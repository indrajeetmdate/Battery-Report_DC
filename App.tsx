import React, { useState } from 'react';
import { ProductIdInput } from './components/ProductIdInput';
import { BatterySpecsForm } from './components/BatterySpecsForm';
import { Dashboard } from './components/Dashboard';
import { Button } from './components/Button';
import { WarrantyRegistrationForm } from './components/WarrantyRegistrationForm';
import { BookCheckupForm } from './components/BookCheckupForm';
import { parseExcelFile } from './services/excelService';
import { generatePDF } from './services/pdfService';
import { BatterySpecs, ProcessedData } from './types';
import { DEFAULT_SPECS, LOGO_URL } from './constants';
import { ChevronLeft, FileText, Settings, LayoutDashboard, Wrench } from 'lucide-react';
import { Routes, Route, Link, useNavigate, useLocation } from 'react-router-dom';

const App: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const mode = location.pathname === '/' ? 'home' : location.pathname.substring(1).split('/')[0];
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [loading, setLoading] = useState(false);
  const [specs, setSpecs] = useState<BatterySpecs>(DEFAULT_SPECS);
  const [data, setData] = useState<ProcessedData | null>(null);
  const [initialSearchTerm, setInitialSearchTerm] = useState('');

  const handleProductSearch = async (productId: string) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/fetch-report?productId=${encodeURIComponent(productId)}`);
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Product ID not found. Please check the ID and try again.');
        }
        throw new Error('Failed to retrieve report data.');
      }
      const blob = await response.blob();
      const parsedData = await parseExcelFile(blob, productId);
      setData(parsedData);
      setStep(2);
    } catch (error: any) {
      console.error('Error processing request:', error);
      alert(error.message || 'An error occurred while fetching the report.');
    } finally {
      setLoading(false);
    }
  };

  const handleGeneratePDF = async () => {
    if (!data) return;
    setLoading(true);
    setTimeout(async () => {
      try {
        await generatePDF(specs, data, ['chart-capacity', 'chart-voltage', 'chart-current', 'chart-temperature']);
      } catch (error) {
        console.error('PDF Generation failed:', error);
        alert('Failed to generate PDF. Please try again.');
      } finally {
        setLoading(false);
      }
    }, 500);
  };

  const goHome = () => {
    navigate('/');
    setStep(1);
    setData(null);
    setInitialSearchTerm('');
  };

  return (
    <div className="min-h-screen bg-[#F8F9F8] text-[#41463F] font-sans">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <button onClick={goHome} className="flex flex-shrink-0 items-center gap-3 hover:opacity-80 transition-opacity">
            <img src={LOGO_URL} alt="DC Energy" className="h-10 w-auto object-contain" />
            <div className="hidden lg:block h-6 w-px bg-gray-300 mx-2" />
            <h1 className="hidden lg:block text-xl font-semibold text-gray-700">Support</h1>
          </button>

          <div className="flex flex-1 items-center justify-end gap-6">
            {/* Top Navigation Links */}
            <nav className="hidden md:flex items-center gap-6">
              <Link 
                to="/warranty"
                onClick={() => setStep(1)}
                className={`text-sm font-semibold transition-colors ${mode === 'warranty' ? 'text-[#78AD3E]' : 'text-gray-500 hover:text-gray-900'}`}
              >
                Warranty Registration
              </Link>
              <Link 
                to="/report"
                onClick={() => setStep(1)}
                className={`text-sm font-semibold transition-colors ${mode === 'report' ? 'text-[#78AD3E]' : 'text-gray-500 hover:text-gray-900'}`}
              >
                Report Generation
              </Link>
              <Link 
                to="/booking"
                onClick={() => setStep(1)}
                className={`text-sm font-semibold transition-colors ${mode === 'booking' ? 'text-[#78AD3E]' : 'text-gray-500 hover:text-gray-900'}`}
              >
                Free Checkup
              </Link>
              <a 
                href="https://cnergy.co.in/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-semibold text-gray-500 hover:text-[#78AD3E] transition-colors"
              >
                DC Website
              </a>
            </nav>

          <div className="flex items-center gap-4">
            {mode === 'report' && step > 1 && (
              <div className="hidden sm:flex items-center gap-2 text-sm font-medium text-gray-500">
                <span className={`flex items-center gap-1 ${step === 2 ? 'text-[#78AD3E]' : ''}`}>
                  <Settings className="w-4 h-4" /> Specs
                </span>
                <span>&rarr;</span>
                <span className={`flex items-center gap-1 ${step === 3 ? 'text-[#78AD3E]' : ''}`}>
                  <LayoutDashboard className="w-4 h-4" /> Report
                </span>
              </div>
            )}
            
            {/* Mobile Menu Dropdown (Simplified to just modes) */}
            <div className="md:hidden flex gap-2">
               <select 
                 value={mode} 
                 onChange={(e) => { 
                   if (e.target.value === 'website') {
                     window.open('https://cnergy.co.in/', '_blank');
                     e.target.value = mode;
                     return;
                   }
                   navigate(`/${e.target.value === 'home' ? '' : e.target.value}`); 
                   setStep(1); 
                 }}
                 className="bg-gray-50 border border-gray-200 text-sm rounded-lg focus:ring-[#78AD3E] focus:border-[#78AD3E] block w-full p-2.5"
               >
                 <option value="home">Home</option>
                 <option value="warranty">Warranty Registration</option>
                 <option value="report">Report Generation</option>
                 <option value="booking">Free Checkup</option>
                 <option value="website">DC Website ↗</option>
               </select>
            </div>
          </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Routes>
          {/* ===== HOME MODE ===== */}
          <Route path="/" element={
            <div className="flex flex-col items-center justify-center min-h-[70vh] animate-fadeIn">
              {/* Hero */}
              <div className="text-center mb-14">
                <div className="inline-flex items-center gap-2 bg-green-50 border border-green-200 text-[#78AD3E] text-sm font-semibold px-4 py-1.5 rounded-full mb-6 uppercase">
                  DC Energy Support
                </div>
                <h2 className="text-4xl md:text-5xl font-bold text-[#41463F] mb-4 leading-tight max-w-3xl mx-auto">
                  Limited time offer: Free checkup for your Inverters and Batteries.
                </h2>
                <p className="text-gray-500 text-lg max-w-xl mx-auto">
                  Register your product warranty or access your battery test reports.
                </p>
              </div>

              {/* Single Action Card on Home */}
              <div className="flex justify-center w-full max-w-lg px-4">
                {/* Free Checkup Card */}
                <button
                  onClick={() => navigate('/booking')}
                  className="group bg-white rounded-3xl p-8 border-2 border-gray-200 shadow-md hover:shadow-xl hover:border-[#1A1C19] hover:-translate-y-1 transition-all duration-300 text-left relative overflow-hidden"
                >
                  <div className="absolute top-0 right-0 p-3 bg-[#78AD3E] text-white text-xs font-bold tracking-wider uppercase rounded-bl-3xl shadow-sm">
                    Free
                  </div>
                  <div className="w-14 h-14 bg-gray-100 group-hover:bg-[#1A1C19] border-2 border-transparent group-hover:border-[#78AD3E] rounded-full flex items-center justify-center mb-5 transition-all duration-300">
                    <Wrench className="w-7 h-7 text-gray-500 group-hover:text-[#78AD3E] transition-colors duration-300" />
                  </div>
                  <h3 className="text-xl font-bold text-[#1A1C19] mb-2 uppercase tracking-tight">Book Checkup</h3>
                  <p className="text-gray-500 text-sm leading-relaxed">
                    Schedule a complimentary diagnostic checkup for your DC Energy inverter and battery units.
                  </p>
                  <div className="mt-5 flex items-center gap-1 text-[#1A1C19] group-hover:text-[#78AD3E] text-sm font-bold uppercase tracking-wider transition-colors">
                    Request Slot <ChevronLeft className="w-4 h-4 rotate-180" />
                  </div>
                </button>
              </div>
            </div>
          } />

          {/* ===== WARRANTY MODE ===== */}
          <Route path="/warranty" element={
            <div className="flex flex-col items-center pt-6 animate-fadeIn">
              <WarrantyRegistrationForm 
                onNoReportFound={(serial) => {
                  setInitialSearchTerm(serial);
                  navigate('/report');
                  setStep(1);
                }}
              />
            </div>
          } />

          {/* ===== BOOKING MODE ===== */}
          <Route path="/booking" element={
            <div className="flex flex-col items-center pt-6 animate-fadeIn">
              <BookCheckupForm />
            </div>
          } />

          {/* ===== REPORT MODE ===== */}
          <Route path="/report" element={
            <>
              {/* Step 1: Product Search */}
              {step === 1 && (
              <div className="flex flex-col items-center justify-center min-h-[60vh] animate-fadeIn">
                <div className="text-center mb-10">
                  <h2 className="text-3xl font-bold text-[#41463F] mb-3">Battery Report Generator</h2>
                  <p className="text-gray-500 max-w-lg mx-auto">
                    Enter your Product ID to retrieve official test data and generate your certification report.
                  </p>
                </div>
                <ProductIdInput 
                  initialValue={initialSearchTerm}
                  onSearch={handleProductSearch} 
                  isLoading={loading} 
                />
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
                    <p className="text-sm text-gray-500">
                      Product ID: <span className="font-medium text-gray-800">{data.fileName}</span>
                    </p>
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
                    <Button variant="outline" onClick={() => setStep(1)} className="rounded-full border-2 border-[#1A1C19] text-[#1A1C19] font-bold uppercase tracking-wider">
                      Search Another ID
                    </Button>
                    <Button
                      onClick={handleGeneratePDF}
                      disabled={loading}
                      className="flex items-center gap-2 rounded-full font-bold uppercase tracking-wider border-2 border-[#78AD3E] bg-[#78AD3E] hover:bg-[#1A1C19] hover:border-[#1A1C19] shadow-md transition-all text-white"
                    >
                      {loading ? (
                        'Generating...'
                      ) : (
                        <>
                          <FileText className="w-5 h-5" /> Download PDF Report
                        </>
                      )}
                    </Button>
                  </div>
                </div>
                <Dashboard data={data} />
              </div>
            )}
            </>
          } />
        </Routes>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-12">
        <div className="max-w-7xl mx-auto px-4 py-6 flex flex-col md:flex-row justify-between items-center text-sm text-gray-500">
          <p className="mx-auto md:mx-0">&copy; {new Date().getFullYear()} DC Energy. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default App;