import { prisma } from "index.ts";
import { PrivateProduct, Product, PublicProduct } from "models/Product.ts";
import { PaginationInfos, getPrismaPagination } from "tools/Pagination.ts";

export async function createProduct(name: string, description: string, price: number, app: number): Promise<PrivateProduct> {
    const newApp = await Product.create(name, description, price, app);
    return newApp;
}

export async function getProduct(id: number): Promise<PublicProduct> {
    return Product.getAsPrivate(id);
}

export async function getAppProducts(app: number, paginationInfos: PaginationInfos): Promise<PrivateProduct[]> {
    const products = await prisma.product.findMany({
        where: { appId: app },
        ...getPrismaPagination(paginationInfos),
        include: Product.privateIncludes
    });
    return products.map(Product.makePrivate);
}

export async function updateProduct(id: number, name: string, description: string, price: number): Promise<PrivateProduct> {
    return Product.makePrivate(await prisma.product.update({
        where: { id },
        data: { name, description, price },
        include: Product.privateIncludes
    }));
}

export async function deleteProduct(id: number): Promise<void> {
    await prisma.product.delete({ where: { id } });
}