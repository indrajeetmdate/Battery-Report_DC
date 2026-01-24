import React, { useState } from 'react';
import { ProductIdInput } from './components/ProductIdInput';
import { BatterySpecsForm } from './components/BatterySpecsForm';
import { Dashboard } from './components/Dashboard';
import { Button } from './components/Button';
import { parseExcelFile } from './services/excelService';
import { generatePDF } from './services/pdfService';
import { BatterySpecs, ProcessedData } from './types';
import { DEFAULT_SPECS, LOGO_URL } from './constants';
import { ChevronLeft, FileText, Settings, LayoutDashboard } from 'lucide-react';

const App: React.FC = () => {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [loading, setLoading] = useState(false);
  const [specs, setSpecs] = useState<BatterySpecs>(DEFAULT_SPECS);
  const [data, setData] = useState<ProcessedData | null>(null);

  const handleProductSearch = async (productId: string) => {
    setLoading(true);
    try {
      // Fetch the file from the backend API which interfaces with Google Drive
      const response = await fetch(`/api/fetch-report?productId=${encodeURIComponent(productId)}`);
      
      if (!response.ok) {
        if (response.status === 404) {
             throw new Error("Product ID not found. Please check the ID and try again.");
        }
        throw new Error("Failed to retrieve report data.");
      }

      const blob = await response.blob();
      
      // Parse the downloaded blob using the existing Excel service
      // Pass the productId as the filename override since blobs don't have names
      const parsedData = await parseExcelFile(blob, productId);
      
      setData(parsedData);
      setStep(2);
    } catch (error: any) {
      console.error("Error processing request:", error);
      alert(error.message || "An error occurred while fetching the report.");
    } finally {
      setLoading(false);
    }
  };

  const handleGeneratePDF = async () => {
    if (!data) return;
    setLoading(true);
    // Slight delay to ensure charts are rendered and fonts loaded if this was a fresh load
    setTimeout(async () => {
        try {
            await generatePDF(specs, data, ['chart-capacity', 'chart-voltage', 'chart-current', 'chart-temperature']);
        } catch (error) {
            console.error("PDF Generation failed:", error);
            alert("Failed to generate PDF. Please try again.");
        } finally {
            setLoading(false);
        }
    }, 500);
  };

  return (
    <div className="min-h-screen bg-[#F8F9F8] text-[#41463F] font-sans">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
             <img src={LOGO_URL} alt="DC Energy" className="h-10 w-auto object-contain" />
             <div className="hidden md:block h-6 w-px bg-gray-300 mx-2"></div>
             <h1 className="hidden md:block text-xl font-semibold text-gray-700">Owner's Dashboard</h1>
          </div>
          <div className="flex items-center gap-4">
             {step > 1 && (
                 <div className="flex items-center gap-2 text-sm font-medium text-gray-500">
                     <span className={`flex items-center gap-1 ${step === 2 ? 'text-[#78AD3E]' : ''}`}>
                         <Settings className="w-4 h-4" /> Specs
                     </span>
                     <span>&rarr;</span>
                     <span className={`flex items-center gap-1 ${step === 3 ? 'text-[#78AD3E]' : ''}`}>
                         <LayoutDashboard className="w-4 h-4" /> Report
                     </span>
                 </div>
             )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Step 1: Product Search */}
        {step === 1 && (
          <div className="flex flex-col items-center justify-center min-h-[60vh]">
            <div className="text-center mb-10 animate-fadeIn">
                <h2 className="text-3xl font-bold text-[#41463F] mb-3">Welcome to DC Energy Reports</h2>
                <p className="text-gray-500 max-w-lg mx-auto">
                    Enter your Product ID to retrieve official test data and generate your certification report.
                </p>
            </div>
            <ProductIdInput onSearch={handleProductSearch} isLoading={loading} />
          </div>
        )}

        {/* Step 2: Configure Specs */}
        {step === 2 && data && (
          <div className="max-w-4xl mx-auto animate-fadeIn">
             <div className="flex items-center justify-between mb-6">
                <button 
                    onClick={() => setStep(1)} 
                    className="flex items-center text-gray-500 hover:text-[#78AD3E] transition-colors"
                >
                    <ChevronLeft className="w-5 h-5 mr-1" /> Back to Search
                </button>
                <div className="text-right">
                    <p className="text-sm text-gray-500">Product ID: <span className="font-medium text-gray-800">{data.fileName}</span></p>
                </div>
             </div>

             <BatterySpecsForm specs={specs} onChange={setSpecs} />

             <div className="mt-8 flex justify-end">
                <Button onClick={() => setStep(3)} className="flex items-center gap-2 px-8 py-3 text-lg">
                    Generate Report Preview &rarr;
                </Button>
             </div>
          </div>
        )}

        {/* Step 3: Dashboard & Download */}
        {step === 3 && data && (
           <div className="animate-fadeIn">
              <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
                  <button 
                        onClick={() => setStep(2)} 
                        className="flex items-center text-gray-500 hover:text-[#78AD3E] transition-colors"
                    >
                        <ChevronLeft className="w-5 h-5 mr-1" /> Edit Specifications
                    </button>
                  <div className="flex items-center gap-3">
                      <Button variant="outline" onClick={() => setStep(1)}>
                          Search Another ID
                      </Button>
                      <Button onClick={handleGeneratePDF} disabled={loading} className="flex items-center gap-2 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all">
                          {loading ? 'Generating...' : (
                              <>
                                <FileText className="w-5 h-5" /> Download PDF Report
                              </>
                          )}
                      </Button>
                  </div>
              </div>

              {/* Visualization Container */}
              <Dashboard data={data} />
           </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-12">
          <div className="max-w-7xl mx-auto px-4 py-6 flex flex-col md:flex-row justify-between items-center text-sm text-gray-500">
              <p>&copy; {new Date().getFullYear()} DC Energy. All rights reserved.</p>
              <div className="flex items-center gap-2 mt-2 md:mt-0">
                  <span className="w-2 h-2 rounded-full bg-[#78AD3E]"></span>
                  System Operational
              </div>
          </div>
      </footer>
    </div>
  );
};

export default App;