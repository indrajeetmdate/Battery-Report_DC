import React, { useState } from 'react';
import { registerWarranty, WarrantyRegistration } from '../services/supabaseService';
import { Shield, CheckCircle, AlertCircle, Loader2, FileText, ExternalLink } from 'lucide-react';

type FormState = 'idle' | 'loading' | 'success' | 'error' | 'duplicate';

const inputClass =
  'w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#78AD3E] focus:border-transparent bg-white text-[#41463F] placeholder-gray-400 transition-all duration-200';

const labelClass = 'block text-sm font-semibold text-[#41463F] mb-1.5';

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
      <div className="flex flex-col items-center justify-center text-center py-16 px-6 animate-fadeIn">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-6">
          <CheckCircle className="w-10 h-10 text-[#78AD3E]" />
        </div>
        <h2 className="text-2xl font-bold text-[#41463F] mb-2">Warranty Registered!</h2>
        <p className="text-gray-500 max-w-md mb-2">
          Your product has been successfully registered.
        </p>
        <p className="text-sm text-gray-400 mb-8">
          Serial: <span className="font-medium text-[#41463F]">{formData.serial_number}</span>
        </p>

        {pdfReportLink && (
          <div className="bg-[#78AD3E]/10 border border-[#78AD3E]/20 rounded-2xl p-6 mb-8 max-w-sm w-full animate-bounceIn">
            <div className="flex items-center gap-3 mb-3 justify-center">
              <FileText className="w-5 h-5 text-[#78AD3E]" />
              <h3 className="font-bold text-[#41463F]">Test Report Found!</h3>
            </div>
            <p className="text-xs text-gray-500 mb-4">An official test report for this product is available.</p>
            <a
              href={pdfReportLink.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-[#78AD3E] text-[#78AD3E] font-bold rounded-xl hover:bg-[#78AD3E] hover:text-white transition-all shadow-sm"
            >
              <ExternalLink className="w-4 h-4" /> View PDF Report
            </a>
          </div>
        )}
        <button
          onClick={handleReset}
          className="px-6 py-2.5 rounded-xl bg-[#78AD3E] text-white font-semibold hover:bg-[#6a9836] transition-colors"
        >
          Register Another Product
        </button>
      </div>
    );
  }

  if (formState === 'duplicate') {
    return (
      <div className="flex flex-col items-center justify-center text-center py-16 px-6 animate-fadeIn">
        <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mb-6">
          <AlertCircle className="w-10 h-10 text-amber-500" />
        </div>
        <h2 className="text-2xl font-bold text-[#41463F] mb-2">Already Registered</h2>
        <p className="text-gray-500 max-w-md mb-2">
          This serial number is already registered for warranty.
        </p>
        <p className="text-sm text-gray-400 mb-8">
          Serial: <span className="font-medium text-[#41463F]">{formData.serial_number}</span>
        </p>
        <button
          onClick={handleReset}
          className="px-6 py-2.5 rounded-xl bg-[#78AD3E] text-white font-semibold hover:bg-[#6a9836] transition-colors"
        >
          Try a Different Serial
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto w-full animate-fadeIn">
      {/* Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {/* Card Header */}
        <div className="bg-gradient-to-r from-[#78AD3E] to-[#5d8a2e] px-8 py-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Warranty Registration</h2>
              <p className="text-green-100 text-sm">Register your DC Energy product</p>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-8 py-7 space-y-5">
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

          <button
            type="submit"
            disabled={formState === 'loading'}
            className="w-full py-3.5 bg-[#78AD3E] hover:bg-[#6a9836] disabled:bg-gray-300 text-white font-bold rounded-xl transition-all duration-200 flex items-center justify-center gap-2 shadow-md hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0"
          >
            {formState === 'loading' ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Registering...
              </>
            ) : (
              <>
                <Shield className="w-5 h-5" />
                Register Warranty
              </>
            )}
          </button>

          <p className="text-xs text-center text-gray-400 pt-1">
            By registering, you confirm you are the product owner. Warranty terms apply.
          </p>
        </form>
      </div>
    </div>
  );
};
