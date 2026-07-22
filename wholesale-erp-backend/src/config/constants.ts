export const COOKIE_NAMES = {
  REFRESH_TOKEN: 'wse_refresh_token',
} as const;

export const PAGINATION_DEFAULTS = {
  PAGE: 1,
  LIMIT: 20,
  MAX_LIMIT: 100,
} as const;

export const CODE_PREFIXES = {
  CUSTOMER: 'CUS',
  PRODUCT: 'PRD',
  CHALLAN: 'CHN',
} as const;

export const ROLE_GROUPS = {
  ALL: ['ADMIN', 'SALES', 'WAREHOUSE', 'ACCOUNTS'] as const,
  ADMIN_ONLY: ['ADMIN'] as const,
  SALES_TEAM: ['ADMIN', 'SALES'] as const,
  WAREHOUSE_TEAM: ['ADMIN', 'WAREHOUSE'] as const,
  FINANCE_TEAM: ['ADMIN', 'ACCOUNTS'] as const,
  CUSTOMER_ACCESS: ['ADMIN', 'SALES', 'ACCOUNTS'] as const,
};
