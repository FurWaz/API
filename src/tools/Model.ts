import HTTP from "./HTTP.ts";
import Lang from "./Lang.ts";
import { ResponseMessage } from "./Responses.ts";

export function buildResourceMessages(resource: string) {
    return {
        CREATED:   buildCreateMessage(resource),
        UPDATED:   buildUpdateMessage(resource),
        DELETED:   buildDeleteMessage(resource),
        FETCHED:   buildFetchMessage(resource),
        NOT_FOUND: buildNotFoundMessage(resource)
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
