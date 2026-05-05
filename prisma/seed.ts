import { PrismaClient } from "@prisma/client";
import * as bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  const adminEmail = process.env.ADMIN_EMAIL ?? "erwin0pisis@gmail.com";
  const adminPassword = process.env.ADMIN_PASSWORD ?? "admin123456";
  const gmailBaseEmail = process.env.GMAIL_BASE_EMAIL ?? adminEmail;
  const passwordHash = await bcrypt.hash(adminPassword, 10);

  await prisma.adminUser.upsert({
    where: { email: adminEmail },
    update: { passwordHash },
    create: {
      email: adminEmail,
      passwordHash,
      role: "ADMIN"
    }
  });

  await prisma.gmailConfig.upsert({
    where: { baseEmail: gmailBaseEmail },
    update: {
      host: process.env.GMAIL_HOST ?? "imap.gmail.com",
      port: Number(process.env.GMAIL_PORT ?? 993),
      secure: String(process.env.GMAIL_TLS ?? "true") === "true",
      appPassword: process.env.GMAIL_APP_PASSWORD ?? null
    },
    create: {
      baseEmail: gmailBaseEmail,
      host: process.env.GMAIL_HOST ?? "imap.gmail.com",
      port: Number(process.env.GMAIL_PORT ?? 993),
      secure: String(process.env.GMAIL_TLS ?? "true") === "true",
      appPassword: process.env.GMAIL_APP_PASSWORD ?? null
    }
  });

  await prisma.shiftUser.deleteMany();

  await prisma.shiftUser.createMany({
    data: [
      {
        firstName: "Erwin",
        lastName: "Pisis",
        phone: "+59170000001",
        shiftDate: new Date("2026-04-28T00:00:00.000Z"),
        shiftStart: "08:00",
        shiftEnd: "12:00",
        isMaster: true
      },
      {
        firstName: "Valeria",
        lastName: "Rojas",
        phone: "+59170000002",
        shiftDate: new Date("2026-04-28T00:00:00.000Z"),
        shiftStart: "12:00",
        shiftEnd: "16:00",
        isMaster: false
      },
      {
        firstName: "Mateo",
        lastName: "Suarez",
        phone: "+59170000003",
        shiftDate: new Date("2026-04-29T00:00:00.000Z"),
        shiftStart: "09:00",
        shiftEnd: "15:00",
        isMaster: false
      }
    ]
  });
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
