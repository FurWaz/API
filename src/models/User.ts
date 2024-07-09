import { prisma } from "index.ts";
import Lang from "tools/Lang.ts";
import { buildResourceMessages } from "tools/Model.ts";
import Password from "tools/Password.ts";

export interface PrivateUser {
    id: number;
    pseudo: string;
    email: string;
    roles: number[];
    apps: number[];
    links: number[];
    verified: boolean;
}

export interface PublicUser {
    id: number;
    pseudo: string;
    email: string;
    roles: number[];
    apps: number[];
    verified: boolean;
}

export class User {
    public static privateIncludes = {
        roles: true,
        apps: true,
        links: true
    };
    public static publicIncludes = {
        roles: true,
        apps: true
    };

    public static MESSAGES = {
        ...buildResourceMessages(Lang.GetText(
            Lang.CreateTranslationContext('models', 'User')
        )),
        LOGGED_IN: {
            message: Lang.GetText(Lang.CreateTranslationContext('responses', 'LoggedIn')),
            status: 200
        },
        TOKEN_REFRESHED: {
            message: Lang.GetText(Lang.CreateTranslationContext('responses', 'TokenRefreshed')),
            status: 200
        }
};

    public static async create(pseudo: string, email: string, password: string): Promise<PrivateUser> {
        return User.makePrivate(await prisma.user.create({
            data: {
                pseudo,
                email,
                password: await Password.hash(password)
            },
            include: User.privateIncludes
        }));
    }

    public static async getAsPublic(id: number): Promise<PublicUser> {
        return User.makePublic(await prisma.user.findUnique({
            where: { id },
            include: User.publicIncludes
        }));
    }

    public static async getAsPrivate(id: number): Promise<PrivateUser> {
        return User.makePrivate(await prisma.user.findUnique({
            where: { id },
            include: User.privateIncludes
        }));
    }

    public static makePublic(obj: any): PublicUser {
        if (!obj) return obj;

        return {
            id: obj.id,
            pseudo: obj.pseudo,
            email: obj.email,
            roles: obj.roles?.map((r: any) => (typeof(r) === 'object')? r.id: r) as number[] || [],
            apps: obj.apps?.map((a: any) => (typeof(a) === 'object')? a.id: a) as number[] || [],
            verified: obj.verified,
        }
    }

    public static makePrivate(obj: any): PrivateUser {
        if (!obj) return obj;

        return {
            id: obj.id as number,
            pseudo: obj.pseudo as string,
            email: obj.email as string,
            roles: obj.roles?.map((r: any) => (typeof(r) === 'object')? r.id: r) as number[] || [],
            apps: obj.apps?.map((a: any) => (typeof(a) === 'object')? a.id: a) as number[] || [],
            links: obj.links?.map((l: any) => (typeof(l) === 'object')? l.id: l) as number[] || [],
            verified: obj.verified as boolean
        } as PrivateUser;
    }
}
