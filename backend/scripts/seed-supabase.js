const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const { PrismaClient } = require('@prisma/client');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting Supabase Cloud Database Seeding...');

  // 1. Seed Super Admin User
  const hashedPassword = await bcrypt.hash('SEYVEN@6251', 10);
  const adminUser = await prisma.user.upsert({
    where: { email: 'farah@seyven.com' },
    update: {},
    create: {
      id: uuidv4(),
      fullName: 'Farah Rahman',
      phone: '01712345678',
      email: 'farah@seyven.com',
      passwordHash: hashedPassword,
      role: 'SUPER_ADMIN',
      isPhoneVerified: true,
    },
  });
  console.log(`✅ Admin User Ready: ${adminUser.fullName} (${adminUser.email})`);

  // 2. Seed Master Categories
  const categoriesData = [
    {
      slug: 'targeted-serums',
      nameEn: 'Targeted Serums & Ampoules',
      nameBn: 'টার্গেটেড সিরাম ও অ্যাম্পুলস',
      description: 'Active clinical formulations for targeted dermal care',
    },
    {
      slug: 'sun-protection',
      nameEn: 'Sun Protection & Fluid Shields',
      nameBn: 'সান প্রোটেকশন ও ফ্লুইড শিল্ড',
      description: 'Broad spectrum SPF50+ PA++++ filters',
    },
    {
      slug: 'barrier-repair',
      nameEn: 'Lipid Barrier Repair & Creams',
      nameBn: 'ব্যারিয়ার রিপেয়ার ও ক্রিম',
      description: 'Intense barrier restoration and hydration',
    },
  ];

  const catMap = new Map();
  for (const cat of categoriesData) {
    const c = await prisma.category.upsert({
      where: { slug: cat.slug },
      update: {},
      create: {
        id: uuidv4(),
        slug: cat.slug,
        nameEn: cat.nameEn,
        nameBn: cat.nameBn,
        description: cat.description,
      },
    });
    catMap.set(cat.slug, c.id);
  }
  console.log(`✅ Seeded ${categoriesData.length} Master Categories`);

  // 3. Seed Master Products & Variants
  const productsData = [
    {
      slug: 'the-ordinary-hyaluronic-acid-2-b5',
      titleEn: 'Hyaluronic Acid 2% + B5 (30ml)',
      titleBn: 'হায়ালুরোনিক অ্যাসিড ২% + বি৫',
      categorySlug: 'targeted-serums',
      bstiStatus: 'APPROVED',
      isPregnancySafe: true,
      variant: {
        sku: 'SYV-TO-HA30ML',
        priceBdt: 2450,
        volumeMlG: 30,
        cogsBdt: 1200,
        barcode: '769915190602',
      },
    },
    {
      slug: 'cosrx-advanced-snail-96-mucin-essence',
      titleEn: 'Advanced Snail 96 Mucin Power Essence (100ml)',
      titleBn: 'অ্যাডভান্সড স্নেল ৯৬ মিউসিন পাওয়ার এসেন্স',
      categorySlug: 'barrier-repair',
      bstiStatus: 'APPROVED',
      isPregnancySafe: true,
      variant: {
        sku: 'SYV-CS-SN100ML',
        priceBdt: 2250,
        volumeMlG: 100,
        cogsBdt: 1100,
        barcode: '8809416470009',
      },
    },
    {
      slug: 'beauty-of-joseon-relief-sun-rice-probiotics',
      titleEn: 'Relief Sun : Rice + Probiotics SPF50+ PA++++ (50ml)',
      titleBn: 'রিলিফ সান : রাইস + প্রোবায়োটিকস সানস্ক্রিন',
      categorySlug: 'sun-protection',
      bstiStatus: 'APPROVED',
      isPregnancySafe: true,
      variant: {
        sku: 'SYV-BOJ-SUN50',
        priceBdt: 1950,
        volumeMlG: 50,
        cogsBdt: 950,
        barcode: '8809738316758',
      },
    },
  ];

  let primaryProductId = null;
  let primaryVariantId = null;

  for (const p of productsData) {
    const { variant, categorySlug, slug, titleEn, titleBn, bstiStatus, isPregnancySafe } = p;
    const categoryId = catMap.get(categorySlug) || null;

    const prod = await prisma.product.upsert({
      where: { slug },
      update: {},
      create: {
        id: uuidv4(),
        slug,
        titleEn,
        titleBn,
        bstiStatus,
        isPregnancySafe,
        publicationState: 'PUBLISHED',
        ...(categoryId ? { category: { connect: { id: categoryId } } } : {}),
      },
    });

    const v = await prisma.productVariant.upsert({
      where: { sku: variant.sku },
      update: {},
      create: {
        id: uuidv4(),
        sku: variant.sku,
        volumeMlG: variant.volumeMlG,
        priceBdt: variant.priceBdt,
        cogsBdt: variant.cogsBdt,
        barcode: variant.barcode,
        product: { connect: { id: prod.id } },
      },
    });

    if (!primaryProductId) {
      primaryProductId = prod.id;
      primaryVariantId = v.id;
    }

    // Active inventory lot
    const existingLot = await prisma.inventoryLot.findFirst({
      where: { batchNumber: `LOT-${variant.sku}-2026A` },
    });
    if (!existingLot) {
      await prisma.inventoryLot.create({
        data: {
          id: uuidv4(),
          variantId: v.id,
          batchNumber: `LOT-${variant.sku}-2026A`,
          manufacturingDate: new Date('2026-01-15'),
          expiryDate: new Date('2028-01-15'),
          initialQuantity: 100,
          availableQuantity: 95,
          status: 'ACTIVE',
        },
      });
    }
  }
  console.log(`✅ Seeded ${productsData.length} Master Products, Variants & Inventory Lots`);

  // 4. Migrate Existing Local Orders into Supabase Cloud PostgreSQL
  const localOrdersPath = path.resolve(__dirname, '../data/local-orders.json');
  if (fs.existsSync(localOrdersPath) && primaryProductId && primaryVariantId) {
    const raw = fs.readFileSync(localOrdersPath, 'utf8');
    const orders = JSON.parse(raw);
    console.log(`📦 Found ${orders.length} local orders to migrate to Supabase...`);

    for (const o of orders) {
      try {
        const orderNum = o.orderNumber || o.id || `ORD-${Math.floor(1000 + Math.random() * 9000)}`;
        const exists = await prisma.order.findUnique({ where: { orderNumber: orderNum } });
        if (!exists) {
          const newOrderId = uuidv4();
          await prisma.order.create({
            data: {
              id: newOrderId,
              orderNumber: orderNum,
              guestName: o.customerName || o.guestName || 'Client',
              guestPhone: o.customerPhone || o.guestPhone || '01700000000',
              shippingAddress: {
                name: o.customerName || 'Client',
                phone: o.customerPhone || '01700000000',
                address: o.shippingAddress || 'Dhaka',
                district: o.district || 'Dhaka',
                zone: o.zone || 'Dhaka Metro',
              },
              source: 'MANUAL_ASSISTED',
              status: o.status === 'CONFIRMED' ? 'CONFIRMED' : 'PLACED',
              paymentStatus: o.paymentMethod === 'COD' ? 'PENDING' : 'PAID',
              subtotalBdt: o.subtotal || 2450,
              deliveryFeeBdt: o.deliveryFee || 70,
              discountBdt: o.discount || 0,
              vatBdt: 0,
              totalPayableBdt: o.totalAmount || 2520,
              codDueBdt: o.paymentMethod === 'COD' ? (o.totalAmount || 2520) : 0,
              advancePaidBdt: o.advancePaid || 0,
              trackingCode: o.consignmentId || o.trackingCode || null,
              items: {
                create: (o.items || []).map((it, idx) => ({
                  id: uuidv4(),
                  title: it.title || it.titleEn || 'Skincare Formulation',
                  sku: it.sku || `SKU-${idx}`,
                  quantity: it.quantity || 1,
                  unitPriceBdt: it.unitPrice || it.priceBdt || 2450,
                  lineTotalBdt: it.totalPrice || 2450,
                  productId: primaryProductId,
                  variantId: primaryVariantId,
                })),
              },
            },
          });
          console.log(`  └ Migrated Order: ${orderNum} (${o.customerName})`);
        }
      } catch (err) {
        console.warn(`  ⚠️ Could not migrate order:`, err.message);
      }
    }
  }

  console.log('🎉 SUPABASE CLOUD DATABASE FULLY SEEDED & READY FOR 10-20 DAILY ORDERS!');
}

main()
  .catch((e) => {
    console.error('Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
