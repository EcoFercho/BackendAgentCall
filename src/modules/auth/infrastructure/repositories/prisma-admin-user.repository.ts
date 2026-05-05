import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../../../prisma/prisma.service";
import {
  AdminUserRepository,
  AdminUserView
} from "../../application/ports/admin-user.repository";

@Injectable()
export class PrismaAdminUserRepository implements AdminUserRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByEmail(email: string) {
    return this.prisma.adminUser.findUnique({
      where: { email }
    });
  }

  async findViewById(id: string): Promise<AdminUserView | null> {
    return this.prisma.adminUser.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        role: true
      }
    });
  }
}
