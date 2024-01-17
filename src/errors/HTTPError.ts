import HTTP from "tools/HTTP.ts";
import Lang from "tools/Lang.ts";

export default class HTTPError extends Error {
    public static Unauthorized() {
        return new HTTPError(
            HTTP.UNAUTHORIZED,
            Lang.GetText(Lang.CreateTranslationContext('errors', 'Unauthorized'))
        );
    }

    public static Forbidden() {
        return new HTTPError(
            HTTP.FORBIDDEN,
            Lang.GetText(Lang.CreateTranslationContext('errors', 'Forbidden'))
        );
    }

    public static InvalidPassword() {
        return new HTTPError(
            HTTP.UNAUTHORIZED,
            Lang.GetText(Lang.CreateTranslationContext('errors', 'InvalidPassword'))
        );
    }

    public static TokenExpired() {
        return new HTTPError(
            HTTP.UNAUTHORIZED,
            Lang.GetText(Lang.CreateTranslationContext('errors', 'ExpiredToken'))
        );
    }

    public status: number;

    /**
     * Creates a new HTTP error
     * @param status The HTTP status code to send
     * @param message The error message to send
     */
    constructor(status: number, message: string) {
        super(message);
        this.status = status;
    }
}
