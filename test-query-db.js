const { PrismaClient } = require('./backend/node_modules/@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const cats = await prisma.category.findMany();
  console.log('Categories:', cats.map(c => ({ id: c.id, name: c.nameEn, slug: c.slug })));
  const prods = await prisma.product.findMany({
    select: {
      id: true,
      titleEn: true,
      slug: true,
      categoryId: true,
      category: { select: { nameEn: true, slug: true } },
      dermalProtocolEn: true
    }
  });
  console.log('Products Count:', prods.length);
  for (const p of prods) {
    let meta = {};
    try { meta = JSON.parse(p.dermalProtocolEn); } catch {}
    console.log(`- "${p.titleEn}": categoryId=${p.categoryId}, categoryRel=${p.category ? p.category.nameEn : 'NULL'}, metaBrand=${meta.brand}`);
  }
}

main().finally(() => prisma.$disconnect());

