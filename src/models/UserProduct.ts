import { prisma } from "index.ts";
import Lang from "tools/Lang.ts";
import { buildResourceMessages } from "tools/Model.ts";

export interface PrivateUserProduct {
    id: number;
    userId: number;
    productId: number;
    quantity: number;
}

// export interface PublicUserProduct {
//     id: number;
//     userId: number;
//     productId: number;
//     quantity: number;
// }

export class UserProduct {
    public static privateIncludes = {

    };
    // public static publicIncludes = {

    // };

    public static MESSAGES = {
        ...buildResourceMessages(Lang.GetText(
            Lang.CreateTranslationContext('models', 'Cart')
        ))
    };

    public static async addProduct(userId: number, productId: number, quantity: number): Promise<PrivateUserProduct> {
        const product = await prisma.userProduct.findFirst({
            where: { userId, productId }
        });


        if (product !== null) {
            return UserProduct.makePrivate(await prisma.userProduct.update({
                where: { id: product.id },
                data: { quantity: product.quantity + quantity }
            }));
        } else return UserProduct.makePrivate(await prisma.userProduct.create({
            data: {
                userId,
                productId,
                quantity
            },
            include: UserProduct.privateIncludes
        }));
    }

    // public static async getAsPublic(id: number): Promise<PublicUserProduct> {
    //     return UserProduct.makePublicUserProduct(await prisma.userProduct.findUnique({
    //         where: { id },
    //         include: UserProduct.publicIncludes
    //     }));
    // }

    public static async getAsPrivate(id: number): Promise<PrivateUserProduct> {
        return UserProduct.makePrivate(await prisma.userProduct.findUnique({
            where: { id },
            include: UserProduct.privateIncludes
        }));
    }

    // public static makePublicUserProduct(obj: any): PublicUserProduct {
    //     if (!obj) return obj;

    //     return {
    //         id: obj.id,
    //         userId: obj.userId,
    //         productId: obj.productId,
    //         quantity: obj.quantity
    //     };
    // }

    public static makePrivate(obj: any): PrivateUserProduct {
        if (!obj) return obj;

        return {
            id: obj.id,
            userId: obj.userId,
            productId: obj.productId,
            quantity: obj.quantity
        };
    }
}
