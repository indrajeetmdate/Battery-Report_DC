import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabaseService';
import { ShieldCheck, XCircle, CheckCircle, Clock, Lock, ChevronDown, ChevronRight, FileText } from 'lucide-react';

const inputClass = 'w-full px-6 py-3.5 bg-gray-50 border-2 border-gray-200 focus:outline-none focus:border-[#78AD3E] text-[#1A1C19] font-medium transition-colors placeholder-gray-400 font-sans rounded-full';
const labelClass = 'block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2 ml-4';

export const AdminDashboard: React.FC = () => {
  const [session, setSession] = useState<any>(null);
  const [isStaff, setIsStaff] = useState(false);
  const [partners, setPartners] = useState<any[]>([]);
  const [claims, setClaims] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [staffCode, setStaffCode] = useState('');
  const [expandedPartners, setExpandedPartners] = useState<Record<string, boolean>>({});

  const toggleExpand = (id: string) => {
    setExpandedPartners(prev => ({ ...prev, [id]: !prev[id] }));
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) checkStaffAndLoad(session.user.id);
      else setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) checkStaffAndLoad(session.user.id);
      else {
        setIsStaff(false);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const checkStaffAndLoad = async (userId: string) => {
    const { data, error } = await supabase.from('staff_users').select('id').eq('id', userId).single();
    if (error) {
      console.error('Staff check error:', error);
      setIsStaff(false);
      if (error.code === '42P01') {
         alert("CRITICAL: The 'staff_users' table does not exist in your Supabase database. You must run the SQL script.");
      }
    } else if (data) {
      setIsStaff(true);
      await Promise.all([fetchPartners(), fetchClaims()]);
    }
    setLoading(false);
  };

  const fetchPartners = async () => {
    const { data, error } = await supabase.from('partners').select('*').order('created_at', { ascending: false });
    if (!error && data) setPartners(data);
  };

  const fetchClaims = async () => {
    const { data, error } = await supabase.from('partner_claims').select('*, partners(business_name, partner_code)').order('created_at', { ascending: false });
    if (!error && data) setClaims(data);
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    try {
      if (authMode === 'signup') {
        if (staffCode !== 'internalDCaffairs') {
          setErrorMsg('Invalid internal access code.');
          setLoading(false);
          return;
        }
        const { data, error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;

        if (data.user) {
          const { error: insertError } = await supabase.from('staff_users').insert([{
            id: data.user.id,
            email: email,
            role: 'admin'
          }]);
          if (insertError) {
            console.error('Staff insert error:', insertError);
            setErrorMsg(`Database Error (${insertError.code}): ${insertError.message}. Did you run the SQL script to create the staff_users table?`);
            setLoading(false);
            return;
          }
        }
        setErrorMsg('');
        // After signup, they may need to confirm email
        alert('Staff account created! Please check your email to confirm, then sign in.');
        setAuthMode('login');
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
    } catch (error: any) {
      setErrorMsg(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id: string) => {
    const code = 'DC-' + Math.random().toString(36).substring(2, 6).toUpperCase();
    const { error } = await supabase.from('partners').update({ status: 'active', partner_code: code }).eq('id', id);
    if (error) {
      alert('Error approving partner: ' + error.message);
    } else {
      fetchPartners();
    }
  };

  const handleReject = async (id: string) => {
    const { error } = await supabase.from('partners').update({ status: 'rejected' }).eq('id', id);
    if (error) {
      alert('Error rejecting partner: ' + error.message);
    } else {
      fetchPartners();
    }
  };

  const handleApproveClaim = async (id: string) => {
    const { error } = await supabase.from('partner_claims').update({ status: 'approved' }).eq('id', id);
    if (error) alert('Error approving claim: ' + error.message);
    else fetchClaims();
  };

  const handleRejectClaim = async (id: string) => {
    const { error } = await supabase.from('partner_claims').update({ status: 'rejected' }).eq('id', id);
    if (error) alert('Error rejecting claim: ' + error.message);
    else fetchClaims();
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setSession(null);
    setIsStaff(false);
    setPartners([]);
    setClaims([]);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-4 border-gray-200 border-t-[#78AD3E] rounded-full animate-spin" />
      </div>
    );
  }

  // Not logged in — Staff Auth Form
  if (!session) {
    return (
      <div className="w-full max-w-md mx-auto animate-fadeIn mt-12">
        <div className="mb-8 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-[#1A1C19] rounded-full mb-4">
            <Lock className="w-8 h-8 text-[#78AD3E]" />
          </div>
          <h2 className="text-3xl font-black text-[#1A1C19] uppercase tracking-tighter leading-none mb-2">
            Staff <span className="text-[#78AD3E]">Access</span>
          </h2>
          <p className="text-gray-500 font-medium text-sm">DC Energy internal administration portal.</p>
        </div>
        <div className="bg-white border-2 border-gray-200 shadow-[8px_8px_0_0_#1A1C19] rounded-3xl p-8">
          <h3 className="text-xl font-black uppercase tracking-tight mb-6">{authMode === 'login' ? 'Staff Sign In' : 'Staff Registration'}</h3>

          {errorMsg && (
            <div className="mb-4 p-4 bg-red-50 border-2 border-red-200 rounded-2xl text-red-700 text-sm font-bold">
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleAuth} className="space-y-5">
            <div>
              <label className={labelClass}>Staff Email</label>
              <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass} placeholder="name@dcenergy.in" />
            </div>
            <div>
              <label className={labelClass}>Password</label>
              <input type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} className={inputClass} placeholder="Min 6 characters" />
            </div>

            {authMode === 'signup' && (
              <div>
                <label className={labelClass}>Internal Access Code</label>
                <input type="password" required value={staffCode} onChange={(e) => setStaffCode(e.target.value)} className={inputClass} placeholder="Enter staff code" />
              </div>
            )}

            <button type="submit" disabled={loading} className="w-full py-4 mt-4 bg-[#1A1C19] text-white font-black text-lg uppercase tracking-widest border-2 border-[#1A1C19] hover:bg-[#78AD3E] hover:border-[#78AD3E] transition-all rounded-full">
              {loading ? 'Processing...' : authMode === 'login' ? 'SIGN IN' : 'CREATE STAFF ACCOUNT'}
            </button>
          </form>
          <div className="mt-6 text-center">
            <button onClick={() => { setAuthMode(authMode === 'login' ? 'signup' : 'login'); setErrorMsg(''); }} className="text-sm font-bold text-gray-500 hover:text-[#1A1C19] uppercase">
              {authMode === 'login' ? 'New staff? Register →' : '← Back to Sign In'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Logged in but NOT staff
  if (!isStaff) {
    return (
      <div className="w-full max-w-md mx-auto animate-fadeIn mt-12 text-center">
        <div className="bg-red-50 border-2 border-red-200 rounded-3xl p-8">
          <XCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h3 className="text-xl font-black uppercase text-[#1A1C19] mb-2">Access Denied</h3>
          <p className="text-gray-600 font-medium mb-6">This account is not registered as DC Energy staff.</p>
          <button onClick={handleLogout} className="px-8 py-3 bg-[#1A1C19] text-white rounded-full font-bold uppercase tracking-wider hover:bg-red-600 transition-colors">
            Sign Out
          </button>
        </div>
      </div>
    );
  }

  // Staff Dashboard
  return (
    <div className="w-full max-w-6xl mx-auto animate-fadeIn mt-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h2 className="text-4xl font-black text-[#1A1C19] uppercase tracking-tighter leading-none mb-1">
            DC Admin <span className="text-[#78AD3E]">Control</span>
          </h2>
          <p className="font-bold text-gray-500">Partner Applications & Claims</p>
        </div>
        <button onClick={handleLogout} className="px-6 py-2 border-2 border-gray-200 hover:border-red-400 hover:text-red-600 rounded-full text-sm font-bold uppercase transition-all">
          Staff Logout
        </button>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-yellow-50 border-2 border-yellow-200 rounded-2xl p-5 text-center">
          <p className="text-3xl font-black text-yellow-600">{partners.filter(p => p.status === 'pending').length}</p>
          <p className="text-xs font-bold uppercase tracking-wider text-yellow-700 mt-1">Pending</p>
        </div>
        <div className="bg-green-50 border-2 border-green-200 rounded-2xl p-5 text-center">
          <p className="text-3xl font-black text-green-600">{partners.filter(p => p.status === 'active').length}</p>
          <p className="text-xs font-bold uppercase tracking-wider text-green-700 mt-1">Active</p>
        </div>
        <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-5 text-center">
          <p className="text-3xl font-black text-red-600">{partners.filter(p => p.status === 'rejected').length}</p>
          <p className="text-xs font-bold uppercase tracking-wider text-red-700 mt-1">Rejected</p>
        </div>
      </div>

      {/* Partners Table */}
      <div className="bg-white border-2 border-gray-200 shadow-[8px_8px_0_0_#1A1C19] rounded-3xl overflow-hidden mb-12">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b-2 border-gray-200 uppercase text-xs font-black tracking-wider text-gray-600">
                <th className="p-5">Business Name</th>
                <th className="p-5">Phone</th>
                <th className="p-5">Status</th>
                <th className="p-5">Partner Code</th>
                <th className="p-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {partners.map((p) => {
                const partnerClaims = claims.filter(c => c.partner_id === p.id);
                const pendingClaims = partnerClaims.filter(c => c.status === 'pending').length;
                const isExpanded = expandedPartners[p.id];

                return (
                  <React.Fragment key={p.id}>
                    <tr 
                      className="border-b last:border-0 border-gray-100 hover:bg-gray-50 transition-colors cursor-pointer"
                      onClick={() => toggleExpand(p.id)}
                    >
                      <td className="p-5 font-bold text-[#1A1C19] flex items-center gap-3">
                        {isExpanded ? <ChevronDown className="w-4 h-4 text-gray-400" /> : <ChevronRight className="w-4 h-4 text-gray-400" />}
                        {p.business_name || 'N/A'}
                        {pendingClaims > 0 && (
                          <span className="ml-2 bg-red-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full">{pendingClaims} NEW</span>
                        )}
                      </td>
                      <td className="p-5 text-gray-600 font-medium">{p.phone_number || 'N/A'}</td>
                      <td className="p-5">
                        {p.status === 'pending' && <span className="inline-flex items-center gap-1 text-yellow-600 bg-yellow-100 px-3 py-1 rounded-full text-xs font-bold uppercase"><Clock className="w-3 h-3" /> Pending</span>}
                        {p.status === 'active' && <span className="inline-flex items-center gap-1 text-green-600 bg-green-100 px-3 py-1 rounded-full text-xs font-bold uppercase"><CheckCircle className="w-3 h-3" /> Active</span>}
                        {p.status === 'rejected' && <span className="inline-flex items-center gap-1 text-red-600 bg-red-100 px-3 py-1 rounded-full text-xs font-bold uppercase"><XCircle className="w-3 h-3" /> Rejected</span>}
                      </td>
                      <td className="p-5 font-mono font-bold text-gray-600">{p.partner_code || '—'}</td>
                      <td className="p-5 text-right space-x-2" onClick={(e) => e.stopPropagation()}>
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
                    
                    {isExpanded && (
                      <tr className="bg-gray-50 border-b-2 border-gray-200 shadow-inner">
                        <td colSpan={5} className="p-0">
                          <div className="p-6 pl-12 bg-gray-50 border-l-4 border-[#78AD3E]">
                            <h4 className="text-sm font-black uppercase text-gray-600 mb-4 flex items-center gap-2">
                              <FileText className="w-4 h-4"/> Invoice Claims for {p.business_name}
                            </h4>
                            
                            {partnerClaims.length === 0 ? (
                              <p className="text-sm text-gray-400 font-medium italic mb-2">No invoice claims submitted by this partner yet.</p>
                            ) : (
                              <div className="overflow-hidden rounded-xl border border-gray-200 shadow-sm bg-white">
                                <table className="w-full text-left">
                                  <thead>
                                    <tr className="bg-gray-100 text-[10px] font-black uppercase tracking-wider text-gray-500 border-b border-gray-200">
                                      <th className="p-3">Invoice Number</th>
                                      <th className="p-3">Date</th>
                                      <th className="p-3">Status</th>
                                      <th className="p-3 text-right">Action</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {partnerClaims.map(c => (
                                      <tr key={c.id} className="border-b last:border-0 border-gray-100">
                                        <td className="p-3 font-bold text-[#78AD3E]">{c.invoice_number}</td>
                                        <td className="p-3 text-gray-500 text-sm font-medium">{new Date(c.created_at).toLocaleDateString()}</td>
                                        <td className="p-3">
                                          {c.status === 'pending' && <span className="inline-flex items-center gap-1 text-yellow-600 text-xs font-bold uppercase"><Clock className="w-3 h-3" /> Pending</span>}
                                          {c.status === 'approved' && <span className="inline-flex items-center gap-1 text-green-600 text-xs font-bold uppercase"><CheckCircle className="w-3 h-3" /> Approved</span>}
                                          {c.status === 'rejected' && <span className="inline-flex items-center gap-1 text-red-600 text-xs font-bold uppercase"><XCircle className="w-3 h-3" /> Rejected</span>}
                                        </td>
                                        <td className="p-3 text-right space-x-2">
                                          {c.status === 'pending' && (
                                            <>
                                              <button onClick={() => handleApproveClaim(c.id)} className="px-3 py-1 bg-green-50 text-green-600 hover:bg-green-600 hover:text-white border border-green-200 rounded-full text-xs font-bold uppercase transition-colors">Approve</button>
                                              <button onClick={() => handleRejectClaim(c.id)} className="px-3 py-1 bg-red-50 text-red-600 hover:bg-red-600 hover:text-white border border-red-200 rounded-full text-xs font-bold uppercase transition-colors">Reject</button>
                                            </>
                                          )}
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
              {partners.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-10 text-center text-gray-400 font-bold uppercase tracking-wider">No partner applications yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
