import React, { useState } from 'react';
import { Bill, useBills } from '@/contexts/BillContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { frequencyOptions } from '@/utils/billUtils';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

interface BillFormProps {
  bill?: Bill;
  onComplete: () => void;
}

const BillForm: React.FC<BillFormProps> = ({ bill, onComplete }) => {
  const { addBill, updateBill } = useBills();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    name: bill?.name || '',
    amount: bill?.amount.toString() || '',
    frequency: bill?.frequency || 'monthly',
    nextDueDate: bill?.nextDueDate ? new Date(bill.nextDueDate).toISOString().split('T')[0] : '',
    notificationTime: bill?.notificationTime || '09:00',
    note: bill?.note || '',
    autoMarkPaid: bill?.autoMarkPaid || false,
    notifyUntilPaid: bill?.notifyUntilPaid !== undefined ? bill.notifyUntilPaid : true,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.amount || !formData.nextDueDate) {
      toast({
        title: 'Missing fields',
        description: 'Please fill in all required fields.',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const billData = {
        name: formData.name,
        amount: parseFloat(formData.amount),
        frequency: formData.frequency as Bill['frequency'],
        nextDueDate: new Date(formData.nextDueDate),
        notificationTime: formData.notificationTime,
        note: formData.note,
        autoMarkPaid: formData.autoMarkPaid,
        notifyUntilPaid: formData.notifyUntilPaid,
        isPaid: bill?.isPaid || false,
      };

      if (bill) {
        console.log('Updating bill:', bill.id);
        await updateBill(bill.id, billData);
        toast({
          title: 'Bill updated',
          description: 'Your bill has been updated successfully.',
        });
      } else {
        console.log('Adding new bill');
        await addBill(billData);
        toast({
          title: 'Bill added',
          description: 'Your bill has been added successfully.',
        });
      }

      onComplete();
    } catch (error) {
      console.error('Error saving bill:', error);
      toast({
        title: 'Error',
        description: 'Failed to save bill. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (field: string, value: any) => {
    setFormData({ ...formData, [field]: value });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="name">Bill Name *</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => handleChange('name', e.target.value)}
          placeholder="e.g., Netflix Subscription"
          required
          disabled={isSubmitting}
        />
      </div>

      <div>
        <Label htmlFor="amount">Amount *</Label>
        <Input
          id="amount"
          type="number"
          step="0.01"
          value={formData.amount}
          onChange={(e) => handleChange('amount', e.target.value)}
          placeholder="0.00"
          required
          disabled={isSubmitting}
        />
      </div>

      <div>
        <Label htmlFor="frequency">Frequency *</Label>
        <Select 
          value={formData.frequency} 
          onValueChange={(value) => handleChange('frequency', value)}
          disabled={isSubmitting}
        >
          <SelectTrigger id="frequency">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {frequencyOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="nextDueDate">Next Due Date *</Label>
        <Input
          id="nextDueDate"
          type="date"
          value={formData.nextDueDate}
          onChange={(e) => handleChange('nextDueDate', e.target.value)}
          required
          disabled={isSubmitting}
        />
      </div>

      <div>
        <Label htmlFor="notificationTime">Notification Time</Label>
        <Input
          id="notificationTime"
          type="time"
          value={formData.notificationTime}
          onChange={(e) => handleChange('notificationTime', e.target.value)}
          disabled={isSubmitting}
        />
      </div>

      <div>
        <Label htmlFor="note">Note</Label>
        <Textarea
          id="note"
          value={formData.note}
          onChange={(e) => handleChange('note', e.target.value)}
          placeholder="Add any additional notes..."
          rows={3}
          disabled={isSubmitting}
        />
      </div>

      <div className="space-y-4 pt-2">
        <div className="flex items-center justify-between">
          <div>
            <Label htmlFor="autoMarkPaid">Auto-mark as paid</Label>
            <p className="text-sm text-muted-foreground">Mark as paid automatically after due date</p>
          </div>
          <Switch
            id="autoMarkPaid"
            checked={formData.autoMarkPaid}
            onCheckedChange={(checked) => handleChange('autoMarkPaid', checked)}
            disabled={isSubmitting}
          />
        </div>

        <div className="flex items-center justify-between">
          <div>
            <Label htmlFor="notifyUntilPaid">Notify until paid</Label>
            <p className="text-sm text-muted-foreground">Send daily reminders until marked as paid</p>
          </div>
          <Switch
            id="notifyUntilPaid"
            checked={formData.notifyUntilPaid}
            onCheckedChange={(checked) => handleChange('notifyUntilPaid', checked)}
            disabled={isSubmitting}
          />
        </div>
      </div>

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? (
          <>
            <Loader2 size={16} className="mr-2 animate-spin" />
            {bill ? 'Updating...' : 'Adding...'}
          </>
        ) : (
          bill ? 'Update Bill' : 'Add Bill'
        )}
      </Button>
    </form>
  );
};

export default BillForm;
