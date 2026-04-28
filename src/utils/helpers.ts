export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(date: string | Date): string {
  return new Date(date).toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function getDiscountPercentage(price: number, compareAtPrice?: number): number {
  if (!compareAtPrice || compareAtPrice <= price) return 0;
  return Math.round(((compareAtPrice - price) / compareAtPrice) * 100);
}

export function getShippingCost(_subtotal: number): number {
  // Free shipping on all prepaid orders (only payment mode supported).
  return 0;
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength).trim() + '...';
}

export function getOrderStatusColor(status: string): string {
  const map: Record<string, string> = {
    placed: '#3B82F6',
    confirmed: '#8B5CF6',
    processing: '#F59E0B',
    shipped: '#06B6D4',
    delivered: '#10B981',
    cancelled: '#EF4444',
    returned: '#6B7280',
  };
  return map[status] ?? '#6B7280';
}

export function getPaymentStatusColor(status: string): string {
  const map: Record<string, string> = {
    pending: '#F59E0B',
    paid: '#10B981',
    failed: '#EF4444',
    refunded: '#6B7280',
  };
  return map[status] ?? '#6B7280';
}

export function generateCartItemKey(productId: string, variant?: string): string {
  return variant ? `${productId}-${variant}` : productId;
}
