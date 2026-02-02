import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Save, Plus, Trash2, FileEdit, ChevronDown, ChevronUp, Image, Type, GripVertical, ExternalLink, ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Link } from 'react-router-dom';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { ImageUploader } from '@/components/admin/ImageUploader';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
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

interface PageSection {
  id: string;
  page_name: string;
  section_name: string;
  content: Record<string, any>;
}

// Helper to render appropriate input based on field type
function renderFieldInput(
  value: any, 
  onChange: (val: any) => void, 
  fieldKey: string
): React.ReactNode {
  // Check if it's an image URL field
  const isImageField = fieldKey.toLowerCase().includes('image') || 
                       fieldKey.toLowerCase().includes('avatar') || 
                       fieldKey.toLowerCase().includes('logo') ||
                       fieldKey.toLowerCase().includes('photo') ||
                       fieldKey.toLowerCase().includes('picture');

  // String fields
  if (typeof value === 'string') {
    // Use ImageUploader for image fields
    if (isImageField) {
      return (
        <ImageUploader
          value={value}
          onChange={onChange}
        />
      );
    }

    if (value.length > 100 || fieldKey.includes('description') || fieldKey.includes('text') || fieldKey.includes('bio') || fieldKey.includes('paragraph')) {
      return (
        <Textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={4}
          placeholder="Enter text..."
        />
      );
    }
    return (
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Enter text..."
      />
    );
  }

  // Number fields
  if (typeof value === 'number') {
    return (
      <Input
        type="number"
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
      />
    );
  }

  // Array fields (for items, paragraphs, etc.)
  if (Array.isArray(value)) {
    return (
      <ArrayFieldEditor 
        items={value} 
        onChange={onChange}
        fieldKey={fieldKey}
      />
    );
  }

  // Object fields
  if (typeof value === 'object' && value !== null) {
    return (
      <ObjectFieldEditor
        obj={value}
        onChange={onChange}
      />
    );
  }

  // Fallback to JSON text
  return (
    <Textarea
      value={JSON.stringify(value, null, 2)}
      onChange={(e) => {
        try {
          onChange(JSON.parse(e.target.value));
        } catch {
          // Invalid JSON, don't update
        }
      }}
      rows={4}
      className="font-mono text-sm"
    />
  );
}

// Array field editor with add/remove and drag-and-drop functionality
function ArrayFieldEditor({ 
  items, 
  onChange,
  fieldKey 
}: { 
  items: any[]; 
  onChange: (items: any[]) => void;
  fieldKey: string;
}) {
  const [expandedItems, setExpandedItems] = useState<number[]>([]);

  // Create stable IDs for items
  const itemsWithIds = items.map((item, index) => ({
    ...item,
    _sortId: `item-${index}`,
    _originalIndex: index,
  }));

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = itemsWithIds.findIndex((item) => item._sortId === active.id);
      const newIndex = itemsWithIds.findIndex((item) => item._sortId === over.id);
      
      // Remove the _sortId and _originalIndex before saving
      const reorderedItems = arrayMove(items, oldIndex, newIndex);
      onChange(reorderedItems);
      
      // Update expanded items indices
      setExpandedItems(prev => {
        return prev.map(idx => {
          if (idx === oldIndex) return newIndex;
          if (oldIndex < newIndex) {
            if (idx > oldIndex && idx <= newIndex) return idx - 1;
          } else {
            if (idx >= newIndex && idx < oldIndex) return idx + 1;
          }
          return idx;
        });
      });
    }
  };

  const toggleExpand = (index: number) => {
    setExpandedItems(prev => 
      prev.includes(index) 
        ? prev.filter(i => i !== index) 
        : [...prev, index]
    );
  };

  const updateItem = (index: number, newValue: any) => {
    const newItems = [...items];
    newItems[index] = newValue;
    onChange(newItems);
  };

  const removeItem = (index: number) => {
    onChange(items.filter((_, i) => i !== index));
    setExpandedItems(prev => prev.filter(i => i !== index).map(i => i > index ? i - 1 : i));
  };

  const addItem = () => {
    // Infer structure from existing items or create empty
    if (items.length > 0) {
      const template = items[0];
      if (typeof template === 'object') {
        const newItem: Record<string, any> = {};
        Object.keys(template).forEach(key => {
          newItem[key] = typeof template[key] === 'string' ? '' : 
                         typeof template[key] === 'number' ? 0 : 
                         Array.isArray(template[key]) ? [] : '';
        });
        onChange([...items, newItem]);
      } else {
        onChange([...items, '']);
      }
    } else {
      // Default to string for paragraphs, object for items
      if (fieldKey === 'paragraphs') {
        onChange([...items, '']);
      } else {
        onChange([...items, { title: '', description: '' }]);
      }
    }
  };

  // For simple string arrays (like paragraphs)
  if (items.length > 0 && typeof items[0] === 'string') {
    return (
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={itemsWithIds.map(item => item._sortId)}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-3">
            {itemsWithIds.map((item, index) => (
              <SortableStringItem
                key={item._sortId}
                id={item._sortId}
                value={items[index]}
                index={index}
                onUpdate={(val) => updateItem(index, val)}
                onRemove={() => removeItem(index)}
              />
            ))}
            <Button variant="outline" size="sm" onClick={addItem}>
              <Plus className="h-4 w-4 mr-2" />
              Add Item
            </Button>
          </div>
        </SortableContext>
      </DndContext>
    );
  }

  // For object arrays (like testimonials, features)
  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={itemsWithIds.map(item => item._sortId)}
        strategy={verticalListSortingStrategy}
      >
        <div className="space-y-3">
          {itemsWithIds.map((item, index) => (
            <SortableObjectItem
              key={item._sortId}
              id={item._sortId}
              item={items[index]}
              index={index}
              isExpanded={expandedItems.includes(index)}
              onToggleExpand={() => toggleExpand(index)}
              onUpdate={(val) => updateItem(index, val)}
              onRemove={() => removeItem(index)}
            />
          ))}
          <Button variant="outline" size="sm" onClick={addItem}>
            <Plus className="h-4 w-4 mr-2" />
            Add Item
          </Button>
        </div>
      </SortableContext>
    </DndContext>
  );
}

// Sortable string item component
function SortableStringItem({
  id,
  value,
  index,
  onUpdate,
  onRemove,
}: {
  id: string;
  value: string;
  index: number;
  onUpdate: (val: string) => void;
  onRemove: () => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className="flex gap-2 items-start">
      <div
        {...attributes}
        {...listeners}
        className="mt-3 cursor-grab active:cursor-grabbing p-1 hover:bg-muted rounded"
      >
        <GripVertical className="h-4 w-4 text-muted-foreground" />
      </div>
      <Textarea
        value={value}
        onChange={(e) => onUpdate(e.target.value)}
        rows={3}
        className="flex-1"
      />
      <Button
        variant="ghost"
        size="icon"
        onClick={onRemove}
        className="flex-shrink-0 mt-1"
      >
        <Trash2 className="h-4 w-4 text-destructive" />
      </Button>
    </div>
  );
}

// Sortable object item component
function SortableObjectItem({
  id,
  item,
  index,
  isExpanded,
  onToggleExpand,
  onUpdate,
  onRemove,
}: {
  id: string;
  item: Record<string, any>;
  index: number;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onUpdate: (val: Record<string, any>) => void;
  onRemove: () => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style}>
      <Collapsible open={isExpanded} onOpenChange={onToggleExpand}>
        <div className="border rounded-lg overflow-hidden">
          <div className="flex items-center justify-between p-3 bg-muted/50 hover:bg-muted">
            <div className="flex items-center gap-2">
              <div
                {...attributes}
                {...listeners}
                className="cursor-grab active:cursor-grabbing p-1 hover:bg-background rounded"
              >
                <GripVertical className="h-4 w-4 text-muted-foreground" />
              </div>
              <Badge variant="outline" className="text-xs">#{index + 1}</Badge>
              <span className="text-sm font-medium">
                {item.title || item.name || item.label || `Item ${index + 1}`}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={(e) => {
                  e.stopPropagation();
                  onRemove();
                }}
              >
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  {isExpanded ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </Button>
              </CollapsibleTrigger>
            </div>
          </div>
          <CollapsibleContent>
            <div className="p-3 space-y-3 border-t">
              <ObjectFieldEditor
                obj={item}
                onChange={onUpdate}
              />
            </div>
          </CollapsibleContent>
        </div>
      </Collapsible>
    </div>
  );
}

// Object field editor
function ObjectFieldEditor({ 
  obj, 
  onChange 
}: { 
  obj: Record<string, any>; 
  onChange: (obj: Record<string, any>) => void;
}) {
  const updateField = (key: string, value: any) => {
    onChange({ ...obj, [key]: value });
  };

  return (
    <div className="space-y-3">
      {Object.entries(obj).map(([key, value]) => (
        <div key={key} className="space-y-1">
          <Label className="capitalize text-sm">{key.replace(/_/g, ' ')}</Label>
          {renderFieldInput(value, (val) => updateField(key, val), key)}
        </div>
      ))}
    </div>
  );
}

export default function PageContent() {
  const queryClient = useQueryClient();
  const [editedContent, setEditedContent] = useState<Record<string, Record<string, any>>>({});

  const { data: pageContent, isLoading } = useQuery({
    queryKey: ['admin-page-content'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('page_content')
        .select('*')
        .order('page_name', { ascending: true });
      
      if (error) throw error;
      return data as PageSection[];
    },
  });

  // Initialize edited content when data loads
  useEffect(() => {
    if (pageContent) {
      const initial: Record<string, Record<string, any>> = {};
      pageContent.forEach(section => {
        initial[section.id] = section.content;
      });
      setEditedContent(initial);
    }
  }, [pageContent]);

  const saveMutation = useMutation({
    mutationFn: async ({ id, content }: { id: string; content: Record<string, any> }) => {
      const { error } = await supabase
        .from('page_content')
        .update({ content })
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-page-content'] });
      queryClient.invalidateQueries({ queryKey: ['page-content'] });
      toast.success('Content saved successfully');
    },
    onError: (error) => {
      toast.error('Failed to save content');
      console.error(error);
    },
  });

  const createMutation = useMutation({
    mutationFn: async ({ page_name, section_name }: { page_name: string; section_name: string }) => {
      const { error } = await supabase
        .from('page_content')
        .insert({
          page_name,
          section_name,
          content: {},
        });
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-page-content'] });
      toast.success('Section created');
    },
    onError: (error) => {
      toast.error('Failed to create section');
      console.error(error);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('page_content')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-page-content'] });
      toast.success('Section deleted');
    },
    onError: (error) => {
      toast.error('Failed to delete section');
      console.error(error);
    },
  });

  const updateContentField = (sectionId: string, field: string, value: any) => {
    setEditedContent(prev => ({
      ...prev,
      [sectionId]: {
        ...(prev[sectionId] || {}),
        [field]: value,
      },
    }));
  };

  const addContentField = (sectionId: string, fieldName: string) => {
    if (!fieldName.trim()) {
      toast.error('Field name is required');
      return;
    }
    setEditedContent(prev => ({
      ...prev,
      [sectionId]: {
        ...(prev[sectionId] || {}),
        [fieldName]: '',
      },
    }));
  };

  const removeContentField = (sectionId: string, field: string) => {
    setEditedContent(prev => {
      const newContent = { ...(prev[sectionId] || {}) };
      delete newContent[field];
      return {
        ...prev,
        [sectionId]: newContent,
      };
    });
  };

  const handleSave = (sectionId: string) => {
    saveMutation.mutate({ 
      id: sectionId, 
      content: editedContent[sectionId] || {} 
    });
  };

  // Group sections by page
  const pageGroups = pageContent?.reduce((acc, section) => {
    if (!acc[section.page_name]) {
      acc[section.page_name] = [];
    }
    acc[section.page_name].push(section);
    return acc;
  }, {} as Record<string, PageSection[]>) || {};

  const pages = Object.keys(pageGroups);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold">Page Content</h1>
          <p className="text-muted-foreground">Manage editable content for your website pages</p>
        </div>
      </div>

      {/* Quick Access: Banner Management */}
      <Card className="bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-primary/20 flex items-center justify-center">
                <ImageIcon className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">Banner Management</h3>
                <p className="text-sm text-muted-foreground">
                  Manage homepage carousel banners with images, titles, and links
                </p>
              </div>
            </div>
            <Button asChild>
              <Link to="/admin/banners">
                <ImageIcon className="h-4 w-4 mr-2" />
                Manage Banners
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      {pages.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <FileEdit className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Content Yet</h3>
            <p className="text-muted-foreground mb-4">
              Start by creating page content sections to manage your website content.
            </p>
            <NewSectionForm onSubmit={(page, section) => createMutation.mutate({ page_name: page, section_name: section })} />
          </CardContent>
        </Card>
      ) : (
        <Tabs defaultValue={pages[0]} className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-4">
              <TabsList>
                {pages.map((page) => (
                  <TabsTrigger key={page} value={page} className="capitalize">
                    {page}
                  </TabsTrigger>
                ))}
              </TabsList>
              <NewSectionForm onSubmit={(page, section) => createMutation.mutate({ page_name: page, section_name: section })} />
            </div>
          </div>

          {pages.map((page) => {
            // Map page names to routes
            const pageRoutes: Record<string, string> = {
              'home': '/',
              'about': '/about',
              'contact': '/contact',
              'shop': '/shop',
              'blog': '/blog',
            };
            const previewUrl = pageRoutes[page] || `/${page}`;

            return (
            <TabsContent key={page} value={page} className="space-y-6">
              {/* Page Preview Button */}
              <div className="flex items-center justify-between bg-muted/50 rounded-lg p-4">
                <div>
                  <h3 className="font-medium capitalize">{page} Page</h3>
                  <p className="text-sm text-muted-foreground">
                    {pageGroups[page].length} section{pageGroups[page].length !== 1 ? 's' : ''} configured
                  </p>
                </div>
                <Button
                  variant="outline"
                  onClick={() => window.open(previewUrl, '_blank')}
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Preview Page
                </Button>
              </div>
              {pageGroups[page].map((section) => (
                <Card key={section.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="capitalize">{section.section_name.replace(/_/g, ' ')}</CardTitle>
                        <CardDescription>
                          {section.page_name} / {section.section_name}
                        </CardDescription>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button 
                          onClick={() => handleSave(section.id)}
                          disabled={saveMutation.isPending}
                        >
                          <Save className="h-4 w-4 mr-2" />
                          Save
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            if (confirm('Delete this section?')) {
                              deleteMutation.mutate(section.id);
                            }
                          }}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {Object.entries(editedContent[section.id] || {}).map(([field, value]) => (
                      <div key={field} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label className="capitalize font-medium">{field.replace(/_/g, ' ')}</Label>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeContentField(section.id, field)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                        {renderFieldInput(
                          value, 
                          (val) => updateContentField(section.id, field, val),
                          field
                        )}
                      </div>
                    ))}

                    <AddFieldForm onAdd={(fieldName) => addContentField(section.id, fieldName)} />
                  </CardContent>
                </Card>
              ))}
            </TabsContent>
            );
          })}
        </Tabs>
      )}
    </div>
  );
}

function NewSectionForm({ onSubmit }: { onSubmit: (page: string, section: string) => void }) {
  const [pageName, setPageName] = useState('');
  const [sectionName, setSectionName] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pageName.trim() || !sectionName.trim()) {
      toast.error('Both page and section names are required');
      return;
    }
    onSubmit(pageName.toLowerCase().trim(), sectionName.toLowerCase().replace(/\s+/g, '_').trim());
    setPageName('');
    setSectionName('');
  };

  return (
    <Accordion type="single" collapsible className="w-full max-w-md">
      <AccordionItem value="new-section" className="border-none">
        <AccordionTrigger className="hover:no-underline py-2">
          <span className="flex items-center gap-2 text-sm">
            <Plus className="h-4 w-4" />
            Add Section
          </span>
        </AccordionTrigger>
        <AccordionContent>
          <form onSubmit={handleSubmit} className="flex flex-col gap-2 pt-2">
            <Input
              value={pageName}
              onChange={(e) => setPageName(e.target.value)}
              placeholder="Page name (e.g., home, about)"
              className="h-8"
            />
            <Input
              value={sectionName}
              onChange={(e) => setSectionName(e.target.value)}
              placeholder="Section name (e.g., hero, features)"
              className="h-8"
            />
            <Button type="submit" size="sm">
              Create
            </Button>
          </form>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}

function AddFieldForm({ onAdd }: { onAdd: (fieldName: string) => void }) {
  const [fieldName, setFieldName] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (fieldName.trim()) {
      onAdd(fieldName.toLowerCase().replace(/\s+/g, '_').trim());
      setFieldName('');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-2 pt-4 border-t">
      <Input
        value={fieldName}
        onChange={(e) => setFieldName(e.target.value)}
        placeholder="New field name"
        className="max-w-xs"
      />
      <Button type="submit" variant="outline" size="sm">
        <Plus className="h-4 w-4 mr-2" />
        Add Field
      </Button>
    </form>
  );
}
