// apps/web/app/admin/login/page.tsx
"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [step, setStep] = useState(1); // 1: Credentials, 2: MFA Passcode Challenge
  const [mfaCode, setMfaCode] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    // Clear user session cache on load
    localStorage.removeItem("amdox_current_user");
  }, []);

  const handleCredentialsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email === "admin@amdox.com" && password === "password") {
      setIsSubmitting(true);
      setError("");
      setTimeout(() => {
        setIsSubmitting(false);
        setStep(2); // Go to MFA step
      }, 1000);
    } else {
      setError("Invalid corporate credentials.");
    }
  };

  const handleMfaSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");

    // Simulate OTP decryption
    setTimeout(() => {
      setIsSubmitting(false);
      if (mfaCode === "123456") {
        const mockUser = {
          id: "u-01",
          email: email,
          full_name: "Executive Platform Director",
          avatar_url: ""
        };
        // Write mock session
        localStorage.setItem("amdox_current_user", JSON.stringify(mockUser));
        router.push("/admin/dashboard");
      } else {
        setError("Invalid OTP validation code.");
      }
    }, 1200);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#030712] relative overflow-hidden">
      <div className="absolute inset-0 opacity-10 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-[400px] h-[400px] bg-[#4F46E5] blur-[100px] rounded-full"></div>
        <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-[#10B981] blur-[100px] rounded-full"></div>
      </div>

      <div className="w-full max-w-md mx-4 glass-panel p-8 rounded-2xl ai-border z-10 relative">
        <div className="text-center mb-8">
          <span className="text-xs font-mono text-[#C0C1FF] tracking-wider block mb-2">[SEC_PROTO // HANDSHAKE]</span>
          <h2 className="text-2xl font-extrabold text-white tracking-tight">AMDOX ERP SECURE PORTAL</h2>
        </div>

        {step === 1 ? (
          <form onSubmit={handleCredentialsSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-mono uppercase text-[#918fa1] mb-2">EMAIL ADDRESS</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-[#0B0F19] border border-white/10 rounded-lg px-4 py-3 text-sm focus:ring-0 focus:border-[#4F46E5] text-white font-mono"
                placeholder="executive@amdox.com"
              />
            </div>
            <div>
              <label className="block text-xs font-mono uppercase text-[#918fa1] mb-2">PASSWORD</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-[#0B0F19] border border-white/10 rounded-lg px-4 py-3 text-sm focus:ring-0 focus:border-[#4F46E5] text-white"
                placeholder="••••••••"
              />
            </div>

            {error && <p className="text-xs text-red-500 font-mono text-center">{error}</p>}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-[#4F46E5] text-white py-3 rounded-lg font-bold text-xs uppercase hover:translate-y-[-2px] transition-fluid shadow-lg shadow-[#4F46E5]/20 flex items-center justify-center gap-2"
            >
              {isSubmitting ? "Initiating OIDC handshake..." : "Request Token Validation"}
            </button>
            <p className="text-[10px] text-[#918fa1]/60 font-mono text-center">
              Demo bypass credentials: admin@amdox.com / password
            </p>
          </form>
        ) : (
          <form onSubmit={handleMfaSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-mono uppercase text-[#918fa1] mb-2">MFA PASSCODE (OTP)</label>
              <input
                type="text"
                required
                maxLength={6}
                value={mfaCode}
                onChange={(e) => setMfaCode(e.target.value)}
                className="w-full bg-[#0B0F19] border border-white/10 rounded-lg px-4 py-3 text-sm focus:ring-0 focus:border-[#4F46E5] text-white tracking-widest text-center text-lg font-mono"
                placeholder="000000"
              />
            </div>

            {error && <p className="text-xs text-red-500 font-mono text-center">{error}</p>}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-[#10B981] text-white py-3 rounded-lg font-bold text-xs uppercase hover:translate-y-[-2px] transition-fluid shadow-lg shadow-[#10B981]/20 flex items-center justify-center gap-2"
            >
              {isSubmitting ? "Validating security token..." : "Authorize Portal Access"}
            </button>
            <div className="flex justify-between text-[10px] text-[#918fa1]/60 font-mono px-2">
              <span className="cursor-pointer hover:underline" onClick={() => setStep(1)}>Back to Credentials</span>
              <span>Demo passcode: 123456</span>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
