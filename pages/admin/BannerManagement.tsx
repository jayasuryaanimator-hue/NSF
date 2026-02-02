import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ImageUploader } from '@/components/admin/ImageUploader';
import { Plus, Trash2, GripVertical, Save, Eye } from 'lucide-react';
import { toast } from 'sonner';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface Banner {
  id: string;
  image_url: string;
  title: string;
  subtitle?: string;
  link_url?: string;
  link_text?: string;
}

const defaultBanners: Banner[] = [
  {
    id: '1',
    image_url: 'https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=1600&h=600&fit=crop',
    title: 'Monsoon Sale - Up to 30% Off',
    subtitle: 'Refresh your skincare routine with our special monsoon collection. Limited time offer on all herbal soaps!',
    link_url: '/shop',
    link_text: 'Shop the Sale',
  },
  {
    id: '2',
    image_url: 'https://images.unsplash.com/photo-1607006344380-b6775a0824a7?w=1600&h=600&fit=crop',
    title: 'New: Lavender Dreams Collection',
    subtitle: 'Introducing our calming lavender range - perfect for relaxation and stress relief.',
    link_url: '/shop?category=herbal-soaps',
    link_text: 'Explore Collection',
  },
  {
    id: '3',
    image_url: 'https://images.unsplash.com/photo-1600857062241-98e5dba7f214?w=1600&h=600&fit=crop',
    title: 'Perfect Gift Sets for Every Occasion',
    subtitle: 'Beautifully packaged gift sets for birthdays, weddings, and festivals.',
    link_url: '/shop?category=gift-sets',
    link_text: 'View Gift Sets',
  },
];

function SortableBannerItem({ 
  banner, 
  index, 
  onUpdate, 
  onRemove 
}: { 
  banner: Banner; 
  index: number; 
  onUpdate: (index: number, field: keyof Banner, value: string) => void;
  onRemove: (index: number) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: banner.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style} className="mb-4">
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                className="cursor-grab active:cursor-grabbing p-1 hover:bg-muted rounded"
                {...attributes}
                {...listeners}
              >
                <GripVertical className="h-5 w-5 text-muted-foreground" />
              </button>
              <CardTitle className="text-lg">Banner {index + 1}</CardTitle>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="text-destructive hover:text-destructive"
              onClick={() => onRemove(index)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-4">
              <div>
                <Label>Banner Image</Label>
                <ImageUploader
                  value={banner.image_url}
                  onChange={(url) => onUpdate(index, 'image_url', url)}
                  folder="banners"
                />
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <Label htmlFor={`title-${index}`}>Title</Label>
                <Input
                  id={`title-${index}`}
                  value={banner.title}
                  onChange={(e) => onUpdate(index, 'title', e.target.value)}
                  placeholder="Banner title"
                />
              </div>
              <div>
                <Label htmlFor={`subtitle-${index}`}>Subtitle</Label>
                <Textarea
                  id={`subtitle-${index}`}
                  value={banner.subtitle || ''}
                  onChange={(e) => onUpdate(index, 'subtitle', e.target.value)}
                  placeholder="Banner subtitle or description"
                  rows={2}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor={`link_url-${index}`}>Link URL</Label>
                  <Input
                    id={`link_url-${index}`}
                    value={banner.link_url || ''}
                    onChange={(e) => onUpdate(index, 'link_url', e.target.value)}
                    placeholder="/shop"
                  />
                </div>
                <div>
                  <Label htmlFor={`link_text-${index}`}>Button Text</Label>
                  <Input
                    id={`link_text-${index}`}
                    value={banner.link_text || ''}
                    onChange={(e) => onUpdate(index, 'link_text', e.target.value)}
                    placeholder="Shop Now"
                  />
                </div>
              </div>
            </div>
          </div>
          
          {/* Preview */}
          {banner.image_url && (
            <div className="mt-4">
              <Label className="mb-2 block">Preview</Label>
              <div className="relative aspect-[21/9] rounded-lg overflow-hidden bg-secondary">
                <div
                  className="absolute inset-0 bg-cover bg-center"
                  style={{ backgroundImage: `url(${banner.image_url})` }}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/40 to-transparent" />
                </div>
                <div className="absolute inset-0 flex items-center p-6">
                  <div className="max-w-md text-white">
                    <h3 className="text-xl font-bold mb-2">{banner.title || 'Banner Title'}</h3>
                    {banner.subtitle && (
                      <p className="text-sm text-white/90 mb-3">{banner.subtitle}</p>
                    )}
                    {banner.link_text && (
                      <span className="inline-block bg-white text-black px-4 py-2 rounded text-sm font-medium">
                        {banner.link_text}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function BannerManagement() {
  const queryClient = useQueryClient();
  const [banners, setBanners] = useState<Banner[]>([]);
  const [hasChanges, setHasChanges] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const { isLoading } = useQuery({
    queryKey: ['admin-banners'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('page_content')
        .select('*')
        .eq('page_name', 'home')
        .eq('section_name', 'banners')
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      
      const content = data?.content as { items?: Banner[] } | null;
      if (content?.items && Array.isArray(content.items)) {
        setBanners(content.items);
        return content.items;
      }
      setBanners(defaultBanners);
      return defaultBanners;
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (bannerData: Banner[]) => {
      // Convert to JSON-compatible format
      const contentPayload = JSON.parse(JSON.stringify({ items: bannerData }));
      
      const { data: existing } = await supabase
        .from('page_content')
        .select('id')
        .eq('page_name', 'home')
        .eq('section_name', 'banners')
        .single();

      if (existing) {
        const { error } = await supabase
          .from('page_content')
          .update({ content: contentPayload })
          .eq('id', existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('page_content')
          .insert([{
            page_name: 'home',
            section_name: 'banners',
            content: contentPayload,
          }]);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-banners'] });
      queryClient.invalidateQueries({ queryKey: ['home-banners'] });
      setHasChanges(false);
      toast.success('Banners saved successfully!');
    },
    onError: (error) => {
      toast.error('Failed to save banners');
      console.error(error);
    },
  });

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setBanners((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);
        setHasChanges(true);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const handleUpdateBanner = (index: number, field: keyof Banner, value: string) => {
    setBanners((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
    setHasChanges(true);
  };

  const handleAddBanner = () => {
    const newBanner: Banner = {
      id: `banner-${Date.now()}`,
      image_url: '',
      title: 'New Banner',
      subtitle: '',
      link_url: '/shop',
      link_text: 'Shop Now',
    };
    setBanners((prev) => [...prev, newBanner]);
    setHasChanges(true);
  };

  const handleRemoveBanner = (index: number) => {
    setBanners((prev) => prev.filter((_, i) => i !== index));
    setHasChanges(true);
  };

  const handleSave = () => {
    saveMutation.mutate(banners);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Banner Management</h1>
          <p className="text-muted-foreground">
            Manage homepage promotional banners. Drag to reorder.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" asChild>
            <a href="/" target="_blank" rel="noopener noreferrer">
              <Eye className="h-4 w-4 mr-2" />
              Preview Site
            </a>
          </Button>
          <Button onClick={handleSave} disabled={!hasChanges || saveMutation.isPending}>
            <Save className="h-4 w-4 mr-2" />
            {saveMutation.isPending ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      ) : (
        <>
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={banners.map((b) => b.id)}
              strategy={verticalListSortingStrategy}
            >
              {banners.map((banner, index) => (
                <SortableBannerItem
                  key={banner.id}
                  banner={banner}
                  index={index}
                  onUpdate={handleUpdateBanner}
                  onRemove={handleRemoveBanner}
                />
              ))}
            </SortableContext>
          </DndContext>

          <Button
            variant="outline"
            className="w-full border-dashed"
            onClick={handleAddBanner}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Banner
          </Button>
        </>
      )}
    </div>
  );
}
