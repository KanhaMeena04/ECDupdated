import React, { useState, useEffect } from 'react';
import { useAdminAuth } from '../api/auth.js';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const AdminLogin = () => {
  const { login, loading, error, success } = useAdminAuth();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (!success) return;
    if (user && user.role === 'admin') {
      navigate('/dashboard');
    } else {
      navigate('/');
    }
  }, [success, user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const loggedUser = await login(email, password);
    if (!loggedUser) return;
    if (loggedUser.role === "admin") {
      navigate("/dashboard");
    } else {
      navigate("/");
    }
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-[#F5FAF8]">
      {/* LEFT COLUMN: Deep Branded Teal Banner */}
      <div className="w-full lg:w-1/2 bg-gradient-to-br from-[#185d4b] via-[#248C70] to-[#124b3c] text-white p-8 lg:p-16 flex flex-col justify-between relative overflow-hidden">
        {/* Subtle decorative background circles */}
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-white/5 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-[#E89D1E]/10 rounded-full blur-3xl pointer-events-none"></div>

        {/* Top Tag */}
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 border border-white/20 text-white/90 text-xs font-semibold tracking-wide backdrop-blur-sm shadow-sm">
            <span className="w-2 h-2 rounded-full bg-[#E89D1E] animate-pulse"></span>
            ECDKART SOHNA (HARYANA) PLATFORM
          </div>
        </div>

        {/* Middle Main Content */}
        <div className="relative z-10 my-10 lg:my-0 max-w-xl">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight leading-tight text-white mb-6 font-heading">
            Smart Hyperlocal Food &amp; Restaurant SaaS
          </h1>
          <p className="text-base sm:text-lg text-white/85 leading-relaxed font-normal">
            Real-time food ordering, hyperlocal multi-kitchen dispatch in Sohna (Haryana), live rider fleet tracking, and unified merchant-customer operations console designed for high-velocity food ecosystems.
          </p>
        </div>

        {/* Bottom Feature Badges */}
        <div className="relative z-10 pt-6 border-t border-white/15 grid grid-cols-2 sm:grid-cols-3 gap-4">
          <div>
            <div className="text-xl sm:text-2xl font-bold text-white tracking-tight">50+ Kitchens</div>
            <div className="text-xs text-white/75 mt-0.5">Active across Sohna, HR</div>
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-bold text-white tracking-tight">25 Min Delivery</div>
            <div className="text-xs text-white/75 mt-0.5">AI fleet dispatching</div>
          </div>
          <div className="col-span-2 sm:col-span-1">
            <div className="text-xl sm:text-2xl font-bold text-white tracking-tight">FSSAI Certified</div>
            <div className="text-xs text-white/75 mt-0.5">100% hygiene compliance</div>
          </div>
        </div>
      </div>

      {/* RIGHT COLUMN: Clean White Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 lg:p-16 bg-white lg:bg-[#F5FAF8]">
        <div className="w-full max-w-md bg-white p-8 sm:p-10 rounded-3xl lg:shadow-[0_20px_50px_rgba(36,140,112,0.12)] border border-[#94B2AA]/30">
          
          {/* Logo Header */}
          <div className="text-left mb-8">
            <div className="mb-4">
              <img 
                src="/image.png" 
                alt="ECDKART Logo" 
                className="h-14 sm:h-16 w-auto object-contain transition-transform duration-300 hover:scale-105" 
              />
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#2C2C2C] tracking-tight font-heading">
              Welcome Administrator
            </h2>
            <p className="text-sm text-gray-500 mt-1.5 font-medium">
              Sign in to explore the Sohna food operations management console
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email Address */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5" htmlFor="email">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                  <svg className="w-5 h-5 text-[#248C70]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@ecdkart.com"
                  required
                  disabled={loading}
                  style={{ color: '#2C2C2C', WebkitTextFillColor: '#2C2C2C', backgroundColor: '#FFFFFF' }}
                  className="w-full pl-11 pr-4 py-3.5 bg-white border-2 border-[#94B2AA] rounded-xl text-[#2C2C2C] text-base placeholder-gray-400 font-semibold focus:ring-2 focus:ring-[#248C70] focus:border-[#248C70] focus:outline-none transition duration-200 shadow-sm"
                />
              </div>
            </div>

            {/* Access Key / Password */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#2C2C2C] mb-1.5" htmlFor="password">
                Access Key / Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                  <svg className="w-5 h-5 text-[#248C70]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  required
                  disabled={loading}
                  style={{ color: '#2C2C2C', WebkitTextFillColor: '#2C2C2C', backgroundColor: '#FFFFFF' }}
                  className="w-full pl-11 pr-11 py-3.5 bg-white border-2 border-[#94B2AA] rounded-xl text-[#2C2C2C] text-base placeholder-gray-400 font-semibold focus:ring-2 focus:ring-[#248C70] focus:border-[#248C70] focus:outline-none transition duration-200 shadow-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 hover:text-[#248C70] focus:outline-none transition"
                >
                  {showPassword ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-3.5 bg-red-50 text-red-700 text-sm rounded-xl border border-red-200 shadow-xs flex items-center gap-2">
                <svg className="w-5 h-5 text-red-500 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <span>{error}</span>
              </div>
            )}

            {/* Success Message */}
            {success && (
              <div className="p-3.5 bg-green-50 text-green-700 text-sm rounded-xl border border-green-200 shadow-xs flex items-center gap-2">
                <svg className="w-5 h-5 text-green-500 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>Login successful! Opening dashboard...</span>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className={`w-full py-4 px-6 rounded-xl font-bold text-base text-white shadow-lg transition-all duration-300 transform hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-2 ${
                loading
                  ? 'bg-[#248C70]/70 cursor-not-allowed shadow-none'
                  : 'bg-[#248C70] hover:bg-[#1c6d57] shadow-[#248C70]/30'
              }`}
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <span>Authenticating...</span>
                </>
              ) : (
                <span>Enter Dashboard Console</span>
              )}
            </button>
          </form>

          {/* Footer Note */}
          <div className="mt-8 pt-6 border-t border-gray-100 text-center">
            <p className="text-xs text-gray-400 font-medium">
              ECDKART Food Delivery &copy; 2026 &bull; Sohna, Haryana Hub
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;