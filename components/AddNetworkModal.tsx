"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { useWorkflowStore, Network } from '@/store/workflowStore';
import { toast } from 'react-toastify';

interface AddNetworkModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AddNetworkModal({ isOpen, onClose }: AddNetworkModalProps) {
  const { addCustomNetwork } = useWorkflowStore();
  const [formData, setFormData] = useState({
    name: '',
    rpcUrl: '',
    chainId: '',
    symbol: '',
    explorer: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.name || !formData.rpcUrl || !formData.chainId || !formData.symbol) {
      toast.error('Please fill in all required fields');
      return;
    }

    const chainIdNum = parseInt(formData.chainId);
    if (isNaN(chainIdNum)) {
      toast.error('Chain ID must be a number');
      return;
    }

    const newNetwork: Network = {
      id: `custom-${Date.now()}`,
      name: formData.name,
      rpcUrl: formData.rpcUrl,
      chainId: chainIdNum,
      symbol: formData.symbol,
      explorer: formData.explorer || undefined,
    };

    addCustomNetwork(newNetwork);
    toast.success(`Network "${formData.name}" added successfully!`);

    // Reset form
    setFormData({
      name: '',
      rpcUrl: '',
      chainId: '',
      symbol: '',
      explorer: '',
    });

    onClose();
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
          >
            {/* Modal */}
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-lg shadow-xl max-w-md w-full p-6"
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-800">
                  Add Custom Network
                </h2>
                <button
                  onClick={onClose}
                  className="p-1 hover:bg-gray-100 rounded transition-colors"
                >
                  <X className="w-5 h-5 text-gray-600" />
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Network Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="e.g., My Custom Network"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    RPC URL <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="url"
                    name="rpcUrl"
                    value={formData.rpcUrl}
                    onChange={handleChange}
                    placeholder="https://rpc.example.com"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Chain ID <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    name="chainId"
                    value={formData.chainId}
                    onChange={handleChange}
                    placeholder="1234"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Currency Symbol <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="symbol"
                    value={formData.symbol}
                    onChange={handleChange}
                    placeholder="ETH"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Block Explorer URL (optional)
                  </label>
                  <input
                    type="url"
                    name="explorer"
                    value={formData.explorer}
                    onChange={handleChange}
                    placeholder="https://explorer.example.com"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary focus:border-transparent"
                  />
                </div>

                {/* Buttons */}
                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={onClose}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-primary text-white rounded-lg hover:bg-opacity-90 transition-colors font-medium"
                  >
                    Add Network
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
