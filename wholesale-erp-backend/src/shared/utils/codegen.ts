import { prisma } from '../../config/database';
import { CODE_PREFIXES } from '../../config/constants';

async function nextSequence(model: 'customer' | 'product' | 'challan'): Promise<number> {
  switch (model) {
    case 'customer': return (await prisma.customer.count()) + 1;
    case 'product': return (await prisma.product.count()) + 1;
    case 'challan': return (await prisma.challan.count()) + 1;
  }
}

export async function generateCustomerCode(): Promise<string> {
  const seq = await nextSequence('customer');
  return `${CODE_PREFIXES.CUSTOMER}-${String(seq).padStart(4, '0')}`;
}

export async function generateProductSku(): Promise<string> {
  const seq = await nextSequence('product');
  return `${CODE_PREFIXES.PRODUCT}-${String(seq).padStart(4, '0')}`;
}

export async function generateChallanNumber(): Promise<string> {
  const year = new Date().getFullYear();
  const seq = await nextSequence('challan');
  return `${CODE_PREFIXES.CHALLAN}-${year}-${String(seq).padStart(4, '0')}`;
}
