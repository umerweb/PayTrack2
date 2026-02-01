import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import BottomNav from '@/components/BottomNav';
import BillForm from '@/components/BillForm';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

const NewBill = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="sticky top-0 z-40 bg-card/80 backdrop-blur-lg border-b border-border">
          <div className="px-6 py-4">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate('/dashboard')}
              >
                <ArrowLeft size={20} />
              </Button>
              <h1 className="text-2xl font-bold">Add New Bill</h1>
            </div>
          </div>
        </div>

        {/* Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="px-6 py-6"
        >
          <div className="bg-card rounded-xl border p-6">
            <BillForm onComplete={() => navigate('/dashboard')} />
          </div>
        </motion.div>
      </div>

      <BottomNav />
    </div>
  );
};

export default NewBill;
