import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { formatCurrency, formatDateTime } from './format';

// Excel Export Functions
export function exportToExcel(data: any[], filename: string, sheetName: string = 'Sheet1') {
  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
  
  // Auto-size columns
  const maxWidth = 50;
  const colWidths = Object.keys(data[0] || {}).map(key => ({
    wch: Math.min(maxWidth, Math.max(key.length, ...data.map(row => String(row[key] || '').length)))
  }));
  worksheet['!cols'] = colWidths;
  
  XLSX.writeFile(workbook, `${filename}.xlsx`);
}

export function exportMultipleSheetsToExcel(
  sheets: { data: any[]; name: string }[],
  filename: string
) {
  const workbook = XLSX.utils.book_new();
  
  sheets.forEach(({ data, name }) => {
    if (data.length > 0) {
      const worksheet = XLSX.utils.json_to_sheet(data);
      XLSX.utils.book_append_sheet(workbook, worksheet, name);
    }
  });
  
  XLSX.writeFile(workbook, `${filename}.xlsx`);
}

// PDF Export Functions
export function exportToPDF(
  title: string,
  headers: string[],
  data: (string | number)[][],
  filename: string,
  options?: {
    orientation?: 'portrait' | 'landscape';
    summary?: { label: string; value: string }[];
  }
) {
  const doc = new jsPDF({
    orientation: options?.orientation || 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  // Add title
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text(title, 14, 20);

  // Add date
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Generated: ${new Date().toLocaleDateString('en-IN')}`, 14, 28);

  let startY = 35;

  // Add summary if provided
  if (options?.summary && options.summary.length > 0) {
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('Summary', 14, startY);
    startY += 6;
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    options.summary.forEach((item, index) => {
      doc.text(`${item.label}: ${item.value}`, 14, startY + (index * 5));
    });
    startY += options.summary.length * 5 + 8;
  }

  // Add table
  autoTable(doc, {
    head: [headers],
    body: data,
    startY: startY,
    styles: {
      fontSize: 9,
      cellPadding: 3,
    },
    headStyles: {
      fillColor: [85, 107, 47], // Olive green matching brand
      textColor: 255,
      fontStyle: 'bold',
    },
    alternateRowStyles: {
      fillColor: [245, 245, 240],
    },
    margin: { top: 35 },
  });

  doc.save(`${filename}.pdf`);
}

// Dashboard Export Data Formatters
export function formatOrdersForExport(orders: any[]) {
  return orders.map(order => ({
    'Order Number': order.order_number,
    'Customer': (order.shipping_address as any)?.full_name || '-',
    'Phone': (order.shipping_address as any)?.phone || '-',
    'Status': order.status?.replace(/_/g, ' ').toUpperCase() || '-',
    'Payment Status': order.payment_status?.replace(/_/g, ' ').toUpperCase() || '-',
    'Payment Method': order.payment_method?.toUpperCase() || '-',
    'Subtotal': formatCurrency(order.subtotal),
    'Tax': formatCurrency(order.tax_amount || 0),
    'Shipping': formatCurrency(order.shipping_amount || 0),
    'Total': formatCurrency(order.total_amount),
    'Date': formatDateTime(order.created_at),
  }));
}

export function formatProductsForExport(products: any[]) {
  return products.map(product => ({
    'Name': product.name,
    'SKU': product.sku || '-',
    'Category': (product.categories as any)?.name || '-',
    'Price': formatCurrency(product.price),
    'Compare at Price': product.compare_at_price ? formatCurrency(product.compare_at_price) : '-',
    'Cost Price': product.cost_price ? formatCurrency(product.cost_price) : '-',
    'Stock': product.stock_quantity || 0,
    'Stock Value': formatCurrency((product.cost_price || product.price) * (product.stock_quantity || 0)),
    'Status': product.is_active ? 'Active' : 'Inactive',
    'Featured': product.is_featured ? 'Yes' : 'No',
    'Created': formatDateTime(product.created_at),
  }));
}

export function formatBillingForExport(bills: any[]) {
  return bills.map(bill => ({
    'Bill Number': bill.bill_number,
    'Customer Name': bill.customer_name,
    'Email': bill.customer_email || '-',
    'Phone': bill.customer_phone || '-',
    'Items Count': (bill.items as any[])?.length || 0,
    'Subtotal': formatCurrency(bill.subtotal),
    'Tax': formatCurrency(bill.tax_amount || 0),
    'Discount': formatCurrency(bill.discount_amount || 0),
    'Total': formatCurrency(bill.total_amount),
    'Date': formatDateTime(bill.created_at),
  }));
}

export function formatReturnsForExport(returns: any[]) {
  return returns.map(ret => ({
    'Order Number': ret.orders?.order_number || '-',
    'Customer': (ret.orders?.shipping_address as any)?.full_name || '-',
    'Reason': ret.reason,
    'Description': ret.description || '-',
    'Status': ret.status?.toUpperCase() || '-',
    'Refund Amount': ret.refund_amount ? formatCurrency(ret.refund_amount) : '-',
    'Requested At': formatDateTime(ret.requested_at),
    'Completed At': ret.completed_at ? formatDateTime(ret.completed_at) : '-',
  }));
}

export function formatStockReportForExport(products: any[]) {
  return products.map(product => ({
    'Product Name': product.name,
    'SKU': product.sku || '-',
    'Stock Quantity': product.stock_quantity || 0,
    'Cost Price': formatCurrency(product.cost_price || product.price),
    'Selling Price': formatCurrency(product.price),
    'Stock Value (Cost)': formatCurrency((product.cost_price || product.price) * (product.stock_quantity || 0)),
    'Stock Value (Retail)': formatCurrency(product.price * (product.stock_quantity || 0)),
    'Status': (product.stock_quantity || 0) === 0 ? 'Out of Stock' : (product.stock_quantity || 0) <= 5 ? 'Low Stock' : 'In Stock',
  }));
}

export function formatCustomersForExport(customers: any[]) {
  return customers.map(customer => ({
    'Name': customer.full_name || '-',
    'Email': customer.email || '-',
    'Phone': customer.phone || '-',
    'Created At': formatDateTime(customer.created_at),
  }));
}

// Dashboard Summary Export
export function exportDashboardSummary(stats: {
  totalSales: number;
  totalOrders: number;
  totalCustomers: number;
  pendingPayments: number;
  activeShipments: number;
  pendingReturns: number;
  totalStockValue: number;
  totalBillingAmount: number;
  totalBillCount: number;
  ordersByStatus: Record<string, number>;
}) {
  const doc = new jsPDF();

  // Title
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('Dashboard Summary Report', 14, 20);

  // Date
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Generated: ${new Date().toLocaleDateString('en-IN')} at ${new Date().toLocaleTimeString('en-IN')}`, 14, 28);

  // Key Metrics
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Key Metrics', 14, 42);

  const metrics = [
    ['Total Sales', formatCurrency(stats.totalSales)],
    ['Total Orders', stats.totalOrders.toString()],
    ['Total Customers', stats.totalCustomers.toString()],
    ['Stock Value', formatCurrency(stats.totalStockValue)],
    ['Billing Amount', formatCurrency(stats.totalBillingAmount)],
    ['Total Bills', stats.totalBillCount.toString()],
    ['Pending Payments', stats.pendingPayments.toString()],
    ['Active Shipments', stats.activeShipments.toString()],
    ['Pending Returns', stats.pendingReturns.toString()],
  ];

  autoTable(doc, {
    body: metrics,
    startY: 48,
    theme: 'striped',
    styles: { fontSize: 11 },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 60 },
      1: { halign: 'right', cellWidth: 60 },
    },
  });

  // Order Status Breakdown
  const finalY = (doc as any).lastAutoTable.finalY || 120;
  
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Order Status Breakdown', 14, finalY + 15);

  const statusData = Object.entries(stats.ordersByStatus).map(([status, count]) => [
    status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
    count.toString(),
  ]);

  autoTable(doc, {
    head: [['Status', 'Count']],
    body: statusData,
    startY: finalY + 20,
    styles: { fontSize: 10 },
    headStyles: {
      fillColor: [85, 107, 47],
      textColor: 255,
    },
  });

  doc.save('dashboard-summary.pdf');
}
