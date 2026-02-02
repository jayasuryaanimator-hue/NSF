import { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

const productTypes = [
  'Power Sprayer',
  'Brush Cutter',
  'Water Pump',
  'Chainsaw',
  'Garden Tools',
  'Tyres',
  'Lubricants',
  'Batteries',
  'Auto Spare Parts',
  'Other',
];

const budgetRanges = [
  'Under ₹5,000',
  '₹5,000 - ₹15,000',
  '₹15,000 - ₹30,000',
  '₹30,000 - ₹50,000',
  '₹50,000+',
];

const timelines = [
  'Urgent - Within 1 week',
  '1-2 weeks',
  '2-4 weeks',
  'No rush - best availability',
];

interface CustomOrder {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  product_type: string;
  dimensions: string | null;
  finish_type: string | null;
  engraving_text: string | null;
  special_requirements: string | null;
  budget_range: string | null;
  timeline: string | null;
}

interface EditOrderDialogProps {
  order: CustomOrder | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditOrderDialog({ order, open, onOpenChange }: EditOrderDialogProps) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    productType: '',
    dimensions: '',
    finishType: '',
    engravingText: '',
    specialRequirements: '',
    budgetRange: '',
    timeline: '',
  });

  useEffect(() => {
    if (order) {
      setFormData({
        name: order.name || '',
        email: order.email || '',
        phone: order.phone || '',
        productType: order.product_type || '',
        dimensions: order.dimensions || '',
        finishType: order.finish_type || '',
        engravingText: order.engraving_text || '',
        specialRequirements: order.special_requirements || '',
        budgetRange: order.budget_range || '',
        timeline: order.timeline || '',
      });
    }
  }, [order]);

  const updateMutation = useMutation({
    mutationFn: async () => {
      if (!order) throw new Error('No order to update');
      
      const { error } = await supabase
        .from('custom_orders')
        .update({
          name: formData.name,
          email: formData.email,
          phone: formData.phone || null,
          product_type: formData.productType,
          dimensions: formData.dimensions || null,
          finish_type: formData.finishType || null,
          engraving_text: formData.engravingText || null,
          special_requirements: formData.specialRequirements || null,
          budget_range: formData.budgetRange || null,
          timeline: formData.timeline || null,
        })
        .eq('id', order.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-custom-orders'] });
      toast.success('Order updated successfully');
      onOpenChange(false);
    },
    onError: (error) => {
      console.error('Error updating order:', error);
      toast.error('Failed to update order');
    },
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.productType) {
      toast.error('Please fill in all required fields');
      return;
    }
    updateMutation.mutate();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Order</DialogTitle>
          <DialogDescription>
            Update your custom order details below.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Contact Information */}
          <div className="space-y-3">
            <h3 className="font-semibold text-sm border-b pb-2">Contact Information</h3>
            <div className="grid md:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="edit-name">Full Name *</Label>
                <Input
                  id="edit-name"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  required
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="edit-email">Email *</Label>
                <Input
                  id="edit-email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  required
                />
              </div>
            </div>
            <div className="space-y-1">
              <Label htmlFor="edit-phone">Phone</Label>
              <Input
                id="edit-phone"
                value={formData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
              />
            </div>
          </div>

          {/* Product Details */}
          <div className="space-y-3">
            <h3 className="font-semibold text-sm border-b pb-2">Product Details</h3>
            <div className="grid md:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="edit-productType">Product Type *</Label>
                <Select
                  value={formData.productType}
                  onValueChange={(value) => handleInputChange('productType', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select product type" />
                  </SelectTrigger>
                  <SelectContent>
                    {productTypes.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label htmlFor="edit-dimensions">Dimensions</Label>
                <Input
                  id="edit-dimensions"
                  value={formData.dimensions}
                  onChange={(e) => handleInputChange('dimensions', e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-1">
              <Label htmlFor="edit-engravingText">Special Needs</Label>
              <Input
                id="edit-engravingText"
                value={formData.engravingText}
                onChange={(e) => handleInputChange('engravingText', e.target.value)}
              />
            </div>
          </div>

          {/* Additional Details */}
          <div className="space-y-3">
            <h3 className="font-semibold text-sm border-b pb-2">Additional Details</h3>
            <div className="grid md:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Budget Range</Label>
                <Select
                  value={formData.budgetRange}
                  onValueChange={(value) => handleInputChange('budgetRange', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select budget" />
                  </SelectTrigger>
                  <SelectContent>
                    {budgetRanges.map((range) => (
                      <SelectItem key={range} value={range}>
                        {range}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Timeline</Label>
                <Select
                  value={formData.timeline}
                  onValueChange={(value) => handleInputChange('timeline', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select timeline" />
                  </SelectTrigger>
                  <SelectContent>
                    {timelines.map((time) => (
                      <SelectItem key={time} value={time}>
                        {time}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1">
              <Label htmlFor="edit-specialRequirements">Special Requirements</Label>
              <Textarea
                id="edit-specialRequirements"
                rows={3}
                value={formData.specialRequirements}
                onChange={(e) => handleInputChange('specialRequirements', e.target.value)}
              />
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={updateMutation.isPending}
              className="flex-1"
            >
              {updateMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
