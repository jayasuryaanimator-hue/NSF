import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { ArrowLeft, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ImageUploader } from '@/components/admin/ImageUploader';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';
import { generateSlug } from '@/lib/format';

// Wood types for furniture
const WOOD_TYPES = [
  'Teak Wood',
  'Rosewood',
  'Sheesham Wood',
  'Mango Wood',
  'Rubber Wood',
  'Pine Wood',
  'Oak Wood',
  'Walnut Wood',
  'Mahogany',
  'Plywood',
  'MDF',
  'Particle Board',
  'Engineered Wood',
  'Metal Frame',
  'Mixed Materials',
  'Other',
];

// Furniture colors
const FURNITURE_COLORS = [
  'Natural',
  'Honey',
  'Walnut',
  'Dark Walnut',
  'Mahogany',
  'Teak Finish',
  'White',
  'Black',
  'Grey',
  'Brown',
  'Beige',
  'Multi-color',
];

export default function ProductForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { isAdmin, isBranchManager, userBranchId } = useAuth();
  const isEditing = !!id;

  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    short_description: '',
    description: '',
    category_id: '',
    branch_id: isBranchManager ? userBranchId || '' : '',
    price: '',
    compare_at_price: '',
    cost_price: '',
    stock_quantity: '',
    dimensions: '',
    wood_type: '',
    color: '',
    is_active: true,
    is_featured: false,
    images: [''],
  });

  // Fetch categories
  const { data: categories } = useQuery({
    queryKey: ['admin-categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('is_active', true)
        .order('display_order');
      
      if (error) throw error;
      return data;
    },
  });

  // Fetch branches (for admins to select, or branch manager's own branch)
  const { data: branches } = useQuery({
    queryKey: ['admin-branches'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('branches')
        .select('id, name, code')
        .eq('is_active', true)
        .order('display_order');
      
      if (error) throw error;
      return data;
    },
  });

  // Get branch manager's branch name
  const userBranch = branches?.find(b => b.id === userBranchId);

  // Fetch product if editing
  const { data: product, isLoading } = useQuery({
    queryKey: ['admin-product', id],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: isEditing,
  });

  // Load product data into form
  useEffect(() => {
    if (product) {
      const dimensions = product.dimensions as { size?: string; wood_type?: string; color?: string } | null;
      setFormData({
        name: product.name || '',
        slug: product.slug || '',
        short_description: product.short_description || '',
        description: product.description || '',
        category_id: product.category_id || '',
        branch_id: product.branch_id || '',
        price: product.price?.toString() || '',
        compare_at_price: product.compare_at_price?.toString() || '',
        cost_price: product.cost_price?.toString() || '',
        stock_quantity: product.stock_quantity?.toString() || '',
        dimensions: dimensions?.size || product.sku || '',
        wood_type: dimensions?.wood_type || '',
        color: dimensions?.color || '',
        is_active: product.is_active ?? true,
        is_featured: product.is_featured ?? false,
        images: product.images?.length ? product.images : [''],
      });
    }
  }, [product]);

  // Auto-set branch_id for branch managers
  useEffect(() => {
    if (isBranchManager && userBranchId && !formData.branch_id) {
      setFormData(prev => ({ ...prev, branch_id: userBranchId }));
    }
  }, [isBranchManager, userBranchId, formData.branch_id]);

  const saveMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const productData = {
        name: data.name,
        slug: data.slug || generateSlug(data.name),
        short_description: data.short_description || null,
        description: data.description || null,
        category_id: data.category_id || null,
        branch_id: data.branch_id || null,
        price: parseFloat(data.price) || 0,
        compare_at_price: data.compare_at_price ? parseFloat(data.compare_at_price) : null,
        cost_price: data.cost_price ? parseFloat(data.cost_price) : null,
        stock_quantity: parseInt(data.stock_quantity) || 0,
        sku: data.dimensions || null, // Store dimensions in SKU for backward compatibility
        dimensions: {
          size: data.dimensions || null,
          wood_type: data.wood_type || null,
          color: data.color || null,
        },
        is_active: data.is_active,
        is_featured: data.is_featured,
        images: data.images.filter(img => img.trim()),
      };

      if (isEditing) {
        const { error } = await supabase
          .from('products')
          .update(productData)
          .eq('id', id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('products')
          .insert(productData);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      toast.success(isEditing ? 'Product updated successfully' : 'Product created successfully');
      navigate('/admin/products');
    },
    onError: (error) => {
      toast.error('Failed to save product');
      console.error(error);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.price) {
      toast.error('Please fill in required fields (Name and Price)');
      return;
    }
    saveMutation.mutate(formData);
  };

  const addImage = () => {
    setFormData(prev => ({
      ...prev,
      images: [...prev.images, '']
    }));
  };

  const updateImage = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.map((item, i) => i === index ? value : item)
    }));
  };

  const removeImage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  };

  if (isEditing && isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-96" />
      </div>
    );
  }

  // Calculate profit margin
  const price = parseFloat(formData.price) || 0;
  const costPrice = parseFloat(formData.cost_price) || 0;
  const comparePrice = parseFloat(formData.compare_at_price) || 0;
  const profit = price - costPrice;
  const profitMargin = costPrice > 0 ? ((profit / costPrice) * 100).toFixed(1) : 0;
  const discount = comparePrice > 0 ? (((comparePrice - price) / comparePrice) * 100).toFixed(0) : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/admin/products')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">
            {isEditing ? 'Edit Product' : 'Add New Furniture'}
          </h1>
          <p className="text-muted-foreground text-sm">
            Add furniture products with competitive wholesale pricing
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info */}
        <Card>
          <CardHeader>
            <CardTitle>Product Details</CardTitle>
            <CardDescription>Basic information about the furniture item</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Product Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    name: e.target.value,
                    slug: generateSlug(e.target.value)
                  }))}
                  placeholder="e.g., King Size Teak Wood Bed"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select
                  value={formData.category_id}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, category_id: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories?.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Branch Selection - Admins can select, Branch managers see their branch (read-only) */}
            {isAdmin ? (
              <div className="space-y-2">
                <Label htmlFor="branch">Branch / Showroom</Label>
                <Select
                  value={formData.branch_id || 'none'}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, branch_id: value === 'none' ? '' : value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select branch (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No Branch (All Locations)</SelectItem>
                    {branches?.map((branch) => (
                      <SelectItem key={branch.id} value={branch.id}>
                        {branch.name} ({branch.code})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Assign this product to a specific branch for inventory tracking
                </p>
              </div>
            ) : isBranchManager && userBranch ? (
              <div className="space-y-2">
                <Label>Your Branch</Label>
                <div className="flex items-center gap-2 p-3 bg-secondary/50 rounded-lg border">
                  <span className="font-medium">{userBranch.name}</span>
                  <span className="text-muted-foreground">({userBranch.code})</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  This product will be added to your branch inventory
                </p>
              </div>
            ) : null}

            <div className="space-y-2">
              <Label htmlFor="short_description">Short Description</Label>
              <Input
                id="short_description"
                value={formData.short_description}
                onChange={(e) => setFormData(prev => ({ ...prev, short_description: e.target.value }))}
                placeholder="Brief description for product cards (1-2 lines)"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Full Description (Optional)</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                rows={3}
                placeholder="Detailed product description..."
              />
            </div>
          </CardContent>
        </Card>

        {/* Pricing */}
        <Card>
          <CardHeader>
            <CardTitle>Pricing & Stock</CardTitle>
            <CardDescription>Set competitive wholesale prices</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label htmlFor="price">Selling Price (₹) *</Label>
                <Input
                  id="price"
                  type="number"
                  step="1"
                  value={formData.price}
                  onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                  placeholder="15000"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="compare_at_price">MRP / Compare Price (₹)</Label>
                <Input
                  id="compare_at_price"
                  type="number"
                  step="1"
                  value={formData.compare_at_price}
                  onChange={(e) => setFormData(prev => ({ ...prev, compare_at_price: e.target.value }))}
                  placeholder="20000"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cost_price">Cost Price (₹)</Label>
                <Input
                  id="cost_price"
                  type="number"
                  step="1"
                  value={formData.cost_price}
                  onChange={(e) => setFormData(prev => ({ ...prev, cost_price: e.target.value }))}
                  placeholder="12000"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="stock_quantity">Stock Qty</Label>
                <Input
                  id="stock_quantity"
                  type="number"
                  value={formData.stock_quantity}
                  onChange={(e) => setFormData(prev => ({ ...prev, stock_quantity: e.target.value }))}
                  placeholder="10"
                />
              </div>
            </div>

            {/* Price Summary */}
            {(price > 0 || costPrice > 0 || comparePrice > 0) && (
              <div className="flex flex-wrap gap-4 p-4 bg-secondary/50 rounded-lg">
                {costPrice > 0 && price > 0 && (
                  <div className="text-sm">
                    <span className="text-muted-foreground">Profit:</span>{' '}
                    <span className={profit >= 0 ? 'text-success font-semibold' : 'text-destructive font-semibold'}>
                      ₹{profit.toLocaleString()} ({profitMargin}%)
                    </span>
                  </div>
                )}
                {comparePrice > 0 && price > 0 && comparePrice > price && (
                  <div className="text-sm">
                    <span className="text-muted-foreground">Discount:</span>{' '}
                    <span className="text-primary font-semibold">{discount}% OFF</span>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Specifications */}
        <Card>
          <CardHeader>
            <CardTitle>Specifications</CardTitle>
            <CardDescription>Physical attributes of the furniture</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="dimensions">Dimensions / Size</Label>
                <Input
                  id="dimensions"
                  value={formData.dimensions}
                  onChange={(e) => setFormData(prev => ({ ...prev, dimensions: e.target.value }))}
                  placeholder="e.g., 6ft x 6.5ft or L72 x W36 x H30 inches"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="wood_type">Material / Wood Type</Label>
                <Select
                  value={formData.wood_type}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, wood_type: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select wood type" />
                  </SelectTrigger>
                  <SelectContent>
                    {WOOD_TYPES.map((wood) => (
                      <SelectItem key={wood} value={wood}>
                        {wood}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="color">Color / Finish</Label>
                <Select
                  value={formData.color}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, color: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select color" />
                  </SelectTrigger>
                  <SelectContent>
                    {FURNITURE_COLORS.map((color) => (
                      <SelectItem key={color} value={color}>
                        {color}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-center gap-6 pt-2">
              <div className="flex items-center gap-2">
                <Switch
                  id="is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
                />
                <Label htmlFor="is_active">Active (visible on website)</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  id="is_featured"
                  checked={formData.is_featured}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_featured: checked }))}
                />
                <Label htmlFor="is_featured">Featured Product</Label>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Images */}
        <Card>
          <CardHeader>
            <CardTitle>Product Images</CardTitle>
            <CardDescription>Add high-quality images of the furniture (first image is the main image)</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {formData.images.map((img, index) => (
              <div key={index} className="p-4 border rounded-lg space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-sm">
                    Image {index + 1} {index === 0 && <span className="text-primary">(Main Image)</span>}
                  </span>
                  {formData.images.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeImage(index)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Remove
                    </Button>
                  )}
                </div>
                <ImageUploader
                  value={img}
                  onChange={(url) => updateImage(index, url)}
                  bucket="page-images"
                  folder="products"
                />
              </div>
            ))}
            <Button type="button" variant="outline" onClick={addImage}>
              <Plus className="h-4 w-4 mr-2" />
              Add Another Image
            </Button>
          </CardContent>
        </Card>

        {/* Submit */}
        <div className="flex items-center gap-4">
          <Button type="submit" size="lg" disabled={saveMutation.isPending}>
            {saveMutation.isPending ? 'Saving...' : isEditing ? 'Update Product' : 'Add Product'}
          </Button>
          <Button type="button" variant="outline" size="lg" onClick={() => navigate('/admin/products')}>
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}
