import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');
  const defaultPassword = await bcrypt.hash('Password123!', 12);

  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@wholesale.com' }, update: {},
    create: { name: 'System Administrator', email: 'admin@wholesale.com', password: defaultPassword, role: Role.ADMIN, isActive: true },
  });

  const salesUser = await prisma.user.upsert({
    where: { email: 'sales@wholesale.com' }, update: {},
    create: { name: 'Rahul Sharma (Sales)', email: 'sales@wholesale.com', password: defaultPassword, role: Role.SALES, isActive: true },
  });

  await prisma.user.upsert({
    where: { email: 'warehouse@wholesale.com' }, update: {},
    create: { name: 'Vikram Singh (Warehouse)', email: 'warehouse@wholesale.com', password: defaultPassword, role: Role.WAREHOUSE, isActive: true },
  });

  await prisma.user.upsert({
    where: { email: 'accounts@wholesale.com' }, update: {},
    create: { name: 'Priya Patel (Accounts)', email: 'accounts@wholesale.com', password: defaultPassword, role: Role.ACCOUNTS, isActive: true },
  });

  const mainWarehouse = await prisma.warehouse.upsert({
    where: { id: 'wh_main_01' }, update: {},
    create: { id: 'wh_main_01', name: 'Central Warehouse - Secunderabad', location: 'Plot 42, Industrial Area, Secunderabad, Telangana 500003', isActive: true },
  });

  const electronicsCat = await prisma.category.upsert({
    where: { slug: 'industrial-electronics' }, update: {},
    create: { name: 'Industrial Electronics', slug: 'industrial-electronics', color: '#3b82f6' },
  });

  const cablesCat = await prisma.category.upsert({
    where: { slug: 'cables-wires' }, update: {},
    create: { name: 'Cables & Wires', slug: 'cables-wires', color: '#10b981' },
  });

  await prisma.product.upsert({
    where: { sku: 'PRD-0001' }, update: {},
    create: {
      sku: 'PRD-0001', name: '3-Phase AC Motor 5HP', description: 'High efficiency industrial motor with thermal protection.',
      categoryId: electronicsCat.id, warehouseId: mainWarehouse.id, unit: 'PCS',
      costPrice: 12500.00, sellingPrice: 15800.00, currentStock: 45, minStockLevel: 10, maxStockLevel: 200, isActive: true,
    },
  });

  await prisma.product.upsert({
    where: { sku: 'PRD-0002' }, update: {},
    create: {
      sku: 'PRD-0002', name: 'Armoured Copper Cable 4mm (100m Roll)', description: 'Heavy duty fire resistant copper cable roll.',
      categoryId: cablesCat.id, warehouseId: mainWarehouse.id, unit: 'ROLL',
      costPrice: 3200.00, sellingPrice: 4100.00, currentStock: 8, minStockLevel: 15, maxStockLevel: 150, isActive: true,
    },
  });

  await prisma.customer.upsert({
    where: { code: 'CUS-0001' }, update: {},
    create: {
      code: 'CUS-0001', name: 'Sri Krishna Enterprises', email: 'contact@srikrishna.com', phone: '9876543210',
      gstNumber: '36AAAAA0000A1Z5', creditLimit: 500000.00, outstandingAmount: 0.00,
      addressLine1: 'Shop No 12, Hardware Market', city: 'Hyderabad', state: 'Telangana', pinCode: '500001',
      tags: ['VIP', 'Wholesale', 'Prompt-Payer'], createdById: salesUser.id, isActive: true,
    },
  });

  await prisma.activityLog.create({
    data: { userId: adminUser.id, action: 'USER_CREATED', entityType: 'System', entityLabel: 'Database Seeding Completed', metadata: { seededAt: new Date().toISOString() } },
  });

  console.log('✅ Seeding completed successfully!');
}

main().catch((e) => { console.error('❌ Seeding error:', e); process.exit(1); }).finally(async () => { await prisma.$disconnect(); });
