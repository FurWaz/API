import { prisma } from "index.ts";
import Lang from "tools/Lang.ts";
import { buildResourceMessages } from "tools/Model.ts";
import { TokenUtils } from "tools/Token.ts";

async function createAppKey(app: PrivateApp) {
    return await TokenUtils.encode({
        id: app.id,
        type: 'access',
        resource: 'app'
    });
}

export interface PrivateApp {
    id: number;
    name: string;
    description: string;
    authorId: number;
    key: string;
    verified: boolean;
}

export interface PublicApp {
    id: number;
    name: string;
    description: string;
    authorId: number;
    verified: boolean;
}

export class App {
    public static MESSAGES = {
        ...buildResourceMessages(Lang.GetText(
            Lang.CreateTranslationContext('models', 'App')
        ))
    };

    public static async create(userId: number, name: string, description: string): Promise<PrivateApp> {
        const app = App.makePrivateApp(await prisma.app.create({
            data: {
                name,
                description,
                key: '',
                author: {
                    connect: {
                        id: userId
                    }
                }
            }
        }));
        const key = await createAppKey(app);
        const updated = await prisma.app.update({
            where: { id: app.id },
            data: { key }
        });
        return updated;
    }

    public static async getAsPublic(id: number): Promise<PublicApp> {
        return App.makePublicApp(await prisma.app.findUnique({
            where: { id }
        }));
    }

    public static async getAsPrivate(id: number): Promise<PrivateApp> {
        return App.makePrivateApp(await prisma.app.findUnique({
            where: { id }
        }));
    }

    public static makePublicApp(obj: any): PublicApp {
        if (!obj) return obj;

        return {
            id: obj.id,
            name: obj.name,
            description: obj.description,
            authorId: obj.authorId,
            verified: obj.verified
        };
    }

    public static makePrivateApp(obj: any): PrivateApp {
        if (!obj) return obj;

        return {
            id: obj.id,
            name: obj.name,
            description: obj.description,
            authorId: obj.authorId,
            verified: obj.verified,
            key: obj.key
        };
    }
}
