import React from 'react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { ChefHat, ShieldCheck, UserCheck, ArrowRight, Sparkles, Lock } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    // Redirect authenticated users to their corresponding dashboard
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
    <div className="min-h-screen bg-gradient-to-b from-purple-950 via-purple-900 to-indigo-950 text-white flex flex-col justify-between relative overflow-hidden">
      {/* Decorative Glows */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 -right-32 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl"></div>
      </div>

      {/* Header */}
      <header className="relative z-10 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-purple-600 flex items-center justify-center shadow-lg shadow-purple-900/40">
            <ChefHat className="w-6 h-6 text-white" />
          </div>
          <div>
            <span className="font-bold text-lg tracking-tight text-white flex items-center gap-1.5">
              Catering<span className="text-purple-300 font-medium">Workers</span>
            </span>
            <span className="block text-[10px] text-purple-300 uppercase tracking-widest font-semibold">
              Booking Platform
            </span>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <Link
            href="/login"
            className="text-xs sm:text-sm font-medium text-purple-200 hover:text-white px-3.5 py-2 rounded-xl transition-colors"
          >
            Sign In
          </Link>
          <Link
            href="/register"
            className="text-xs sm:text-sm font-semibold bg-purple-600 hover:bg-purple-500 text-white px-4 py-2 rounded-xl shadow-md shadow-purple-900/30 transition-all"
          >
            Register
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <main className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold bg-purple-800/80 text-purple-200 border border-purple-700/80 mb-6 backdrop-blur-md">
          <Sparkles className="w-4 h-4 text-purple-300" />
          <span>Professional Workforce Scheduling System</span>
        </div>

        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-tight sm:leading-none">
          Catering Worker <br className="hidden sm:inline" />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-200 via-white to-purple-300">
            Booking & Authentication
          </span>
        </h1>

        <p className="mt-6 text-base sm:text-lg text-purple-200 max-w-2xl mx-auto leading-relaxed">
          Secure, role-based platform designed for catering staff, banquet servers, and event administrators. Access verified shifts and manage workforce operations.
        </p>

        {/* Action Buttons */}
        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/register"
            className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-3.5 rounded-xl text-base font-semibold text-white bg-purple-600 hover:bg-purple-500 shadow-xl shadow-purple-900/50 transition-all duration-150 group"
          >
            Register as Worker
            <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
          </Link>

          <Link
            href="/login"
            className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-3.5 rounded-xl text-base font-semibold text-purple-100 bg-white/10 hover:bg-white/20 border border-white/20 backdrop-blur-md transition-all duration-150"
          >
            Sign In to Account
          </Link>
        </div>

        {/* Feature Badges */}
        <div className="mt-16 grid grid-cols-1 sm:grid-cols-3 gap-4 text-left">
          <div className="p-5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
            <div className="w-9 h-9 rounded-xl bg-purple-500/20 flex items-center justify-center mb-3">
              <UserCheck className="w-5 h-5 text-purple-300" />
            </div>
            <h3 className="font-semibold text-white text-sm">Worker Dashboard</h3>
            <p className="text-xs text-purple-200/80 mt-1">
              Dedicated portal for catering staff to view profile info and upcoming event shifts.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 flex items-center justify-center mb-3">
              <ShieldCheck className="w-5 h-5 text-amber-300" />
            </div>
            <h3 className="font-semibold text-white text-sm">Admin Control</h3>
            <p className="text-xs text-purple-200/80 mt-1">
              Protected administrative area with server-side authorization and roster management.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 flex items-center justify-center mb-3">
              <Lock className="w-5 h-5 text-emerald-300" />
            </div>
            <h3 className="font-semibold text-white text-sm">Row Level Security</h3>
            <p className="text-xs text-purple-200/80 mt-1">
              Database-enforced security policies preventing privilege escalation and data leaks.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 text-center text-xs text-purple-300/60 border-t border-purple-800/40">
        Catering Worker Booking Platform &copy; {new Date().getFullYear()}. Secure Supabase SSR Authentication.
      </footer>
    </div>
  );
}
