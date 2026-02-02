/**
 * Format a number as Indian Rupee currency
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Format a date to a readable string
 */
export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(d);
}

/**
 * Format a date with time
 */
export function formatDateTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(d);
}

/**
 * Format order status for display
 */
export function formatOrderStatus(status: string): string {
  const statusMap: Record<string, string> = {
    order_placed: 'Order Placed',
    payment_verification_pending: 'Payment Verification Pending',
    payment_confirmed: 'Payment Confirmed',
    product_packed: 'Product Packed',
    shipped: 'Shipped',
    out_for_delivery: 'Out for Delivery',
    delivered: 'Delivered',
    cancelled: 'Cancelled',
  };
  return statusMap[status] || status;
}

/**
 * Format payment status for display
 */
export function formatPaymentStatus(status: string): string {
  const statusMap: Record<string, string> = {
    pending: 'Pending',
    verification_pending: 'Verification Pending',
    verified: 'Verified',
    failed: 'Failed',
    refunded: 'Refunded',
  };
  return statusMap[status] || status;
}

/**
 * Get status badge class based on order status
 */
export function getStatusBadgeClass(status: string): string {
  const classMap: Record<string, string> = {
    order_placed: 'status-badge status-pending',
    payment_verification_pending: 'status-badge status-pending',
    payment_confirmed: 'status-badge status-confirmed',
    product_packed: 'status-badge status-processing',
    shipped: 'status-badge status-shipped',
    out_for_delivery: 'status-badge status-shipped',
    delivered: 'status-badge status-delivered',
    cancelled: 'status-badge status-cancelled',
  };
  return classMap[status] || 'status-badge';
}

/**
 * Truncate text to a specified length
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength).trim() + '...';
}

/**
 * Generate a slug from a string
 */
export function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Calculate tax amount (18% GST)
 */
export function calculateTax(subtotal: number): number {
  return Math.round(subtotal * 0.18 * 100) / 100;
}

/**
 * Calculate total with tax
 */
export function calculateTotal(subtotal: number, shippingAmount: number = 0): {
  subtotal: number;
  tax: number;
  shipping: number;
  total: number;
} {
  const tax = calculateTax(subtotal);
  const total = subtotal + tax + shippingAmount;
  return {
    subtotal,
    tax,
    shipping: shippingAmount,
    total,
  };
}
