import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ArrowLeft, Plus, Trash2, FileDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { formatCurrency, formatDateTime } from '@/lib/format';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/contexts/AuthContext';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface BillItem {
  id: string;
  product_id?: string;
  name: string;
  quantity: number;
  unit_price: number;
  total: number;
}

// Format currency for PDF (uses Rs. instead of ₹ for font compatibility)
function formatCurrencyForPDF(amount: number): string {
  return `Rs. ${amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

// PDF generation function for a single bill
function generateBillPDF(bill: {
  bill_number: string;
  customer_name: string;
  customer_email?: string | null;
  customer_phone?: string | null;
  customer_gstin?: string | null;
  items: BillItem[];
  subtotal: number;
  discount_amount: number;
  tax_amount: number;
  total_amount: number;
  notes?: string | null;
  created_at?: string;
}) {
  const doc = new jsPDF();
  
  // Add logo (using base64 or drawing text-based logo)
  // Header with company name as logo placeholder
  doc.setFillColor(85, 107, 47);
  doc.rect(14, 10, 60, 12, 'F');
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.text('NEW SATHIYA FURNITURE', 44, 18, { align: 'center' });
  doc.setTextColor(0, 0, 0);
  
  // Invoice title
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.text('INVOICE', 195, 18, { align: 'right' });
  
  // Company info
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text('NEW SATHIYA FURNITURE', 14, 32);
  doc.text('39c, Aavanipudur Jalakandapuram, Main Road', 14, 37);
  doc.text('Edappadi, Tamil Nadu 637101', 14, 42);
  doc.text('India', 14, 47);
  doc.text('Phone: 8675255084', 14, 54);
  doc.text('Email: krameshjet@gmail.com', 14, 59);
  
  // Bill details (right side)
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('Bill Number:', 140, 32);
  doc.setFont('helvetica', 'normal');
  doc.text(bill.bill_number, 140, 38);
  
  doc.setFont('helvetica', 'bold');
  doc.text('Date:', 140, 48);
  doc.setFont('helvetica', 'normal');
  doc.text(bill.created_at ? formatDateTime(bill.created_at) : new Date().toLocaleDateString('en-IN'), 140, 54);
  
  // Separator line
  doc.setDrawColor(200);
  doc.line(14, 68, 195, 68);
  
  // Customer info
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('Bill To:', 14, 78);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(bill.customer_name, 14, 85);
  let customerY = 91;
  if (bill.customer_phone) {
    doc.text(`Phone: ${bill.customer_phone}`, 14, customerY);
    customerY += 5;
  }
  if (bill.customer_email) {
    doc.text(`Email: ${bill.customer_email}`, 14, customerY);
    customerY += 5;
  }
  if (bill.customer_gstin) {
    doc.text(`GSTIN: ${bill.customer_gstin}`, 14, customerY);
    customerY += 5;
  }
  
  // Items table
  const tableData = bill.items
    .filter(item => item.name)
    .map((item, index) => [
      (index + 1).toString(),
      item.name,
      item.quantity.toString(),
      formatCurrencyForPDF(item.unit_price),
      formatCurrencyForPDF(item.total),
    ]);
  
  autoTable(doc, {
    head: [['#', 'Item', 'Qty', 'Price', 'Total']],
    body: tableData,
    startY: 105,
    styles: { fontSize: 10, cellPadding: 4 },
    headStyles: {
      fillColor: [85, 107, 47],
      textColor: 255,
      fontStyle: 'bold',
    },
    columnStyles: {
      0: { cellWidth: 15 },
      1: { cellWidth: 80 },
      2: { cellWidth: 20, halign: 'center' },
      3: { cellWidth: 35, halign: 'right' },
      4: { cellWidth: 35, halign: 'right' },
    },
    alternateRowStyles: { fillColor: [245, 245, 240] },
  });
  
  // Summary
  const finalY = (doc as any).lastAutoTable.finalY + 10;
  
  const summaryX = 140;
  doc.setFontSize(10);
  
  doc.text('Subtotal:', summaryX, finalY);
  doc.text(formatCurrencyForPDF(bill.subtotal), 195, finalY, { align: 'right' });
  
  if (bill.discount_amount > 0) {
    doc.text('Discount:', summaryX, finalY + 7);
    doc.text(`-${formatCurrencyForPDF(bill.discount_amount)}`, 195, finalY + 7, { align: 'right' });
  }
  
  if (bill.tax_amount > 0) {
    doc.text('Tax:', summaryX, finalY + 14);
    doc.text(`+${formatCurrencyForPDF(bill.tax_amount)}`, 195, finalY + 14, { align: 'right' });
  }
  
  doc.setDrawColor(200);
  doc.line(summaryX, finalY + 18, 195, finalY + 18);
  
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Total:', summaryX, finalY + 26);
  doc.text(formatCurrencyForPDF(bill.total_amount), 195, finalY + 26, { align: 'right' });
  
  // Notes
  if (bill.notes) {
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('Notes:', 14, finalY + 40);
    doc.text(bill.notes, 14, finalY + 47);
  }
  
  // Footer
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text('Thank you for your business!', 105, 275, { align: 'center' });
  doc.setFontSize(8);
  doc.text('For any enquiries, contact us at krameshjet@gmail.com or call 8675255084', 105, 282, { align: 'center' });
  
  doc.save(`${bill.bill_number}.pdf`);
}

export default function BillingForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const isEditing = !!id;

  const [formData, setFormData] = useState({
    customer_name: '',
    customer_email: '',
    customer_phone: '',
    customer_gstin: '',
    notes: '',
    discount_amount: 0,
    tax_amount: 0,
  });

  const [items, setItems] = useState<BillItem[]>([
    { id: crypto.randomUUID(), name: '', quantity: 1, unit_price: 0, total: 0 }
  ]);
  
  const [downloadPdfAfterSave, setDownloadPdfAfterSave] = useState(false);

  // Fetch products for selection
  const { data: products } = useQuery({
    queryKey: ['admin-products-for-billing'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('id, name, price')
        .eq('is_active', true)
        .order('name');
      
      if (error) throw error;
      return data;
    },
  });

  // Fetch bill if editing
  const { data: bill, isLoading } = useQuery({
    queryKey: ['admin-bill', id],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await supabase
        .from('billing_records')
        .select('*')
        .eq('id', id)
        .maybeSingle();
      
      if (error) throw error;
      return data;
    },
    enabled: isEditing,
  });

  // Load bill data into form when editing
  useEffect(() => {
    if (bill) {
      setFormData({
        customer_name: bill.customer_name || '',
        customer_email: bill.customer_email || '',
        customer_phone: bill.customer_phone || '',
        customer_gstin: (bill as any).customer_gstin || '',
        notes: bill.notes || '',
        discount_amount: Number(bill.discount_amount) || 0,
        tax_amount: Number(bill.tax_amount) || 0,
      });
      setItems((bill.items as unknown as BillItem[]) || []);
    }
  }, [bill]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const subtotal = items.reduce((sum, item) => sum + item.total, 0);
      const total = subtotal + formData.tax_amount - formData.discount_amount;

      const billData = {
        customer_name: formData.customer_name,
        customer_email: formData.customer_email || null,
        customer_phone: formData.customer_phone || null,
        customer_gstin: formData.customer_gstin || null,
        notes: formData.notes || null,
        items: items as unknown as any,
        subtotal,
        tax_amount: formData.tax_amount,
        discount_amount: formData.discount_amount,
        total_amount: total,
        created_by: user?.id || null,
      };

      if (isEditing) {
        const { data, error } = await supabase
          .from('billing_records')
          .update(billData as any)
          .eq('id', id)
          .select()
          .single();
        if (error) throw error;
        return data;
      } else {
        const { data, error } = await supabase
          .from('billing_records')
          .insert(billData as any)
          .select()
          .single();
        if (error) throw error;
        return data;
      }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['admin-billing'] });
      
      if (downloadPdfAfterSave && data) {
        // Generate PDF with the saved bill data
        generateBillPDF({
          bill_number: data.bill_number,
          customer_name: data.customer_name,
          customer_email: data.customer_email,
          customer_phone: data.customer_phone,
          customer_gstin: (data as any).customer_gstin,
          items: data.items as unknown as BillItem[],
          subtotal: Number(data.subtotal),
          discount_amount: Number(data.discount_amount) || 0,
          tax_amount: Number(data.tax_amount) || 0,
          total_amount: Number(data.total_amount),
          notes: data.notes,
          created_at: data.created_at,
        });
        toast.success(isEditing ? 'Bill updated & PDF downloaded' : 'Bill created & PDF downloaded');
      } else {
        toast.success(isEditing ? 'Bill updated' : 'Bill created');
      }
      
      navigate('/admin/billing');
    },
    onError: (error) => {
      toast.error('Failed to save bill');
      console.error(error);
    },
  });

  const addItem = () => {
    setItems([...items, { 
      id: crypto.randomUUID(), 
      name: '', 
      quantity: 1, 
      unit_price: 0, 
      total: 0 
    }]);
  };

  const updateItem = (index: number, field: keyof BillItem, value: any) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    
    if (field === 'quantity' || field === 'unit_price') {
      newItems[index].total = newItems[index].quantity * newItems[index].unit_price;
    }
    
    setItems(newItems);
  };

  const selectProduct = (index: number, productId: string) => {
    const product = products?.find(p => p.id === productId);
    if (product) {
      const newItems = [...items];
      newItems[index] = {
        ...newItems[index],
        product_id: productId,
        name: product.name,
        unit_price: product.price,
        total: newItems[index].quantity * product.price,
      };
      setItems(newItems);
    }
  };

  const removeItem = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    }
  };

  const subtotal = items.reduce((sum, item) => sum + item.total, 0);
  const total = subtotal + formData.tax_amount - formData.discount_amount;

  const handleSubmit = (e: React.FormEvent, withPdf = false) => {
    e.preventDefault();
    if (!formData.customer_name) {
      toast.error('Customer name is required');
      return;
    }
    if (items.every(item => !item.name)) {
      toast.error('At least one item is required');
      return;
    }
    setDownloadPdfAfterSave(withPdf);
    saveMutation.mutate();
  };

  // Download PDF for existing bill
  const handleDownloadPDF = () => {
    if (bill) {
      generateBillPDF({
        bill_number: bill.bill_number,
        customer_name: bill.customer_name,
        customer_email: bill.customer_email,
        customer_phone: bill.customer_phone,
        customer_gstin: (bill as any).customer_gstin,
        items: bill.items as unknown as BillItem[],
        subtotal: Number(bill.subtotal),
        discount_amount: Number(bill.discount_amount) || 0,
        tax_amount: Number(bill.tax_amount) || 0,
        total_amount: Number(bill.total_amount),
        notes: bill.notes,
        created_at: bill.created_at,
      });
      toast.success('PDF downloaded');
    }
  };

  if (isEditing && isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/admin/billing')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-bold">
            {isEditing ? `Bill: ${bill?.bill_number}` : 'New Bill'}
          </h1>
        </div>
        {isEditing && bill && (
          <Button variant="outline" onClick={handleDownloadPDF}>
            <FileDown className="h-4 w-4 mr-2" />
            Download PDF
          </Button>
        )}
      </div>

      <form onSubmit={(e) => handleSubmit(e, false)} className="space-y-6">
        {/* Customer Info */}
        <Card>
          <CardHeader>
            <CardTitle>Customer Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label htmlFor="customer_name">Customer Name *</Label>
                <Input
                  id="customer_name"
                  value={formData.customer_name}
                  onChange={(e) => setFormData(prev => ({ ...prev, customer_name: e.target.value }))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="customer_email">Email</Label>
                <Input
                  id="customer_email"
                  type="email"
                  value={formData.customer_email}
                  onChange={(e) => setFormData(prev => ({ ...prev, customer_email: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="customer_phone">Phone</Label>
                <Input
                  id="customer_phone"
                  value={formData.customer_phone}
                  onChange={(e) => setFormData(prev => ({ ...prev, customer_phone: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="customer_gstin">GSTIN (Optional)</Label>
                <Input
                  id="customer_gstin"
                  value={formData.customer_gstin}
                  onChange={(e) => setFormData(prev => ({ ...prev, customer_gstin: e.target.value }))}
                  placeholder="e.g., 33AAAAA0000A1Z5"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Items */}
        <Card>
          <CardHeader>
            <CardTitle>Bill Items</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {items.map((item, index) => (
              <div key={item.id} className="flex flex-wrap items-end gap-4 p-4 border rounded-lg">
                <div className="flex-1 min-w-[200px] space-y-2">
                  <Label>Product</Label>
                  <Select
                    value={item.product_id || ''}
                    onValueChange={(v) => selectProduct(index, v)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select product or enter manually" />
                    </SelectTrigger>
                    <SelectContent>
                      {products?.map((product) => (
                        <SelectItem key={product.id} value={product.id}>
                          {product.name} - {formatCurrency(product.price)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex-1 min-w-[200px] space-y-2">
                  <Label>Item Name</Label>
                  <Input
                    value={item.name}
                    onChange={(e) => updateItem(index, 'name', e.target.value)}
                    placeholder="Item name"
                  />
                </div>
                <div className="w-24 space-y-2">
                  <Label>Qty</Label>
                  <Input
                    type="number"
                    min="1"
                    value={item.quantity}
                    onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value) || 1)}
                  />
                </div>
                <div className="w-32 space-y-2">
                  <Label>Price (₹)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={item.unit_price}
                    onChange={(e) => updateItem(index, 'unit_price', parseFloat(e.target.value) || 0)}
                  />
                </div>
                <div className="w-32 space-y-2">
                  <Label>Total</Label>
                  <div className="h-10 flex items-center font-medium">
                    {formatCurrency(item.total)}
                  </div>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removeItem(index)}
                  disabled={items.length === 1}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            ))}
            <Button type="button" variant="outline" onClick={addItem}>
              <Plus className="h-4 w-4 mr-2" />
              Add Item
            </Button>
          </CardContent>
        </Card>

        {/* Summary */}
        <Card>
          <CardHeader>
            <CardTitle>Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="discount">Discount (₹)</Label>
                <Input
                  id="discount"
                  type="number"
                  step="0.01"
                  value={formData.discount_amount}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    discount_amount: parseFloat(e.target.value) || 0 
                  }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tax">Tax (₹)</Label>
                <Input
                  id="tax"
                  type="number"
                  step="0.01"
                  value={formData.tax_amount}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    tax_amount: parseFloat(e.target.value) || 0 
                  }))}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                rows={2}
              />
            </div>

            <Separator />

            <div className="space-y-2 text-right">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>{formatCurrency(subtotal)}</span>
              </div>
              {formData.discount_amount > 0 && (
                <div className="flex justify-between text-destructive">
                  <span>Discount:</span>
                  <span>-{formatCurrency(formData.discount_amount)}</span>
                </div>
              )}
              {formData.tax_amount > 0 && (
                <div className="flex justify-between">
                  <span>Tax:</span>
                  <span>+{formatCurrency(formData.tax_amount)}</span>
                </div>
              )}
              <Separator />
              <div className="flex justify-between text-xl font-bold">
                <span>Total:</span>
                <span>{formatCurrency(total)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex flex-wrap justify-end gap-4">
          <Button type="button" variant="outline" onClick={() => navigate('/admin/billing')}>
            Cancel
          </Button>
          <Button 
            type="button" 
            variant="secondary"
            disabled={saveMutation.isPending}
            onClick={(e) => handleSubmit(e, true)}
          >
            <FileDown className="h-4 w-4 mr-2" />
            {saveMutation.isPending ? 'Saving...' : 'Save & Download PDF'}
          </Button>
          <Button type="submit" disabled={saveMutation.isPending}>
            {saveMutation.isPending ? 'Saving...' : isEditing ? 'Update Bill' : 'Create Bill'}
          </Button>
        </div>
      </form>
    </div>
  );
}
