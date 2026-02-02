import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { Save, Store, Truck, Mail, CreditCard, QrCode } from 'lucide-react';
import { ImageUploader } from '@/components/admin/ImageUploader';

interface SiteSettings {
  store_name: string;
  store_email: string;
  store_phone: string;
  store_address: string;
  currency: string;
  tax_rate: number;
  free_shipping_threshold: number;
  shipping_cost: number;
  enable_cod: boolean;
  enable_upi: boolean;
  upi_id: string;
  upi_qr_code: string;
  whatsapp_number: string;
  maintenance_mode: boolean;
  maintenance_started_at: number | null;
  social_facebook: string;
  social_instagram: string;
  social_twitter: string;
}

const defaultSettings: SiteSettings = {
  store_name: 'Deiva',
  store_email: 'contact@deiva.com',
  store_phone: '',
  store_address: '',
  currency: 'INR',
  tax_rate: 18,
  free_shipping_threshold: 499,
  shipping_cost: 49,
  enable_cod: true,
  enable_upi: true,
  upi_id: '',
  upi_qr_code: '',
  whatsapp_number: '918124584569',
  maintenance_mode: false,
  maintenance_started_at: null,
  social_facebook: '',
  social_instagram: '',
  social_twitter: '',
};

export default function Settings() {
  const [settings, setSettings] = useState<SiteSettings>(defaultSettings);
  const queryClient = useQueryClient();

  const { data: savedSettings, isLoading } = useQuery({
    queryKey: ['site-settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('site_settings')
        .select('*');
      if (error) throw error;

      const settingsMap: Record<string, unknown> = {};
      data?.forEach((item) => {
        settingsMap[item.key] = item.value;
      });
      return settingsMap;
    },
  });

  useEffect(() => {
    if (savedSettings) {
      setSettings((prev) => ({
        ...prev,
        ...Object.fromEntries(
          Object.entries(savedSettings).map(([key, value]) => [
            key,
            typeof value === 'object' ? (value as Record<string, unknown>).value ?? value : value,
          ])
        ),
      }));
    }
  }, [savedSettings]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const entries = Object.entries(settings);
      
      for (const [key, value] of entries) {
        // Handle maintenance mode timestamp
        let saveValue = value;
        if (key === 'maintenance_mode' && value === true) {
          // Set maintenance_started_at when enabling maintenance
          const startedAtEntry = entries.find(([k]) => k === 'maintenance_started_at');
          if (!startedAtEntry || !startedAtEntry[1]) {
            // Update the started_at timestamp
            const { error: tsError } = await supabase
              .from('site_settings')
              .upsert(
                { key: 'maintenance_started_at', value: { value: Date.now() } },
                { onConflict: 'key' }
              );
            if (tsError) throw tsError;
          }
        } else if (key === 'maintenance_mode' && value === false) {
          // Clear maintenance_started_at when disabling
          const { error: tsError } = await supabase
            .from('site_settings')
            .upsert(
              { key: 'maintenance_started_at', value: { value: null } },
              { onConflict: 'key' }
            );
          if (tsError) throw tsError;
        }

        const { error } = await supabase
          .from('site_settings')
          .upsert(
            { key, value: { value: saveValue } },
            { onConflict: 'key' }
          );
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['site-settings'] });
      queryClient.invalidateQueries({ queryKey: ['maintenance-settings'] });
      toast({ title: 'Settings saved' });
    },
    onError: () => {
      toast({ title: 'Error saving settings', variant: 'destructive' });
    },
  });

  const updateSetting = <K extends keyof SiteSettings>(key: K, value: SiteSettings[K]) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48" />
        <div className="grid md:grid-cols-2 gap-6">
          <Skeleton className="h-[300px]" />
          <Skeleton className="h-[300px]" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Settings</h1>
          <p className="text-muted-foreground">Manage your store settings</p>
        </div>
        <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
          <Save className="h-4 w-4 mr-2" />
          {saveMutation.isPending ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Store Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Store className="h-5 w-5" />
              Store Information
            </CardTitle>
            <CardDescription>Basic store details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Store Name</Label>
              <Input
                value={settings.store_name}
                onChange={(e) => updateSetting('store_name', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Store Email</Label>
              <Input
                type="email"
                value={settings.store_email}
                onChange={(e) => updateSetting('store_email', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Store Phone</Label>
              <Input
                value={settings.store_phone}
                onChange={(e) => updateSetting('store_phone', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Store Address</Label>
              <Textarea
                value={settings.store_address}
                onChange={(e) => updateSetting('store_address', e.target.value)}
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        {/* Shipping Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Truck className="h-5 w-5" />
              Shipping & Tax
            </CardTitle>
            <CardDescription>Configure shipping and tax rates</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Tax Rate (%)</Label>
              <Input
                type="number"
                value={settings.tax_rate}
                onChange={(e) => updateSetting('tax_rate', Number(e.target.value))}
              />
            </div>
            <div className="space-y-2">
              <Label>Free Shipping Threshold (₹)</Label>
              <Input
                type="number"
                value={settings.free_shipping_threshold}
                onChange={(e) => updateSetting('free_shipping_threshold', Number(e.target.value))}
              />
            </div>
            <div className="space-y-2">
              <Label>Shipping Cost (₹)</Label>
              <Input
                type="number"
                value={settings.shipping_cost}
                onChange={(e) => updateSetting('shipping_cost', Number(e.target.value))}
              />
            </div>
          </CardContent>
        </Card>

        {/* Payment Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Payment Methods
            </CardTitle>
            <CardDescription>Configure payment options</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Cash on Delivery</Label>
                <p className="text-sm text-muted-foreground">Allow COD payments</p>
              </div>
              <Switch
                checked={settings.enable_cod}
                onCheckedChange={(v) => updateSetting('enable_cod', v)}
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label>UPI Payment</Label>
                <p className="text-sm text-muted-foreground">Allow UPI payments</p>
              </div>
              <Switch
                checked={settings.enable_upi}
                onCheckedChange={(v) => updateSetting('enable_upi', v)}
              />
            </div>
            {settings.enable_upi && (
              <>
                <div className="space-y-2">
                  <Label>UPI ID</Label>
                  <Input
                    value={settings.upi_id}
                    onChange={(e) => updateSetting('upi_id', e.target.value)}
                    placeholder="yourname@upi"
                  />
                  <p className="text-xs text-muted-foreground">
                    This UPI ID will be shown to customers for payment
                  </p>
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <QrCode className="h-4 w-4" />
                    UPI QR Code
                  </Label>
                  <ImageUploader
                    value={settings.upi_qr_code}
                    onChange={(url) => updateSetting('upi_qr_code', url)}
                    bucket="page-images"
                    folder="payment"
                  />
                  <p className="text-xs text-muted-foreground">
                    Upload your UPI QR code image for customers to scan
                  </p>
                </div>
              </>
            )}
            <div className="space-y-2 pt-4 border-t">
              <Label>WhatsApp Support Number</Label>
              <Input
                value={settings.whatsapp_number}
                onChange={(e) => updateSetting('whatsapp_number', e.target.value)}
                placeholder="918124584569"
              />
              <p className="text-xs text-muted-foreground">
                Include country code (e.g., 91 for India)
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Social Media */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Social Media
            </CardTitle>
            <CardDescription>Social media links</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Facebook URL</Label>
              <Input
                value={settings.social_facebook}
                onChange={(e) => updateSetting('social_facebook', e.target.value)}
                placeholder="https://facebook.com/..."
              />
            </div>
            <div className="space-y-2">
              <Label>Instagram URL</Label>
              <Input
                value={settings.social_instagram}
                onChange={(e) => updateSetting('social_instagram', e.target.value)}
                placeholder="https://instagram.com/..."
              />
            </div>
            <div className="space-y-2">
              <Label>Twitter URL</Label>
              <Input
                value={settings.social_twitter}
                onChange={(e) => updateSetting('social_twitter', e.target.value)}
                placeholder="https://twitter.com/..."
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Maintenance Mode */}
      <Card className={settings.maintenance_mode ? 'border-destructive' : ''}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Maintenance Mode
            {settings.maintenance_mode && (
              <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full bg-destructive text-destructive-foreground animate-pulse">
                ACTIVE
              </span>
            )}
          </CardTitle>
          <CardDescription>Enable to show maintenance page to visitors (4 hours max)</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label>Enable Maintenance Mode</Label>
              <p className="text-sm text-muted-foreground">
                The store will be inaccessible to customers for up to 4 hours
              </p>
            </div>
            <Switch
              checked={settings.maintenance_mode}
              onCheckedChange={(v) => {
                updateSetting('maintenance_mode', v);
                if (v) {
                  updateSetting('maintenance_started_at', Date.now());
                } else {
                  updateSetting('maintenance_started_at', null);
                }
              }}
            />
          </div>
          {settings.maintenance_mode && (
            <div className="p-4 bg-destructive/10 rounded-lg border border-destructive/20">
              <p className="text-sm text-destructive font-medium">
                ⚠️ Maintenance mode is active! Customers cannot access the store.
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Admin routes (/admin/*) remain accessible. Mode will auto-expire after 4 hours.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
