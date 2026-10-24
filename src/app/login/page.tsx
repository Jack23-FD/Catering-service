'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Mail, AlertCircle, ArrowRight, Loader2, CheckCircle2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import PasswordInput from '@/components/PasswordInput';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTarget = searchParams.get('redirect');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      setError('Please provide both your email address and password.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const supabase = createClient();

      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (signInError) {
        if (signInError.message.includes('Invalid login credentials')) {
          setError('Invalid email or password. Please verify your credentials and try again.');
        } else if (signInError.message.toLowerCase().includes('email not confirmed')) {
          setError('Your email has not been confirmed yet. Please verify your email inbox before logging in.');
        } else {
          setError(signInError.message);
        }
        setIsLoading(false);
        return;
      }

      if (!data.user) {
        setError('Authentication failed. No user record found.');
        setIsLoading(false);
        return;
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('role, full_name')
        .eq('id', data.user.id)
        .maybeSingle();

      setSuccess('Authentication successful! Directing to workspace...');

      const role = profile?.role;
      let destination = '/worker/dashboard';

      if (role === 'admin') {
        destination = redirectTarget && redirectTarget.startsWith('/admin')
          ? redirectTarget
          : '/admin/dashboard';
      } else {
        destination = redirectTarget && redirectTarget.startsWith('/worker')
          ? redirectTarget
          : '/worker/dashboard';
      }

      setTimeout(() => {
        router.push(destination);
        router.refresh();
      }, 700);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'An unexpected error occurred while logging in.';
      setError(message);
      setIsLoading(false);
    }
  };

  return (
    <div className="mt-8 bg-[#FFFFFF] p-7 sm:p-9 rounded-2xl border border-[#E8E0D7] shadow-[0_4px_24px_rgba(40,41,35,0.04)]">
      {/* Success Notification */}
      {success && (
        <div className="mb-6 p-3.5 rounded-xl bg-[#EBF5F0] border border-[#A8D5C2] flex items-start gap-2.5">
          <CheckCircle2 className="w-4 h-4 text-[#36785D] shrink-0 mt-0.5" />
          <div className="text-xs text-[#235540] font-medium">{success}</div>
        </div>
      )}

      {/* Error Notification */}
      {error && (
        <div className="mb-6 p-3.5 rounded-xl bg-red-50/70 border border-[#B94A48]/30 flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 text-[#B94A48] shrink-0 mt-0.5" />
          <div className="text-xs text-[#B94A48] font-medium">{error}</div>
        </div>
      )}

      <form className="space-y-4" onSubmit={handleLogin} noValidate>
        {/* Email Address */}
        <div className="space-y-1.5 text-left">
          <label
            htmlFor="login-email"
            className="block text-xs font-semibold text-[#29251F]"
          >
            Email Address
          </label>
          <div className="relative rounded-lg">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#716A62]">
              <Mail className="h-4 w-4" />
            </div>
            <input
              id="login-email"
              name="email"
              type="email"
              autoComplete="email"
              required
              placeholder="worker@hospitality.com or admin@caterconnect.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="block w-full pl-10 pr-3.5 py-2.5 text-sm rounded-lg border border-[#E8E0D7] text-[#29251F] placeholder-[#9E968D] focus:border-[#B87333] focus:ring-2 focus:ring-[#B87333]/15 bg-white hover:border-[#B87333]/40 transition-all outline-none"
            />
          </div>
        </div>

        {/* Password */}
        <PasswordInput
          id="login-password"
          name="password"
          label="Password"
          placeholder="Enter your account password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isLoading}
          className="w-full mt-2 flex justify-center items-center py-2.5 px-4 rounded-lg text-sm font-semibold text-white bg-[#B87333] hover:bg-[#9E5F27] focus:outline-none focus:ring-2 focus:ring-[#B87333]/30 disabled:opacity-60 disabled:cursor-not-allowed shadow-xs transition-all duration-150 group"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Signing In...
            </>
          ) : (
            <>
              Sign In to Workspace
              <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-0.5 transition-transform" />
            </>
          )}
        </button>
      </form>

      {/* Switch to Register */}
      <div className="mt-6 pt-5 border-t border-[#E8E0D7] text-center">
        <p className="text-xs text-[#716A62]">
          Looking for part-time catering shifts?{' '}
          <Link
            href="/register"
            className="font-semibold text-[#B87333] hover:text-[#9E5F27] hover:underline transition-colors"
          >
            Register as staff here
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-[#FAF8F5] flex flex-col justify-center py-12 sm:px-6 lg:px-8 selection:bg-[#A8D5C2] selection:text-[#282923]">
      <div className="sm:mx-auto sm:w-full sm:max-w-md px-4">
        {/* Branding Crest */}
        <div className="text-center">
          <Link href="/" className="inline-flex items-center space-x-2.5 group">
            <div className="w-11 h-11 rounded-lg bg-[#282923] border border-[#E8E0D7] flex items-center justify-center shadow-xs">
              <span className="font-serif text-[#B87333] text-xl font-bold">C</span>
              <span className="w-1.5 h-1.5 rounded-full bg-[#A8D5C2] -ml-0.5 mt-1.5"></span>
            </div>
            <div className="text-left">
              <span className="font-serif text-2xl tracking-tight text-[#29251F]">
                Cater<span className="font-sans font-semibold text-[#B87333]">Connect</span>
              </span>
              <span className="block text-[9px] uppercase tracking-[0.2em] font-semibold text-[#716A62] -mt-1">
                Hospitality Staffing
              </span>
            </div>
          </Link>

          <h1 className="font-serif text-2xl sm:text-3xl text-[#29251F] tracking-tight mt-6">
            Sign In to Workspace
          </h1>
          <p className="mt-1 text-xs text-[#716A62]">
            Access your catering schedule, active shifts, and management roster
          </p>
        </div>

        <Suspense
          fallback={
            <div className="mt-8 bg-white p-12 rounded-2xl border border-[#E8E0D7] flex justify-center items-center">
              <Loader2 className="w-6 h-6 text-[#B87333] animate-spin" />
            </div>
          }
        >
          <LoginForm />
        </Suspense>
      </div>
    </div>
  );
}
