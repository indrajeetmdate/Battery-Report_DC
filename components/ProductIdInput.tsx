import React, { useState } from 'react';
import { Search, Loader2 } from 'lucide-react';
import { Button } from './Button';

interface ProductIdInputProps {
  onSearch: (id: string) => void;
  isLoading: boolean;
  initialValue?: string;
}

export const ProductIdInput: React.FC<ProductIdInputProps> = ({ onSearch, isLoading, initialValue = '' }) => {
  const [productId, setProductId] = useState(initialValue);

  React.useEffect(() => {
    if (initialValue) {
      setProductId(initialValue);
    }
  }, [initialValue]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (productId.trim()) {
      onSearch(productId.trim());
    }
  };

  return (
    <div className="w-full max-w-lg mx-auto bg-white p-8 rounded-xl shadow-lg border border-gray-100">
        <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-[#41463F] mb-2">Battery Test Search</h2>
            <p className="text-gray-500">Enter the Product ID to retrieve the test report.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label htmlFor="productId" className="block text-sm font-medium text-gray-700 mb-1">
                    Product ID / Serial Number
                </label>
                <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Search className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                        type="text"
                        id="productId"
                        className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-[#78AD3E] focus:border-[#78AD3E] transition-colors"
                        placeholder="e.g. BATT-2023-001"
                        value={productId}
                        onChange={(e) => setProductId(e.target.value)}
                        disabled={isLoading}
                        autoFocus
                    />
                </div>
            </div>

            <Button 
                type="submit" 
                fullWidth 
                className="py-3 text-lg flex justify-center items-center gap-2"
                disabled={!productId.trim() || isLoading}
            >
                {isLoading ? (
                    <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Searching Database...
                    </>
                ) : (
                    'Generate Report'
                )}
            </Button>
        </form>
        
        <div className="mt-6 pt-6 border-t border-gray-100 text-center text-xs text-gray-400">
            Secure connection to DC Energy Database
        </div>
    </div>
  );
};