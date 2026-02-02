import { useState, useEffect } from 'react';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { Download, Smartphone, Monitor, CheckCircle, Share, MoreVertical } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export default function Install() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }

    // Detect iOS
    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent);
    setIsIOS(isIOSDevice);

    // Detect Android
    const isAndroidDevice = /Android/.test(navigator.userAgent);
    setIsAndroid(isAndroidDevice);

    // Listen for the beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Listen for app installed event
    window.addEventListener('appinstalled', () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      setIsInstalled(true);
    }
    setDeferredPrompt(null);
  };

  return (
    <Layout>
      <section className="section-padding bg-gradient-to-b from-secondary to-background">
        <div className="container-deiva">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-3xl mx-auto text-center"
          >
            <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center mx-auto mb-6 shadow-xl">
              <Smartphone className="h-10 w-10 text-white" />
            </div>
            
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Install <span className="text-gradient">New Sathiya Furniture</span>
            </h1>
            
            <p className="text-lg text-muted-foreground mb-8 max-w-xl mx-auto">
              Get quick access to our furniture collection right from your home screen. 
              Works offline and loads instantly!
            </p>

            {isInstalled ? (
              <motion.div
                initial={{ scale: 0.9 }}
                animate={{ scale: 1 }}
                className="bg-success/10 border border-success/20 rounded-xl p-6 mb-8"
              >
                <CheckCircle className="h-12 w-12 text-success mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-success mb-2">App Installed!</h3>
                <p className="text-muted-foreground">
                  New Sathiya Furniture is now installed on your device. 
                  You can access it from your home screen.
                </p>
              </motion.div>
            ) : deferredPrompt ? (
              <Button
                size="lg"
                onClick={handleInstallClick}
                className="gap-2 bg-gradient-to-r from-primary to-primary/80 shadow-lg mb-8"
              >
                <Download className="h-5 w-5" />
                Install App Now
              </Button>
            ) : (
              <div className="space-y-6 mb-8">
                {isIOS && (
                  <div className="bg-card border rounded-xl p-6 text-left">
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <span className="text-2xl">📱</span> Install on iPhone/iPad
                    </h3>
                    <ol className="space-y-3 text-muted-foreground">
                      <li className="flex items-start gap-3">
                        <span className="h-6 w-6 rounded-full bg-primary text-primary-foreground text-sm flex items-center justify-center flex-shrink-0">1</span>
                        <span>Tap the <Share className="inline h-4 w-4" /> <strong>Share</strong> button at the bottom of Safari</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <span className="h-6 w-6 rounded-full bg-primary text-primary-foreground text-sm flex items-center justify-center flex-shrink-0">2</span>
                        <span>Scroll down and tap <strong>"Add to Home Screen"</strong></span>
                      </li>
                      <li className="flex items-start gap-3">
                        <span className="h-6 w-6 rounded-full bg-primary text-primary-foreground text-sm flex items-center justify-center flex-shrink-0">3</span>
                        <span>Tap <strong>"Add"</strong> in the top right corner</span>
                      </li>
                    </ol>
                  </div>
                )}

                {isAndroid && (
                  <div className="bg-card border rounded-xl p-6 text-left">
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <span className="text-2xl">🤖</span> Install on Android
                    </h3>
                    <ol className="space-y-3 text-muted-foreground">
                      <li className="flex items-start gap-3">
                        <span className="h-6 w-6 rounded-full bg-primary text-primary-foreground text-sm flex items-center justify-center flex-shrink-0">1</span>
                        <span>Tap the <MoreVertical className="inline h-4 w-4" /> <strong>menu button</strong> (three dots) in your browser</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <span className="h-6 w-6 rounded-full bg-primary text-primary-foreground text-sm flex items-center justify-center flex-shrink-0">2</span>
                        <span>Tap <strong>"Install app"</strong> or <strong>"Add to Home screen"</strong></span>
                      </li>
                      <li className="flex items-start gap-3">
                        <span className="h-6 w-6 rounded-full bg-primary text-primary-foreground text-sm flex items-center justify-center flex-shrink-0">3</span>
                        <span>Tap <strong>"Install"</strong> to confirm</span>
                      </li>
                    </ol>
                  </div>
                )}

                {!isIOS && !isAndroid && (
                  <div className="bg-card border rounded-xl p-6 text-left">
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <Monitor className="h-5 w-5" /> Install on Desktop
                    </h3>
                    <ol className="space-y-3 text-muted-foreground">
                      <li className="flex items-start gap-3">
                        <span className="h-6 w-6 rounded-full bg-primary text-primary-foreground text-sm flex items-center justify-center flex-shrink-0">1</span>
                        <span>Look for the <strong>install icon</strong> in the address bar (Chrome/Edge)</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <span className="h-6 w-6 rounded-full bg-primary text-primary-foreground text-sm flex items-center justify-center flex-shrink-0">2</span>
                        <span>Click on it and select <strong>"Install"</strong></span>
                      </li>
                      <li className="flex items-start gap-3">
                        <span className="h-6 w-6 rounded-full bg-primary text-primary-foreground text-sm flex items-center justify-center flex-shrink-0">3</span>
                        <span>The app will open in its own window</span>
                      </li>
                    </ol>
                  </div>
                )}
              </div>
            )}

            {/* Features */}
            <div className="grid sm:grid-cols-3 gap-6 mt-12">
              <div className="bg-card rounded-xl p-6 border">
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <Smartphone className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold mb-2">Works Offline</h3>
                <p className="text-sm text-muted-foreground">Browse furniture even without internet connection</p>
              </div>
              <div className="bg-card rounded-xl p-6 border">
                <div className="h-12 w-12 rounded-full bg-accent/10 flex items-center justify-center mx-auto mb-4">
                  <Download className="h-6 w-6 text-accent" />
                </div>
                <h3 className="font-semibold mb-2">Instant Access</h3>
                <p className="text-sm text-muted-foreground">Launch directly from your home screen</p>
              </div>
              <div className="bg-card rounded-xl p-6 border">
                <div className="h-12 w-12 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="h-6 w-6 text-success" />
                </div>
                <h3 className="font-semibold mb-2">Fast & Light</h3>
                <p className="text-sm text-muted-foreground">No app store download needed</p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>
    </Layout>
  );
}
