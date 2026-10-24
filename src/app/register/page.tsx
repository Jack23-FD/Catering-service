'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  User,
  Mail,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Loader2,
  Phone,
  Home,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import PasswordInput from '@/components/PasswordInput';

export default function RegisterPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [errors, setErrors] = useState<{
    fullName?: string;
    email?: string;
    phone?: string;
    address?: string;
    password?: string;
    confirmPassword?: string;
    general?: string;
  }>({});

  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const validateForm = () => {
    const newErrors: typeof errors = {};

    if (!fullName.trim() || fullName.trim().length < 2) {
      newErrors.fullName = 'Full name must be at least 2 characters';
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim()) {
      newErrors.email = 'Email address is required';
    } else if (!emailRegex.test(email.trim())) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!phone.trim()) {
      newErrors.phone = 'Mobile number is required for shift coordinator contact';
    } else if (phone.trim().length < 7) {
      newErrors.phone = 'Please enter a valid mobile number';
    }

    if (!address.trim()) {
      newErrors.address = 'Residential address is required';
    }

    if (!password) {
      newErrors.password = 'Password is required';
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters long';
    }

    if (!confirmPassword) {
      newErrors.confirmPassword = 'Confirmation password is required';
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsLoading(true);
    setErrors({});
    setSuccessMessage(null);

    try {
      const supabase = createClient();

      const { data, error: signUpError } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            full_name: fullName.trim(),
            phone: phone.trim(),
            address: address.trim(),
          },
        },
      });

      if (signUpError) {
        setErrors({ general: signUpError.message });
        setIsLoading(false);
        return;
      }

      const user = data.user;
      if (!user) {
        setErrors({ general: 'Registration failed. Please try again.' });
        setIsLoading(false);
        return;
      }

      if (data.session) {
        await supabase
          .from('profiles')
          .upsert({
            id: user.id,
            full_name: fullName.trim(),
            email: email.trim(),
            phone: phone.trim() || null,
            address: address.trim() || null,
            role: 'worker',
          }, { onConflict: 'id' });

        setSuccessMessage('Registration successful! Directing to worker workspace...');
        setTimeout(() => {
          router.push('/worker/dashboard');
          router.refresh();
        }, 1000);
      } else {
        setSuccessMessage(
          'Verification email dispatched! Please check your inbox to activate your account.'
        );
        setIsLoading(false);
      }
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'An unexpected error occurred during registration.';
      setErrors({ general: message });
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF8F5] flex flex-col justify-center py-12 sm:px-6 lg:px-8 selection:bg-[#A8D5C2] selection:text-[#282923]">
      <div className="sm:mx-auto sm:w-full sm:max-w-lg px-4">
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
            Register for Catering Shifts
          </h1>
          <p className="mt-1 text-xs text-[#716A62]">
            Create your profile to view banquet shifts, claim event posts, and track wages
          </p>
        </div>

        <div className="mt-8 bg-[#FFFFFF] p-7 sm:p-9 rounded-2xl border border-[#E8E0D7] shadow-[0_4px_24px_rgba(40,41,35,0.04)]">
          {/* Success Message */}
          {successMessage && (
            <div className="mb-6 p-4 rounded-xl bg-[#EBF5F0] border border-[#A8D5C2] flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-[#36785D] shrink-0 mt-0.5" />
              <div className="text-xs text-[#235540] font-medium leading-relaxed">
                {successMessage}
              </div>
            </div>
          )}

          {/* General Error Alert */}
          {errors.general && (
            <div className="mb-6 p-4 rounded-xl bg-red-50/70 border border-[#B94A48]/30 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-[#B94A48] shrink-0 mt-0.5" />
              <div className="text-xs text-[#B94A48] font-medium">
                {errors.general}
              </div>
            </div>
          )}

          <form className="space-y-4" onSubmit={handleRegister} noValidate>
            {/* Full Name */}
            <div className="space-y-1.5 text-left">
              <label
                htmlFor="fullName"
                className="block text-xs font-semibold text-[#29251F]"
              >
                Full Name <span className="text-red-500">*</span>
              </label>
              <div className="relative rounded-lg">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#716A62]">
                  <User className="h-4 w-4" />
                </div>
                <input
                  id="fullName"
                  name="fullName"
                  type="text"
                  required
                  placeholder="e.g. Ramesh Kumar / Sarah Jenkins"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className={`block w-full pl-10 pr-3.5 py-2.5 text-sm rounded-lg border transition-all duration-150 outline-none ${
                    errors.fullName
                      ? 'border-[#B94A48] text-[#B94A48] placeholder-red-300 focus:ring-2 focus:ring-[#B94A48]/20 bg-red-50/20'
                      : 'border-[#E8E0D7] text-[#29251F] placeholder-[#9E968D] focus:border-[#B87333] focus:ring-2 focus:ring-[#B87333]/15 bg-white hover:border-[#B87333]/40'
                  }`}
                />
              </div>
              {errors.fullName && (
                <p className="text-xs text-[#B94A48] font-medium">
                  {errors.fullName}
                </p>
              )}
            </div>

            {/* Email Address */}
            <div className="space-y-1.5 text-left">
              <label
                htmlFor="email"
                className="block text-xs font-semibold text-[#29251F]"
              >
                Gmail / Email Address <span className="text-red-500">*</span>
              </label>
              <div className="relative rounded-lg">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#716A62]">
                  <Mail className="h-4 w-4" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  placeholder="ramesh.catering@gmail.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={`block w-full pl-10 pr-3.5 py-2.5 text-sm rounded-lg border transition-all duration-150 outline-none ${
                    errors.email
                      ? 'border-[#B94A48] text-[#B94A48] placeholder-red-300 focus:ring-2 focus:ring-[#B94A48]/20 bg-red-50/20'
                      : 'border-[#E8E0D7] text-[#29251F] placeholder-[#9E968D] focus:border-[#B87333] focus:ring-2 focus:ring-[#B87333]/15 bg-white hover:border-[#B87333]/40'
                  }`}
                />
              </div>
              {errors.email && (
                <p className="text-xs text-[#B94A48] font-medium">
                  {errors.email}
                </p>
              )}
            </div>

            {/* Mobile Number */}
            <div className="space-y-1.5 text-left">
              <label
                htmlFor="phone"
                className="block text-xs font-semibold text-[#29251F]"
              >
                Mobile Number <span className="text-red-500">*</span>
              </label>
              <div className="relative rounded-lg">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#716A62]">
                  <Phone className="h-4 w-4" />
                </div>
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  required
                  placeholder="+91 98765 43210"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className={`block w-full pl-10 pr-3.5 py-2.5 text-sm rounded-lg border transition-all duration-150 outline-none ${
                    errors.phone
                      ? 'border-[#B94A48] text-[#B94A48] placeholder-red-300 focus:ring-2 focus:ring-[#B94A48]/20 bg-red-50/20'
                      : 'border-[#E8E0D7] text-[#29251F] placeholder-[#9E968D] focus:border-[#B87333] focus:ring-2 focus:ring-[#B87333]/15 bg-white hover:border-[#B87333]/40'
                  }`}
                />
              </div>
              {errors.phone && (
                <p className="text-xs text-[#B94A48] font-medium">
                  {errors.phone}
                </p>
              )}
            </div>

            {/* Residential Address */}
            <div className="space-y-1.5 text-left">
              <label
                htmlFor="address"
                className="block text-xs font-semibold text-[#29251F]"
              >
                Residential Address <span className="text-red-500">*</span>
              </label>
              <div className="relative rounded-lg">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#716A62]">
                  <Home className="h-4 w-4" />
                </div>
                <input
                  id="address"
                  name="address"
                  type="text"
                  required
                  placeholder="Street name, Area, City (e.g. T. Nagar, Chennai)"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className={`block w-full pl-10 pr-3.5 py-2.5 text-sm rounded-lg border transition-all duration-150 outline-none ${
                    errors.address
                      ? 'border-[#B94A48] text-[#B94A48] placeholder-red-300 focus:ring-2 focus:ring-[#B94A48]/20 bg-red-50/20'
                      : 'border-[#E8E0D7] text-[#29251F] placeholder-[#9E968D] focus:border-[#B87333] focus:ring-2 focus:ring-[#B87333]/15 bg-white hover:border-[#B87333]/40'
                  }`}
                />
              </div>
              {errors.address && (
                <p className="text-xs text-[#B94A48] font-medium">
                  {errors.address}
                </p>
              )}
            </div>

            {/* Password Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <PasswordInput
                id="password"
                name="password"
                label="Create Password"
                placeholder="Min. 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                error={errors.password}
              />

              <PasswordInput
                id="confirmPassword"
                name="confirmPassword"
                label="Confirm Password"
                placeholder="Re-enter password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                error={errors.confirmPassword}
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-3 flex justify-center items-center py-2.5 px-4 rounded-lg text-sm font-semibold text-white bg-[#B87333] hover:bg-[#9E5F27] focus:outline-none focus:ring-2 focus:ring-[#B87333]/30 disabled:opacity-60 disabled:cursor-not-allowed shadow-xs transition-all duration-150 group"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Registering Worker Profile...
                </>
              ) : (
                <>
                  Complete Registration
                  <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-0.5 transition-transform" />
                </>
              )}
            </button>
          </form>

          {/* Switch to Login */}
          <div className="mt-6 pt-5 border-t border-[#E8E0D7] text-center">
            <p className="text-xs text-[#716A62]">
              Already registered on CaterConnect?{' '}
              <Link
                href="/login"
                className="font-semibold text-[#B87333] hover:text-[#9E5F27] hover:underline transition-colors"
              >
                Sign in to your account
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
