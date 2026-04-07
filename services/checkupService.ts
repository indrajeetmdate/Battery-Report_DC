import { supabase } from './supabaseService';

export interface CheckupBooking {
  customer_name: string;
  phone_number: string;
  location_data: string;
  checkup_date: string;
  time_slot: 'Morning (10 AM - 2 PM)' | 'Afternoon (2 PM - 6 PM)';
}

/** Submit a new checkup booking */
export const bookCheckupSlot = async (bookingData: CheckupBooking): Promise<void> => {
  const { error } = await supabase.from('checkup_bookings').insert([
    {
      customer_name: bookingData.customer_name.trim(),
      phone_number: bookingData.phone_number.trim(),
      location_data: bookingData.location_data.trim(),
      checkup_date: bookingData.checkup_date,
      time_slot: bookingData.time_slot,
    },
  ]);

  if (error) throw new Error(error.message);

  // Send Slack Notification via our backend relay
  try {
    await fetch('/api/notify-slack', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(bookingData),
    });
  } catch (err) {
    console.error("Failed to notify slack:", err);
  }
};
