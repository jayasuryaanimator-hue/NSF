import { useState, useEffect } from 'react';
import { Wrench, Clock, Phone, Mail } from 'lucide-react';

interface MaintenancePageProps {
  startedAt: number;
}

export function MaintenancePage({ startedAt }: MaintenancePageProps) {
  const [timeRemaining, setTimeRemaining] = useState('');

  useEffect(() => {
    const FOUR_HOURS_MS = 4 * 60 * 60 * 1000;
    const endTime = startedAt + FOUR_HOURS_MS;

    const updateTimer = () => {
      const now = Date.now();
      const remaining = endTime - now;

      if (remaining <= 0) {
        setTimeRemaining('00:00:00');
        return;
      }

      const hours = Math.floor(remaining / (1000 * 60 * 60));
      const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((remaining % (1000 * 60)) / 1000);

      setTimeRemaining(
        `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
      );
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [startedAt]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-secondary via-background to-secondary/50 flex items-center justify-center p-4">
      <div className="max-w-lg w-full text-center">
        {/* Animated Icon */}
        <div className="relative mb-8">
          <div className="h-24 w-24 mx-auto bg-primary/10 rounded-full flex items-center justify-center animate-pulse">
            <Wrench className="h-12 w-12 text-primary" />
          </div>
          <div className="absolute inset-0 h-24 w-24 mx-auto rounded-full border-4 border-primary/20 animate-ping" style={{ animationDuration: '2s' }} />
        </div>

        {/* Title */}
        <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
          We're Currently Under Maintenance
        </h1>

        {/* Description */}
        <p className="text-muted-foreground text-lg mb-8">
          Our team is working hard to bring you an improved experience. 
          We'll be back shortly!
        </p>

        {/* Countdown Timer */}
        <div className="bg-card rounded-2xl border p-6 mb-8 shadow-lg">
          <div className="flex items-center justify-center gap-2 text-muted-foreground mb-3">
            <Clock className="h-5 w-5" />
            <span className="font-medium">Estimated time remaining</span>
          </div>
          <div className="text-4xl md:text-5xl font-mono font-bold text-primary tracking-wider">
            {timeRemaining}
          </div>
        </div>

        {/* Contact Info */}
        <div className="bg-muted/50 rounded-xl p-6">
          <p className="text-sm text-muted-foreground mb-4">
            For urgent queries, please contact us:
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a 
              href="tel:+918883358059" 
              className="flex items-center gap-2 text-foreground hover:text-primary transition-colors"
            >
              <Phone className="h-4 w-4" />
              +91 88833 58059
            </a>
            <a 
              href="mailto:gounderandcoagro@gmail.com" 
              className="flex items-center gap-2 text-foreground hover:text-primary transition-colors"
            >
              <Mail className="h-4 w-4" />
              gounderandcoagro@gmail.com
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
