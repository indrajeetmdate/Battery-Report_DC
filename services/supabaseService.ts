import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.warn('Supabase environment variables are not set. Warranty registration will not work.');
}

export const supabase = createClient(
  SUPABASE_URL || 'https://ncxynrxeabkvlcirspnz.supabase.co',
  SUPABASE_ANON_KEY || ''
);

export interface WarrantyRegistration {
  serial_number: string;
  customer_name: string;
  phone_number: string;
  email: string;
  invoice_number: string;
}

/** Check if a serial number already has a warranty registered */
export const checkWarrantyExists = async (serialNumber: string): Promise<boolean> => {
  const { data, error } = await supabase
    .from('warranty_registrations')
    .select('id')
    .eq('serial_number', serialNumber.trim())
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data !== null;
};

/** Register a new warranty */
export const registerWarranty = async (formData: WarrantyRegistration): Promise<void> => {
  const alreadyExists = await checkWarrantyExists(formData.serial_number);
  if (alreadyExists) {
    throw new Error('ALREADY_REGISTERED');
  }

  const { error } = await supabase.from('warranty_registrations').insert([
    {
      serial_number: formData.serial_number.trim(),
      customer_name: formData.customer_name.trim(),
      phone_number: formData.phone_number.trim(),
      email: formData.email.trim(),
      invoice_number: formData.invoice_number.trim(),
    },
  ]);

  if (error) throw new Error(error.message);
};
