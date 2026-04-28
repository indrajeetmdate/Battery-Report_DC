import React, { useState } from 'react';
import { registerWarranty, WarrantyRegistration } from '../services/supabaseService';
import { Shield, CheckCircle, AlertCircle, Loader2, Mail } from 'lucide-react';

type FormState = 'idle' | 'loading' | 'success' | 'error';

const inputClass =
  'w-full px-6 py-3.5 bg-gray-50 border-2 border-gray-200 focus:outline-none focus:border-[#78AD3E] text-[#1A1C19] font-medium transition-colors placeholder-gray-400 font-sans rounded-full';

const labelClass = 'block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2 ml-4';

export const WarrantyRegistrationForm: React.FC = () => {
  const [formData, setFormData] = useState<WarrantyRegistration>({
    customer_name: '',
    phone_number: '',
    email: '',
    invoice_number: '',
  });
  const [formState, setFormState] = useState<FormState>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormState('loading');
    setErrorMessage('');

    try {
      await registerWarranty(formData);

      // Send confirmation email (fire-and-forget, don't block on it)
      try {
        await fetch('/api/send-warranty-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            customer_name: formData.customer_name.trim(),
            customer_email: formData.email.trim(),
          }),
        });
      } catch (emailErr) {
        console.warn('Email notification failed (non-critical):', emailErr);
      }

      setFormState('success');
    } catch (err: any) {
      setFormState('error');
      setErrorMessage(err.message || 'An unexpected error occurred.');
    }
  };

  const handleReset = () => {
    setFormData({ customer_name: '', phone_number: '', email: '', invoice_number: '' });
    setFormState('idle');
    setErrorMessage('');
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
            Your product has been successfully registered under <span className="font-bold text-[#1A1C19]">{formData.customer_name}</span>.
          </p>

          <div className="bg-[#78AD3E]/10 border-2 border-[#78AD3E] rounded-3xl p-6 mb-8 max-w-sm w-full mt-4">
            <div className="flex items-center gap-3 mb-3 justify-center">
              <Mail className="w-5 h-5 text-[#1A1C19]" />
              <h3 className="font-bold text-[#1A1C19] uppercase text-sm">Confirmation Sent</h3>
            </div>
            <p className="text-sm font-medium text-gray-600 mb-2">
              A confirmation email has been sent to <span className="font-bold text-[#1A1C19]">{formData.email}</span>.
            </p>
            <p className="text-xs text-gray-400 font-medium">
              Please keep your purchase invoice safe — it serves as your warranty proof.
            </p>
          </div>

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

  return (
    <div className="w-full max-w-2xl mx-auto animate-fadeIn">
      {/* Header */}
      <div className="mb-8 pl-2">
        <h2 className="text-4xl md:text-5xl font-black text-[#1A1C19] uppercase tracking-tighter leading-none mb-3">
          Warranty<br/>
          <span className="text-[#78AD3E]">Registration</span>
        </h2>
        <p className="text-gray-500 font-medium max-w-md">
          Register your DC Energy product. Keep your purchase invoice safe — it serves as your proof of warranty.
        </p>
      </div>

      {/* Card */}
      <div className="bg-white border-2 border-gray-200 shadow-[8px_8px_0_0_#1A1C19] rounded-3xl overflow-hidden p-8">
        <form onSubmit={handleSubmit} className="space-y-6">
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
            By registering, you confirm you are the product owner. Keep your invoice as warranty proof.
          </p>
        </form>
      </div>
    </div>
  );
};
