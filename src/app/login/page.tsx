'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Mail, ChefHat, AlertCircle, ArrowRight, Loader2, CheckCircle2 } from 'lucide-react';
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

      // Sign in with password
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
        setError('Authentication failed. No user found.');
        setIsLoading(false);
        return;
      }

      // Securely retrieve the user's role from profiles
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role, full_name')
        .eq('id', data.user.id)
        .maybeSingle();

      if (profileError) {
        console.warn('Profile fetch note:', profileError.message);
      }

      setSuccess('Login successful! Directing to your workspace...');

      // Role-based routing
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
      }, 800);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'An unexpected error occurred while logging in.';
      setError(message);
      setIsLoading(false);
    }
  };

  return (
    <div className="mt-8 bg-white/95 backdrop-blur-md py-8 px-6 sm:px-10 shadow-2xl rounded-3xl border border-white/20">
      {/* Success Notification */}
      {success && (
        <div className="mb-6 p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-start gap-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          <div className="text-sm text-emerald-800 font-medium">{success}</div>
        </div>
      )}

      {/* Error Notification */}
      {error && (
        <div className="mb-6 p-4 rounded-2xl bg-red-50 border border-red-200 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
          <div className="text-sm text-red-800 font-medium">{error}</div>
        </div>
      )}

      <form className="space-y-5" onSubmit={handleLogin} noValidate>
        {/* Email Address */}
        <div className="space-y-1.5 text-left">
          <label
            htmlFor="login-email"
            className="block text-sm font-medium text-gray-700"
          >
            Email Address
          </label>
          <div className="relative rounded-xl shadow-sm">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-purple-400">
              <Mail className="h-4 w-4" />
            </div>
            <input
              id="login-email"
              name="email"
              type="email"
              autoComplete="email"
              required
              placeholder="worker@example.com or admin@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="block w-full pl-10 pr-3.5 py-2.5 sm:text-sm rounded-xl border border-purple-200 text-gray-900 placeholder-gray-400 focus:border-purple-600 focus:ring-2 focus:ring-purple-600/20 bg-white hover:border-purple-300 transition-all duration-150 outline-none"
            />
          </div>
        </div>

        {/* Password */}
        <PasswordInput
          id="login-password"
          name="password"
          label="Password"
          placeholder="Enter your password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isLoading}
          className="w-full flex justify-center items-center py-3 px-4 rounded-xl shadow-lg shadow-purple-900/30 text-sm font-semibold text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-600 disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-150 group"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Signing in...
            </>
          ) : (
            <>
              Sign In to Platform
              <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-0.5 transition-transform" />
            </>
          )}
        </button>
      </form>

      {/* Switch to Register */}
      <div className="mt-6 pt-6 border-t border-gray-100 text-center">
        <p className="text-sm text-gray-600">
          New catering worker?{' '}
          <Link
            href="/register"
            className="font-semibold text-purple-700 hover:text-purple-600 hover:underline transition-colors"
          >
            Register for shifts here
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-950 via-purple-900 to-indigo-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      {/* Decorative background glows */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl"></div>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10 px-4">
        {/* Branding */}
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-white shadow-xl shadow-purple-950/50 mb-4 ring-4 ring-purple-500/20">
            <ChefHat className="w-8 h-8 text-purple-700" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Sign In to Catering Hub
          </h1>
          <p className="mt-2 text-sm text-purple-200">
            Access your shifts, bookings, and dashboard
          </p>
        </div>

        <Suspense
          fallback={
            <div className="mt-8 bg-white/95 backdrop-blur-md py-12 px-6 rounded-3xl flex justify-center items-center">
              <Loader2 className="w-8 h-8 text-purple-600 animate-spin" />
            </div>
          }
        >
          <LoginForm />
        </Suspense>
      </div>
    </div>
  );
}
