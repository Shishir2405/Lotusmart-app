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

/**
 * Derive a poster image (first frame) from a Cloudinary VIDEO url:
 *   .../video/upload/<rest>/name.mp4  ->  .../video/upload/so_0/<rest>/name.jpg
 * so_0 seeks to the first frame and renders it as a still, which lets a video
 * slide show real artwork instead of a black box before playback starts.
 * Returns null when the url isn't a Cloudinary video delivery url.
 */
export function videoPosterUrl(videoUrl: string): string | null {
  if (typeof videoUrl !== 'string') return null;
  const marker = '/video/upload/';
  const idx = videoUrl.indexOf(marker);
  if (idx === -1) return null;

  const prefix = videoUrl.slice(0, idx + marker.length);
  let rest = videoUrl.slice(idx + marker.length);

  rest = rest.includes('.') ? rest.replace(/\.[^./?]+(\?.*)?$/, '.jpg') : `${rest}.jpg`;

  return `${prefix}so_0/${rest}`;
}
