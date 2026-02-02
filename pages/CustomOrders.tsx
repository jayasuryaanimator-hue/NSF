import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Layout } from '@/components/layout/Layout';
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { formatDateTime, formatCurrency } from '@/lib/format';
import { Loader2, Paintbrush, Ruler, TreeDeciduous, Clock, IndianRupee, Sparkles, Upload, X, MessageCircle, Image, Package, FileText, CheckCircle, Pencil, Trash2, ChevronDown, Send } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { OrderMessages } from '@/components/custom-orders/OrderMessages';
import { EditOrderDialog } from '@/components/custom-orders/EditOrderDialog';



const productTypes = [
  'Sofa Set',
  'Dining Table',
  'Bed Frame',
  'Wardrobe',
  'TV Unit',
  'Study Desk',
  'Bookshelf',
  'Coffee Table',
  'Dressing Table',
  'Shoe Rack',
  'Kitchen Cabinet',
  'Other Furniture',
];

const woodTypes = [
  'Teak Wood',
  'Rosewood',
  'Sheesham',
  'Mango Wood',
  'Rubber Wood',
  'Pine Wood',
];

const budgetRanges = [
  'Under ₹25,000',
  '₹25,000 - ₹50,000',
  '₹50,000 - ₹1,00,000',
  '₹1,00,000 - ₹2,00,000',
  '₹2,00,000+',
];

const timelines = [
  'Urgent - Within 2 weeks',
  '2-4 weeks',
  '1-2 months',
  'No rush - best quality',
];

const STATUS_DISPLAY: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  pending: { label: 'Pending Review', color: 'bg-yellow-100 text-yellow-800', icon: Clock },
  reviewed: { label: 'Under Review', color: 'bg-blue-100 text-blue-800', icon: FileText },
  quoted: { label: 'Quote Provided', color: 'bg-purple-100 text-purple-800', icon: IndianRupee },
  accepted: { label: 'Accepted', color: 'bg-green-100 text-green-800', icon: CheckCircle },
  in_progress: { label: 'In Progress', color: 'bg-indigo-100 text-indigo-800', icon: Package },
  completed: { label: 'Completed', color: 'bg-emerald-100 text-emerald-800', icon: CheckCircle },
  cancelled: { label: 'Cancelled', color: 'bg-red-100 text-red-800', icon: X },
};

export default function CustomOrders() {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [activeTab, setActiveTab] = useState(user ? 'my-orders' : 'new-order');
  const [editingOrder, setEditingOrder] = useState<any>(null);
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  
  // Fetch user's custom orders (excluding deleted)
  const { data: myOrders, isLoading: isLoadingOrders, refetch: refetchOrders } = useQuery({
    queryKey: ['my-custom-orders', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('custom_orders')
        .select('*')
        .eq('user_id', user.id)
        .eq('deleted_by_customer', false)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  // Delete order mutation (hard delete)
  const deleteOrderMutation = useMutation({
    mutationFn: async (orderId: string) => {
      // First delete all messages for this order
      const { error: msgError } = await supabase
        .from('custom_order_messages')
        .delete()
        .eq('custom_order_id', orderId);
      
      if (msgError) throw msgError;

      // Then delete the order
      const { error } = await supabase
        .from('custom_orders')
        .delete()
        .eq('id', orderId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-custom-orders'] });
      toast({
        title: 'Order deleted',
        description: 'Your custom order has been removed.',
      });
    },
    onError: (error) => {
      console.error('Error deleting order:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete order. Please try again.',
        variant: 'destructive',
      });
    },
  });
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    productType: '',
    woodType: '',
    dimensions: '',
    finishType: '',
    engravingText: '',
    specialRequirements: '',
    budgetRange: '',
    timeline: '',
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (uploadedImages.length + files.length > 5) {
      toast({
        title: 'Too many images',
        description: 'You can upload a maximum of 5 reference images.',
        variant: 'destructive',
      });
      return;
    }

    setIsUploading(true);

    try {
      const newImages: string[] = [];
      
      for (const file of Array.from(files)) {
        if (file.size > 5 * 1024 * 1024) {
          toast({
            title: 'File too large',
            description: `${file.name} exceeds 5MB limit.`,
            variant: 'destructive',
          });
          continue;
        }

        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
        const filePath = `reference-images/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('custom-order-images')
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('custom-order-images')
          .getPublicUrl(filePath);

        newImages.push(publicUrl);
      }

      setUploadedImages(prev => [...prev, ...newImages]);
      toast({
        title: 'Images uploaded',
        description: `${newImages.length} image(s) uploaded successfully.`,
      });
    } catch (error: any) {
      console.error('Error uploading images:', error);
      toast({
        title: 'Upload failed',
        description: 'Failed to upload images. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const removeImage = (index: number) => {
    setUploadedImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.email || !formData.productType) {
      toast({
        title: 'Missing information',
        description: 'Please fill in all required fields.',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Save to database
      const { error } = await supabase.from('custom_orders').insert({
        user_id: user?.id || null,
        name: formData.name,
        email: formData.email,
        phone: formData.phone || null,
        product_type: formData.productType,
        wood_type: formData.woodType || null,
        dimensions: formData.dimensions || null,
        finish_type: formData.finishType || null,
        engraving_text: formData.engravingText || null,
        special_requirements: formData.specialRequirements || null,
        budget_range: formData.budgetRange || null,
        timeline: formData.timeline || null,
        reference_images: uploadedImages.length > 0 ? uploadedImages : null,
      });

      if (error) throw error;

      toast({
        title: 'Request submitted!',
        description: 'Your custom furniture request has been received. We will contact you soon.',
      });

      // Reset form
      setFormData({
        name: '',
        email: '',
        phone: '',
        productType: '',
        woodType: '',
        dimensions: '',
        finishType: '',
        engravingText: '',
        specialRequirements: '',
        budgetRange: '',
        timeline: '',
      });
      setUploadedImages([]);
      
      // Refetch orders if user is logged in
      if (user) {
        refetchOrders();
        setActiveTab('my-orders');
      }

    } catch (error: any) {
      console.error('Error submitting custom order:', error);
      toast({
        title: 'Error',
        description: 'Failed to submit your request. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const features = [
    {
      icon: TreeDeciduous,
      title: 'Premium Woods',
      description: 'Teak, Rosewood, Sheesham & Mango wood',
    },
    {
      icon: Ruler,
      title: 'Custom Dimensions',
      description: 'Furniture tailored to your space',
    },
    {
      icon: Paintbrush,
      title: 'Finish Options',
      description: 'Natural, Walnut, Honey, Mahogany & more',
    },
    {
      icon: Sparkles,
      title: 'Expert Craftsmanship',
      description: 'Skilled artisans with 25+ years experience',
    },
  ];

  return (
    <Layout>
      {/* Hero Section */}
      <section className="relative py-20 bg-gradient-to-br from-primary/10 via-secondary/20 to-accent/10">
        <div className="container-deiva">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center max-w-3xl mx-auto"
          >
            <h1 className="text-4xl md:text-5xl font-bold text-primary mb-4">
              Custom Furniture Orders
            </h1>
            <p className="text-lg text-muted-foreground">
              Dream furniture, crafted just for you. Share your vision and we'll bring it to life 
              with premium wood and expert craftsmanship.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section className="py-12 bg-muted/30">
        <div className="container-deiva">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="text-center"
              >
                <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-primary/10 flex items-center justify-center">
                  <feature.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-semibold text-foreground mb-1">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Main Content Section */}
      <section className="py-16">
        <div className="container-deiva">
          {user ? (
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
              <TabsList className="grid w-full max-w-md grid-cols-2">
                <TabsTrigger value="my-orders" className="gap-2">
                  <Package className="w-4 h-4" />
                  My Orders ({myOrders?.length || 0})
                </TabsTrigger>
                <TabsTrigger value="new-order" className="gap-2">
                  <MessageCircle className="w-4 h-4" />
                  New Request
                </TabsTrigger>
              </TabsList>
              
              {/* My Orders Tab */}
              <TabsContent value="my-orders" className="space-y-6">
                {isLoadingOrders ? (
                  <div className="space-y-4">
                    {[...Array(3)].map((_, i) => (
                      <Skeleton key={i} className="h-32 w-full" />
                    ))}
                  </div>
                ) : myOrders && myOrders.length > 0 ? (
                  <div className="grid gap-4">
                    {myOrders.map((order) => {
                      const statusInfo = STATUS_DISPLAY[order.status] || STATUS_DISPLAY.pending;
                      const StatusIcon = statusInfo.icon;
                      const isExpanded = expandedOrderId === order.id;
                      return (
                        <Card key={order.id} className="overflow-hidden">
                          <CardContent className="p-0">
                            <div className="flex flex-col md:flex-row">
                              {/* Status sidebar */}
                              <div className={`p-4 md:w-48 flex flex-col justify-center items-center ${statusInfo.color} text-center`}>
                                <StatusIcon className="w-8 h-8 mb-2" />
                                <p className="font-semibold">{statusInfo.label}</p>
                              </div>
                              
                              {/* Order details */}
                              <div className="flex-1 p-4 space-y-3">
                                <div className="flex flex-wrap justify-between items-start gap-2">
                                  <div>
                                    <h3 className="font-semibold text-lg">{order.product_type}</h3>
                                    <p className="text-sm text-muted-foreground">
                                      Submitted on {formatDateTime(order.created_at)}
                                    </p>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    {order.quoted_price && (
                                      <div className="text-right mr-2">
                                        <p className="text-sm text-muted-foreground">Quoted Price</p>
                                        <p className="text-xl font-bold text-green-600">
                                          {formatCurrency(order.quoted_price)}
                                        </p>
                                      </div>
                                    )}
                                    {/* Action buttons */}
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => setEditingOrder(order)}
                                      title="Edit order"
                                    >
                                      <Pencil className="w-4 h-4" />
                                    </Button>
                                    <AlertDialog>
                                      <AlertDialogTrigger asChild>
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          className="text-destructive hover:text-destructive"
                                          title="Delete order"
                                        >
                                          <Trash2 className="w-4 h-4" />
                                        </Button>
                                      </AlertDialogTrigger>
                                      <AlertDialogContent>
                                        <AlertDialogHeader>
                                          <AlertDialogTitle>Delete this order?</AlertDialogTitle>
                                          <AlertDialogDescription>
                                            This will permanently delete your custom order request. This action cannot be undone.
                                          </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                                          <AlertDialogAction
                                            onClick={() => deleteOrderMutation.mutate(order.id)}
                                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                          >
                                            Delete
                                          </AlertDialogAction>
                                        </AlertDialogFooter>
                                      </AlertDialogContent>
                                    </AlertDialog>
                                  </div>
                                </div>
                                
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                                  {order.dimensions && (
                                    <div>
                                      <span className="text-muted-foreground">Dimensions:</span>
                                      <p className="font-medium">{order.dimensions}</p>
                                    </div>
                                  )}
                                  {order.budget_range && (
                                    <div>
                                      <span className="text-muted-foreground">Budget:</span>
                                      <p className="font-medium">{order.budget_range}</p>
                                    </div>
                                  )}
                                  {order.timeline && (
                                    <div>
                                      <span className="text-muted-foreground">Timeline:</span>
                                      <p className="font-medium">{order.timeline}</p>
                                    </div>
                                  )}
                                </div>
                                
                                {/* Admin Notes - visible to customer */}
                                {order.admin_notes && (
                                  <div className="mt-3 p-3 bg-muted rounded-lg border-l-4 border-primary">
                                    <p className="text-xs text-muted-foreground mb-1 font-semibold">Message from Gounder & Co:</p>
                                    <p className="text-sm">{order.admin_notes}</p>
                                  </div>
                                )}
                                
                                {/* Reference Images */}
                                {order.reference_images && order.reference_images.length > 0 && (
                                  <div className="flex gap-2 mt-2">
                                    {order.reference_images.map((url: string, idx: number) => (
                                      <img
                                        key={idx}
                                        src={url}
                                        alt={`Reference ${idx + 1}`}
                                        className="w-12 h-12 object-cover rounded border"
                                      />
                                    ))}
                                  </div>
                                )}

                                {/* Collapsible Messages Section */}
                                <Collapsible
                                  open={isExpanded}
                                  onOpenChange={(open) => setExpandedOrderId(open ? order.id : null)}
                                >
                                  <CollapsibleTrigger asChild>
                                    <Button variant="outline" className="w-full mt-3 gap-2">
                                      <MessageCircle className="w-4 h-4" />
                                      Messages
                                      <ChevronDown className={`w-4 h-4 ml-auto transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                                    </Button>
                                  </CollapsibleTrigger>
                                  <CollapsibleContent className="mt-3 border-t pt-3">
                                    <OrderMessages orderId={order.id} senderType="customer" />
                                  </CollapsibleContent>
                                </Collapsible>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                ) : (
                  <Card className="text-center py-12">
                    <CardContent>
                      <Package className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                      <h3 className="font-semibold text-lg mb-2">No Custom Orders Yet</h3>
                      <p className="text-muted-foreground mb-4">
                        You haven't submitted any custom order requests yet.
                      </p>
                      <Button onClick={() => setActiveTab('new-order')}>
                        <MessageCircle className="w-4 h-4 mr-2" />
                        Create New Request
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>
              
              {/* New Order Tab */}
              <TabsContent value="new-order">
                <div className="grid lg:grid-cols-3 gap-8">
                  {/* Form */}
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.6 }}
                    className="lg:col-span-2"
                  >
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Sparkles className="w-5 h-5 text-primary" />
                          Request Custom Furniture
                        </CardTitle>
                        <CardDescription>
                          Fill out the form below and we'll get back to you with a quote.
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Contact Information */}
                    <div className="space-y-4">
                      <h3 className="font-semibold text-foreground border-b pb-2">Contact Information</h3>
                      <div className="grid md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="name">Full Name *</Label>
                          <Input
                            id="name"
                            placeholder="Your name"
                            value={formData.name}
                            onChange={(e) => handleInputChange('name', e.target.value)}
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="email">Email Address *</Label>
                          <Input
                            id="email"
                            type="email"
                            placeholder="you@example.com"
                            value={formData.email}
                            onChange={(e) => handleInputChange('email', e.target.value)}
                            required
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="phone">Phone Number</Label>
                        <Input
                          id="phone"
                          type="tel"
                          placeholder="+91 98765 43210"
                          value={formData.phone}
                          onChange={(e) => handleInputChange('phone', e.target.value)}
                        />
                      </div>
                    </div>

                    {/* Product Details */}
                    <div className="space-y-4">
                      <h3 className="font-semibold text-foreground border-b pb-2">Product Details</h3>
                      <div className="grid md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="productType">Furniture Type *</Label>
                          <Select
                            value={formData.productType}
                            onValueChange={(value) => handleInputChange('productType', value)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select furniture type" />
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
                        <div className="space-y-2">
                          <Label htmlFor="woodType">Preferred Wood</Label>
                          <Select
                            value={formData.woodType}
                            onValueChange={(value) => handleInputChange('woodType', value)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select wood type" />
                            </SelectTrigger>
                            <SelectContent>
                              {woodTypes.map((type) => (
                                <SelectItem key={type} value={type}>
                                  {type}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="grid md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="dimensions">Dimensions (L x W x H)</Label>
                          <Input
                            id="dimensions"
                            placeholder="e.g., 180cm x 90cm x 75cm"
                            value={formData.dimensions}
                            onChange={(e) => handleInputChange('dimensions', e.target.value)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="finishType">Preferred Finish</Label>
                          <Input
                            id="finishType"
                            placeholder="e.g., Natural, Walnut, Honey"
                            value={formData.finishType}
                            onChange={(e) => handleInputChange('finishType', e.target.value)}
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="specialNeeds">Special Requirements / Engraving</Label>
                        <Textarea
                          id="specialNeeds"
                          placeholder="Any specific design requests, carvings, or personalization"
                          value={formData.engravingText}
                          onChange={(e) => handleInputChange('engravingText', e.target.value)}
                          rows={3}
                        />
                      </div>
                    </div>

                    {/* Reference Images */}
                    <div className="space-y-4">
                      <h3 className="font-semibold text-foreground border-b pb-2 flex items-center gap-2">
                        <Image className="w-4 h-4" />
                        Reference Images (Optional)
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        Upload up to 5 images for design reference or inspiration.
                      </p>
                      
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handleImageUpload}
                        className="hidden"
                      />
                      
                      <div className="flex flex-wrap gap-3">
                        {uploadedImages.map((url, index) => (
                          <div key={index} className="relative group">
                            <img
                              src={url}
                              alt={`Reference ${index + 1}`}
                              className="w-20 h-20 object-cover rounded-lg border"
                            />
                            <button
                              type="button"
                              onClick={() => removeImage(index)}
                              className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                        
                        {uploadedImages.length < 5 && (
                          <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            disabled={isUploading}
                            className="w-20 h-20 border-2 border-dashed border-muted-foreground/30 rounded-lg flex flex-col items-center justify-center gap-1 hover:border-primary/50 transition-colors disabled:opacity-50"
                          >
                            {isUploading ? (
                              <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                            ) : (
                              <>
                                <Upload className="w-5 h-5 text-muted-foreground" />
                                <span className="text-xs text-muted-foreground">Upload</span>
                              </>
                            )}
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Additional Details */}
                    <div className="space-y-4">
                      <h3 className="font-semibold text-foreground border-b pb-2">Additional Details</h3>
                      <div className="grid md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="budgetRange">Budget Range</Label>
                          <Select
                            value={formData.budgetRange}
                            onValueChange={(value) => handleInputChange('budgetRange', value)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select budget range" />
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
                        <div className="space-y-2">
                          <Label htmlFor="timeline">Preferred Timeline</Label>
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
                      <div className="space-y-2">
                        <Label htmlFor="specialRequirements">Special Requirements</Label>
                        <Textarea
                          id="specialRequirements"
                          placeholder="Describe any specific requirements, design ideas, or inspiration..."
                          rows={4}
                          value={formData.specialRequirements}
                          onChange={(e) => handleInputChange('specialRequirements', e.target.value)}
                        />
                      </div>
                    </div>

                    <Button
                      type="submit"
                      size="lg"
                      className="w-full gap-2 bg-green-600 hover:bg-green-700"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Submitting...
                        </>
                      ) : (
                        <>
                          <MessageCircle className="w-4 h-4" />
                          Submit & Send via WhatsApp
                        </>
                      )}
                    </Button>
                        </form>
                      </CardContent>
                    </Card>
                  </motion.div>

                  {/* Sidebar */}
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                    className="space-y-6"
                  >
                    <Card className="bg-primary/5 border-primary/20">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Clock className="w-5 h-5 text-primary" />
                          How It Works
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="flex gap-3">
                          <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold shrink-0">
                            1
                          </div>
                          <div>
                            <h4 className="font-medium">Submit Your Request</h4>
                            <p className="text-sm text-muted-foreground">Fill out the form with your requirements</p>
                          </div>
                        </div>
                        <div className="flex gap-3">
                          <div className="w-8 h-8 rounded-full bg-green-600 text-white flex items-center justify-center text-sm font-bold shrink-0">
                            2
                          </div>
                          <div>
                            <h4 className="font-medium">Chat on WhatsApp</h4>
                            <p className="text-sm text-muted-foreground">Discuss details directly with us</p>
                          </div>
                        </div>
                        <div className="flex gap-3">
                          <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold shrink-0">
                            3
                          </div>
                          <div>
                            <h4 className="font-medium">Get a Quote</h4>
                            <p className="text-sm text-muted-foreground">We'll provide a detailed quote</p>
                          </div>
                        </div>
                        <div className="flex gap-3">
                          <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold shrink-0">
                            4
                          </div>
                          <div>
                            <h4 className="font-medium">Crafting & Delivery</h4>
                            <p className="text-sm text-muted-foreground">Your custom piece is created</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <IndianRupee className="w-5 h-5 text-primary" />
                          Pricing Guide
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Small items</span>
                          <span className="font-medium">₹1,500+</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Medium items</span>
                          <span className="font-medium">₹3,500+</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Large items</span>
                          <span className="font-medium">₹8,000+</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Custom engraving</span>
                          <span className="font-medium">₹500+</span>
                        </div>
                        <p className="text-xs text-muted-foreground pt-2 border-t">
                          Final pricing depends on size, complexity, and finish.
                        </p>
                      </CardContent>
                    </Card>

                    {/* Contact Info */}
                    <Card className="bg-primary/5 border-primary/20">
                      <CardContent className="pt-6">
                        <div className="text-center">
                          <Sparkles className="w-10 h-10 text-primary mx-auto mb-3" />
                          <h3 className="font-semibold mb-2">Have Questions?</h3>
                          <p className="text-sm text-muted-foreground mb-4">
                            Visit our showrooms or call us for personalized assistance.
                          </p>
                          <Button
                            variant="outline"
                            className="w-full"
                            asChild
                          >
                            <a href="/contact">
                              Contact Us
                            </a>
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                </div>
              </TabsContent>
            </Tabs>
          ) : (
            /* Non-logged in user - show form directly */
            <div className="grid lg:grid-cols-3 gap-8">
              {/* Form */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6 }}
                className="lg:col-span-2"
              >
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <MessageCircle className="w-5 h-5 text-green-600" />
                      Request a Custom Order
                    </CardTitle>
                    <CardDescription>
                      Fill out the form below. Your request will be sent directly to us via WhatsApp for faster response.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-6">
                      {/* Contact Information */}
                      <div className="space-y-4">
                        <h3 className="font-semibold text-foreground border-b pb-2">Contact Information</h3>
                        <div className="grid md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="name-guest">Full Name *</Label>
                            <Input
                              id="name-guest"
                              placeholder="Your name"
                              value={formData.name}
                              onChange={(e) => handleInputChange('name', e.target.value)}
                              required
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="email-guest">Email Address *</Label>
                            <Input
                              id="email-guest"
                              type="email"
                              placeholder="you@example.com"
                              value={formData.email}
                              onChange={(e) => handleInputChange('email', e.target.value)}
                              required
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="phone-guest">Phone Number</Label>
                          <Input
                            id="phone-guest"
                            type="tel"
                            placeholder="+91 98765 43210"
                            value={formData.phone}
                            onChange={(e) => handleInputChange('phone', e.target.value)}
                          />
                        </div>
                      </div>

                      {/* Product Details */}
                      <div className="space-y-4">
                        <h3 className="font-semibold text-foreground border-b pb-2">Product Details</h3>
                        <div className="grid md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="productType-guest">Product Type *</Label>
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
                          <div className="space-y-2">
                            <Label htmlFor="dimensions-guest">Dimensions</Label>
                            <Input
                              id="dimensions-guest"
                              placeholder="e.g., 40cm x 30cm x 3cm"
                              value={formData.dimensions}
                              onChange={(e) => handleInputChange('dimensions', e.target.value)}
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="specialNeeds-guest">Special Requirements</Label>
                          <Input
                            id="specialNeeds-guest"
                            placeholder="Any specific brand, model, or features needed"
                            value={formData.engravingText}
                            onChange={(e) => handleInputChange('engravingText', e.target.value)}
                          />
                        </div>
                      </div>

                      {/* Additional Details */}
                      <div className="space-y-4">
                        <h3 className="font-semibold text-foreground border-b pb-2">Additional Details</h3>
                        <div className="grid md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="budgetRange-guest">Budget Range</Label>
                            <Select
                              value={formData.budgetRange}
                              onValueChange={(value) => handleInputChange('budgetRange', value)}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select budget range" />
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
                          <div className="space-y-2">
                            <Label htmlFor="timeline-guest">Preferred Timeline</Label>
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
                        <div className="space-y-2">
                          <Label htmlFor="specialRequirements-guest">Special Requirements</Label>
                          <Textarea
                            id="specialRequirements-guest"
                            placeholder="Describe any specific requirements, design ideas, or inspiration..."
                            rows={4}
                            value={formData.specialRequirements}
                            onChange={(e) => handleInputChange('specialRequirements', e.target.value)}
                          />
                        </div>
                      </div>

                      <Button
                        type="submit"
                        size="lg"
                        className="w-full gap-2 bg-green-600 hover:bg-green-700"
                        disabled={isSubmitting}
                      >
                        {isSubmitting ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Submitting...
                          </>
                        ) : (
                          <>
                            <MessageCircle className="w-4 h-4" />
                            Submit & Send via WhatsApp
                          </>
                        )}
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Sidebar */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="space-y-6"
              >
                <Card className="bg-primary/5 border-primary/20">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Clock className="w-5 h-5 text-primary" />
                      How It Works
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold shrink-0">
                        1
                      </div>
                      <div>
                        <h4 className="font-medium">Submit Your Request</h4>
                        <p className="text-sm text-muted-foreground">Fill out the form with your requirements</p>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <div className="w-8 h-8 rounded-full bg-green-600 text-white flex items-center justify-center text-sm font-bold shrink-0">
                        2
                      </div>
                      <div>
                        <h4 className="font-medium">Chat on WhatsApp</h4>
                        <p className="text-sm text-muted-foreground">Discuss details directly with us</p>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold shrink-0">
                        3
                      </div>
                      <div>
                        <h4 className="font-medium">Get a Quote</h4>
                        <p className="text-sm text-muted-foreground">We'll provide a detailed quote</p>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold shrink-0">
                        4
                      </div>
                      <div>
                        <h4 className="font-medium">Crafting & Delivery</h4>
                        <p className="text-sm text-muted-foreground">Your custom piece is created</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <IndianRupee className="w-5 h-5 text-primary" />
                      Pricing Guide
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Small items</span>
                      <span className="font-medium">₹1,500+</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Medium items</span>
                      <span className="font-medium">₹3,500+</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Large items</span>
                      <span className="font-medium">₹8,000+</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Custom engraving</span>
                      <span className="font-medium">₹500+</span>
                    </div>
                    <p className="text-xs text-muted-foreground pt-2 border-t">
                      Final pricing depends on size, complexity, and finish.
                    </p>
                  </CardContent>
                </Card>

                {/* Contact Info */}
                <Card className="bg-primary/5 border-primary/20">
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <Sparkles className="w-10 h-10 text-primary mx-auto mb-3" />
                      <h3 className="font-semibold mb-2">Have Questions?</h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        Visit our showrooms or call us for personalized assistance.
                      </p>
                      <Button
                        variant="outline"
                        className="w-full"
                        asChild
                      >
                        <a href="/contact">
                          Contact Us
                        </a>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </div>
          )}
        </div>
      </section>

      {/* Edit Order Dialog */}
      <EditOrderDialog
        order={editingOrder}
        open={!!editingOrder}
        onOpenChange={(open) => !open && setEditingOrder(null)}
      />
    </Layout>
  );
}
