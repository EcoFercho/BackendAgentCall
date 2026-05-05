import { PrismaService } from "../../../../prisma/prisma.service";
import { AdminUserRepository, AdminUserView } from "../../application/ports/admin-user.repository";
export declare class PrismaAdminUserRepository implements AdminUserRepository {
    private readonly prisma;
    constructor(prisma: PrismaService);
    findByEmail(email: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        email: string;
        passwordHash: string;
        role: import(".prisma/client").$Enums.UserRole;
    } | null>;
    findViewById(id: string): Promise<AdminUserView | null>;
}
