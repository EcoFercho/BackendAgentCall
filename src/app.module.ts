import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { NotificationsModule } from "./notifications/notifications.module";
import { PrismaModule } from "./prisma/prisma.module";
import { AuthModule } from "./modules/auth/auth.module";
import { MailModule } from "./modules/mail/mail.module";
import { ShiftUsersModule } from "./modules/shift-users/shift-users.module";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    NotificationsModule,
    MailModule,
    ShiftUsersModule
  ]
})
export class AppModule {}
