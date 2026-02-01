import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useBills } from '@/contexts/BillContext';
import { useTheme } from '@/components/ThemeProvider';
import BottomNav from '@/components/BottomNav';
import BillCard from '@/components/BillCard';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Moon, Sun, Cloud, AlertCircle } from 'lucide-react';
import { filterBillsByDateRange } from '@/utils/billUtils';
import { Alert, AlertDescription } from '@/components/ui/alert';

const Dashboard = () => {
  const navigate = useNavigate();
  const { bills, hasCompletedOnboarding, loading, user } = useBills();
  const { theme, setTheme } = useTheme();
  const [view, setView] = useState<'week' | '14days' | 'month' | 'year' | 'all'>('all');
  const [filteredBills, setFilteredBills] = useState(bills);

  useEffect(() => {
    if (!loading && !hasCompletedOnboarding) {
      navigate('/');
    }
  }, [hasCompletedOnboarding, loading, navigate]);

  useEffect(() => {
    setFilteredBills(filterBillsByDateRange(bills, view));
  }, [bills, view]);

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading your bills...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="sticky top-0 z-40 bg-card/80 backdrop-blur-lg border-b border-border">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-2xl font-bold">My Bills</h1>
                {user && (
                  <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                    <Cloud size={12} />
                    Synced with {user.email}
                  </p>
                )}
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleTheme}
                className="rounded-full"
              >
                {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
              </Button>
            </div>
            
            <div className="flex items-center gap-3">
              <Select value={view} onValueChange={(value: any) => setView(value)}>
                <SelectTrigger className="flex-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="week">This Week</SelectItem>
                  <SelectItem value="14days">Next 14 Days</SelectItem>
                  <SelectItem value="month">This Month</SelectItem>
                  <SelectItem value="year">This Year</SelectItem>
                  <SelectItem value="all">All Bills</SelectItem>
                </SelectContent>
              </Select>
              
              <Button
                onClick={() => navigate('/new-bill')}
                size="icon"
                className="rounded-full"
              >
                <Plus size={20} />
              </Button>
            </div>
          </div>
        </div>

        {/* No sync warning */}
        {!user && bills.length > 0 && (
          <div className="px-6 pt-4">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Your bills are saved locally. Sign in from Settings to backup and sync across devices.
              </AlertDescription>
            </Alert>
          </div>
        )}

        {/* Bills List */}
        <div className="px-6 py-6 space-y-3">
          <AnimatePresence mode="popLayout">
            {filteredBills.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-center py-16"
              >
                <div className="text-muted-foreground mb-4">
                  <p className="text-lg">No bills found</p>
                  <p className="text-sm mt-2">Add your first bill to get started!</p>
                </div>
                <Button onClick={() => navigate('/new-bill')}>
                  <Plus size={16} className="mr-2" />
                  Add Bill
                </Button>
              </motion.div>
            ) : (
              filteredBills.map((bill) => (
                <BillCard key={bill.id} bill={bill} />
              ))
            )}
          </AnimatePresence>
        </div>
      </div>

      <BottomNav />
    </div>
  );
};

export default Dashboard;
