import { useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { ProductCard } from '@/components/products/ProductCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { motion } from 'framer-motion';
import { Search, SlidersHorizontal, X, Grid3X3, List, TreeDeciduous, Palette } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

type SortOption = 'newest' | 'price-low' | 'price-high' | 'name';

// Wood types for filtering
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
];

// Colors for filtering
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
];

interface ProductDimensions {
  size?: string | null;
  wood_type?: string | null;
  color?: string | null;
}

export default function Shop() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState('');
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 100000]);
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedWoodTypes, setSelectedWoodTypes] = useState<string[]>([]);
  const [selectedColors, setSelectedColors] = useState<string[]>([]);

  const selectedCategory = searchParams.get('category') || '';

  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true });
      
      if (error) throw error;
      return data || [];
    },
  });

  const { data: products = [], isLoading } = useQuery({
    queryKey: ['products', selectedCategory],
    queryFn: async () => {
      let query = supabase
        .from('products')
        .select('*, categories(name, slug)')
        .eq('is_active', true);

      if (selectedCategory) {
        const category = categories.find(c => c.slug === selectedCategory);
        if (category) {
          query = query.eq('category_id', category.id);
        }
      }

      const { data, error } = await query.order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    },
    enabled: categories.length > 0 || !selectedCategory,
  });

  // Extract available wood types and colors from products
  const availableFilters = useMemo(() => {
    const woodTypes = new Set<string>();
    const colors = new Set<string>();

    products.forEach(product => {
      const dims = typeof product.dimensions === 'object' && product.dimensions !== null
        ? product.dimensions as ProductDimensions
        : null;
      
      if (dims?.wood_type) woodTypes.add(dims.wood_type);
      if (dims?.color) colors.add(dims.color);
    });

    return {
      woodTypes: Array.from(woodTypes),
      colors: Array.from(colors),
    };
  }, [products]);

  const filteredProducts = useMemo(() => {
    let filtered = [...products];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        p =>
          p.name.toLowerCase().includes(query) ||
          p.description?.toLowerCase().includes(query) ||
          p.short_description?.toLowerCase().includes(query)
      );
    }

    // Price filter
    filtered = filtered.filter(
      p => p.price >= priceRange[0] && p.price <= priceRange[1]
    );

    // Wood type filter
    if (selectedWoodTypes.length > 0) {
      filtered = filtered.filter(p => {
        const dims = typeof p.dimensions === 'object' && p.dimensions !== null
          ? p.dimensions as ProductDimensions
          : null;
        return dims?.wood_type && selectedWoodTypes.includes(dims.wood_type);
      });
    }

    // Color filter
    if (selectedColors.length > 0) {
      filtered = filtered.filter(p => {
        const dims = typeof p.dimensions === 'object' && p.dimensions !== null
          ? p.dimensions as ProductDimensions
          : null;
        return dims?.color && selectedColors.includes(dims.color);
      });
    }

    // Sort
    switch (sortBy) {
      case 'price-low':
        filtered.sort((a, b) => a.price - b.price);
        break;
      case 'price-high':
        filtered.sort((a, b) => b.price - a.price);
        break;
      case 'name':
        filtered.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'newest':
      default:
        filtered.sort((a, b) => 
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
    }

    return filtered;
  }, [products, searchQuery, priceRange, sortBy, selectedWoodTypes, selectedColors]);

  const handleCategoryChange = (slug: string) => {
    if (slug === 'all') {
      searchParams.delete('category');
    } else {
      searchParams.set('category', slug);
    }
    setSearchParams(searchParams);
  };

  const toggleWoodType = (woodType: string) => {
    setSelectedWoodTypes(prev =>
      prev.includes(woodType)
        ? prev.filter(w => w !== woodType)
        : [...prev, woodType]
    );
  };

  const toggleColor = (color: string) => {
    setSelectedColors(prev =>
      prev.includes(color)
        ? prev.filter(c => c !== color)
        : [...prev, color]
    );
  };

  const clearFilters = () => {
    setSearchQuery('');
    setPriceRange([0, 100000]);
    setSortBy('newest');
    setSelectedWoodTypes([]);
    setSelectedColors([]);
    searchParams.delete('category');
    setSearchParams(searchParams);
  };

  const activeFilterCount = 
    (selectedCategory ? 1 : 0) + 
    selectedWoodTypes.length + 
    selectedColors.length +
    (priceRange[0] > 0 || priceRange[1] < 100000 ? 1 : 0);

  const FilterContent = () => (
    <div className="space-y-6">
      <Accordion type="multiple" defaultValue={['categories', 'price', 'wood', 'color']} className="w-full">
        {/* Categories */}
        <AccordionItem value="categories">
          <AccordionTrigger className="text-sm font-semibold">Categories</AccordionTrigger>
          <AccordionContent>
            <div className="space-y-1 pt-2">
              <button
                onClick={() => handleCategoryChange('all')}
                className={cn(
                  'w-full text-left px-3 py-2 rounded-lg transition-colors text-sm',
                  !selectedCategory
                    ? 'bg-primary text-primary-foreground'
                    : 'hover:bg-secondary'
                )}
              >
                All Products
              </button>
              {categories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => handleCategoryChange(category.slug)}
                  className={cn(
                    'w-full text-left px-3 py-2 rounded-lg transition-colors text-sm',
                    selectedCategory === category.slug
                      ? 'bg-primary text-primary-foreground'
                      : 'hover:bg-secondary'
                  )}
                >
                  {category.name}
                </button>
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Price Range */}
        <AccordionItem value="price">
          <AccordionTrigger className="text-sm font-semibold">Price Range</AccordionTrigger>
          <AccordionContent>
            <div className="pt-2 px-1">
              <Slider
                value={priceRange}
                onValueChange={(value) => setPriceRange(value as [number, number])}
                max={100000}
                min={0}
                step={1000}
                className="mb-3"
              />
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>₹{priceRange[0].toLocaleString()}</span>
                <span>₹{priceRange[1].toLocaleString()}</span>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Wood Type Filter */}
        <AccordionItem value="wood">
          <AccordionTrigger className="text-sm font-semibold">
            <span className="flex items-center gap-2">
              <TreeDeciduous className="h-4 w-4" />
              Material / Wood Type
            </span>
          </AccordionTrigger>
          <AccordionContent>
            <div className="space-y-2 pt-2">
              {(availableFilters.woodTypes.length > 0 ? availableFilters.woodTypes : WOOD_TYPES.slice(0, 8)).map((wood) => (
                <div key={wood} className="flex items-center space-x-2">
                  <Checkbox
                    id={`wood-${wood}`}
                    checked={selectedWoodTypes.includes(wood)}
                    onCheckedChange={() => toggleWoodType(wood)}
                  />
                  <Label
                    htmlFor={`wood-${wood}`}
                    className="text-sm font-normal cursor-pointer"
                  >
                    {wood}
                  </Label>
                </div>
              ))}
              {selectedWoodTypes.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs text-muted-foreground mt-2"
                  onClick={() => setSelectedWoodTypes([])}
                >
                  Clear wood filters
                </Button>
              )}
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Color Filter */}
        <AccordionItem value="color">
          <AccordionTrigger className="text-sm font-semibold">
            <span className="flex items-center gap-2">
              <Palette className="h-4 w-4" />
              Color / Finish
            </span>
          </AccordionTrigger>
          <AccordionContent>
            <div className="space-y-2 pt-2">
              {(availableFilters.colors.length > 0 ? availableFilters.colors : FURNITURE_COLORS.slice(0, 8)).map((color) => (
                <div key={color} className="flex items-center space-x-2">
                  <Checkbox
                    id={`color-${color}`}
                    checked={selectedColors.includes(color)}
                    onCheckedChange={() => toggleColor(color)}
                  />
                  <Label
                    htmlFor={`color-${color}`}
                    className="text-sm font-normal cursor-pointer flex items-center gap-2"
                  >
                    <span
                      className="w-4 h-4 rounded-full border"
                      style={{
                        backgroundColor:
                          color === 'Natural' ? '#d4a574' :
                          color === 'Honey' ? '#eb9605' :
                          color === 'Walnut' ? '#5d4037' :
                          color === 'Dark Walnut' ? '#3e2723' :
                          color === 'Mahogany' ? '#c04000' :
                          color === 'Teak Finish' ? '#b8860b' :
                          color === 'White' ? '#ffffff' :
                          color === 'Black' ? '#1a1a1a' :
                          color === 'Grey' ? '#808080' :
                          color === 'Brown' ? '#8b4513' :
                          color === 'Beige' ? '#f5f5dc' :
                          '#cccccc'
                      }}
                    />
                    {color}
                  </Label>
                </div>
              ))}
              {selectedColors.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs text-muted-foreground mt-2"
                  onClick={() => setSelectedColors([])}
                >
                  Clear color filters
                </Button>
              )}
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      {/* Clear All Filters */}
      {activeFilterCount > 0 && (
        <Button variant="outline" className="w-full" onClick={clearFilters}>
          Clear All Filters ({activeFilterCount})
        </Button>
      )}
    </div>
  );

  return (
    <Layout>
      {/* Header */}
      <section className="py-12 bg-secondary/30">
        <div className="container-deiva">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <h1 className="text-3xl md:text-4xl font-bold mb-4">
              {selectedCategory
                ? categories.find(c => c.slug === selectedCategory)?.name || 'Shop'
                : 'All Furniture'}
            </h1>
            <p className="text-muted-foreground">
              Explore our wide range of quality furniture at wholesale prices
            </p>
          </motion.div>
        </div>
      </section>

      <section className="section-padding">
        <div className="container-deiva">
          <div className="lg:grid lg:grid-cols-4 lg:gap-8">
            {/* Sidebar - Desktop */}
            <aside className="hidden lg:block">
              <div className="sticky top-24">
                <FilterContent />
              </div>
            </aside>

            {/* Main Content */}
            <div className="lg:col-span-3">
              {/* Toolbar */}
              <div className="flex flex-wrap items-center gap-4 mb-8">
                {/* Search */}
                <div className="relative flex-1 min-w-[200px]">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search furniture..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2"
                    >
                      <X className="h-4 w-4 text-muted-foreground" />
                    </button>
                  )}
                </div>

                {/* Sort */}
                <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortOption)}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="newest">Newest</SelectItem>
                    <SelectItem value="price-low">Price: Low to High</SelectItem>
                    <SelectItem value="price-high">Price: High to Low</SelectItem>
                    <SelectItem value="name">Name</SelectItem>
                  </SelectContent>
                </Select>

                {/* View Toggle */}
                <div className="hidden md:flex items-center gap-1 bg-secondary rounded-lg p-1">
                  <Button
                    variant={viewMode === 'grid' ? 'default' : 'ghost'}
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => setViewMode('grid')}
                  >
                    <Grid3X3 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={viewMode === 'list' ? 'default' : 'ghost'}
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => setViewMode('list')}
                  >
                    <List className="h-4 w-4" />
                  </Button>
                </div>

                {/* Mobile Filter */}
                <Sheet>
                  <SheetTrigger asChild>
                    <Button variant="outline" className="lg:hidden relative">
                      <SlidersHorizontal className="h-4 w-4 mr-2" />
                      Filters
                      {activeFilterCount > 0 && (
                        <span className="absolute -top-2 -right-2 h-5 w-5 bg-primary text-primary-foreground text-xs rounded-full flex items-center justify-center">
                          {activeFilterCount}
                        </span>
                      )}
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="left" className="overflow-y-auto">
                    <SheetHeader>
                      <SheetTitle>Filters</SheetTitle>
                    </SheetHeader>
                    <div className="mt-6">
                      <FilterContent />
                    </div>
                  </SheetContent>
                </Sheet>
              </div>

              {/* Active Filters Pills */}
              {(selectedWoodTypes.length > 0 || selectedColors.length > 0) && (
                <div className="flex flex-wrap gap-2 mb-6">
                  {selectedWoodTypes.map(wood => (
                    <Button
                      key={wood}
                      variant="secondary"
                      size="sm"
                      className="gap-1"
                      onClick={() => toggleWoodType(wood)}
                    >
                      <TreeDeciduous className="h-3 w-3" />
                      {wood}
                      <X className="h-3 w-3" />
                    </Button>
                  ))}
                  {selectedColors.map(color => (
                    <Button
                      key={color}
                      variant="secondary"
                      size="sm"
                      className="gap-1"
                      onClick={() => toggleColor(color)}
                    >
                      <Palette className="h-3 w-3" />
                      {color}
                      <X className="h-3 w-3" />
                    </Button>
                  ))}
                </div>
              )}

              {/* Results Count */}
              <p className="text-sm text-muted-foreground mb-6">
                Showing {filteredProducts.length} product{filteredProducts.length !== 1 ? 's' : ''}
              </p>

              {/* Products Grid */}
              {isLoading ? (
                <div className={cn(
                  'grid gap-6',
                  viewMode === 'grid'
                    ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
                    : 'grid-cols-1'
                )}>
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <div key={i} className="bg-secondary/30 rounded-xl aspect-product animate-pulse" />
                  ))}
                </div>
              ) : filteredProducts.length > 0 ? (
                <div className={cn(
                  'grid gap-6',
                  viewMode === 'grid'
                    ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
                    : 'grid-cols-1'
                )}>
                  {filteredProducts.map((product, index) => (
                    <motion.div
                      key={product.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.05 }}
                    >
                      <ProductCard product={product} />
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-16">
                  <p className="text-muted-foreground mb-4">No furniture found matching your filters</p>
                  <Button variant="outline" onClick={clearFilters}>
                    Clear Filters
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
}
