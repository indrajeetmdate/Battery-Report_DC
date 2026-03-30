import React, { useState } from 'react';
import { registerWarranty, WarrantyRegistration } from '../services/supabaseService';
import { Shield, CheckCircle, AlertCircle, Loader2, FileText, ExternalLink } from 'lucide-react';

type FormState = 'idle' | 'loading' | 'success' | 'error' | 'duplicate';

const inputClass =
  'w-full px-6 py-3.5 bg-gray-50 border-2 border-gray-200 focus:outline-none focus:border-[#78AD3E] text-[#1A1C19] font-medium transition-colors placeholder-gray-400 font-sans rounded-full';

const labelClass = 'block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2 ml-4';

interface WarrantyRegistrationFormProps {
  onNoReportFound: (serialNumber: string) => void;
}

export const WarrantyRegistrationForm: React.FC<WarrantyRegistrationFormProps> = ({ onNoReportFound }) => {
  const [formData, setFormData] = useState<WarrantyRegistration>({
    serial_number: '',
    customer_name: '',
    phone_number: '',
    email: '',
    invoice_number: '',
  });
  const [formState, setFormState] = useState<FormState>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [pdfReportLink, setPdfReportLink] = useState<{ url: string; name: string } | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormState('loading');
    setErrorMessage('');

    try {
      await registerWarranty(formData);
      setFormState('success');

      // After successful registration, check for an existing PDF report in Google Drive
      try {
        const response = await fetch(`/api/check-pdf?serialNumber=${encodeURIComponent(formData.serial_number)}`);
        if (response.ok) {
          const result = await response.json();
          if (result.exists) {
            setPdfReportLink({ url: result.webViewLink, name: result.name });
            return;
          }
        }
        
        // If we get here, either response was not ok, or PDF does not exist in Drive
        onNoReportFound(formData.serial_number);
        return;
        
      } catch (pdfErr) {
        console.warn('Failed to check for PDF report:', pdfErr);
        // Fallback to report generator
        onNoReportFound(formData.serial_number);
        return;
      }
    } catch (err: any) {
      if (err.message === 'ALREADY_REGISTERED') {
        setFormState('duplicate');
      } else {
        setFormState('error');
        setErrorMessage(err.message || 'An unexpected error occurred.');
      }
    }
  };

  const handleReset = () => {
    setFormData({ serial_number: '', customer_name: '', phone_number: '', email: '', invoice_number: '' });
    setFormState('idle');
    setErrorMessage('');
    setPdfReportLink(null);
  };

  if (formState === 'success') {
    return (
      <div className="w-full max-w-xl mx-auto animate-fadeIn mt-8">
        <div className="border-4 border-[#78AD3E] bg-white p-10 flex flex-col items-center justify-center text-center shadow-[8px_8px_0_0_#78AD3E] rounded-3xl">
          <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mb-6 border-2 border-[#78AD3E]">
            <CheckCircle className="w-10 h-10 text-[#78AD3E]" />
          </div>
          <h2 className="text-3xl font-black text-[#1A1C19] mb-4 uppercase tracking-tight">Warranty<br/>Registered!</h2>
          <p className="text-gray-600 font-medium mb-2 max-w-sm">
            Your product has been successfully registered.
          </p>
          <p className="text-sm font-bold text-gray-400 mb-8 uppercase tracking-wider">
            Serial: <span className="text-[#1A1C19]">{formData.serial_number}</span>
          </p>

          {pdfReportLink && (
            <div className="bg-[#78AD3E]/10 border-2 border-[#78AD3E] rounded-3xl p-6 mb-8 max-w-sm w-full animate-bounceIn">
              <div className="flex items-center gap-3 mb-3 justify-center">
                <FileText className="w-5 h-5 text-[#1A1C19]" />
                <h3 className="font-bold text-[#1A1C19] uppercase">Test Report Found!</h3>
              </div>
              <p className="text-sm font-medium text-gray-600 mb-6">An official test report for this product is available.</p>
              <a
                href={pdfReportLink.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 px-6 py-3.5 bg-white border-2 border-[#1A1C19] text-[#1A1C19] font-bold uppercase tracking-wider rounded-full hover:bg-[#1A1C19] hover:text-white transition-all shadow-sm"
              >
                <ExternalLink className="w-4 h-4" /> View PDF Report
              </a>
            </div>
          )}
          <button
            onClick={handleReset}
            className="w-full sm:w-auto px-8 py-4 bg-[#1A1C19] text-white font-bold uppercase tracking-widest hover:bg-[#78AD3E] transition-colors border-2 border-transparent focus:outline-none rounded-full"
          >
            Register Another
          </button>
        </div>
      </div>
    );
  }

  if (formState === 'duplicate') {
    return (
      <div className="w-full max-w-xl mx-auto animate-fadeIn mt-8">
        <div className="border-4 border-amber-400 bg-white p-10 flex flex-col items-center justify-center text-center shadow-[8px_8px_0_0_#fbbf24] rounded-3xl">
          <div className="w-20 h-20 bg-amber-50 rounded-full flex items-center justify-center mb-6 border-2 border-amber-400">
            <AlertCircle className="w-10 h-10 text-amber-500" />
          </div>
          <h2 className="text-3xl font-black text-[#1A1C19] mb-4 uppercase tracking-tight">Already<br/>Registered</h2>
          <p className="text-gray-600 font-medium mb-2 max-w-sm">
            This serial number is already registered for warranty.
          </p>
          <p className="text-sm font-bold text-gray-400 mb-8 uppercase tracking-wider">
            Serial: <span className="text-[#1A1C19]">{formData.serial_number}</span>
          </p>
          <button
            onClick={handleReset}
            className="w-full sm:w-auto px-8 py-4 bg-[#1A1C19] text-white font-bold uppercase tracking-widest hover:bg-amber-500 transition-colors border-2 border-transparent focus:outline-none rounded-full"
          >
            Try a Different Serial
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-2xl mx-auto animate-fadeIn">
      {/* Eco-Utilitarian Header block */}
      <div className="mb-8 pl-2">
        <h2 className="text-4xl md:text-5xl font-black text-[#1A1C19] uppercase tracking-tighter leading-none mb-3">
          Warranty<br/>
          <span className="text-[#78AD3E]">Registration</span>
        </h2>
        <p className="text-gray-500 font-medium max-w-md">
          Register your DC Energy product to ensure official support and tracking.
        </p>
      </div>

      {/* Card */}
      <div className="bg-white border-2 border-gray-200 shadow-[8px_8px_0_0_#1A1C19] rounded-3xl overflow-hidden p-8">
        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className={labelClass} htmlFor="serial_number">
              Serial Number <span className="text-red-400">*</span>
            </label>
            <input
              id="serial_number"
              name="serial_number"
              type="text"
              placeholder="e.g. DCE-2024-XXXXX"
              value={formData.serial_number}
              onChange={handleChange}
              required
              className={inputClass}
            />
          </div>

          <div>
            <label className={labelClass} htmlFor="invoice_number">
              Invoice Number <span className="text-red-400">*</span>
            </label>
            <input
              id="invoice_number"
              name="invoice_number"
              type="text"
              placeholder="e.g. INV-2024-001"
              value={formData.invoice_number}
              onChange={handleChange}
              required
              className={inputClass}
            />
          </div>

          <div>
            <label className={labelClass} htmlFor="customer_name">
              Full Name <span className="text-red-400">*</span>
            </label>
            <input
              id="customer_name"
              name="customer_name"
              type="text"
              placeholder="Your full name"
              value={formData.customer_name}
              onChange={handleChange}
              required
              className={inputClass}
            />
          </div>

          <div>
            <label className={labelClass} htmlFor="phone_number">
              Phone Number <span className="text-red-400">*</span>
            </label>
            <input
              id="phone_number"
              name="phone_number"
              type="tel"
              placeholder="+91 XXXXX XXXXX"
              value={formData.phone_number}
              onChange={handleChange}
              required
              className={inputClass}
            />
          </div>

          <div>
            <label className={labelClass} htmlFor="email">
              Email Address <span className="text-red-400">*</span>
            </label>
            <input
              id="email"
              name="email"
              type="email"
              placeholder="you@example.com"
              value={formData.email}
              onChange={handleChange}
              required
              className={inputClass}
            />
          </div>

          {formState === 'error' && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{errorMessage || 'Registration failed. Please try again.'}</span>
            </div>
          )}

          <div className="pt-2">
            <button
              type="submit"
              disabled={formState === 'loading'}
              className="w-full py-5 bg-[#78AD3E] text-white font-black text-lg uppercase tracking-widest border-2 border-[#78AD3E] hover:bg-[#1A1C19] hover:border-[#1A1C19] transition-all disabled:opacity-50 flex items-center justify-center gap-2 rounded-full"
            >
              {formState === 'loading' ? (
                <>
                  <Loader2 className="w-6 h-6 animate-spin" /> Processing...
                </>
              ) : (
                <>
                  <Shield className="w-6 h-6" /> REGISTER
                </>
              )}
            </button>
          </div>

          <p className="text-xs text-center text-gray-400 pt-1">
            By registering, you confirm you are the product owner. Warranty terms apply.
          </p>
        </form>
      </div>
    </div>
  );
};
