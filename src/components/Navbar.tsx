'use client';

import React from 'react';
import Link from 'next/link';
import { ChefHat, ShieldCheck, UserCheck, LogOut } from 'lucide-react';
import { signOut } from '@/app/auth/actions';

interface NavbarProps {
  userEmail?: string | null;
  userName?: string | null;
  role?: 'worker' | 'admin' | null;
}

export default function Navbar({ userEmail, userName, role }: NavbarProps) {
  return (
    <header className="sticky top-0 z-40 w-full backdrop-blur-md bg-purple-950/95 text-white border-b border-purple-800 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <Link
          href="/"
          className="flex items-center space-x-3 group transition-transform duration-150 hover:scale-[1.01]"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-500 flex items-center justify-center shadow-md shadow-purple-900/40">
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
        </Link>

        {/* Right Nav / Actions */}
        <div className="flex items-center space-x-3 sm:space-x-4">
          {userName || userEmail ? (
            <div className="flex items-center space-x-3 sm:space-x-4">
              {/* Role Badge */}
              {role === 'admin' ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-400/20 text-amber-200 border border-amber-400/30">
                  <ShieldCheck className="w-3.5 h-3.5 text-amber-300" />
                  Admin
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-purple-800/80 text-purple-200 border border-purple-700">
                  <UserCheck className="w-3.5 h-3.5 text-purple-300" />
                  Worker
                </span>
              )}

              {/* User Name Preview */}
              <div className="hidden md:block text-right">
                <p className="text-xs font-semibold text-white truncate max-w-[150px]">
                  {userName || 'User'}
                </p>
                <p className="text-[11px] text-purple-300 truncate max-w-[150px]">
                  {userEmail}
                </p>
              </div>

              {/* Logout button */}
              <form action={signOut}>
                <button
                  type="submit"
                  className="inline-flex items-center gap-1.5 text-xs font-medium bg-white/10 hover:bg-white/20 text-purple-100 hover:text-white px-3 py-1.5 rounded-lg border border-purple-700/60 transition-all duration-150"
                  title="Sign Out"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Logout</span>
                </button>
              </form>
            </div>
          ) : (
            <div className="flex items-center space-x-2 sm:space-x-3">
              <Link
                href="/login"
                className="text-xs sm:text-sm font-medium text-purple-200 hover:text-white px-3 py-1.5 rounded-lg transition-colors"
              >
                Sign In
              </Link>
              <Link
                href="/register"
                className="text-xs sm:text-sm font-semibold bg-purple-600 hover:bg-purple-500 text-white px-3.5 py-1.5 rounded-lg shadow-sm transition-all duration-150"
              >
                Register as Worker
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
