import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabaseService';
import { ShieldCheck, XCircle, CheckCircle, Clock } from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const [partners, setPartners] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPartners();
  }, []);

  const fetchPartners = async () => {
    // In a real app we'd need admin roles, but for local demo we just fetch all
    const { data, error } = await supabase.from('partners').select('*').order('created_at', { ascending: false });
    if (!error && data) setPartners(data);
    setLoading(false);
  };

  const handleApprove = async (id: string) => {
    const code = 'DC-' + Math.random().toString(36).substring(2, 6).toUpperCase();
    await supabase.from('partners').update({ status: 'active', partner_code: code }).eq('id', id);
    fetchPartners();
  };

  const handleReject = async (id: string) => {
    await supabase.from('partners').update({ status: 'rejected' }).eq('id', id);
    fetchPartners();
  };

  if (loading) return <div className="text-center py-20">Loading...</div>;

  return (
    <div className="w-full max-w-6xl mx-auto animate-fadeIn mt-8">
      <div className="mb-8">
        <h2 className="text-4xl font-black text-[#1A1C19] uppercase tracking-tighter leading-none mb-1">
          DC Admin <span className="text-[#78AD3E]">Control</span>
        </h2>
        <p className="font-bold text-gray-500">Partner Applications & Claims</p>
      </div>

      <div className="bg-white border-2 border-gray-200 shadow-[8px_8px_0_0_#1A1C19] rounded-3xl overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b-2 border-gray-200 uppercase text-xs font-black tracking-wider text-gray-600">
              <th className="p-5">Business Name</th>
              <th className="p-5">Contact</th>
              <th className="p-5">Status</th>
              <th className="p-5">Partner Code</th>
              <th className="p-5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {partners.map((p) => (
              <tr key={p.id} className="border-b last:border-0 border-gray-100 hover:bg-gray-50 transition-colors">
                <td className="p-5 font-bold text-[#1A1C19]">{p.business_name || 'N/A'}</td>
                <td className="p-5 text-gray-600 font-medium">{p.phone_number || 'N/A'}</td>
                <td className="p-5">
                  {p.status === 'pending' && <span className="inline-flex items-center gap-1 text-yellow-600 bg-yellow-100 px-3 py-1 rounded-full text-xs font-bold uppercase"><Clock className="w-3 h-3"/> Pending</span>}
                  {p.status === 'active' && <span className="inline-flex items-center gap-1 text-green-600 bg-green-100 px-3 py-1 rounded-full text-xs font-bold uppercase"><CheckCircle className="w-3 h-3"/> Active</span>}
                  {p.status === 'rejected' && <span className="inline-flex items-center gap-1 text-red-600 bg-red-100 px-3 py-1 rounded-full text-xs font-bold uppercase"><XCircle className="w-3 h-3"/> Rejected</span>}
                </td>
                <td className="p-5 font-mono font-bold text-gray-600">{p.partner_code || '-'}</td>
                <td className="p-5 text-right space-x-2">
                  {p.status === 'pending' && (
                    <>
                      <button onClick={() => handleApprove(p.id)} className="p-2 bg-green-50 text-green-600 hover:bg-green-600 hover:text-white border-2 border-green-200 rounded-full transition-colors" title="Approve">
                         <ShieldCheck className="w-5 h-5" />
                      </button>
                      <button onClick={() => handleReject(p.id)} className="p-2 bg-red-50 text-red-600 hover:bg-red-600 hover:text-white border-2 border-red-200 rounded-full transition-colors" title="Reject">
                         <XCircle className="w-5 h-5" />
                      </button>
                    </>
                  )}
                </td>
              </tr>
            ))}
            {partners.length === 0 && (
              <tr>
                <td colSpan={5} className="p-10 text-center text-gray-500 font-bold uppercase tracking-wider">No partners found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
