import HTTP from 'tools/HTTP.ts';
import { prisma } from '../index.ts';
import Lang from 'tools/Lang.ts';
import HTTPError from 'errors/HTTPError.ts';
import { PrivateUser, PublicUser, User } from 'models/User.ts';
import Mailer from 'tools/Mailer.ts';
import Mail from 'tools/Mail.ts';
import Formatter from 'tools/Formatter.ts';
import { getRootDir } from 'tools/Dirs.ts';
import Config from 'tools/Config.ts';
import { rmUnverifiedUser } from 'tools/Tasks.ts';
import { Timer } from 'tools/Timer.ts';
import { TokenUtils } from 'tools/Token.ts';
import Password from 'tools/Password.ts';

type EmailVerificationTokenPayload = { type: 'emailVerify'; id: number; };
type passwordResetTokenPayload = { type: 'passwordReset'; id: number; };
async function createEmailVerifyToken(userId: number) {
    return TokenUtils.encodePayload({
        type: 'emailVerify',
        id: userId
    }, '24h');
}
async function createPasswordResetToken(userId: number) {
    return TokenUtils.encodePayload({
        type: 'passwordReset',
        id: userId
    }, '15m');
}

export async function verifyUserEmail(token: string) {
    const payload = await TokenUtils.decodePayload(token) as EmailVerificationTokenPayload;
    if (payload === null || payload.type !== 'emailVerify')
        throw new HTTPError(HTTP.INVALID_TOKEN, Lang.GetText(Lang.CreateTranslationContext('errors', 'InvalidToken')));

    const user = await prisma.user.findUnique({ where: { id: payload.id } });
    if (user === null)
        throw new HTTPError(User.MESSAGES.NOT_FOUND.status, User.MESSAGES.NOT_FOUND.message);
    if (user.emailVerified)
        throw new HTTPError(HTTP.EXPIRED_TOKEN, Lang.GetText(Lang.CreateTranslationContext('errors', 'EmailAlreadyVerified')));

    await prisma.user.update({ where: { id: payload.id }, data: { emailVerified: true } });
}

export async function sendPasswordResetEmail(email: string) {
    const user = await prisma.user.findUnique({ where: { email } });
    if (user === null)
        throw new HTTPError(User.MESSAGES.NOT_FOUND.status, User.MESSAGES.NOT_FOUND.message);

    const passwordResetToken = await createPasswordResetToken(user.id);
    Mailer.sendMail(
        user.email,
        Mail.fromFile(
            Formatter.formatString('${Lang::mailResetPassword/subject}'),
            getRootDir() + 'mails/resetPassword.html',
            {
                webhost: Config.webHost,
                resetLink: `${Config.webHost}/reset/password?token=${passwordResetToken}`,
                mailto: Config.mailContact
            }
        )
    );
}

export async function resetPassword(token: string, password: string) {
    const payload = await TokenUtils.decodePayload(token) as passwordResetTokenPayload;
    if (payload === null || payload.type !== 'passwordReset')
        throw new HTTPError(HTTP.INVALID_TOKEN, Lang.GetText(Lang.CreateTranslationContext('errors', 'InvalidToken')));

    const user = await prisma.user.findUnique({ where: { id: payload.id } });
    if (user === null)
        throw new HTTPError(User.MESSAGES.NOT_FOUND.status, User.MESSAGES.NOT_FOUND.message);

    await prisma.user.update({ where: { id: payload.id }, data: { password: await Password.hash(password) } });
}

/**
 * Creates a new user and returns it if successful, throws an error otherwise
 * @param pseudo The user pseudo
 * @param email The user email address (must be unique)
 * @param password The user plain password
 * @returns The created user (as a PrivateUser)
 */
export async function createUser(pseudo: string, email: string, password: string): Promise<PrivateUser> {
    const user = await prisma.user.findFirst({ where: { OR: [{ pseudo }, { email }] } });
    
    // If user already exists, throw an error
    if (user !== null) {
        throw new HTTPError(
            HTTP.CONFLICT,
            Lang.GetText(Lang.CreateTranslationContext(
                'errors',
                'AlreadyExists',
                { resource: Lang.GetText(Lang.CreateTranslationContext('models', 'User')) }
            ))
        );
    }

    // Generate password hash and create user
    const newUser = await User.create(pseudo, email, password);

    // send mail to verify user email
    const emailVerifyToken = await createEmailVerifyToken(newUser.id);
    Mailer.sendMail(
        newUser.email,
        Mail.fromFile(
            Formatter.formatString('${Lang::mailVerifyEmail/subject}'),
            getRootDir() + 'mails/verifyEmail.html',
            {
                webhost: Config.webHost,
                verifyLink: `${Config.webHost}/verify/email?token=${emailVerifyToken}`,
                mailto: Config.mailContact
            }
        )
    );

    // register task to delete user in 24 hour if not email-verified
    Timer.addTask(rmUnverifiedUser.createTask(newUser.id));

    return newUser;
}

export async function setUserInfos(id: number, infos: any) {
    const user = await prisma.user.findUnique({ where: { id } });
    if (user === null)
        throw new HTTPError(User.MESSAGES.NOT_FOUND.status, User.MESSAGES.NOT_FOUND.message);

    if (infos.password !== undefined) {
        if (infos.oldPassword === undefined)
            throw new HTTPError(HTTP.BAD_REQUEST, Lang.GetText(Lang.CreateTranslationContext('errors', 'MissingOldPassword')));
        if (!await Password.compare(infos.oldPassword, user.password))
            throw new HTTPError(HTTP.UNAUTHORIZED, Lang.GetText(Lang.CreateTranslationContext('errors', 'InvalidOldPassword')));
        infos.password = await Password.hash(infos.password);
    }

    if (infos.pseudo === undefined && infos.email === undefined && infos.password === undefined)
        return user;

    const newUser = await prisma.user.update({ where: { id }, data: {
            pseudo: infos.pseudo,
            email: infos.email,
            password: infos.password
        }
    });
    return User.makePrivateUser(newUser);
}

export async function deleteUser(id: number, password: string) {
    const user = await prisma.user.findUnique({ where: { id } });
    if (user === null)
        throw new HTTPError(User.MESSAGES.NOT_FOUND.status, User.MESSAGES.NOT_FOUND.message);

    if (!await Password.compare(password, user.password))
        throw HTTPError.InvalidPassword();

    await prisma.user.delete({ where: { id } });
}

export async function getPublicUser(id: number): Promise<PublicUser> {
    const user = await User.getAsPublic(id);
    if (user === null)
        throw new HTTPError(User.MESSAGES.NOT_FOUND.status, User.MESSAGES.NOT_FOUND.message);
    return user;
}

export async function getPrivateUser(id: number): Promise<PrivateUser> {
    const user = await User.getAsPrivate(id);
    if (user === null)
        throw new HTTPError(User.MESSAGES.NOT_FOUND.status, User.MESSAGES.NOT_FOUND.message);
    return user;
}

export async function setUserProfile(id: number, infos: any) {
    const newUserProfile = await prisma.userProfile.upsert({
        where: { userId: id },
        create: { userId: id, ...infos },
        update: infos
    });
    return newUserProfile;
}

export async function deleteUserProfile(id: number) {
    await prisma.userProfile.delete({ where: { userId: id } });
}
