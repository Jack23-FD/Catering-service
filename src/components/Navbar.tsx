'use client';

import React from 'react';
import Link from 'next/link';
import { ShieldCheck, UserCheck, LogOut, ArrowRight, Sparkles } from 'lucide-react';
import { signOut } from '@/app/auth/actions';

interface NavbarProps {
  userEmail?: string | null;
  userName?: string | null;
  role?: 'worker' | 'admin' | null;
}

export default function Navbar({ userEmail, userName, role }: NavbarProps) {
  return (
    <header className="sticky top-0 z-40 w-full bg-[#FFFFFF]/95 backdrop-blur-md border-b border-[#E8E0D7] shadow-[0_1px_3px_rgba(40,41,35,0.03)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Logo & Wordmark */}
        <Link
          href="/"
          className="flex items-center space-x-3 group transition-transform duration-150"
        >
          {/* Distinctive Copper & Mint Crest */}
          <div className="w-9 h-9 rounded-lg bg-[#282923] border border-[#E8E0D7] flex items-center justify-center shadow-xs group-hover:border-[#B87333] transition-colors">
            <span className="font-serif text-[#B87333] text-lg font-bold tracking-tight">C</span>
            <span className="w-1.5 h-1.5 rounded-full bg-[#A8D5C2] -ml-0.5 mt-1"></span>
          </div>

          <div>
            <div className="flex items-baseline space-x-1">
              <span className="font-serif text-xl tracking-tight text-[#29251F] font-normal">
                Cater<span className="font-sans font-semibold text-[#B87333]">Connect</span>
              </span>
            </div>
            <span className="block text-[9px] uppercase tracking-[0.2em] font-semibold text-[#716A62] -mt-1">
              Hospitality Staffing
            </span>
          </div>
        </Link>

        {/* Right Navigation / User Actions */}
        <div className="flex items-center space-x-3 sm:space-x-5">
          {userName || userEmail ? (
            <div className="flex items-center space-x-3 sm:space-x-4">
              {/* Role Badge */}
              {role === 'admin' ? (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold tracking-wide uppercase bg-[#F9EFE6] text-[#B87333] border border-[#E5C3A5]">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#B87333]" />
                  Admin
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold tracking-wide uppercase bg-[#EBF5F0] text-[#235540] border border-[#A8D5C2]">
                  <UserCheck className="w-3.5 h-3.5 text-[#36785D]" />
                  Staff
                </span>
              )}

              {/* User Identity Preview */}
              <div className="hidden sm:block text-right">
                <p className="text-xs font-semibold text-[#29251F] truncate max-w-[160px]">
                  {userName || 'Account'}
                </p>
                <p className="text-[11px] text-[#716A62] truncate max-w-[160px]">
                  {userEmail}
                </p>
              </div>

              {/* Sign Out Button */}
              <form action={signOut}>
                <button
                  type="submit"
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-[#716A62] hover:text-[#B87333] bg-[#FAF8F5] hover:bg-[#F9EFE6] px-3 py-1.5 rounded-lg border border-[#E8E0D7] hover:border-[#E5C3A5] transition-all duration-150"
                  title="Sign Out"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span className="hidden md:inline">Sign Out</span>
                </button>
              </form>
            </div>
          ) : (
            <div className="flex items-center space-x-2 sm:space-x-3">
              <Link
                href="/login"
                className="text-xs sm:text-sm font-medium text-[#716A62] hover:text-[#29251F] px-3 py-1.5 rounded-lg transition-colors"
              >
                Sign In
              </Link>
              <Link
                href="/register"
                className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold bg-[#B87333] hover:bg-[#9E5F27] text-white px-3.5 py-1.5 rounded-lg shadow-xs transition-all duration-150"
              >
                <span>Join as Worker</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
