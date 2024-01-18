import Lang from "tools/Lang.ts";
import { buildResourceMessages } from "tools/Model.ts";

// export interface PrivateCheckout {
// 
// }

// export interface PublicCheckout {
// 
// }

export class Checkout {
    public static MESSAGES = {
        ...buildResourceMessages(Lang.GetText(
            Lang.CreateTranslationContext('models', 'Checkout')
        ))
    };
}
