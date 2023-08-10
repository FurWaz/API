import en from '../langs/en.json';
import fr from '../langs/fr.json';

const Langs: any[] = [en, fr];

class Lang {
    private readonly _data: any;

    constructor (data: any) {
        this._data = data;
    }

    get code () {
        return this._data.code;
    }

    get name () {
        return this._data.name;
    }

    get data () {
        return this._data.lang;
    }
}

function createLanguage (data: any) {
    return new Proxy(new Lang(data), {
        get (target: any, prop: string) {
            if (prop in target) {
                return target[prop];
            } else {
                if (prop in target.data) {
                    return target.data[prop];
                } else {
                    return defaultLang.data[prop];
                }
            }
        }
    });
}

const defaultCode: string = Langs[0].code;
const defaultLang: Lang = Langs[0];

function sanitizeCode (code: string) {
    if (code.length > 2) code = code.split('-')[0];
    if (code.length > 2) code = code.substring(0, 2);
    return code.toLowerCase();
}

function getLang (code: string) {
    if (code === undefined || code === null) {
        code = defaultCode;
    }

    code = sanitizeCode(code);
    if (!Langs.map(l => l.code).includes(code)) {
        code = defaultCode;
    }

    let lang = (code === defaultCode) ? defaultLang : Langs.find(l => l.code === code);
    if (lang === undefined || lang === null) lang = defaultLang;

    return createLanguage(lang);
}

export {
    getLang
};
