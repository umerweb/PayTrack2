import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Bill, useBills } from '@/contexts/BillContext';
import { getBillStatus, getStatusColor } from '@/utils/billUtils';
import { formatCurrency, convertCurrency } from '@/utils/currencyUtils';
import { format } from 'date-fns';
import { Calendar, Clock, CheckCircle2, Trash2, Edit, FileText, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import BillForm from '@/components/BillForm';
import { useToast } from '@/hooks/use-toast';

interface BillCardProps {
  bill: Bill;
}

const BillCard: React.FC<BillCardProps> = ({ bill }) => {
  const { settings, markAsPaid, deleteBill } = useBills();
  const { toast } = useToast();
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const status = getBillStatus(bill);
  const statusColor = getStatusColor(status);
  
  const displayAmount = settings.displayCurrency
    ? convertCurrency(bill.amount, settings.currency, settings.displayCurrency)
    : bill.amount;
  
  const displayCurrency = settings.displayCurrency || settings.currency;

  const handleMarkAsPaid = async () => {
    setIsProcessing(true);
    try {
      await markAsPaid(bill.id);
      toast({
        title: 'Bill marked as paid',
        description: `${bill.name} has been marked as paid.`,
      });
    } catch (error) {
      console.error('Error marking bill as paid:', error);
      toast({
        title: 'Error',
        description: 'Failed to mark bill as paid. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDelete = async () => {
    setIsProcessing(true);
    try {
      await deleteBill(bill.id);
      setShowDeleteDialog(false);
      toast({
        title: 'Bill deleted',
        description: `${bill.name} has been removed.`,
      });
    } catch (error) {
      console.error('Error deleting bill:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete bill. Please try again.',
        variant: 'destructive',
      });
      setIsProcessing(false);
    }
  };

  return (
    <>
      <motion.div
        layout
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, x: -100 }}
        className={`rounded-xl border p-4 ${statusColor} transition-all`}
      >
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <h3 className="font-semibold text-lg mb-1">{bill.name}</h3>
            <p className="text-2xl font-bold">
              {formatCurrency(displayAmount, displayCurrency)}
            </p>
          </div>
          
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowEditDialog(true)}
              className="h-8 w-8"
              disabled={isProcessing}
            >
              <Edit size={16} />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowDeleteDialog(true)}
              className="h-8 w-8 text-destructive"
              disabled={isProcessing}
            >
              <Trash2 size={16} />
            </Button>
          </div>
        </div>

        <div className="space-y-2 text-sm mb-3">
          <div className="flex items-center gap-2">
            <Calendar size={16} className="text-muted-foreground" />
            <span>Due: {format(bill.nextDueDate, 'MMM dd, yyyy')}</span>
          </div>
          
          <div className="flex items-center gap-2">
            <Clock size={16} className="text-muted-foreground" />
            <span>Frequency: {bill.frequency}</span>
          </div>
          
          {bill.note && (
            <div className="flex items-center gap-2">
              <FileText size={16} className="text-muted-foreground" />
              <span className="line-clamp-1">{bill.note}</span>
            </div>
          )}
        </div>

        {status !== 'paid' && (
          <Button
            onClick={handleMarkAsPaid}
            size="sm"
            className="w-full"
            variant={status === 'overdue' ? 'destructive' : 'default'}
            disabled={isProcessing}
          >
            {isProcessing ? (
              <>
                <Loader2 size={16} className="mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <CheckCircle2 size={16} className="mr-2" />
                Mark as Paid
              </>
            )}
          </Button>
        )}

        {status === 'paid' && (
          <div className="flex items-center justify-center gap-2 text-green-500 py-2">
            <CheckCircle2 size={20} />
            <span className="font-medium">Paid</span>
          </div>
        )}
      </motion.div>

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Bill</DialogTitle>
            <DialogDescription>Update your bill details</DialogDescription>
          </DialogHeader>
          <BillForm
            bill={bill}
            onComplete={() => setShowEditDialog(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Bill</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{bill.name}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setShowDeleteDialog(false)}
              disabled={isProcessing}
            >
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDelete}
              disabled={isProcessing}
            >
              {isProcessing ? (
                <>
                  <Loader2 size={16} className="mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default BillCard;
