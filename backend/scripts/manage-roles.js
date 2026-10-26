const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  const args = process.argv.slice(2);
  const command = args[0];

  if (!command || command === 'list') {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        phone: true,
        fullName: true,
        role: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
    console.log('\n=== CURRENT USERS IN DATABASE ===');
    console.table(users);
    return;
  }

  if (command === 'set-role') {
    const identifier = args[1]; // email or phone
    const newRole = args[2]?.toUpperCase(); // e.g. SUPER_ADMIN, CATALOG_MANAGER, FULFILLMENT_OPERATOR, SUPPORT_AGENT, FINANCE_OFFICER, CUSTOMER

    const validRoles = [
      'CUSTOMER',
      'SUPER_ADMIN',
      'CATALOG_MANAGER',
      'FULFILLMENT_OPERATOR',
      'SUPPORT_AGENT',
      'FINANCE_OFFICER',
    ];

    if (!identifier || !newRole || !validRoles.includes(newRole)) {
      console.error(`\nUsage: node scripts/manage-roles.js set-role <email-or-phone> <ROLE>`);
      console.error(`Valid roles: ${validRoles.join(', ')}`);
      return;
    }

    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: identifier.toLowerCase().trim() },
          { phone: identifier.trim() },
          { phone: `+88${identifier.trim().replace(/^\+88/, '')}` },
        ],
      },
    });

    if (!user) {
      console.error(`User with identifier "${identifier}" not found in database.`);
      return;
    }

    const updated = await prisma.user.update({
      where: { id: user.id },
      data: { role: newRole },
      select: { id: true, email: true, phone: true, fullName: true, role: true },
    });

    console.log(`\n SUCCESS: User ${updated.fullName || updated.email || updated.phone} role updated to: [${updated.role}]`);
  }
}

run()
  .catch((err) => {
    console.error('Error:', err.message);
  })
  .finally(() => prisma.$disconnect());
