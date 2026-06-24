import React, { useState } from 'react';
import { Mail, Phone, ArrowRight, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { submitEnquiry } from '@/api/wytsaas/enquiry';
import contactIllustration from '@/assets/wytnet_contact_illustration.png';

const COUNTRY_CODES = [
  { code: '+1', name: 'US/CA' },
  { code: '+91', name: 'IN' },
  { code: '+62', name: 'ID' },
  { code: '+44', name: 'UK' },
  { code: '+81', name: 'JP' },
  { code: '+49', name: 'DE' },
  { code: '+33', name: 'FR' },
  { code: '+61', name: 'AU' },
];

export default function EnquirySection() {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [countryCode, setCountryCode] = useState('+1');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [message, setMessage] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);

  // Status states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  // Field validation states
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const errors: Record<string, string> = {};
    if (!firstName.trim()) errors.firstName = 'First name is required';
    else if (firstName.length > 100) errors.firstName = 'Maximum 100 characters';

    if (!lastName.trim()) errors.lastName = 'Last name is required';
    else if (lastName.length > 100) errors.lastName = 'Maximum 100 characters';

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim()) errors.email = 'Email is required';
    else if (!emailRegex.test(email)) errors.email = 'Please enter a valid email address';
    else if (email.length > 255) errors.email = 'Maximum 255 characters';

    if (phoneNumber && (countryCode + phoneNumber).length > 30) {
      errors.phone = 'Phone number is too long';
    }

    if (!message.trim()) errors.message = 'Message is required';
    else if (message.length > 500) errors.message = 'Maximum 500 characters';

    if (!termsAccepted) errors.terms = 'You must agree to the Terms of service and Privacy Policy';

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    if (!validate()) return;

    setIsSubmitting(true);
    try {
      const fullPhone = phoneNumber.trim() ? `${countryCode} ${phoneNumber.trim()}` : undefined;
      await submitEnquiry({
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        email: email.trim(),
        phone: fullPhone,
        message: message.trim(),
        terms_accepted: termsAccepted,
      });

      setIsSuccess(true);
      // Reset form
      setFirstName('');
      setLastName('');
      setEmail('');
      setPhoneNumber('');
      setMessage('');
      setTermsAccepted(false);
      setValidationErrors({});
    } catch (err: any) {
      console.error('Enquiry submission error:', err);
      setSubmitError(err.detail || 'Failed to submit enquiry. Please try again later.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section id="contact-us" className="relative overflow-hidden bg-gradient-to-b from-[#fafbfe] to-white py-20 lg:py-28 px-6 border-t border-slate-100">
      {/* Decorative premium radial glows */}
      <div className="absolute top-[10%] left-[10%] h-[450px] w-[450px] rounded-full bg-blue-600/5 glow-blur pointer-events-none" />
      <div className="absolute bottom-[10%] right-[10%] h-[400px] w-[400px] rounded-full bg-purple-500/5 glow-blur pointer-events-none" />
      <div className="absolute top-1/2 left-1/3 h-[300px] w-[300px] rounded-full bg-indigo-500/3 glow-blur pointer-events-none" />

      <div className="relative z-10 mx-auto max-w-6xl">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-stretch">
          
          {/* Left Column: Glassy Info Panel */}
          <div className="lg:col-span-5 flex w-full">
            <div className="bg-white/85 backdrop-blur-xl rounded-[32px] p-6 border border-slate-200/80 shadow-[0_12px_40px_rgba(0,0,0,0.015)] flex flex-col justify-between w-full h-full">
              
              <div className="space-y-6">
                {/* Holographic glowing image card */}
                <div className="relative overflow-hidden rounded-2xl bg-slate-950 aspect-[16/10] flex items-center justify-center border border-slate-200/10 shadow-[0_4px_25px_rgba(59,130,246,0.05)] group">
                  <img
                    src={contactIllustration}
                    alt="WytNet Identity Platform Illustration"
                    className="w-full h-full object-cover transition-transform duration-700 hover:scale-105 opacity-95 hover:opacity-100"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 via-transparent to-transparent pointer-events-none" />
                  <div className="absolute top-3 right-3 bg-blue-500/10 backdrop-blur-md border border-blue-500/30 text-blue-400 text-[10px] font-extrabold px-2.5 py-1 rounded-full uppercase tracking-wider">
                    Kernel OS
                  </div>
                </div>

                {/* Status Indicator */}
                <div className="flex items-center gap-2 px-1">
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                  </span>
                  <span className="text-[10px] font-bold tracking-widest text-emerald-600 uppercase">
                    Operational &bull; Direct Support Link
                  </span>
                </div>

                {/* Side-by-side Contact Badges */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Email Badge */}
                  <div className="bg-slate-50/50 border border-slate-200/80 hover:border-blue-500/30 transition-all duration-300 rounded-2xl p-4 flex items-center gap-3">
                    <div className="shrink-0 bg-blue-500/10 p-2.5 rounded-xl border border-blue-500/20 flex items-center justify-center">
                      <Mail className="h-5 w-5 text-blue-500" />
                    </div>
                    <div className="min-w-0">
                      <span className="text-[9px] text-slate-400 font-extrabold uppercase tracking-wider block">Email us</span>
                      <a 
                        href="mailto:info@wytnet.io" 
                        className="text-xs font-bold text-slate-700 hover:text-blue-600 transition-colors duration-200 block truncate"
                      >
                        info@wytnet.io
                      </a>
                    </div>
                  </div>

                  {/* Phone Badge */}
                  <div className="bg-slate-50/50 border border-slate-200/80 hover:border-emerald-500/30 transition-all duration-300 rounded-2xl p-4 flex items-center gap-3">
                    <div className="shrink-0 bg-emerald-500/10 p-2.5 rounded-xl border border-emerald-500/20 flex items-center justify-center">
                      <Phone className="h-5 w-5 text-emerald-500" />
                    </div>
                    <div className="min-w-0">
                      <span className="text-[9px] text-slate-400 font-extrabold uppercase tracking-wider block">Call us</span>
                      <a 
                        href="tel:+1321221231" 
                        className="text-xs font-bold text-slate-700 hover:text-emerald-600 transition-colors duration-200 block truncate"
                      >
                        +1 321-221-231
                      </a>
                    </div>
                  </div>
                </div>

                {/* Description Text */}
                <div className="px-1">
                  <h4 className="text-lg font-bold text-slate-900 tracking-tight">
                    WytNet Identity Services
                  </h4>
                  <p className="text-xs text-slate-500 leading-relaxed mt-2">
                    Connect directly with the core integration group. We assist with sandbox queries, payment routing nodes, SDK implementation, and customized ecosystem configurations.
                  </p>
                </div>
              </div>

            </div>
          </div>

          {/* Right Column: Premium Form Card */}
          <div className="lg:col-span-7 flex w-full">
            <div className="bg-white/85 backdrop-blur-xl rounded-[32px] p-8 sm:p-10 shadow-[0_12px_40px_rgba(0,0,0,0.015)] border border-slate-200/80 relative overflow-hidden flex flex-col justify-between w-full h-full">
              
              {/* Glowing Top Line */}
              <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-blue-500 to-purple-500" />

              {isSuccess ? (
                /* Success Message */
                <div className="py-8 text-center animate-fadeIn my-auto space-y-6">
                  <div className="flex justify-center">
                    <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-full shadow-[0_0_20px_rgba(16,185,129,0.1)]">
                      <CheckCircle2 className="h-12 w-12 text-emerald-500 animate-pulse" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-2xl font-extrabold text-slate-900">
                      Message Transmitted
                    </h3>
                    <p className="text-slate-500 text-sm max-w-sm mx-auto">
                      Thank you for reaching out to WytNet.
                    </p>
                  </div>
                  <div className="bg-slate-50/80 rounded-2xl p-5 border border-slate-200/80 text-slate-600 text-xs sm:text-sm leading-relaxed max-w-md mx-auto">
                    Your enquiry has been registered. Our integration desk will review your details and trigger a response shortly.
                  </div>
                  <button
                    onClick={() => setIsSuccess(false)}
                    className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 px-6 py-2.5 text-xs font-semibold text-slate-600 hover:text-slate-800 transition-all duration-200"
                  >
                    Submit another response
                  </button>
                </div>
              ) : (
                /* The Contact Form */
                <form onSubmit={handleSubmit} className="space-y-6 my-auto">
                  <div className="space-y-1">
                    <h3 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                      Send a message
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-500 font-medium leading-relaxed">
                      Discuss licensing, sandbox approvals, payment integrations, or submit technical pre-sales inquiries.
                    </p>
                  </div>

                  {/* General Submit Error */}
                  {submitError && (
                    <div className="flex items-start gap-2.5 p-4 bg-rose-50 border border-rose-100 rounded-xl text-rose-800 text-xs sm:text-sm">
                      <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                      <span>{submitError}</span>
                    </div>
                  )}

                  {/* First Name & Last Name */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <input
                        type="text"
                        placeholder="First name"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        className={`w-full px-4 py-3 rounded-xl border bg-slate-50/40 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:ring-4 transition-all duration-200 text-sm ${
                          validationErrors.firstName
                            ? 'border-rose-300 focus:ring-rose-200/50'
                            : 'border-slate-200/80 focus:border-blue-500 focus:ring-blue-500/10'
                        }`}
                      />
                      {validationErrors.firstName && (
                        <p className="text-rose-500 text-xs mt-1.5 ml-1">{validationErrors.firstName}</p>
                      )}
                    </div>
                    <div>
                      <input
                        type="text"
                        placeholder="Last name"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        className={`w-full px-4 py-3 rounded-xl border bg-slate-50/40 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:ring-4 transition-all duration-200 text-sm ${
                          validationErrors.lastName
                            ? 'border-rose-300 focus:ring-rose-200/50'
                            : 'border-slate-200/80 focus:border-blue-500 focus:ring-blue-500/10'
                        }`}
                      />
                      {validationErrors.lastName && (
                        <p className="text-rose-500 text-xs mt-1.5 ml-1">{validationErrors.lastName}</p>
                      )}
                    </div>
                  </div>

                  {/* Email */}
                  <div>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-[18px] w-[18px] text-slate-400 pointer-events-none" />
                      <input
                        type="email"
                        placeholder="Your email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className={`w-full pl-11 pr-4 py-3 rounded-xl border bg-slate-50/40 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:ring-4 transition-all duration-200 text-sm ${
                          validationErrors.email
                            ? 'border-rose-300 focus:ring-rose-200/50'
                            : 'border-slate-200/80 focus:border-blue-500 focus:ring-blue-500/10'
                        }`}
                      />
                    </div>
                    {validationErrors.email && (
                      <p className="text-rose-500 text-xs mt-1.5 ml-1">{validationErrors.email}</p>
                    )}
                  </div>

                  {/* Phone with country code select */}
                  <div>
                    <div className="flex rounded-xl border border-slate-200/80 bg-slate-50/40 focus-within:bg-white focus-within:ring-4 focus-within:ring-blue-500/10 focus-within:border-blue-500 transition-all duration-200 overflow-hidden">
                      <div className="relative shrink-0 border-r border-slate-200/60 bg-transparent">
                        <select
                          value={countryCode}
                          onChange={(e) => setCountryCode(e.target.value)}
                          className="h-full px-3 py-3 text-sm text-slate-700 bg-transparent font-medium focus:outline-none cursor-pointer pr-6 appearance-none"
                        >
                          {COUNTRY_CODES.map((item) => (
                            <option key={item.code} value={item.code} className="text-slate-800">
                              {item.code} ({item.name})
                            </option>
                          ))}
                        </select>
                        <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none border-solid border-t-slate-500 border-t-4 border-x-transparent border-x-4 border-b-0" />
                      </div>
                      <input
                        type="tel"
                        placeholder="Phone number"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value.replace(/[^\d\s\-()]/g, ''))}
                        className="w-full px-4 py-3 bg-transparent text-slate-900 placeholder:text-slate-400 focus:outline-none text-sm"
                      />
                    </div>
                    {validationErrors.phone && (
                      <p className="text-rose-500 text-xs mt-1.5 ml-1">{validationErrors.phone}</p>
                    )}
                  </div>

                  {/* Textarea */}
                  <div>
                    <div className="relative rounded-xl border border-slate-200/80 bg-slate-50/40 focus-within:bg-white focus-within:ring-4 focus-within:ring-blue-500/10 focus-within:border-blue-500 transition-all duration-200">
                      <textarea
                        rows={4}
                        placeholder="How can we help?"
                        value={message}
                        onChange={(e) => {
                          if (e.target.value.length <= 500) {
                            setMessage(e.target.value);
                          }
                        }}
                        className="w-full px-4 pt-3 pb-8 bg-transparent text-slate-900 placeholder:text-slate-400 focus:outline-none text-sm resize-none rounded-xl"
                      />
                      <span className="absolute bottom-2.5 right-4 text-[10px] font-extrabold text-slate-400 bg-white/70 border border-slate-200 px-2 py-0.5 rounded-md">
                        {message.length}/500
                      </span>
                    </div>
                    {validationErrors.message && (
                      <p className="text-rose-500 text-xs mt-1.5 ml-1">{validationErrors.message}</p>
                    )}
                  </div>

                  {/* Terms check box */}
                  <div>
                    <label className="flex items-start gap-3 cursor-pointer group">
                      <input
                        type="checkbox"
                        checked={termsAccepted}
                        onChange={(e) => setTermsAccepted(e.target.checked)}
                        className="sr-only"
                      />
                      <div className={`mt-0.5 h-[18px] w-[18px] shrink-0 rounded border flex items-center justify-center transition-all duration-200 ${
                        termsAccepted 
                          ? 'border-blue-500 bg-blue-600 text-white shadow-[0_0_10px_rgba(59,130,246,0.15)]' 
                          : 'border-slate-300 group-hover:border-slate-400 bg-white'
                      }`}>
                        {termsAccepted && (
                          <svg className="h-3 w-3 stroke-[3]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </div>
                      <span className="text-xs text-slate-500 leading-tight">
                        By contacting us, you agree to our{' '}
                        <a href="#terms" className="font-semibold text-slate-600 hover:text-blue-600 transition-colors">
                          Terms of service
                        </a>{' '}
                        and{' '}
                        <a href="#privacy" className="font-semibold text-slate-600 hover:text-blue-600 transition-colors">
                          Privacy Policy
                        </a>.
                      </span>
                    </label>
                    {validationErrors.terms && (
                      <p className="text-rose-500 text-xs mt-1.5 ml-1">{validationErrors.terms}</p>
                    )}
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 py-3.5 text-sm font-bold text-white shadow-[0_0_15px_rgba(59,130,246,0.1)] hover:shadow-[0_0_25px_rgba(59,130,246,0.25)] transition-all duration-250 active:scale-[0.99] disabled:opacity-85 disabled:pointer-events-none"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin text-white" />
                        <span>Sending Message...</span>
                      </>
                    ) : (
                      <>
                        <span>Send Message</span>
                        <ArrowRight className="h-4 w-4" />
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
