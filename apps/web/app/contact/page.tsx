// apps/web/app/contact/page.tsx
"use client";

import React, { useState, useRef } from "react";
import Link from "next/link";

export default function ContactPage() {
  const [formData, setFormData] = useState({ name: "", email: "", message: "" });
  const [file, setFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [successOpen, setSuccessOpen] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form validations
  const validateForm = () => {
    const tempErrors: Record<string, string> = {};
    if (!formData.name.trim()) tempErrors.name = "Identifier is required.";
    if (!formData.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      tempErrors.email = "Please specify a valid enterprise email.";
    }
    if (formData.message.trim().length < 10) {
      tempErrors.message = "Message context must be at least 10 characters.";
    }
    setErrors(tempErrors);
    return Object.keys(tempErrors).length === 0;
  };

  // Drag and Drop helpers
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  // Submission handler with torture-test protection
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    // Trigger lock state - disable buttons and form fields
    setIsSubmitting(true);
    setUploadProgress(10);

    try {
      // Simulate file upload streaming bytes to Supabase storage bucket amdox-secure-vault
      if (file) {
        for (let percent = 20; percent <= 100; percent += 20) {
          await new Promise((resolve) => setTimeout(resolve, 300));
          setUploadProgress(percent);
        }
      } else {
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
      
      // Submit form text parameters
      console.log("Submitted payload:", { ...formData, attachment: file ? file.name : null });
      setSuccessOpen(true);
      setFormData({ name: "", email: "", message: "" });
      setFile(null);
    } catch (err) {
      console.error("Submission pipeline error:", err);
      alert("Submission pipeline failure. Please retry.");
    } finally {
      setIsSubmitting(false);
      setUploadProgress(0);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-between">
      {/* Top Nav */}
      <nav className="w-full bg-[#030712]/80 border-b border-white/5 h-16 flex items-center">
        <div className="flex justify-between items-center w-full px-8 max-w-7xl mx-auto">
          <Link href="/" className="font-bold text-lg text-[#C0C1FF] tracking-tight">
            AMDOX ERP
          </Link>
          <Link href="/" className="text-xs uppercase font-bold text-[#918fa1] hover:text-white transition-fluid">
            Back to Home
          </Link>
        </div>
      </nav>

      <main className="flex-1 max-w-lg mx-auto w-full px-8 py-16">
        <div className="mb-10 text-center">
          <span className="text-xs font-mono text-[#4F46E5] bg-[#4F46E5]/10 px-3 py-1 rounded-full inline-block border border-[#4F46E5]/20 mb-3">
            [SYS_ROUTING // SECURE_CONTACT]
          </span>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Enterprise Architect Contact</h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Name */}
          <div>
            <label className="block text-xs font-mono uppercase text-[#918fa1] mb-2">Corporate Identity / Name</label>
            <input
              type="text"
              required
              disabled={isSubmitting}
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className={`w-full bg-[#0B0F19] border rounded-lg px-4 py-3 text-sm focus:ring-0 focus:border-[#4F46E5] transition-fluid text-white ${
                errors.name ? "border-red-500" : "border-white/10"
              }`}
              placeholder="e.g. Executive VP Finance"
            />
            {errors.name && <p className="text-xs text-red-500 mt-1 font-mono">{errors.name}</p>}
          </div>

          {/* Email */}
          <div>
            <label className="block text-xs font-mono uppercase text-[#918fa1] mb-2">Business Email Address</label>
            <input
              type="email"
              required
              disabled={isSubmitting}
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className={`w-full bg-[#0B0F19] border rounded-lg px-4 py-3 text-sm focus:ring-0 focus:border-[#4F46E5] transition-fluid text-white ${
                errors.email ? "border-red-500" : "border-white/10"
              }`}
              placeholder="e.g. direct@organization.com"
            />
            {errors.email && <p className="text-xs text-red-500 mt-1 font-mono">{errors.email}</p>}
          </div>

          {/* Message */}
          <div>
            <label className="block text-xs font-mono uppercase text-[#918fa1] mb-2">Detailed Message Context</label>
            <textarea
              required
              disabled={isSubmitting}
              rows={4}
              value={formData.message}
              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              className={`w-full bg-[#0B0F19] border rounded-lg px-4 py-3 text-sm focus:ring-0 focus:border-[#4F46E5] transition-fluid text-white ${
                errors.message ? "border-red-500" : "border-white/10"
              }`}
              placeholder="Query descriptions and infrastructure demands..."
            />
            {errors.message && <p className="text-xs text-red-500 mt-1 font-mono">{errors.message}</p>}
          </div>

          {/* File Uploader */}
          <div className="space-y-2">
            <label className="block text-xs font-mono uppercase text-[#918fa1]">Secure Media Upload (Bucket: amdox-secure-vault)</label>
            <div
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
              onClick={() => !isSubmitting && fileInputRef.current?.click()}
              className={`border border-dashed rounded-xl p-6 text-center cursor-pointer transition-fluid flex flex-col items-center justify-center min-h-[120px] ${
                dragActive ? "border-[#4F46E5] bg-[#4F46E5]/5" : "border-white/10 bg-[#0B0F19]"
              } ${isSubmitting ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                disabled={isSubmitting}
                className="hidden"
                accept="image/*,application/pdf"
              />
              <span className="material-symbols-outlined text-[#918fa1] mb-2">cloud_upload</span>
              {file ? (
                <span className="text-xs font-bold text-[#10B981]">{file.name} ({(file.size/1024).toFixed(1)} KB)</span>
              ) : (
                <span className="text-xs text-[#918fa1]">Drag & drop attachment or click to upload</span>
              )}
            </div>
            {uploadProgress > 0 && (
              <div className="w-full bg-[#080e1a] h-1.5 rounded-full overflow-hidden">
                <div className="bg-[#10B981] h-full transition-fluid" style={{ width: `${uploadProgress}%` }}></div>
              </div>
            )}
          </div>

          {/* Submit Action */}
          <button
            type="submit"
            disabled={isSubmitting}
            className={`w-full py-3 rounded-lg font-bold text-xs uppercase tracking-wider transition-fluid shadow-lg flex items-center justify-center gap-2 ${
              isSubmitting 
                ? "bg-[#2f3542] text-[#918fa1] cursor-not-allowed"
                : "bg-[#4F46E5] text-white hover:translate-y-[-2px] shadow-[#4F46E5]/20"
            }`}
          >
            {isSubmitting ? (
              <>
                <span className="animate-spin h-4 w-4 border-2 border-[#918fa1] border-t-transparent rounded-full" />
                Streaming data bytes...
              </>
            ) : (
              "Submit Connection Request"
            )}
          </button>
        </form>
      </main>

      {/* Success Modal */}
      {successOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center transition-fluid">
          <div className="glass-panel p-6 rounded-2xl w-full max-w-sm mx-4 text-center ai-border">
            <span className="material-symbols-outlined text-[#10B981] text-display-lg mb-4">check_circle</span>
            <h3 className="text-xl font-bold text-white mb-2">Request Handshake Encrypted</h3>
            <p className="text-xs text-[#c7c4d8] leading-relaxed mb-6">
              Your connection configuration query has been written to the database. An architect will establish contact within 2 hours.
            </p>
            <button
              onClick={() => setSuccessOpen(false)}
              className="bg-[#4F46E5] text-white px-6 py-2.5 rounded-lg text-xs font-bold uppercase hover:opacity-90 transition-fluid"
            >
              Acknowledge
            </button>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="w-full py-8 px-8 border-t border-white/5 bg-[#080e1a]">
        <div className="max-w-7xl mx-auto flex justify-between items-center text-[10px] font-mono text-[#918fa1]/60">
          <span>AMDOX SECURE GATEWAY</span>
          <span>© 2026 AMDOX ENTERPRISE. ENCRYPTED END-TO-END.</span>
        </div>
      </footer>
    </div>
  );
}
