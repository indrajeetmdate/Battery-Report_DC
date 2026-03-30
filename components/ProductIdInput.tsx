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
    <div className="w-full max-w-2xl mx-auto animate-fadeIn">
        <div className="mb-8 pl-2">
            <h2 className="text-4xl md:text-5xl font-black text-[#1A1C19] uppercase tracking-tighter leading-none mb-3">
              Report<br/>
              <span className="text-[#78AD3E]">Search</span>
            </h2>
            <p className="text-gray-500 font-medium max-w-md">
              Enter your Product ID or Serial Number to retrieve the official certified test report.
            </p>
        </div>

      <div className="bg-white border-2 border-gray-200 shadow-[8px_8px_0_0_#1A1C19] rounded-3xl p-8">
        <form onSubmit={handleSubmit} className="space-y-6">
            <div>
                <label htmlFor="productId" className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2 ml-4">
                    Product ID / Serial Number
                </label>
                <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-6 flex items-center pointer-events-none">
                        <Search className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                        type="text"
                        id="productId"
                        className="w-full px-6 py-4 pl-14 bg-gray-50 border-2 border-gray-200 focus:outline-none focus:border-[#78AD3E] text-[#1A1C19] font-medium transition-colors placeholder-gray-400 font-sans rounded-full"
                        placeholder="e.g. DCE-2024-XXXXX"
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
                className="py-4 text-lg flex justify-center items-center gap-2 rounded-full mt-2"
                disabled={!productId.trim() || isLoading}
            >
                {isLoading ? (
                    <>
                        <Loader2 className="w-6 h-6 animate-spin" />
                        SEARCHING DATABASE...
                    </>
                ) : (
                    'GENERATE REPORT'
                )}
            </Button>
        </form>
        
        <div className="mt-6 pt-4 text-center text-xs font-bold tracking-wider text-gray-400 uppercase">
            SECURE CONNECTION TO DC ENERGY LABS
        </div>
      </div>
    </div>
  );
};