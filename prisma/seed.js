const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  await prisma.user.update({
    where: { username: "admin" },
    data: { role: "owner" },
  });
}

main()
  .then(() => console.log("Role atribuída ao admin"))
  .catch((e) => console.error(e))
  .finally(() => prisma.$disconnect());
