import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { supabase } from '@/integrations/supabase/client';
import { formatCurrency } from '@/lib/format';

interface Product {
  id: string;
  name: string;
  slug: string;
  price: number;
  images: string[] | null;
  short_description: string | null;
}

export function ProductSearch() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Keyboard shortcut to open search
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };
    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  // Search products with debounce
  const searchProducts = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setProducts([]);
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('products')
        .select('id, name, slug, price, images, short_description')
        .eq('is_active', true)
        .ilike('name', `%${searchQuery}%`)
        .limit(8);

      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error('Search error:', error);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      searchProducts(query);
    }, 300);
    return () => clearTimeout(timer);
  }, [query, searchProducts]);

  const handleSelect = (slug: string) => {
    setOpen(false);
    setQuery('');
    navigate(`/product/${slug}`);
  };

  const handleOpenChange = (open: boolean) => {
    setOpen(open);
    if (!open) {
      setQuery('');
      setProducts([]);
    }
  };

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        className="hidden md:flex"
        onClick={() => setOpen(true)}
        aria-label="Search products"
      >
        <Search className="h-5 w-5" />
      </Button>

      <CommandDialog open={open} onOpenChange={handleOpenChange}>
        <CommandInput
          placeholder="Search products..."
          value={query}
          onValueChange={setQuery}
        />
        <CommandList>
          {loading ? (
            <div className="py-6 text-center text-sm text-muted-foreground">
              Searching...
            </div>
          ) : query.trim() === '' ? (
            <div className="py-6 text-center text-sm text-muted-foreground">
              Type to search products...
            </div>
          ) : products.length === 0 ? (
            <CommandEmpty>No products found.</CommandEmpty>
          ) : (
            <CommandGroup heading="Products">
              {products.map((product) => (
                <CommandItem
                  key={product.id}
                  value={product.name}
                  onSelect={() => handleSelect(product.slug)}
                  className="flex items-center gap-3 cursor-pointer py-3"
                >
                  <div className="h-12 w-12 rounded-lg bg-muted overflow-hidden flex-shrink-0">
                    {product.images?.[0] ? (
                      <img
                        src={product.images[0]}
                        alt={product.name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center text-muted-foreground">
                        <Search className="h-4 w-4" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{product.name}</p>
                    {product.short_description && (
                      <p className="text-xs text-muted-foreground truncate">
                        {product.short_description}
                      </p>
                    )}
                  </div>
                  <span className="text-sm font-semibold text-primary flex-shrink-0">
                    {formatCurrency(product.price)}
                  </span>
                </CommandItem>
              ))}
            </CommandGroup>
          )}
        </CommandList>
        <div className="border-t px-3 py-2 text-xs text-muted-foreground flex items-center justify-between">
          <span>Press ⌘K to toggle search</span>
          <span>↵ to select</span>
        </div>
      </CommandDialog>
    </>
  );
}
