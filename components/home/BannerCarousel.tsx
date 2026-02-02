import { useState, useEffect, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import livingRoomBanner from '@/assets/banners/furniture-living-room.jpg';
import bedroomBanner from '@/assets/banners/furniture-bedroom.jpg';
import diningBanner from '@/assets/banners/furniture-dining.jpg';

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
    image_url: livingRoomBanner,
    title: 'Premium Living Room Furniture',
    subtitle: 'Discover our elegant collection of sofas, coffee tables, and living room sets. Quality craftsmanship for your home.',
    link_url: '/shop?category=living-room',
    link_text: 'Shop Living Room',
  },
  {
    id: '2',
    image_url: bedroomBanner,
    title: 'Beautiful Bedroom Furniture',
    subtitle: 'Luxurious beds, wardrobes, and dressers. Create your dream bedroom with our premium furniture collection.',
    link_url: '/shop?category=bedroom',
    link_text: 'Shop Bedroom',
  },
  {
    id: '3',
    image_url: diningBanner,
    title: 'Elegant Dining Room Sets',
    subtitle: 'Stylish dining tables and chairs for memorable family meals. Quality wood furniture at affordable prices.',
    link_url: '/shop?category=dining-room',
    link_text: 'Shop Dining',
  },
];

export function BannerCarousel() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const { data: banners = defaultBanners } = useQuery({
    queryKey: ['home-banners'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('page_content')
        .select('content')
        .eq('page_name', 'home')
        .eq('section_name', 'banners')
        .maybeSingle();
      
      if (error || !data?.content) return defaultBanners;
      
      const content = data.content as any;
      if (content.items && Array.isArray(content.items) && content.items.length > 0) {
        return content.items as Banner[];
      }
      return defaultBanners;
    },
    staleTime: 60 * 1000, // 1 minute
  });

  const goToSlide = useCallback((index: number) => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    setIsAutoPlaying(false);
    setCurrentIndex(index);
    setTimeout(() => setIsTransitioning(false), 500);
  }, [isTransitioning]);

  const goToPrevious = useCallback(() => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    setIsAutoPlaying(false);
    setCurrentIndex((prev) => (prev - 1 + banners.length) % banners.length);
    setTimeout(() => setIsTransitioning(false), 500);
  }, [banners.length, isTransitioning]);

  const goToNext = useCallback(() => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    setCurrentIndex((prev) => (prev + 1) % banners.length);
    setTimeout(() => setIsTransitioning(false), 500);
  }, [banners.length, isTransitioning]);

  useEffect(() => {
    if (!isAutoPlaying) return;
    
    const timer = setInterval(() => {
      goToNext();
    }, 5000);

    return () => clearInterval(timer);
  }, [isAutoPlaying, goToNext]);

  return (
    <section className="relative w-full overflow-hidden bg-secondary">
      <div className="relative aspect-[21/9] md:aspect-[3/1] lg:aspect-[4/1]">
        {/* Sliding Container - moves all content together */}
        <div 
          className="flex h-full transition-transform duration-500 ease-in-out"
          style={{ transform: `translateX(-${currentIndex * 100}%)` }}
        >
          {banners.map((banner, index) => (
            <div
              key={banner.id}
              className="relative w-full h-full flex-shrink-0"
            >
              {/* Background Image */}
              <div
                className="absolute inset-0 bg-cover bg-center"
                style={{ backgroundImage: `url(${banner.image_url})` }}
              >
                {/* Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/40 to-transparent" />
              </div>

              {/* Content */}
              <div className="absolute inset-0 flex items-center">
                <div className="container-deiva">
                  <div className="max-w-xl text-white">
                    <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4 drop-shadow-lg">
                      {banner.title}
                    </h2>
                    {banner.subtitle && (
                      <p className="text-lg md:text-xl mb-6 text-white/90 drop-shadow">
                        {banner.subtitle}
                      </p>
                    )}
                    {banner.link_url && (
                      <Button
                        asChild
                        size="lg"
                        className="bg-white text-black hover:bg-white/90"
                      >
                        <Link to={banner.link_url}>
                          {banner.link_text || 'Shop Now'}
                        </Link>
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Navigation Arrows */}
        <button
          onClick={goToPrevious}
          disabled={isTransitioning}
          className="absolute left-4 top-1/2 -translate-y-1/2 h-12 w-12 rounded-full bg-white/20 backdrop-blur-sm hover:bg-white/40 flex items-center justify-center transition-colors z-10 disabled:opacity-50"
          aria-label="Previous slide"
        >
          <ChevronLeft className="h-6 w-6 text-white" />
        </button>
        <button
          onClick={() => { setIsAutoPlaying(false); goToNext(); }}
          disabled={isTransitioning}
          className="absolute right-4 top-1/2 -translate-y-1/2 h-12 w-12 rounded-full bg-white/20 backdrop-blur-sm hover:bg-white/40 flex items-center justify-center transition-colors z-10 disabled:opacity-50"
          aria-label="Next slide"
        >
          <ChevronRight className="h-6 w-6 text-white" />
        </button>

        {/* Dots Indicator */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 z-10">
          {banners.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`h-2.5 rounded-full transition-all duration-300 ${
                index === currentIndex
                  ? 'w-8 bg-white'
                  : 'w-2.5 bg-white/50 hover:bg-white/80'
              }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
