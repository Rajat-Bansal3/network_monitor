import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  // Create admin user
  await prisma.user.upsert({
    where: { email: "admin@nms.local" },
    update: {},
    create: {
      email: "admin@nms.local",
      password: await bcrypt.hash("SecureAdminPassword123!", 12),
      role: "Admin",
    },
  });

  // Create operator user
  await prisma.user.upsert({
    where: { email: "operator@nms.local" },
    update: {},
    create: {
      email: "operator@nms.local",
      password: await bcrypt.hash("OperatorPass456!", 12),
      role: "Operator",
    },
  });

  // Create viewer user
  await prisma.user.upsert({
    where: { email: "viewer@nms.local" },
    update: {},
    create: {
      email: "viewer@nms.local",
      password: await bcrypt.hash("ViewerPass789!", 12),
      role: "Viewer",
    },
  });

  console.log("Database seeded with 3 users");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
