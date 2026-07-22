export type Role = 'ADMIN' | 'SALES' | 'WAREHOUSE' | 'ACCOUNTS';
export type ChallanStatus = 'DRAFT' | 'CONFIRMED' | 'DISPATCHED' | 'DELIVERED' | 'CANCELLED';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  avatar?: string;
  isActive: boolean;
}

export interface Customer {
  id: string;
  code: string;
  name: string;
  email?: string;
  phone: string;
  gstNumber?: string;
  creditLimit: number;
  outstandingAmount: number;
  city?: string;
  state?: string;
  addressLine1?: string;
  pinCode?: string;
  isActive: boolean;
  tags: string[];
}

export interface Product {
  id: string;
  sku: string;
  name: string;
  description?: string;
  categoryId: string;
  unit: string;
  costPrice: number;
  sellingPrice: number;
  currentStock: number;
  minStockLevel: number;
  isActive: boolean;
  category?: { id: string; name: string; color?: string };
}

export interface ChallanItem {
  id?: string;
  productId: string;
  productName: string;
  productSku: string;
  unit: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  total: number;
}

export interface Challan {
  id: string;
  challanNumber: string;
  customerId: string;
  status: ChallanStatus;
  subtotal: number;
  discountPercent: number;
  discountAmount: number;
  taxPercent: number;
  taxAmount: number;
  total: number;
  createdAt: string;
  customer?: Partial<Customer>;
  items: ChallanItem[];
}

export interface ActivityLog {
  id: string;
  action: string;
  entityType: string;
  entityLabel?: string;
  metadata?: any;
  createdAt: string;
  user?: { name: string; role: string; avatar?: string };
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'error';
  isRead: boolean;
  actionUrl?: string;
  createdAt: string;
}
