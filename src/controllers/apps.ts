import HTTPError from "errors/HTTPError.ts";
import { prisma } from "index.ts";
import { App, PrivateApp, PublicApp } from "models/App.ts";
import HTTP from "tools/HTTP.ts";
import Lang from "tools/Lang.ts";
import { PaginationInfos, getPrismaPagination } from "tools/Pagination.ts";

export async function getAllApps(pagination: PaginationInfos): Promise<PublicApp[]> {
    const apps = await prisma.app.findMany({
        ...getPrismaPagination(pagination)
    });
    return apps.map(app => App.makePublicApp(app));
}

export async function createApp(userId: number, name: string, description: string): Promise<PrivateApp> {
    const app = await prisma.app.findFirst({ where: { name } });
    
    // If user already exists, throw an error
    if (app !== null) {
        throw new HTTPError(
            HTTP.CONFLICT,
            Lang.GetText(Lang.CreateTranslationContext(
                'errors',
                'AlreadyExists',
                { resource: Lang.GetText(Lang.CreateTranslationContext('models', 'App')) }
            ))
        );
    }

    const newApp = await App.create(userId, name, description);
    return newApp;
}

export async function updateApp(userId: number, id: number, infos: any) {
    const app = await App.getAsPrivate(id);
    if (app === null)
        throw new HTTPError(App.MESSAGES.NOT_FOUND.status, App.MESSAGES.NOT_FOUND.message);

    if (app.authorId !== userId)
        throw HTTPError.Unauthorized();

    if (infos.name === undefined && infos.description === undefined)
        return app;

    const newApp = await prisma.app.update({
        where: { id },
        data: {
            name: infos.name ?? app.name,
            description: infos.description ?? app.description
        }
    });
    return App.makePrivateApp(newApp);
}

export async function deleteApp(userId: number, id: number) {
    const app = await App.getAsPrivate(id);
    if (app === null)
        throw new HTTPError(App.MESSAGES.NOT_FOUND.status, App.MESSAGES.NOT_FOUND.message);

    if (app.authorId !== userId)
        throw HTTPError.Unauthorized();

    await prisma.app.delete({ where: { id } });
}

export async function getPublicApp(id: number): Promise<PublicApp> {
    const user = await App.getAsPublic(id);
    if (user === null)
        throw new HTTPError(App.MESSAGES.NOT_FOUND.status, App.MESSAGES.NOT_FOUND.message);
    return user;
}

export async function getPrivateApp(id: number): Promise<PrivateApp> {
    const user = await App.getAsPrivate(id);
    if (user === null)
        throw new HTTPError(App.MESSAGES.NOT_FOUND.status, App.MESSAGES.NOT_FOUND.message);
    return user;
}

export async function getAppAsUser(userId: number, appId: number): Promise<PublicApp> {
    const app = await App.getAsPrivate(appId);
    if (app === null)
        throw new HTTPError(App.MESSAGES.NOT_FOUND.status, App.MESSAGES.NOT_FOUND.message);

    if (app.authorId !== userId)
        return App.makePublicApp(app);
    return App.makePrivateApp(app);
}

export async function getOwnApps(userId: number, pagination: PaginationInfos): Promise<PublicApp[]> {
    const apps = await prisma.app.findMany({
        where: { authorId: userId },
        ...getPrismaPagination(pagination)
    });
    return apps.map(app => App.makePrivateApp(app));
}
