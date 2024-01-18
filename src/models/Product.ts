import { prisma } from "index.ts";
import Lang from "tools/Lang.ts";
import { buildResourceMessages } from "tools/Model.ts";

export interface PrivateProduct {
    id: number;
    name: string;
    description: string;
    price: number;
    app: number;
    carts: number[];
    purchases: number[];
}

export interface PublicProduct {
    id: number;
    name: string;
    description: string;
    price: number;
    app: number;
}

export class Product {
    public static privateIncludes = {
        carts: true,
        purchases: true,
        app: true
    };
    public static publicIncludes = {
        app: true
    };

    public static MESSAGES = {
        ...buildResourceMessages(Lang.GetText(
            Lang.CreateTranslationContext('models', 'Product')
        ))
    };

    public static async create(name: string, description: string, price: number, app: number): Promise<PrivateProduct> {
        const product = Product.makePrivate(await prisma.product.create({
            data: {
                name,
                description,
                price,
                app: { connect: { id: app } }
            },
            include: Product.privateIncludes
        }));
        return product;
    }

    public static async getAsPublic(id: number): Promise<PublicProduct> {
        return Product.makePublic(await prisma.product.findUnique({
            where: { id },
            include: Product.publicIncludes
        }));
    }

    public static async getAsPrivate(id: number): Promise<PrivateProduct> {
        return Product.makePrivate(await prisma.product.findUnique({
            where: { id },
            include: Product.privateIncludes
        }));
    }

    public static makePublic(obj: any): PublicProduct {
        if (!obj) return obj;

        return {
            id: obj.id,
            name: obj.name,
            description: obj.description,
            price: obj.price,
            app: typeof(obj.app) === 'number'? obj.app : obj.app.id
        };
    }

    public static makePrivate(obj: any): PrivateProduct {
        if (!obj) return obj;

        return {
            id: obj.id,
            name: obj.name,
            description: obj.description,
            price: obj.price,
            app: typeof(obj.app) === 'number'? obj.app : obj.app.id,
            carts: obj.carts?.map((c: any) => (typeof(c) === 'object')? c.id: c) as number[] || [],
            purchases: obj.purchases?.map((p: any) => (typeof(p) === 'object')? p.id: p) as number[] || []
        };
    }
}
