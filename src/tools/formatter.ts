import type { App, User } from '@prisma/client';

export function PrivateUser (user: User): any {
    const obj: any = Object.assign({}, user);
    delete obj.password;
    delete obj.lastEmailVerif;
    delete obj.lastPasswordReset;
    return obj;
}

export function PublicUser (user: User): any {
    const obj: any = Object.assign({}, user);
    delete obj.password;
    delete obj.send_email;
    delete obj.lastEmailVerif;
    delete obj.lastPasswordReset;
    return obj;
}

export function PrivateApp (app: App): any {
    const obj: any = Object.assign({}, app);
    if (obj.author !== undefined) {
        obj.author = PrivateUser(obj.author);
        delete obj.author_id;
    }
    return obj;
}

export function PublicApp (app: App): any {
    const obj: any = Object.assign({}, app);
    obj.author = PublicUser(obj.author);
    delete obj.key;
    delete obj.author_id;
    return obj;
}
