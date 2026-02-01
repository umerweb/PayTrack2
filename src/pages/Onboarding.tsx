import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useBills } from '@/contexts/BillContext';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { currencies } from '@/utils/currencyUtils';
import { Wallet, ArrowRight } from 'lucide-react';

const Onboarding = () => {
  const navigate = useNavigate();
  const { hasCompletedOnboarding, completeOnboarding, loading, settings } = useBills();
  const [selectedCurrency, setSelectedCurrency] = useState(settings.currency || 'USD');

  useEffect(() => {
    console.log('Onboarding - Loading:', loading, 'Completed:', hasCompletedOnboarding);
    
    if (!loading && hasCompletedOnboarding) {
      console.log('Onboarding already completed, redirecting to dashboard');
      navigate('/dashboard');
    }
  }, [hasCompletedOnboarding, loading, navigate]);

  const handleContinue = async () => {
    console.log('Completing onboarding with currency:', selectedCurrency);
    await completeOnboarding(selectedCurrency);
    navigate('/dashboard');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-accent/5">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-accent/5 p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="bg-card rounded-3xl shadow-2xl p-8 space-y-8">
          <div className="text-center space-y-4">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring' }}
              className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary/10 text-primary mx-auto"
            >
              <Wallet size={40} />
            </motion.div>
            
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">
                Welcome to Bill Reminder
              </h1>
              <p className="text-muted-foreground">
                Never miss a payment again. Let's get started by setting up your default currency.
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Select Your Currency</label>
              <Select value={selectedCurrency} onValueChange={setSelectedCurrency}>
                <SelectTrigger className="w-full h-12">
                  <SelectValue placeholder="Choose currency" />
                </SelectTrigger>
                <SelectContent>
                  {currencies.map((currency) => (
                    <SelectItem key={currency.code} value={currency.code}>
                      {currency.symbol} {currency.code} - {currency.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="bg-muted/50 rounded-lg p-4 text-sm text-muted-foreground">
              <p>💡 You can change this later in settings. All your bills will use this currency by default.</p>
            </div>
          </div>

          <Button
            onClick={handleContinue}
            className="w-full h-12 text-lg"
            size="lg"
          >
            Continue
            <ArrowRight className="ml-2" size={20} />
          </Button>
        </div>
      </motion.div>
    </div>
  );
};

export default Onboarding;
