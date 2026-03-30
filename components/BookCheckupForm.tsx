import React, { useState } from 'react';
import { bookCheckupSlot, CheckupBooking } from '../services/checkupService';
import { Crosshair, MapPin, CheckCircle, AlertTriangle, Loader2, Wrench } from 'lucide-react';

type FormState = 'idle' | 'loading' | 'success' | 'error';
type TimeSlot = 'Morning (10 AM - 2 PM)' | 'Afternoon (2 PM - 6 PM)';

// Utilitarian Pill Input Class
const inputClass = 'w-full px-6 py-3.5 bg-gray-50 border-2 border-gray-200 focus:outline-none focus:border-[#78AD3E] text-[#1A1C19] font-medium transition-colors placeholder-gray-400 font-sans rounded-full';
const labelClass = 'block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2 ml-4';

export const BookCheckupForm: React.FC = () => {
  const [formData, setFormData] = useState<CheckupBooking>({
    customer_name: '',
    phone_number: '',
    location_data: '',
    checkup_date: '',
    time_slot: 'Morning (10 AM - 2 PM)',
  });
  
  const [formState, setFormState] = useState<FormState>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [isDetecting, setIsDetecting] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleTimeSlotChange = (slot: TimeSlot) => {
    setFormData(prev => ({ ...prev, time_slot: slot }));
  };

  const handleDetectLocation = () => {
    setIsDetecting(true);
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser");
      setIsDetecting(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setFormData(prev => ({ ...prev, location_data: `${latitude.toFixed(6)}, ${longitude.toFixed(6)}` }));
        setIsDetecting(false);
      },
      (error) => {
        console.warn("Error getting location: ", error.message);
        alert("Failed to detect location. Please type your location manually.");
        setIsDetecting(false);
      },
      { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormState('loading');
    setErrorMessage('');

    try {
      await bookCheckupSlot(formData);
      setFormState('success');
    } catch (err: any) {
      setFormState('error');
      setErrorMessage(err.message || 'An unexpected error occurred during booking.');
    }
  };

  const handleReset = () => {
    setFormData({ customer_name: '', phone_number: '', location_data: '', checkup_date: '', time_slot: 'Morning (10 AM - 2 PM)' });
    setFormState('idle');
  };

  if (formState === 'success') {
    return (
      <div className="w-full max-w-xl mx-auto animate-fadeIn mt-8">
        <div className="border-4 border-[#78AD3E] bg-white p-10 flex flex-col items-center justify-center text-center shadow-[8px_8px_0_0_#78AD3E]">
          <div className="w-20 h-20 bg-green-50 mb-6 flex items-center justify-center border-2 border-[#78AD3E]">
            <CheckCircle className="w-10 h-10 text-[#78AD3E]" />
          </div>
          <h2 className="text-3xl font-black text-[#1A1C19] mb-4 uppercase tracking-tight">Slot Confirmed</h2>
          <p className="text-gray-600 font-medium mb-8 max-w-sm">
            Your {formData.time_slot} checkup on {formData.checkup_date} has been added to our service queue. 
            Our technician will contact you shortly before arrival.
          </p>
          <button
            onClick={handleReset}
            className="w-full sm:w-auto px-8 py-4 bg-[#1A1C19] text-white font-bold uppercase tracking-widest hover:bg-[#78AD3E] transition-colors border-2 border-transparent focus:outline-none rounded-full"
          >
            BOOK ANOTHER SLOT
          </button>
        </div>
      </div>
    );
  }

  // Get tomorrow's date for the minimum date picker boundary
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDate = tomorrow.toISOString().split('T')[0];

  return (
    <div className="w-full max-w-2xl mx-auto animate-fadeIn">
      {/* Eco-Utilitarian Header block */}
      <div className="mb-8">
        <h2 className="text-4xl md:text-5xl font-black text-[#1A1C19] uppercase tracking-tighter leading-none mb-3">
          Free Checkup<br/>
          <span className="text-[#78AD3E]">Slot Request</span>
        </h2>
        <p className="text-gray-500 font-medium max-w-md">
          Request a complimentary technical inspection for your Inverter & Battery units.<br/>
          <span className="text-sm mt-1 block italic text-gray-400">*Note: any repair can be done at additional cost.</span>
        </p>
      </div>

      <div className="bg-white border-2 border-gray-200 shadow-[8px_8px_0_0_#1A1C19] rounded-3xl">
        <form onSubmit={handleSubmit} className="p-8 space-y-8">
          
          <div className="space-y-6">
            {/* Name */}
            <div>
              <label className={labelClass} htmlFor="customer_name">Contact Name</label>
              <input
                id="customer_name"
                name="customer_name"
                type="text"
                placeholder="FIRST LAST"
                value={formData.customer_name}
                onChange={handleChange}
                required
                className={inputClass}
              />
            </div>

            {/* Phone */}
            <div>
              <label className={labelClass} htmlFor="phone_number">Phone Number</label>
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

            {/* Location (with radar-ping detect button) */}
            <div>
              <label className={labelClass} htmlFor="location_data">Service Location</label>
              <div className="flex gap-3 flex-col sm:flex-row">
                <div className="relative flex-grow">
                  <div className="absolute inset-y-0 left-0 pl-6 flex items-center pointer-events-none">
                    <MapPin className="w-5 h-5 text-gray-400" />
                  </div>
                  <input
                    id="location_data"
                    name="location_data"
                    type="text"
                    placeholder="ENTER ADDRESS OR GPS COORDS"
                    value={formData.location_data}
                    onChange={handleChange}
                    required
                  className={`${inputClass} pl-14`}
                  />
                </div>
                <button
                  type="button"
                  onClick={handleDetectLocation}
                  disabled={isDetecting}
                  className="sm:w-auto w-full px-8 py-3.5 bg-gray-100 hover:bg-[#78AD3E] hover:text-white border-2 border-gray-200 hover:border-[#78AD3E] text-gray-600 font-bold uppercase tracking-wider transition-colors flex items-center justify-center gap-2 disabled:opacity-50 rounded-full"
                  title="Detect GPS Location"
                >
                  <Crosshair className={`w-5 h-5 ${isDetecting ? 'animate-spin' : ''}`} />
                  <span className="sm:hidden">Detect Location</span>
                </button>
              </div>
            </div>

            {/* Date Selection */}
            <div>
              <label className={labelClass} htmlFor="checkup_date">Preferred Date</label>
              <div className="relative">
                <input
                  id="checkup_date"
                  name="checkup_date"
                  type="date"
                  min={minDate}
                  value={formData.checkup_date}
                  onChange={handleChange}
                  required
                  className={inputClass}
                />
              </div>
            </div>

            {/* Segmented Time Slot Picker */}
            <div>
              <label className={labelClass}>Preferred Time Block</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => handleTimeSlotChange('Morning (10 AM - 2 PM)')}
                  className={`py-4 px-6 border-2 font-bold uppercase transition-all flex items-center justify-center rounded-full
                    ${formData.time_slot === 'Morning (10 AM - 2 PM)' 
                      ? 'border-[#1A1C19] bg-[#1A1C19] text-[#78AD3E]' 
                      : 'border-gray-200 bg-white text-gray-500 hover:border-gray-300'}`}
                >
                  Morning (10 - 2)
                </button>
                <button
                  type="button"
                  onClick={() => handleTimeSlotChange('Afternoon (2 PM - 6 PM)')}
                  className={`py-4 px-6 border-2 font-bold uppercase transition-all flex items-center justify-center rounded-full
                    ${formData.time_slot === 'Afternoon (2 PM - 6 PM)' 
                      ? 'border-[#1A1C19] bg-[#1A1C19] text-[#78AD3E]' 
                      : 'border-gray-200 bg-white text-gray-500 hover:border-gray-300'}`}
                >
                  Afternoon (2 - 6)
                </button>
              </div>
            </div>
          </div>

          {formState === 'error' && (
            <div className="flex items-center gap-3 p-4 bg-red-50 border-2 border-red-200 text-red-700 font-medium">
              <AlertTriangle className="w-5 h-5 flex-shrink-0" />
              <span>{errorMessage || 'Failed to request slot. Please try again.'}</span>
            </div>
          )}

          {/* Submit Action */}
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
                'SUBMIT REQUEST'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
