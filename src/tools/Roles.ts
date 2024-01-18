import { prisma } from "index.ts";

export class Role {
    id?: number = undefined;
    name: string;
    listeners: any[] = [];

    constructor(name: string) {
        this.name = name;

        this.loadRole();
    }

    private async loadRole() {
        const role = await prisma.role.findFirst({ where: { name: this.name } })
            ?? await prisma.role.create({ data: { name: this.name } });
        this.id = role.id;
        this.listeners.forEach(l => l(this));
    }

    async hasPerm(list: string|string[]): Promise<boolean> {
        if (this.id === undefined)
            return new Promise<boolean>(resolve => {
                this.listeners.push(async (role: Role) => {
                    resolve(await role.hasPerm(list));
                });
            });

        if (typeof(list) === 'string')
            return await this.hasPerm(list.split(',').map(s => s.trim()));
        return list.includes(this.name) || list.includes(this.id.toString());
    }
}

export const Roles = {
    ADMIN: new Role('admin')
}
