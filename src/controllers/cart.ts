import HTTPError from "errors/HTTPError.ts";
import { prisma } from "index.ts";
import { PrivateUserProduct, UserProduct } from "models/UserProduct.ts";
import { PaginationInfos, getPrismaPagination } from "tools/Pagination.ts";

export async function getUserProducts(userId: number, pagination: PaginationInfos): Promise<PrivateUserProduct[]> {
    const products = await prisma.userProduct.findMany({
        where: { userId },
        ...getPrismaPagination(pagination),
        include: UserProduct.privateIncludes
    });
    return products.map(UserProduct.makePrivate);
}

export async function deleteUserProducts(userId: number): Promise<void> {
    await prisma.userProduct.deleteMany({ where: { userId } });
}

export async function getUserProduct(id: number, userId: number): Promise<PrivateUserProduct> {
    const product = UserProduct.makePrivate(
        await prisma.userProduct.findFirst({ where: { id, userId } })
    );

    if (!product) {
        throw new HTTPError(
            UserProduct.MESSAGES.NOT_FOUND.status,
            UserProduct.MESSAGES.NOT_FOUND.message
        );
    }
    return product;
}

export async function updateUserProduct(id: number, userId: number, quantity: number): Promise<PrivateUserProduct> {
    return UserProduct.makePrivate(await prisma.userProduct.update({
        where: { id, userId },
        data: { quantity }
    }));
}

export async function deleteUserProduct(id: number, userId: number): Promise<void> {
    await prisma.userProduct.delete({ where: { id, userId } });
}
