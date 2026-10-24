'use client';

import React, { useState } from 'react';
import { Eye, EyeOff, Lock } from 'lucide-react';

interface PasswordInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  id: string;
  error?: string;
  helperText?: string;
}

export default function PasswordInput({
  label,
  id,
  error,
  helperText,
  className = '',
  ...props
}: PasswordInputProps) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="w-full space-y-1.5 text-left">
      <div className="flex justify-between items-center">
        <label
          htmlFor={id}
          className="block text-xs font-semibold text-[#29251F] select-none"
        >
          {label}
        </label>
      </div>

      <div className="relative rounded-lg">
        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#716A62]">
          <Lock className="h-4 w-4" aria-hidden="true" />
        </div>

        <input
          id={id}
          type={showPassword ? 'text' : 'password'}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={error ? `${id}-error` : helperText ? `${id}-helper` : undefined}
          className={`block w-full pl-10 pr-11 py-2.5 text-sm rounded-lg border transition-all duration-150 outline-none ${
            error
              ? 'border-[#B94A48] text-[#B94A48] placeholder-red-300 focus:ring-2 focus:ring-[#B94A48]/20 bg-red-50/20'
              : 'border-[#E8E0D7] text-[#29251F] placeholder-[#9E968D] focus:border-[#B87333] focus:ring-2 focus:ring-[#B87333]/15 bg-white hover:border-[#B87333]/40'
          } ${className}`}
          {...props}
        />

        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-[#716A62] hover:text-[#B87333] focus:outline-none transition-colors"
          tabIndex={0}
          aria-label={showPassword ? `Hide ${label}` : `Show ${label}`}
        >
          {showPassword ? (
            <EyeOff className="h-4 w-4" aria-hidden="true" />
          ) : (
            <Eye className="h-4 w-4" aria-hidden="true" />
          )}
        </button>
      </div>

      {error ? (
        <p id={`${id}-error`} className="text-xs text-[#B94A48] font-medium">
          {error}
        </p>
      ) : helperText ? (
        <p id={`${id}-helper`} className="text-xs text-[#716A62]">
          {helperText}
        </p>
      ) : null}
    </div>
  );
}
