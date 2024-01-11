import HTTPError from "errors/HTTPError.ts";
import { prisma } from "index.ts";
import { PrivateUser, PublicUser, User } from "models/User.ts";
import Config from "tools/Config.ts";
import HTTP from "tools/HTTP.ts";
import Lang from "tools/Lang.ts";
import Password from "tools/Password.ts";
import { TokenData, TokenUtils } from "tools/Token.ts";

async function createUserRefreshToken(user: PublicUser|PrivateUser) {
    return await TokenUtils.encode({
        type: 'refresh',
        resource: 'user',
        id: user.id,
        expiration: Config.security.refreshExpiration
    })
}

async function createUserAccessToken(user: PublicUser|PrivateUser) {
    return await TokenUtils.encode({
        type: 'access',
        resource: 'user',
        id: user.id,
        expiration: Config.security.accessExpiration,
        payload: {
            roles: user.roles.reduce((acc: string, role: number) => (acc.length>0)? `${acc},${role}` : `${role}`, '')
        }
    })
}

export async function getUserTokens(pseudo: string, email: string, password: string) {
    const user = await prisma.user.findFirst({
        where: {
            OR: [
                { pseudo },
                { email }
            ]
        },
        include: User.privateUserIncludes
    });

    if (!user || !await Password.compare(password, user.password))
        throw new HTTPError(
            HTTP.UNAUTHORIZED,
            Lang.GetText(Lang.CreateTranslationContext('errors', 'InvalidCredentials'))
        );
    
    const privateUser = User.makePrivateUser(user);
    return {
        refresh: await createUserRefreshToken(privateUser),
        access: await createUserAccessToken(privateUser)
    };
}

export async function getAccessToken(refreshToken: TokenData) {
    if (refreshToken.type !== 'refresh' || refreshToken.resource !== 'user')
        throw new HTTPError(
            HTTP.INVALID_TOKEN,
            Lang.GetText(Lang.CreateTranslationContext('errors', 'InvalidToken'))
        );

    return createUserAccessToken(await User.getAsPrivate(refreshToken.id));
}
