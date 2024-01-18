import { prisma } from "index.ts";

export class CheckoutStatus {
    id?: number = undefined;
    name: string;
    listeners: any[] = [];

    constructor(name: string) {
        this.name = name;

        this.loadStatus();
    }

    private async loadStatus() {
        const status = await prisma.checkoutStatus.findFirst({ where: { name: this.name } })
            ?? await prisma.checkoutStatus.create({ data: { name: this.name } });
        this.id = status.id;
        this.listeners.forEach(l => l(this));
    }
}

export const CheckoutStatuses = {
    SUCCEEDED: new CheckoutStatus('succeeded'),
    CANCELED: new CheckoutStatus('canceled'),
    PENDING: new CheckoutStatus('pending'),
    FAILED: new CheckoutStatus('failed')
}
