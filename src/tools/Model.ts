import HTTP from "./HTTP.ts";
import Lang from "./Lang.ts";
import { ResponseMessage } from "./Responses.ts";

export function buildResourceMessages(translationContext: any) {
    return {
        CREATED:   () => buildCreateMessage(Lang.GetText(translationContext)),
        UPDATED:   () => buildUpdateMessage(Lang.GetText(translationContext)),
        DELETED:   () => buildDeleteMessage(Lang.GetText(translationContext)),
        FETCHED:   () => buildFetchMessage(Lang.GetText(translationContext)),
        NOT_FOUND: () => buildNotFoundMessage(Lang.GetText(translationContext)),
        ADDED:     () => buildMessage(Lang.GetText(translationContext), 'Added', HTTP.OK),
        REMOVED:   () => buildMessage(Lang.GetText(translationContext), 'Removed', HTTP.OK)
    };
}

export function buildCreateMessage(resource: string): ResponseMessage {
    return buildMessage(resource, 'Created', HTTP.CREATED);
}

export function buildUpdateMessage(resource: string): ResponseMessage {
    return buildMessage(resource, 'Updated', HTTP.OK);
}

export function buildDeleteMessage(resource: string): ResponseMessage {
    return buildMessage(resource, 'Deleted', HTTP.OK);
}

export function buildFetchMessage(resource: string): ResponseMessage {
    return buildMessage(resource, 'Fetched', HTTP.OK);
}

export function buildNotFoundMessage(resource: string): ResponseMessage {
    return buildMessage(resource, 'NotFound', HTTP.NOT_FOUND);
}

export function buildMessage(resource: string, action: string, code: number): ResponseMessage {
    return {
        message: Lang.GetText(Lang.CreateTranslationContext('responses', action, { resource })),
        status: code
    }
}
