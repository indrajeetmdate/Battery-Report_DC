import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabaseService';
import { Shield, UserCheck, ChevronLeft } from 'lucide-react';

const inputClass = 'w-full px-6 py-3.5 bg-gray-50 border-2 border-gray-200 focus:outline-none focus:border-[#78AD3E] text-[#1A1C19] font-medium transition-colors placeholder-gray-400 font-sans rounded-full';
const labelClass = 'block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2 ml-4';

export const PartnerPortal: React.FC = () => {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [phone, setPhone] = useState('');
  const [partnerRecord, setPartnerRecord] = useState<any>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [signupDone, setSignupDone] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) fetchPartnerRecord(session.user.id);
      else setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) fetchPartnerRecord(session.user.id);
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchPartnerRecord = async (userId: string) => {
    const { data, error } = await supabase.from('partners').select('*').eq('id', userId).single();
    if (!error && data) {
      setPartnerRecord(data);
    }
    setLoading(false);
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    try {
      if (authMode === 'signup') {
        const { data, error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;

        if (data.user) {
          // Insert the partner record immediately
          const { error: insertError } = await supabase.from('partners').insert([{
            id: data.user.id,
            business_name: businessName,
            phone_number: phone,
            status: 'pending'
          }]);

          if (insertError) {
            console.error('Partner insert error:', insertError);
            setErrorMsg('Registration saved but profile creation had an issue. Contact support.');
          }

          // Notify Slack
          try {
            await fetch('/api/notify-partner-slack', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ partner_name: businessName, phone_number: phone })
            });
          } catch (slackErr) {
            console.warn('Slack notification failed (non-critical):', slackErr);
          }
        }

        // Show success regardless — they may need to confirm email
        setSignupDone(true);
        setLoading(false);
        return;
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

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setSession(null);
    setPartnerRecord(null);
    setSignupDone(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-4 border-gray-200 border-t-[#78AD3E] rounded-full animate-spin" />
      </div>
    );
  }

  // Signup success screen (email confirmation may be required)
  if (signupDone && !session) {
    return (
      <div className="w-full max-w-xl mx-auto animate-fadeIn mt-8">
        <div className="bg-white border-2 border-gray-200 shadow-[8px_8px_0_0_#1A1C19] rounded-3xl p-10 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Shield className="w-8 h-8 text-[#78AD3E]" />
          </div>
          <h3 className="text-2xl font-black uppercase tracking-tight mb-3 text-[#1A1C19]">Application Submitted!</h3>
          <p className="text-gray-600 font-medium mb-4">
            Please check your email to confirm your account, then sign in below. Our team will review your application shortly.
          </p>
          <button
            onClick={() => { setSignupDone(false); setAuthMode('login'); }}
            className="mt-4 px-8 py-3 bg-[#1A1C19] text-white font-bold uppercase tracking-wider rounded-full hover:bg-[#78AD3E] transition-colors"
          >
            Go to Sign In
          </button>
        </div>
      </div>
    );
  }

  // Not logged in — show auth form
  if (!session) {
    return (
      <div className="w-full max-w-xl mx-auto animate-fadeIn mt-8">
        <div className="mb-8">
          <h2 className="text-4xl font-black text-[#1A1C19] uppercase tracking-tighter leading-none mb-3">
            Partner <span className="text-[#78AD3E]">Network</span>
          </h2>
          <p className="text-gray-500 font-medium max-w-md">
            Register as a dealer or vendor partner. Earn lifetime incentives on every order from customers you introduce to DC Energy.
          </p>
        </div>
        <div className="bg-white border-2 border-gray-200 shadow-[8px_8px_0_0_#1A1C19] rounded-3xl p-8">
          <h3 className="text-2xl font-black uppercase tracking-tight mb-6">{authMode === 'login' ? 'Partner Login' : 'Partner Application'}</h3>

          {errorMsg && (
            <div className="mb-4 p-4 bg-red-50 border-2 border-red-200 rounded-2xl text-red-700 text-sm font-bold">
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleAuth} className="space-y-5">
            <div>
              <label className={labelClass}>Email Address</label>
              <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass} placeholder="you@business.com" />
            </div>
            <div>
              <label className={labelClass}>Password</label>
              <input type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} className={inputClass} placeholder="Min 6 characters" />
            </div>

            {authMode === 'signup' && (
              <>
                <div>
                  <label className={labelClass}>Business / Vendor Name</label>
                  <input type="text" required value={businessName} onChange={(e) => setBusinessName(e.target.value)} className={inputClass} placeholder="Your company name" />
                </div>
                <div>
                  <label className={labelClass}>Phone Number</label>
                  <input type="tel" required value={phone} onChange={(e) => setPhone(e.target.value)} className={inputClass} placeholder="+91 XXXXX XXXXX" />
                </div>
              </>
            )}

            <button type="submit" disabled={loading} className="w-full py-4 mt-4 bg-[#78AD3E] text-white font-black text-lg uppercase tracking-widest border-2 border-[#78AD3E] hover:bg-[#1A1C19] hover:border-[#1A1C19] transition-all rounded-full flex items-center justify-center gap-2">
              {loading ? 'Processing...' : authMode === 'login' ? 'SIGN IN' : 'SUBMIT APPLICATION'}
            </button>
          </form>
          <div className="mt-6 text-center">
            <button onClick={() => { setAuthMode(authMode === 'login' ? 'signup' : 'login'); setErrorMsg(''); }} className="text-sm font-bold text-gray-500 hover:text-[#1A1C19] uppercase">
              {authMode === 'login' ? "New partner? Apply now →" : "← Already registered? Sign in"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Logged in — Partner Dashboard
  return (
    <div className="w-full max-w-4xl mx-auto animate-fadeIn mt-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h2 className="text-4xl font-black text-[#1A1C19] uppercase tracking-tighter leading-none mb-1">
            Partner <span className="text-[#78AD3E]">Dashboard</span>
          </h2>
          <p className="font-bold text-gray-500">{partnerRecord?.business_name || session.user.email}</p>
        </div>
        <button onClick={handleLogout} className="px-6 py-2 border-2 border-gray-200 hover:border-[#1A1C19] rounded-full text-sm font-bold uppercase transition-all shadow-sm">
          Logout
        </button>
      </div>

      {!partnerRecord || partnerRecord.status === 'pending' ? (
        <div className="border-4 border-yellow-400 bg-yellow-50 rounded-3xl p-8 flex flex-col items-center justify-center text-center shadow-[8px_8px_0_0_#eab308]">
          <Shield className="w-12 h-12 text-yellow-500 mb-4" />
          <h3 className="text-2xl font-black uppercase text-[#1A1C19] mb-2">Under Review</h3>
          <p className="text-gray-700 font-medium max-w-md">Your partner application is currently pending verification by the DC Energy administration team. You will be notified once activated.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-white border-2 border-gray-200 shadow-[8px_8px_0_0_#1A1C19] rounded-3xl p-8">
            <UserCheck className="w-8 h-8 text-[#78AD3E] mb-4" />
            <h3 className="text-xl font-black uppercase mb-4">Your Partner Code</h3>
            <div className="inline-block bg-[#1A1C19] text-white px-6 py-3 rounded-full text-2xl font-mono font-bold tracking-widest">
              {partnerRecord.partner_code || 'PENDING'}
            </div>
            <p className="text-sm text-gray-500 font-medium mt-4">Share this code with your customers. They enter it during warranty registration to lock in your lifetime incentives.</p>
          </div>

          <div className="bg-white border-2 border-gray-200 shadow-[8px_8px_0_0_#1A1C19] rounded-3xl p-8">
            <h3 className="text-xl font-black uppercase mb-4">Manual Claim</h3>
            <p className="text-sm text-gray-500 mb-6 font-medium">If a customer forgot to enter your code, you can manually submit their details for verification.</p>
            <button className="w-full py-4 bg-gray-100 border-2 border-dashed border-gray-300 hover:border-[#78AD3E] hover:bg-green-50 rounded-full font-bold uppercase text-gray-600 hover:text-[#78AD3E] transition-all">
              + File New Claim
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
