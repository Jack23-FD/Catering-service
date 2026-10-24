import React from 'react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import {
  Calendar,
  Users,
  CheckCircle2,
  Clock,
  ArrowRight,
  ShieldCheck,
  MapPin,
  Sparkles,
  Banknote,
  UtensilsCrossed,
} from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle();

    if (profile?.role === 'admin') {
      redirect('/admin/dashboard');
    } else {
      redirect('/worker/dashboard');
    }
  }

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-[#29251F] flex flex-col justify-between selection:bg-[#A8D5C2] selection:text-[#282923]">
      {/* Top Navigation */}
      <header className="border-b border-[#E8E0D7] bg-[#FFFFFF]/90 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          {/* Brand */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-lg bg-[#282923] border border-[#E8E0D7] flex items-center justify-center shadow-xs">
              <span className="font-serif text-[#B87333] text-xl font-bold">C</span>
              <span className="w-1.5 h-1.5 rounded-full bg-[#A8D5C2] -ml-0.5 mt-1.5"></span>
            </div>
            <div>
              <span className="font-serif text-2xl tracking-tight text-[#29251F]">
                Cater<span className="font-sans font-semibold text-[#B87333]">Connect</span>
              </span>
              <span className="block text-[10px] uppercase tracking-[0.2em] font-semibold text-[#716A62] -mt-1">
                Hospitality Staffing System
              </span>
            </div>
          </div>

          {/* Action Links */}
          <div className="flex items-center space-x-4">
            <Link
              href="/login"
              className="text-sm font-medium text-[#716A62] hover:text-[#29251F] px-3 py-2 transition-colors"
            >
              Sign In
            </Link>
            <Link
              href="/register"
              className="inline-flex items-center gap-2 text-sm font-semibold bg-[#B87333] hover:bg-[#9E5F27] text-white px-4 py-2.5 rounded-lg shadow-xs transition-all duration-150"
            >
              <span>Join Workforce</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          {/* Left Column: Editorial Headline & Value Prop */}
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-[#F9EFE6] text-[#B87333] border border-[#E5C3A5]">
              <Sparkles className="w-3.5 h-3.5 text-[#B87333]" />
              <span>Boutique Hospitality & Catering Staffing</span>
            </div>

            <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl text-[#29251F] leading-[1.12] tracking-tight">
              Where premier catering meets dedicated event staff.
            </h1>

            <p className="text-base sm:text-lg text-[#716A62] max-w-xl leading-relaxed">
              CaterConnect pairs upscale banquets, weddings, and corporate dining teams with skilled, verified part-time servers, bartenders, and kitchen associates — with transparent wages and verified rosters.
            </p>

            {/* CTAs */}
            <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <Link
                href="/register"
                className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-lg text-sm font-semibold bg-[#B87333] hover:bg-[#9E5F27] text-white shadow-xs transition-all duration-150 group"
              >
                <span>Register as Part-Time Worker</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>

              <Link
                href="/login"
                className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-lg text-sm font-semibold bg-[#FFFFFF] hover:bg-[#FAF8F5] text-[#29251F] border border-[#E8E0D7] hover:border-[#B87333]/40 shadow-xs transition-all duration-150"
              >
                <span>Catering Business Login</span>
              </Link>
            </div>

            {/* Quick Guarantees */}
            <div className="pt-6 border-t border-[#E8E0D7] grid grid-cols-3 gap-4 text-xs">
              <div className="space-y-1">
                <span className="font-serif text-lg font-bold text-[#29251F]">100%</span>
                <p className="text-[#716A62]">Direct Contact & Verified Phone Numbers</p>
              </div>
              <div className="space-y-1">
                <span className="font-serif text-lg font-bold text-[#B87333]">₹ Clear</span>
                <p className="text-[#716A62]">Hourly, Daily, or Per-Serve Pay Rates</p>
              </div>
              <div className="space-y-1">
                <span className="font-serif text-lg font-bold text-[#36785D]">Live Maps</span>
                <p className="text-[#716A62]">Turn-by-turn Venue Navigation</p>
              </div>
            </div>
          </div>

          {/* Right Column: Architectural Preview Card */}
          <div className="lg:col-span-5">
            <div className="bg-[#FFFFFF] rounded-2xl border border-[#E8E0D7] p-6 sm:p-7 shadow-[0_4px_20px_rgba(40,41,35,0.06)] space-y-5">
              <div className="flex items-center justify-between pb-4 border-b border-[#E8E0D7]">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#A8D5C2]"></div>
                  <span className="text-xs font-semibold text-[#716A62] uppercase tracking-wider">
                    Live Shift Posting
                  </span>
                </div>
                <span className="text-[11px] font-semibold text-[#36785D] bg-[#EBF5F0] px-2.5 py-0.5 rounded-md border border-[#A8D5C2]">
                  Available Today
                </span>
              </div>

              <div>
                <span className="text-xs font-semibold text-[#B87333] uppercase tracking-wider">
                  Grand Banquet Event
                </span>
                <h3 className="font-serif text-xl sm:text-2xl text-[#29251F] mt-1">
                  Royal Garden Heritage Gala
                </h3>
                <p className="text-xs text-[#716A62] mt-1 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-[#B87333]" />
                  Taj Connemara & Convention Center, Chennai
                </p>
              </div>

              {/* Specs Grid */}
              <div className="grid grid-cols-2 gap-3 p-3.5 rounded-xl bg-[#FAF8F5] border border-[#E8E0D7] text-xs">
                <div>
                  <span className="text-[11px] text-[#716A62] block">Duration</span>
                  <span className="font-semibold text-[#29251F] flex items-center gap-1 mt-0.5">
                    <Clock className="w-3.5 h-3.5 text-[#B87333]" />
                    2 Consecutive Days
                  </span>
                </div>
                <div>
                  <span className="text-[11px] text-[#716A62] block">Compensation</span>
                  <span className="font-semibold text-[#36785D] flex items-center gap-1 mt-0.5">
                    <Banknote className="w-3.5 h-3.5 text-[#36785D]" />
                    ₹1,200 / Day
                  </span>
                </div>
              </div>

              {/* Staffing Status */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-medium">
                  <span className="text-[#716A62]">Crew Confirmed</span>
                  <span className="text-[#29251F]">8 of 10 Positions Filled</span>
                </div>
                <div className="w-full bg-[#E8E0D7] h-2 rounded-full overflow-hidden">
                  <div className="bg-[#B87333] h-full rounded-full" style={{ width: '80%' }}></div>
                </div>
              </div>

              {/* Sample Action */}
              <Link
                href="/login"
                className="w-full py-2.5 px-4 rounded-lg text-xs font-semibold text-center text-[#282923] bg-[#FAF8F5] hover:bg-[#F9EFE6] hover:text-[#B87333] border border-[#E8E0D7] hover:border-[#E5C3A5] transition-all block"
              >
                Sign in to view open shifts & roster details →
              </Link>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-[#E8E0D7] bg-[#FFFFFF] py-8 text-center text-xs text-[#716A62]">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© {new Date().getFullYear()} CaterConnect. Handcrafted event staffing for contemporary hospitality.</p>
          <div className="flex items-center space-x-6 text-[#716A62]">
            <Link href="/login" className="hover:text-[#B87333] transition-colors">Admin Portal</Link>
            <Link href="/register" className="hover:text-[#B87333] transition-colors">Worker Portal</Link>
            <span>Verified Credentials</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
