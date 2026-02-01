import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useBills } from '@/contexts/BillContext';
import BottomNav from '@/components/BottomNav';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { formatCurrency, convertCurrency } from '@/utils/currencyUtils';
import { getBillStatus } from '@/utils/billUtils';
import { CheckCircle2, Clock, AlertCircle, DollarSign, TrendingUp, Edit2, Save } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const Insights = () => {
  const { bills, settings, updateSettings, loading } = useBills();
  const { toast } = useToast();
  const [isEditingIncome, setIsEditingIncome] = useState(false);
  const [incomeValue, setIncomeValue] = useState(settings.monthlyIncome?.toString() || '');

  const insights = useMemo(() => {
    const paidBills = bills.filter(bill => getBillStatus(bill) === 'paid');
    const overdueBills = bills.filter(bill => getBillStatus(bill) === 'overdue');
    const upcomingBills = bills.filter(bill => getBillStatus(bill) === 'upcoming');

    const totalPaid = paidBills.reduce((sum, bill) => sum + bill.amount, 0);
    const totalRemaining = [...overdueBills, ...upcomingBills].reduce((sum, bill) => sum + bill.amount, 0);
    const totalOverdue = overdueBills.reduce((sum, bill) => sum + bill.amount, 0);

    return {
      paidCount: paidBills.length,
      remainingCount: overdueBills.length + upcomingBills.length,
      overdueCount: overdueBills.length,
      totalPaid,
      totalRemaining,
      totalOverdue,
      totalBills: bills.length,
    };
  }, [bills]);

  const displayCurrency = settings.displayCurrency || settings.currency;

  const handleSaveIncome = async () => {
    const income = parseFloat(incomeValue);
    if (!isNaN(income)) {
      try {
        await updateSettings({ monthlyIncome: income });
        toast({
          title: 'Income updated',
          description: 'Your monthly income has been saved.',
        });
      } catch (error) {
        console.error('Error updating income:', error);
        toast({
          title: 'Error',
          description: 'Failed to update income. Please try again.',
          variant: 'destructive',
        });
      }
    }
    setIsEditingIncome(false);
  };

  const remainingAfterBills = settings.monthlyIncome
    ? settings.monthlyIncome - insights.totalRemaining
    : null;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background pb-20">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading insights...</p>
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
            <h1 className="text-2xl font-bold">Insights</h1>
          </div>
        </div>

        {/* Content */}
        <div className="px-6 py-6 space-y-4">
          {/* Monthly Income Card */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <DollarSign size={20} />
                    Monthly Income
                  </span>
                  {!isEditingIncome && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setIsEditingIncome(true)}
                    >
                      <Edit2 size={16} />
                    </Button>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isEditingIncome ? (
                  <div className="space-y-3">
                    <Input
                      type="number"
                      step="0.01"
                      value={incomeValue}
                      onChange={(e) => setIncomeValue(e.target.value)}
                      placeholder="Enter your monthly income"
                    />
                    <div className="flex gap-2">
                      <Button onClick={handleSaveIncome} className="flex-1">
                        <Save size={16} className="mr-2" />
                        Save
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setIncomeValue(settings.monthlyIncome?.toString() || '');
                          setIsEditingIncome(false);
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <p className="text-3xl font-bold">
                      {settings.monthlyIncome
                        ? formatCurrency(settings.monthlyIncome, displayCurrency)
                        : 'Not set'}
                    </p>
                    {remainingAfterBills !== null && (
                      <p className="text-sm text-muted-foreground mt-2">
                        After bills: {formatCurrency(remainingAfterBills, displayCurrency)}
                      </p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Bill Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card>
              <CardHeader>
                <CardTitle>Bill Statistics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center p-3 bg-green-500/10 rounded-lg">
                    <CheckCircle2 className="mx-auto mb-2 text-green-500" size={24} />
                    <p className="text-2xl font-bold">{insights.paidCount}</p>
                    <p className="text-xs text-muted-foreground">Paid</p>
                  </div>
                  
                  <div className="text-center p-3 bg-blue-500/10 rounded-lg">
                    <Clock className="mx-auto mb-2 text-blue-500" size={24} />
                    <p className="text-2xl font-bold">{insights.remainingCount}</p>
                    <p className="text-xs text-muted-foreground">Remaining</p>
                  </div>
                  
                  <div className="text-center p-3 bg-red-500/10 rounded-lg">
                    <AlertCircle className="mx-auto mb-2 text-red-500" size={24} />
                    <p className="text-2xl font-bold">{insights.overdueCount}</p>
                    <p className="text-xs text-muted-foreground">Overdue</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Payment Summary */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card>
              <CardHeader>
                <CardTitle>Payment Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center p-3 bg-green-500/10 rounded-lg">
                  <span className="text-sm font-medium">Total Paid</span>
                  <span className="text-lg font-bold text-green-500">
                    {formatCurrency(insights.totalPaid, displayCurrency)}
                  </span>
                </div>
                
                <div className="flex justify-between items-center p-3 bg-blue-500/10 rounded-lg">
                  <span className="text-sm font-medium">Total Remaining</span>
                  <span className="text-lg font-bold text-blue-500">
                    {formatCurrency(insights.totalRemaining, displayCurrency)}
                  </span>
                </div>
                
                {insights.totalOverdue > 0 && (
                  <div className="flex justify-between items-center p-3 bg-red-500/10 rounded-lg">
                    <span className="text-sm font-medium">Total Overdue</span>
                    <span className="text-lg font-bold text-red-500">
                      {formatCurrency(insights.totalOverdue, displayCurrency)}
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Income vs Bills */}
          {settings.monthlyIncome && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp size={20} />
                    Budget Analysis
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>Bills vs Income</span>
                      <span className="font-medium">
                        {((insights.totalRemaining / settings.monthlyIncome) * 100).toFixed(1)}%
                      </span>
                    </div>
                    <div className="h-3 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary transition-all"
                        style={{
                          width: `${Math.min((insights.totalRemaining / settings.monthlyIncome) * 100, 100)}%`
                        }}
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <div className="p-3 bg-muted rounded-lg">
                      <p className="text-xs text-muted-foreground mb-1">Income</p>
                      <p className="font-bold">
                        {formatCurrency(settings.monthlyIncome, displayCurrency)}
                      </p>
                    </div>
                    <div className="p-3 bg-muted rounded-lg">
                      <p className="text-xs text-muted-foreground mb-1">After Bills</p>
                      <p className="font-bold">
                        {formatCurrency(remainingAfterBills!, displayCurrency)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </div>
      </div>

      <BottomNav />
    </div>
  );
};

export default Insights;
