import bcrypt from "bcrypt";
import Config from "./Config.ts";

export default class Password {
    static async hash(password: string): Promise<string> {
        const hash = bcrypt.hash(password, Config.security.hashRounds);
        return hash;
    }

    static async compare(password: string, hash: string): Promise<boolean> {
        const result = await bcrypt.compare(password, hash);
        return result;
    }
}
