import { Link } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { formatDate } from '@/lib/format';
import { motion } from 'framer-motion';
import { Calendar, User, ArrowRight, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function Blog() {
  const { data: posts = [], isLoading } = useQuery({
    queryKey: ['blog-posts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('blog_posts')
        .select('*')
        .eq('is_published', true)
        .order('published_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    },
  });

  return (
    <Layout>
      {/* Header */}
      <section className="py-16 bg-gradient-to-br from-secondary via-background to-secondary/50">
        <div className="container-deiva">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center max-w-2xl mx-auto"
          >
            <span className="inline-block px-4 py-2 bg-primary/10 text-primary rounded-full text-sm font-medium mb-6">
              Our Blog
            </span>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Stories, Tips & Insights
            </h1>
            <p className="text-muted-foreground">
              Expert tips on agricultural machinery maintenance, product guides,
              and insights from the Gounder & Co team.
            </p>
          </motion.div>
        </div>
      </section>

      <section className="section-padding">
        <div className="container-deiva">
          {isLoading ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="rounded-xl overflow-hidden border">
                  <div className="aspect-video bg-secondary/30 animate-pulse" />
                  <div className="p-6 space-y-3">
                    <div className="h-4 bg-secondary/30 rounded animate-pulse w-1/2" />
                    <div className="h-6 bg-secondary/30 rounded animate-pulse" />
                    <div className="h-16 bg-secondary/30 rounded animate-pulse" />
                  </div>
                </div>
              ))}
            </div>
          ) : posts.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {posts.map((post, index) => (
                <motion.article
                  key={post.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  viewport={{ once: true }}
                  className="group"
                >
                  <Link to={`/blog/${post.slug}`} className="block">
                    <div className="rounded-xl overflow-hidden border card-hover">
                      {/* Image */}
                      <div className="aspect-video bg-secondary/30 overflow-hidden">
                        {post.featured_image ? (
                          <img
                            src={post.featured_image}
                            alt={post.title}
                            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                          />
                        ) : (
                          <div className="h-full w-full flex items-center justify-center">
                            <BookOpen className="h-12 w-12 text-muted-foreground/30" />
                          </div>
                        )}
                      </div>

                      {/* Content */}
                      <div className="p-6">
                        {/* Meta */}
                        <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                          {post.published_at && (
                            <div className="flex items-center gap-1">
                              <Calendar className="h-4 w-4" />
                              <span>{formatDate(post.published_at)}</span>
                            </div>
                          )}
                          {post.author_name && (
                            <div className="flex items-center gap-1">
                              <User className="h-4 w-4" />
                              <span>{post.author_name}</span>
                            </div>
                          )}
                        </div>

                        {/* Category */}
                        {post.category && (
                          <span className="inline-block px-2 py-1 bg-primary/10 text-primary text-xs font-medium rounded mb-3">
                            {post.category}
                          </span>
                        )}

                        {/* Title */}
                        <h2 className="text-xl font-semibold mb-3 group-hover:text-primary transition-colors line-clamp-2">
                          {post.title}
                        </h2>

                        {/* Excerpt */}
                        {post.excerpt && (
                          <p className="text-muted-foreground text-sm line-clamp-3 mb-4">
                            {post.excerpt}
                          </p>
                        )}

                        {/* Read More */}
                        <span className="inline-flex items-center gap-1 text-primary font-medium text-sm group-hover:gap-2 transition-all">
                          Read More <ArrowRight className="h-4 w-4" />
                        </span>
                      </div>
                    </div>
                  </Link>
                </motion.article>
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <BookOpen className="h-16 w-16 text-muted-foreground/30 mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">No blog posts yet</h2>
              <p className="text-muted-foreground mb-6">
                We're working on creating helpful content for you. Check back soon!
              </p>
              <Button asChild>
                <Link to="/shop">Explore Our Products</Link>
              </Button>
            </div>
          )}
        </div>
      </section>
    </Layout>
  );
}
