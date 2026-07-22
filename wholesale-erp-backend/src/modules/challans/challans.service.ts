import { challansRepository } from './challans.repository';
import { ApiError } from '../../shared/utils/ApiError';
import { generateChallanNumber } from '../../shared/utils/codegen';
import { logActivity } from '../../shared/services/activity.service';
import { notifyRoles } from '../../shared/services/notification.service';
import { parsePagination, buildPaginationMeta } from '../../shared/utils/pagination';
import { prisma } from '../../config/database';
import { CreateChallanInput, ListChallansQuery } from './challans.schema';

export const challansService = {
  async list(query: ListChallansQuery) {
    const pagination = parsePagination(query);
    const [challans, total] = await challansRepository.findMany({
      skip: pagination.skip, take: pagination.take, search: query.search,
      customerId: query.customerId, status: query.status as never,
      fromDate: query.fromDate ? new Date(query.fromDate) : undefined,
      toDate: query.toDate ? new Date(query.toDate) : undefined,
    });
    return { data: challans, meta: buildPaginationMeta(total, pagination.page, pagination.limit) };
  },

  async getById(id: string) {
    const challan = await challansRepository.findById(id);
    if (!challan) throw ApiError.notFound('Challan not found');
    return challan;
  },

  async createDraft(input: CreateChallanInput, actorId: string, ipAddress?: string) {
    const customer = await prisma.customer.findUnique({ where: { id: input.customerId } });
    if (!customer || !customer.isActive) throw ApiError.notFound('Customer not found or inactive');

    const productIds = input.items.map((i) => i.productId);
    const products = await prisma.product.findMany({ where: { id: { in: productIds }, isActive: true } });
    if (products.length !== productIds.length) throw ApiError.badRequest('One or more selected products are invalid or inactive');

    const productMap = new Map(products.map((p) => [p.id, p]));
    let subtotal = 0;

    const itemsData = input.items.map((item) => {
      const product = productMap.get(item.productId)!;
      const unitPrice = Number(product.sellingPrice);
      const lineSubtotal = unitPrice * item.quantity;
      const discountAmount = (lineSubtotal * item.discount) / 100;
      const lineTotal = lineSubtotal - discountAmount;
      subtotal += lineTotal;
      return {
        productId: product.id, productName: product.name, productSku: product.sku,
        unit: product.unit, quantity: item.quantity, unitPrice, discount: item.discount, total: lineTotal,
      };
    });

    const discountAmount = (subtotal * input.discountPercent) / 100;
    const taxableAmount = subtotal - discountAmount;
    const taxAmount = (taxableAmount * input.taxPercent) / 100;
    const total = taxableAmount + taxAmount;

    const challanNumber = await generateChallanNumber();
    const challan = await challansRepository.create(
      {
        challanNumber, customerId: customer.id, userId: actorId, status: 'DRAFT',
        subtotal, discountPercent: input.discountPercent, discountAmount,
        taxPercent: input.taxPercent, taxAmount, total,
        deliveryAddress: input.deliveryAddress ?? `${customer.addressLine1},${customer.city}, ${customer.state} -${customer.pinCode}`,
        notes: input.notes,
      },
      itemsData as never
    );

    await logActivity({
      userId: actorId, action: 'CHALLAN_CREATED', entityType: 'Challan',
      entityId: challan.id, entityLabel: `Challan ${challan.challanNumber}`,
      metadata: { customerId: customer.id, total, itemCount: itemsData.length }, ipAddress,
    });
    return challan;
  },

  async confirm(id: string, actorId: string, ipAddress?: string) {
    return prisma.$transaction(async (tx) => {
      const challan = await tx.challan.findUnique({ where: { id }, include: { items: true, customer: true } });
      if (!challan) throw ApiError.notFound('Challan not found');
      if (challan.status !== 'DRAFT') throw ApiError.badRequest('Only DRAFT challans can be confirmed');

      for (const item of challan.items) {
        const product = await tx.product.findUnique({ where: { id: item.productId } });
        if (!product) throw ApiError.notFound(`Product ${item.productName} no longer exists`);
        if (product.currentStock < item.quantity) {
          throw ApiError.unprocessable(`Insufficient stock for ${product.name} (${product.sku}). Available: ${product.currentStock}, Required:${item.quantity}`);
        }

        const balanceAfter = product.currentStock - item.quantity;
        await tx.product.update({ where: { id: item.productId }, data: { currentStock: balanceAfter } });
        await tx.stockMovement.create({
          data: {
            productId: item.productId, userId: actorId, challanId: challan.id, type: 'OUTWARD',
            quantity: item.quantity, balanceAfter, unitCost: product.costPrice,
            reference: challan.challanNumber, notes: `Challan confirmed for ${challan.customer.name}`,
          },
        });

        if (balanceAfter <= product.minStockLevel) {
          await notifyRoles(
            ['ADMIN', 'WAREHOUSE'],
            {
              title: 'Low Stock Alert',
              message: `Product ${product.name} (${product.sku}) dropped to ${balanceAfter}${product.unit} after Challan confirmation.`,
              type: 'warning', actionUrl: `/inventory/${product.id}`,
            },
            tx
          );
        }
      }

      const updatedChallan = await tx.challan.update({
        where: { id }, data: { status: 'CONFIRMED', confirmedAt: new Date() },
        include: { customer: true, items: true },
      });
      await tx.customer.update({ where: { id: challan.customerId }, data: { outstandingAmount: { increment: challan.total } } });
      await logActivity(
        { userId: actorId, action: 'CHALLAN_CONFIRMED', entityType: 'Challan', entityId: challan.id, entityLabel: `Challan ${challan.challanNumber}`, metadata: { total: challan.total, customerId: challan.customerId }, ipAddress },
        tx
      );
      await notifyRoles(['WAREHOUSE'], { title: 'New Challan Ready for Dispatch', message: `Challan ${challan.challanNumber} (${challan.customer.name}) confirmed and awaiting dispatch.`, type: 'info', actionUrl: `/challans/${challan.id}` }, tx);
      return updatedChallan;
    });
  },

  async dispatch(id: string, actorId: string, ipAddress?: string) {
    const challan = await this.getById(id);
    if (challan.status !== 'CONFIRMED') throw ApiError.badRequest('Only CONFIRMED challans can be dispatched');
    const updated = await challansRepository.updateStatus(id, 'DISPATCHED', 'dispatchedAt');
    await logActivity({ userId: actorId, action: 'CHALLAN_DISPATCHED', entityType: 'Challan', entityId: id, entityLabel: `Challan ${challan.challanNumber}`, ipAddress });
    return updated;
  },

  async deliver(id: string, actorId: string, ipAddress?: string) {
    const challan = await this.getById(id);
    if (challan.status !== 'DISPATCHED') throw ApiError.badRequest('Only DISPATCHED challans can be marked as delivered');
    const updated = await challansRepository.updateStatus(id, 'DELIVERED', 'deliveredAt');
    await logActivity({ userId: actorId, action: 'CHALLAN_DELIVERED', entityType: 'Challan', entityId: id, entityLabel: `Challan ${challan.challanNumber}`, ipAddress });
    return updated;
  },

  async cancel(id: string, actorId: string, ipAddress?: string) {
    return prisma.$transaction(async (tx) => {
      const challan = await tx.challan.findUnique({ where: { id }, include: { items: true, customer: true } });
      if (!challan) throw ApiError.notFound('Challan not found');
      if (challan.status === 'DELIVERED' || challan.status === 'CANCELLED') throw ApiError.badRequest('Cannot cancel a delivered or already cancelled challan');

      if (challan.status === 'CONFIRMED' || challan.status === 'DISPATCHED') {
        for (const item of challan.items) {
          const product = await tx.product.findUnique({ where: { id: item.productId } });
          if (product) {
            const balanceAfter = product.currentStock + item.quantity;
            await tx.product.update({ where: { id: item.productId }, data: { currentStock: balanceAfter } });
            await tx.stockMovement.create({
              data: { productId: item.productId, userId: actorId, challanId: challan.id, type: 'RETURN', quantity: item.quantity, balanceAfter, unitCost: product.costPrice, reference: `${challan.challanNumber}_CANCEL`, notes: 'Stock restored due to challan cancellation' },
            });
          }
        }
        await tx.customer.update({ where: { id: challan.customerId }, data: { outstandingAmount: { decrement: challan.total } } });
      }

      const updated = await tx.challan.update({ where: { id }, data: { status: 'CANCELLED', cancelledAt: new Date() } });
      await logActivity({ userId: actorId, action: 'CHALLAN_CANCELLED', entityType: 'Challan', entityId: id, entityLabel: `Challan ${challan.challanNumber}`, metadata: { previousStatus: challan.status }, ipAddress }, tx);
      return updated;
    });
  },

  async generateInvoiceHtml(id: string): Promise<string> {
    const challan = await this.getById(id);
    const dateStr = challan.createdAt.toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' });
    const itemsRows = challan.items.map((i, idx) => `<tr><td style="padding: 12px; border-bottom: 1px solid #e2e8f0; text-align: center;">${idx + 1}</td><td style="padding: 12px; border-bottom: 1px solid #e2e8f0;"><strong>${i.productName}</strong><br><small style="color: #64748b;">SKU: ${i.productSku}</small></td><td style="padding: 12px; border-bottom: 1px solid #e2e8f0; text-align: right;">₹${Number(i.unitPrice).toFixed(2)}</td><td style="padding: 12px; border-bottom: 1px solid #e2e8f0; text-align: center;">${i.quantity}${i.unit}</td><td style="padding: 12px; border-bottom: 1px solid #e2e8f0; text-align: right;">${Number(i.discount)}\%</td><td style="padding: 12px; border-bottom: 1px solid #e2e8f0; text-align: right; font-weight: 600;">₹${Number(i.total).toFixed(2)}</td></tr>`).join('');

    return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Invoice - ${challan.challanNumber}</title><style>body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; color: #1e293b; margin: 0; padding: 40px; } .container { max-width: 800px; margin: 0 auto; border: 1px solid #cbd5e1; padding: 40px; border-radius: 8px; } .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #0f172a; padding-bottom: 20px; margin-bottom: 30px; } .company h1 { margin: 0 0 8px 0; color: #0f172a; font-size: 28px; } .invoice-meta { text-align: right; } .invoice-meta h2 { margin: 0 0 8px 0; color: #3b82f6; font-size: 24px; } .grid { display: flex; justify-content: space-between; margin-bottom: 30px; } .box { width: 48%; } table { width: 100%; border-collapse: collapse; margin-bottom: 30px; } th { background-color: #f8fafc; padding: 12px; text-align: left; font-size: 14px; color: #475569; border-bottom: 2px solid #cbd5e1; } .totals { width: 300px; margin-left: auto; } .totals-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #f1f5f9; } .totals-row.grand { font-size: 18px; font-weight: bold; border-top: 2px solid #0f172a; border-bottom: none; padding-top: 12px; color: #0f172a; } .badge { display: inline-block; padding: 4px 12px; border-radius: 9999px; font-size: 12px; font-weight: 600; text-transform: uppercase; } .status-${challan.status.toLowerCase()} { background: #dbeafe; color: #1d4ed8; }</style></head><body><div class="container"><div class="header"><div class="company"><h1>WHOLESALE ERP</h1><p style="margin: 0; color: #64748b;">Wholesale Business Management System<br>Secunderabad, Telangana, India</p></div><div class="invoice-meta"><h2>TAX INVOICE</h2><p style="margin: 0;"><strong>Challan No:</strong> ${challan.challanNumber}<br><strong>Date:</strong> ${dateStr}<br><span class="badge status-${challan.status.toLowerCase()}" style="margin-top: 8px;">${challan.status}</span></p></div></div><div class="grid"><div class="box"><h3 style="color: #64748b; font-size: 12px; text-transform: uppercase; margin-bottom: 8px;">Billed To:</h3><p style="margin: 0; font-size: 16px;"><strong>${challan.customer.name}</strong></p><p style="margin: 4px 0; color: #475569;">${challan.customer.phone} | ${challan.customer.email ?? ''}</p><p style="margin: 4px 0; color: #475569;">GSTIN: <strong>${challan.customer.gstNumber ?? 'N/A'}</strong></p></div><div class="box"><h3 style="color: #64748b; font-size: 12px; text-transform: uppercase; margin-bottom: 8px;">Delivery Address:</h3><p style="margin: 0; color: #475569; white-space: pre-line;">${challan.deliveryAddress ?? 'Same as billing address'}</p></div></div><table><thead><tr><th style="width: 50px; text-align: center;">#</th><th>Product Description</th><th style="text-align: right;">Price</th><th style="text-align: center;">Qty</th><th style="text-align: right;">Disc.</th><th style="text-align: right;">Total</th></tr></thead><tbody>${itemsRows}</tbody></table><div class="totals"><div class="totals-row"><span>Subtotal:</span><span>₹${Number(challan.subtotal).toFixed(2)}</span></div><div class="totals-row"><span>Discount (${Number(challan.discountPercent)}%):</span><span>-₹${Number(challan.discountAmount).toFixed(2)}</span></div><div class="totals-row"><span>GST (${Number(challan.taxPercent)}%):</span><span>₹${Number(challan.taxAmount).toFixed(2)}</span></div><div class="totals-row grand"><span>Total Amount:</span><span>₹${Number(challan.total).toFixed(2)}</span></div></div></div></body></html>`;
  },
};
