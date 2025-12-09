import { useState } from 'react';
import { Lock, Eye, EyeOff, KeyRound } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface LocalAuthProps {
  onAuthenticated: () => void;
  isSetup: boolean;
  onSetupComplete: (pin: string) => void;
}

export function LocalAuth({ onAuthenticated, isSetup, onSetupComplete }: LocalAuthProps) {
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [error, setError] = useState('');

  const handleSetup = () => {
    setError('');
    
    if (pin.length < 4) {
      setError('PIN must be at least 4 characters');
      return;
    }
    
    if (pin !== confirmPin) {
      setError('PINs do not match');
      return;
    }
    
    onSetupComplete(pin);
  };

  const handleLogin = () => {
    setError('');
    const storedHash = localStorage.getItem('tina-pin-hash');
    
    if (storedHash && hashPin(pin) === storedHash) {
      onAuthenticated();
    } else {
      setError('Incorrect PIN');
    }
  };

  const hashPin = (value: string): string => {
    // Simple hash for local storage - not cryptographically secure but adequate for local device protection
    let hash = 0;
    for (let i = 0; i < value.length; i++) {
      const char = value.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return hash.toString(36);
  };

  if (!isSetup) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 tina-gradient-bg">
        <div className="w-full max-w-md animate-fade-in">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mb-4">
              <KeyRound className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-2xl font-bold text-foreground mb-2">Set Up Your PIN</h1>
            <p className="text-sm text-muted-foreground">
              Create a PIN to protect your translations on this device
            </p>
          </div>

          <div className="space-y-4 p-6 rounded-xl bg-card border border-border">
            <div className="space-y-2">
              <Label htmlFor="new-pin">Create PIN</Label>
              <div className="relative">
                <Input
                  id="new-pin"
                  type={showPin ? 'text' : 'password'}
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  placeholder="Enter PIN (min 4 characters)"
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPin(!showPin)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirm-pin">Confirm PIN</Label>
              <Input
                id="confirm-pin"
                type={showPin ? 'text' : 'password'}
                value={confirmPin}
                onChange={(e) => setConfirmPin(e.target.value)}
                placeholder="Confirm your PIN"
              />
            </div>

            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}

            <Button onClick={handleSetup} className="w-full" variant="tina">
              Set PIN
            </Button>

            <p className="text-xs text-center text-muted-foreground">
              Your PIN is stored locally on this device only
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 tina-gradient-bg">
      <div className="w-full max-w-md animate-fade-in">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mb-4">
            <Lock className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-2">Welcome Back</h1>
          <p className="text-sm text-muted-foreground">
            Enter your PIN to access TINA 2
          </p>
        </div>

        <div className="space-y-4 p-6 rounded-xl bg-card border border-border">
          <div className="space-y-2">
            <Label htmlFor="login-pin">PIN</Label>
            <div className="relative">
              <Input
                id="login-pin"
                type={showPin ? 'text' : 'password'}
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                placeholder="Enter your PIN"
                className="pr-10"
                onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
              />
              <button
                type="button"
                onClick={() => setShowPin(!showPin)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}

          <Button onClick={handleLogin} className="w-full" variant="tina">
            Unlock
          </Button>
        </div>
      </div>
    </div>
  );
}
