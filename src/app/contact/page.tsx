"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Footer } from "@/components/footer";
import { BackgroundParticles } from "@/components/BackgroundParticles";
import {
  ArrowLeft,
  MapPin,
  Phone,
  Mail,
  Clock,
  Sparkles,
  Send,
  CheckCircle2,
  AlertCircle,
  User,
  MessageSquare,
  ShieldCheck,
  Globe,
  Copy,
  Check,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  MessageCircle,
  Layers,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const contactFaqs = [
  {
    q: "How fast will the Femmeflo team respond to my inquiry?",
    a: "Our corporate and distributor desk typically reviews and responds to all direct messages within 2 to 4 business hours.",
  },
  {
    q: "Do you offer bulk supply and distributor pricing across India?",
    a: "Yes! We work directly with retail chains, pharmacies, NGOs, and regional distributors across all Indian states with dedicated wholesale margins.",
  },
  {
    q: "Can I request physical product samples for institutional testing?",
    a: "Certainly. Send us your firm/institution credentials via this form or email us at sales@femmeflo.in and our sample coordinator will assist you.",
  },
  {
    q: "Where is Femmeflo manufactured?",
    a: "Femmeflo XL sanitary pads are proudly manufactured in India under stringent ISO & GMP certified hygiene laboratories with 100% rash-free cotton materials.",
  },
];

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    queryType: "Bulk Order / Wholesale Enquiry",
    message: "",
  });

  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [ticketId, setTicketId] = useState("84920");
  const [errorMsg, setErrorMsg] = useState("");
  const [copiedPhone, setCopiedPhone] = useState(false);
  const [copiedEmail, setCopiedEmail] = useState(false);
  const [activeFaq, setActiveFaq] = useState<number | null>(null);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    if (errorMsg) setErrorMsg("");
  };

  const handleCopyEmail = () => {
    navigator.clipboard.writeText("sales@femmeflo.in");
    setCopiedEmail(true);
    setTimeout(() => setCopiedEmail(false), 2000);
  };

  const handleCopyPhone = () => {
    navigator.clipboard.writeText("+91 98206 76562");
    setCopiedPhone(true);
    setTimeout(() => setCopiedPhone(false), 2000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.email.trim() || !formData.message.trim()) {
      setErrorMsg("Please fill in all required fields (Name, Email, Message).");
      return;
    }

    setLoading(true);
    setErrorMsg("");

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || "Failed to send message.");
      }

      setTicketId(Math.floor(10000 + Math.random() * 90000).toString());
      setSubmitted(true);
      setFormData({
        name: "",
        email: "",
        phone: "",
        queryType: "Bulk Order / Wholesale Enquiry",
        message: "",
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "An unexpected error occurred. Please try again.";
      setErrorMsg(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-white font-[family-name:var(--font-jakarta)] flex flex-col justify-between overflow-x-hidden">
      <div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-2">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs font-bold text-zinc-500 hover:text-[#E61C5D] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>
        </div>

        {/* Hero Header Section with Floating Background Elements */}
        <section className="relative w-full bg-gradient-to-b from-[#FFF9F7] via-[#FDF3F5] to-white pt-10 sm:pt-16 pb-16 px-4 sm:px-6 lg:px-8 border-b border-rose-100/60 overflow-hidden">
          <div className="absolute top-0 right-[-5%] w-[550px] h-[550px] bg-rose-200/30 rounded-full blur-[130px] pointer-events-none -z-10" />
          <div className="absolute bottom-0 left-[-5%] w-[550px] h-[550px] bg-emerald-100/40 rounded-full blur-[130px] pointer-events-none -z-10" />
          
          <BackgroundParticles />

          <div className="max-w-7xl mx-auto text-center flex flex-col items-center relative z-10">
            {/* Pill Badge */}
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-rose-100/90 border border-rose-200 text-xs font-extrabold text-[#E61C5D] shadow-2xs mb-4"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#E61C5D]" />
              <span>DIRECT CONTACT &amp; SUPPORT</span>
            </motion.div>

            {/* Title */}
            <motion.h1
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-zinc-900 font-[family-name:var(--font-playfair)] leading-[1.12]"
            >
              Let&apos;s Start a{" "}
              <span className="text-[#E61C5D] italic font-[family-name:var(--font-playfair)] font-normal">
                Conversation.
              </span>
            </motion.h1>

            {/* Subtitle */}
            <motion.p
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="mt-4 text-zinc-600 text-base sm:text-lg max-w-2xl leading-relaxed"
            >
              Have questions about Femmeflo XL, bulk orders, dealership partnerships, or customer support? Send us a message below.
            </motion.p>

            {/* 4 Quick Stat Badges */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="mt-8 flex flex-wrap items-center justify-center gap-3 sm:gap-6 text-xs sm:text-sm font-semibold text-zinc-700"
            >
              <div className="px-4 py-2 rounded-2xl bg-white/80 border border-rose-100 shadow-2xs flex items-center gap-2">
                <Clock className="w-4 h-4 text-[#156035]" />
                <span>Fast 2-4 Hr Response</span>
              </div>

              <div className="px-4 py-2 rounded-2xl bg-white/80 border border-rose-100 shadow-2xs flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[#E61C5D]" />
                <span>Direct Factory Support</span>
              </div>

              <div className="px-4 py-2 rounded-2xl bg-white/80 border border-rose-100 shadow-2xs flex items-center gap-2">
                <Globe className="w-4 h-4 text-[#156035]" />
                <span>Pan-India Distribution</span>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Main 2-Column Form & Corporate Info Section */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-20 relative">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-start">
            
            {/* Left 7 Columns: Premium Interactive Contact Form */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="lg:col-span-7 bg-white/95 backdrop-blur-2xl rounded-3xl p-6 sm:p-10 border border-rose-100/90 shadow-[0_25px_60px_rgba(0,0,0,0.06)] relative overflow-hidden"
            >
              <div className="w-full h-1.5 bg-gradient-to-r from-[#156035] via-[#E61C5D] to-rose-400 absolute top-0 left-0" />

              <div className="mb-6">
                <h2 className="text-2xl sm:text-3xl font-bold text-zinc-900 font-[family-name:var(--font-playfair)]">
                  Send Your Query
                </h2>
                <p className="text-zinc-500 text-sm mt-1">
                  Complete the details below to send us your message.
                </p>
              </div>

              {submitted ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-[#EBF6EF] border border-[#CCE9D7] rounded-3xl p-8 text-center flex flex-col items-center space-y-4 my-6 shadow-inner"
                >
                  <div className="w-16 h-16 rounded-full bg-[#156035] text-white flex items-center justify-center shadow-lg">
                    <CheckCircle2 className="w-9 h-9" />
                  </div>
                  <h3 className="text-2xl font-bold text-[#156035] font-[family-name:var(--font-playfair)]">
                    Query Sent Successfully!
                  </h3>
                  <p className="text-zinc-700 text-sm max-w-md leading-relaxed">
                    Thank you for reaching out to Femmeflo. Your message has been logged and forwarded to our sales team. We will get back to you shortly.
                  </p>
                  <div className="px-4 py-2 bg-white rounded-xl border border-emerald-200 text-xs font-mono text-[#156035]">
                    Reference Ticket: FF-{ticketId}
                  </div>
                  <button
                    onClick={() => setSubmitted(false)}
                    className="mt-2 px-6 py-3 rounded-full bg-[#156035] text-white font-bold text-xs uppercase tracking-wider hover:bg-[#0f4727] transition-all shadow-md cursor-pointer"
                  >
                    Submit Another Query
                  </button>
                </motion.div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5">
                  {errorMsg && (
                    <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-[#E61C5D] text-xs font-semibold flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{errorMsg}</span>
                    </div>
                  )}

                  {/* Name & Email */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-xs font-extrabold uppercase tracking-wider text-zinc-700 mb-2">
                        Full Name <span className="text-[#E61C5D]">*</span>
                      </label>
                      <div className="relative">
                        <User className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          name="name"
                          value={formData.name}
                          onChange={handleChange}
                          placeholder="e.g. Ananya Sharma"
                          required
                          className="w-full pl-10 pr-4 py-3 rounded-xl border border-zinc-200 focus:border-[#E61C5D] focus:ring-2 focus:ring-rose-100 text-sm font-medium text-zinc-900 outline-none transition-all bg-white"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-extrabold uppercase tracking-wider text-zinc-700 mb-2">
                        Email Address <span className="text-[#E61C5D]">*</span>
                      </label>
                      <div className="relative">
                        <Mail className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input
                          type="email"
                          name="email"
                          value={formData.email}
                          onChange={handleChange}
                          placeholder="ananya@example.com"
                          required
                          className="w-full pl-10 pr-4 py-3 rounded-xl border border-zinc-200 focus:border-[#E61C5D] focus:ring-2 focus:ring-rose-100 text-sm font-medium text-zinc-900 outline-none transition-all bg-white"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Query Category Dropdown & Phone Row */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-xs font-extrabold uppercase tracking-wider text-zinc-700 mb-2">
                        SELECTED CATEGORY <span className="text-[#E61C5D]">*</span>
                      </label>
                      <div className="relative">
                        <Layers className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                        <select
                          name="queryType"
                          value={formData.queryType}
                          onChange={handleChange}
                          required
                          className="w-full pl-10 pr-10 py-3 rounded-xl border border-zinc-200 focus:border-[#E61C5D] focus:ring-2 focus:ring-rose-100 text-sm font-medium text-zinc-900 outline-none transition-all bg-white appearance-none cursor-pointer"
                        >
                          <option value="Bulk Order / Wholesale Enquiry">Bulk Order / Wholesale Enquiry</option>
                          <option value="Distributor & Dealership Opportunity">Distributor & Dealership Opportunity</option>
                          <option value="Product Feedback & Support">Product Feedback & Support</option>
                          <option value="General Inquiry">General Inquiry</option>
                        </select>
                        <ChevronDown className="w-4 h-4 text-zinc-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-extrabold uppercase tracking-wider text-zinc-700 mb-2">
                        Phone / WhatsApp No.
                      </label>
                      <div className="relative">
                        <Phone className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input
                          type="tel"
                          name="phone"
                          value={formData.phone}
                          onChange={handleChange}
                          placeholder="+91 98765 43210"
                          className="w-full pl-10 pr-4 py-3 rounded-xl border border-zinc-200 focus:border-[#E61C5D] focus:ring-2 focus:ring-rose-100 text-sm font-medium text-zinc-900 outline-none transition-all bg-white"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Message Field with Character Count */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-xs font-extrabold uppercase tracking-wider text-zinc-700">
                        Your Message / Details <span className="text-[#E61C5D]">*</span>
                      </label>
                      <span className="text-[11px] text-zinc-400 font-medium">
                        {formData.message.length} / 500 chars
                      </span>
                    </div>
                    <div className="relative">
                      <MessageSquare className="w-4 h-4 text-zinc-400 absolute left-3.5 top-4" />
                      <textarea
                        name="message"
                        value={formData.message}
                        onChange={handleChange}
                        maxLength={500}
                        rows={4}
                        placeholder="Detail your requirements, location, quantity, or questions..."
                        required
                        className="w-full pl-10 pr-4 py-3 rounded-xl border border-zinc-200 focus:border-[#E61C5D] focus:ring-2 focus:ring-rose-100 text-sm font-medium text-zinc-900 outline-none transition-all resize-none bg-white"
                      />
                    </div>
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-4 rounded-2xl bg-gradient-to-r from-[#E61C5D] via-rose-600 to-[#E61C5D] text-white font-extrabold text-sm uppercase tracking-wider flex items-center justify-center gap-2.5 shadow-lg hover:shadow-xl hover:scale-[1.01] transition-all cursor-pointer disabled:opacity-60"
                  >
                    {loading ? (
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        <span>Send Message &amp; Submit Query</span>
                      </>
                    )}
                  </button>
                </form>
              )}
            </motion.div>

            {/* Right 5 Columns: Corporate Details Card */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="lg:col-span-5 space-y-6"
            >
              {/* Corporate Card */}
              <div className="bg-gradient-to-br from-white via-rose-50/30 to-emerald-50/20 rounded-3xl p-6 sm:p-8 border border-rose-100 shadow-[0_20px_50px_rgba(0,0,0,0.04)] space-y-6 relative overflow-hidden">
                <div className="w-full h-1 bg-gradient-to-r from-emerald-500 to-[#E61C5D] absolute top-0 left-0" />

                <div>
                  <span className="text-[11px] font-extrabold tracking-widest text-[#156035] uppercase">
                    CORPORATE HEADQUARTERS
                  </span>
                  <h3 className="text-xl sm:text-2xl font-bold font-[family-name:var(--font-playfair)] text-zinc-900 mt-1">
                    Masako Enterprises Private Limited
                  </h3>
                </div>

                <div className="space-y-4 text-sm">
                  {/* Thane Office */}
                  <div className="p-3.5 rounded-2xl bg-white/90 border border-zinc-100 shadow-2xs flex items-start gap-3.5">
                    <div className="w-9 h-9 rounded-xl bg-emerald-100 text-[#156035] flex items-center justify-center shrink-0 mt-0.5">
                      <MapPin className="w-4.5 h-4.5" />
                    </div>
                    <div>
                      <h4 className="font-extrabold text-xs uppercase tracking-wider text-[#156035]">THANE OFFICE</h4>
                      <p className="text-zinc-600 text-xs font-medium leading-relaxed mt-0.5">
                        101, Shree Sankalp, G B Road, Thane West, Maharashtra - 400615
                      </p>
                    </div>
                  </div>

                  {/* Navi Mumbai MBP Office */}
                  <div className="p-3.5 rounded-2xl bg-white/90 border border-zinc-100 shadow-2xs flex items-start gap-3.5">
                    <div className="w-9 h-9 rounded-xl bg-rose-100 text-[#E61C5D] flex items-center justify-center shrink-0 mt-0.5">
                      <MapPin className="w-4.5 h-4.5" />
                    </div>
                    <div>
                      <h4 className="font-extrabold text-xs uppercase tracking-wider text-[#E61C5D]">NAVI MUMBAI OFFICE</h4>
                      <p className="text-zinc-600 text-xs font-medium leading-relaxed mt-0.5">
                        207 Building no 1 Millenium Business Park, Sector-2 Mahape Navi Mumbai 400710
                      </p>
                    </div>
                  </div>

                  {/* Phone & Copy */}
                  <div className="p-3.5 rounded-2xl bg-white/90 border border-zinc-100 shadow-2xs flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-emerald-100 text-[#156035] flex items-center justify-center shrink-0">
                        <Phone className="w-4.5 h-4.5" />
                      </div>
                      <div>
                        <h4 className="font-extrabold text-xs uppercase tracking-wider text-[#156035]">PHONE &amp; SUPPORT</h4>
                        <a href="tel:+919820676562" className="text-zinc-900 font-bold hover:text-[#E61C5D] transition-colors text-sm">
                          +91 98206 76562
                        </a>
                      </div>
                    </div>
                    <button
                      onClick={handleCopyPhone}
                      className="p-2 rounded-xl text-zinc-400 hover:text-[#156035] hover:bg-emerald-50 transition-all cursor-pointer"
                      title="Copy Phone Number"
                    >
                      {copiedPhone ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>

                  {/* Email & Copy */}
                  <div className="p-3.5 rounded-2xl bg-white/90 border border-zinc-100 shadow-2xs flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-rose-100 text-[#E61C5D] flex items-center justify-center shrink-0">
                        <Mail className="w-4.5 h-4.5" />
                      </div>
                      <div>
                        <h4 className="font-extrabold text-xs uppercase tracking-wider text-[#E61C5D]">EMAIL ENQUIRIES</h4>
                        <a href="mailto:sales@femmeflo.in" className="text-zinc-900 font-bold hover:text-[#E61C5D] transition-colors text-sm block">
                          sales@femmeflo.in
                        </a>
                      </div>
                    </div>
                    <button
                      onClick={handleCopyEmail}
                      className="p-2 rounded-xl text-zinc-400 hover:text-[#E61C5D] hover:bg-rose-50 transition-all cursor-pointer"
                      title="Copy Email Address"
                    >
                      {copiedEmail ? <Check className="w-4 h-4 text-rose-600" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Direct WhatsApp CTA Button */}
                <div className="pt-2">
                  <a
                    href="https://wa.me/919820676562?text=Hello%20Femmeflo%20Team!%20I%20have%20an%20enquiry%20regarding%20Femmeflo%20sanitary%20pads."
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-3.5 px-4 rounded-2xl bg-[#25D366] text-white font-extrabold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-md hover:bg-[#20bd5a] transition-all cursor-pointer group"
                  >
                    <MessageCircle className="w-4.5 h-4.5" />
                    <span>Chat on WhatsApp Directly</span>
                    <span className="ml-auto text-[10px] bg-white/20 px-2 py-0.5 rounded-full font-normal">🟢 Online</span>
                  </a>
                </div>
              </div>

              {/* Google Maps External Button */}
              <a
                href="https://maps.google.com/?q=207+Building+no+1+Millenium+Business+Park,+Sector-2,+Mahape,+Navi+Mumbai+400710"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full p-4 rounded-3xl bg-white border border-rose-100 shadow-2xs flex items-center justify-between text-xs font-extrabold text-zinc-800 hover:text-[#E61C5D] hover:border-rose-300 transition-all group cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-rose-50 text-[#E61C5D] flex items-center justify-center shrink-0">
                    <MapPin className="w-4.5 h-4.5" />
                  </div>
                  <span>View Navi Mumbai Office on Google Maps</span>
                </div>
                <ExternalLink className="w-4 h-4 text-zinc-400 group-hover:text-[#E61C5D] transition-colors" />
              </a>
            </motion.div>

          </div>
        </section>

        {/* Quick FAQ Section */}
        <section className="bg-gradient-to-b from-white to-[#FFF9F7] py-12 sm:py-16 border-t border-rose-100/60">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-10">
              <h2 className="text-2xl sm:text-3xl font-bold font-[family-name:var(--font-playfair)] text-zinc-900">
                Frequently Asked Questions
              </h2>
              <p className="text-zinc-500 text-sm mt-1">
                Quick answers to common inquiries before submitting your message.
              </p>
            </div>

            <div className="space-y-4">
              {contactFaqs.map((faq, idx) => {
                const isOpen = activeFaq === idx;
                return (
                  <div
                    key={idx}
                    className="bg-white rounded-2xl border border-rose-100 overflow-hidden shadow-2xs transition-all"
                  >
                    <button
                      onClick={() => setActiveFaq(isOpen ? null : idx)}
                      className="w-full p-5 text-left flex items-center justify-between font-bold text-sm text-zinc-900 cursor-pointer"
                    >
                      <span>{faq.q}</span>
                      {isOpen ? (
                        <ChevronUp className="w-5 h-5 text-[#E61C5D] shrink-0" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-zinc-400 shrink-0" />
                      )}
                    </button>
                    <AnimatePresence>
                      {isOpen && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          className="px-5 pb-5 text-xs sm:text-sm text-zinc-600 leading-relaxed border-t border-rose-50 pt-3"
                        >
                          {faq.a}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      </div>

      <Footer />
    </main>
  );
}
