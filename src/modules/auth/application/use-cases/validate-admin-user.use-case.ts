import { Inject, Injectable } from "@nestjs/common";
import {
  ADMIN_USER_REPOSITORY,
  AdminUserRepository
} from "../ports/admin-user.repository";

@Injectable()
export class ValidateAdminUserUseCase {
  constructor(
    @Inject(ADMIN_USER_REPOSITORY)
    private readonly adminUserRepository: AdminUserRepository
  ) {}

  async execute(userId: string) {
    return this.adminUserRepository.findViewById(userId);
  }
}
