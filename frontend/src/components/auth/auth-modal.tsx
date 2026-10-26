'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { X, User, Phone, Mail, Lock, ShieldCheck, ArrowRight, Loader2, Sparkles, KeyRound, ArrowLeft, CheckCircle2, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '@/context/auth-context';
import { useLanguage } from '@/context/language-context';
import { BRAND } from '@/lib/constants';
import { isValidBdPhone } from '@/lib/formatters';

export function AuthModal() {
  const { isAuthModalOpen, closeAuthModal, register, login, forgotPassword, resetPassword, sendOtp, verifyOtp } = useAuth();
  const { t } = useLanguage();

  const [activeTab, setActiveTab] = useState<'LOGIN' | 'REGISTER' | 'OTP' | 'FORGOT_PASSWORD'>('LOGIN');
  const [forgotStep, setForgotStep] = useState<'REQUEST_CODE' | 'RESET_PASSWORD'>('REQUEST_CODE');

  // Form states
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [otpCode, setOtpCode] = useState('');

  // Password visibility states
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Forgot password states
  const [forgotEmail, setForgotEmail] = useState('');
  const [resetCode, setResetCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Resend countdown timer
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown((c) => c - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  if (!isAuthModalOpen) return null;

  // Real-time typo warning for Bangladeshi users
  const getEmailWarning = (input: string) => {
    const val = input.trim().toLowerCase();
    if (val.includes('@gamil.com') || val.includes('@gmai.com') || val.includes('@gmial.com')) {
      return t('It looks like a typo. Did you mean @gmail.com?', 'সম্ভবত বানান ভুল হয়েছে। আপনি কি @gmail.com লিখতে চেয়েছেন?');
    }
    if (val.includes('@hotmial.com') || val.includes('@yaho.com')) {
      return t('Please verify your email domain spelling.', 'ইমেইলের বানানটি পুনরায় যাচাই করুন।');
    }
    return null;
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!fullName.trim() || fullName.trim().length < 2) {
      setErrorMessage(t('Please enter your full name.', 'অনুগ্রহ করে আপনার পুরো নাম লিখুন।'));
      return;
    }

    if (!isValidBdPhone(phone)) {
      setErrorMessage(t('Please enter a valid 11-digit mobile number (e.g. 017XXXXXXXX).', 'সঠিক ১১ ডিজিটের মোবাইল নম্বর দিন (যেমন: 017XXXXXXXX)।'));
      return;
    }

    if (!email.trim() || !email.includes('@')) {
      setErrorMessage(t('Please enter a valid Gmail or email address.', 'অনুগ্রহ করে সঠিক Gmail বা ইমেইল দিন।'));
      return;
    }

    const typoWarning = getEmailWarning(email);
    if (typoWarning) {
      setErrorMessage(typoWarning);
      return;
    }

    if (password.length < 6) {
      setErrorMessage(t('Password must be at least 6 characters.', 'পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে।'));
      return;
    }

    setIsLoading(true);
    try {
      await register({
        fullName: fullName.trim(),
        phone: phone.trim(),
        email: email.trim(),
        password,
      });
      closeAuthModal();
    } catch (err: any) {
      setErrorMessage(err.message || t('Failed to create account. Please check details.', 'অ্যাকাউন্ট তৈরি করা যায়নি। পুনরায় তথ্য যাচাই করুন।'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!loginIdentifier.trim()) {
      setErrorMessage(t('Please enter your phone number or Gmail.', 'মোবাইল নম্বর বা Gmail এড্রেস দিন।'));
      return;
    }

    if (!loginPassword) {
      setErrorMessage(t('Please enter your password.', 'পাসওয়ার্ড দিন।'));
      return;
    }

    setIsLoading(true);
    try {
      await login({
        identifier: loginIdentifier.trim(),
        password: loginPassword,
      });
      closeAuthModal();
    } catch (err: any) {
      setErrorMessage(err.message || t('Incorrect phone/email or password.', 'ভুল মোবাইল নম্বর/ইমেইল অথবা পাসওয়ার্ড।'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendResetCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    const cleanEmail = forgotEmail.trim();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      setErrorMessage(t('Please enter your registered Gmail or email address.', 'আপনার রেজিস্টার্ড Gmail বা ইমেইল ঠিকানা দিন।'));
      return;
    }

    const typoWarning = getEmailWarning(cleanEmail);
    if (typoWarning) {
      setErrorMessage(typoWarning);
      return;
    }

    setIsLoading(true);
    try {
      const res = await forgotPassword(cleanEmail);
      setSuccessMessage(
        res.message ||
        t('A 6-digit code has been dispatched to your email.', 'আপনার ইমেইলে ৬ ডিজিটের কোড পাঠানো হয়েছে।')
      );
      setForgotStep('RESET_PASSWORD');
      setResendCooldown(60);
    } catch (err: any) {
      setErrorMessage(err.message || t('Failed to dispatch reset code.', 'কোড পাঠানো যায়নি।'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (resetCode.trim().length !== 6) {
      setErrorMessage(t('Please enter the 6-digit code received in your email.', 'ইমেইলে পাওয়া ৬ ডিজিটের কোডটি দিন।'));
      return;
    }

    if (newPassword.length < 6) {
      setErrorMessage(t('New password must be at least 6 characters long.', 'নতুন পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে।'));
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage(t('Passwords do not match. Please re-check.', 'দুই ঘরে পাসওয়ার্ড মিলছে না। পুনরায় চেক করুন।'));
      return;
    }

    setIsLoading(true);
    try {
      await resetPassword({
        email: forgotEmail.trim(),
        code: resetCode.trim(),
        newPassword,
      });
      closeAuthModal();
    } catch (err: any) {
      setErrorMessage(err.message || t('Invalid or expired code. Please request a new one.', 'ভুল বা মেয়াদোত্তীর্ণ কোড। পুনরায় অনুরোধ করুন।'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    if (!isValidBdPhone(phone)) {
      setErrorMessage(t('Please enter a valid mobile number.', 'সঠিক মোবাইল নম্বর দিন।'));
      return;
    }

    setIsLoading(true);
    try {
      await sendOtp(phone);
      setSuccessMessage(t('6-digit code sent to your phone.', 'আপনার ফোনে ৬ ডিজিটের কোড পাঠানো হয়েছে।'));
    } catch (err: any) {
      setErrorMessage(err.message || t('Failed to send SMS code.', 'কোড পাঠানো যায়নি।'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    if (otpCode.length !== 6) {
      setErrorMessage(t('Please enter 6-digit code.', '৬ ডিজিটের কোড দিন।'));
      return;
    }

    setIsLoading(true);
    try {
      await verifyOtp(phone, otpCode);
      closeAuthModal();
    } catch (err: any) {
      setErrorMessage(err.message || t('Invalid or expired code.', 'ভুল বা মেয়াদোত্তীর্ণ কোড।'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      {/* Backdrop */}
      <div
        onClick={closeAuthModal}
        className="fixed inset-0 bg-[#1C1917]/50 backdrop-blur-sm transition-opacity"
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-md bg-[#F9F6F0] border border-[#E6DFD5] shadow-2xl p-6 sm:p-8 z-10 space-y-6 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Close Button */}
        <button
          type="button"
          onClick={closeAuthModal}
          className="absolute top-5 right-5 p-1 text-[#1C1917]/60 hover:text-[#1C1917] transition-colors focus:outline-none"
          aria-label="Close"
        >
          <X className="w-5 h-5 stroke-[1.5]" />
        </button>

        {/* Brand Header */}
        <div className="text-center space-y-2 select-none">
          <div className="relative w-10 h-10 mx-auto">
            <Image
              src={BRAND.logoPath}
              alt="SEYVEN"
              fill
              sizes="40px"
              className="object-contain"
            />
          </div>
          <h2 className="text-sm font-serif uppercase tracking-[0.3em] font-normal text-[#1C1917]">
            {BRAND.name}
          </h2>
          <p className="text-[10px] uppercase tracking-[0.2em] text-[#C7A97B] font-medium">
            {activeTab === 'FORGOT_PASSWORD'
              ? t('PASSWORD RECOVERY', 'পাসওয়ার্ড পুনরুদ্ধার')
              : t('CLIENT IDENTITY & ACCESS', 'আপনার অ্যাকাউন্ট')}
          </p>
        </div>

        {/* Tab Switcher: LOGIN vs CREATE ACCOUNT (Hidden during Forgot Password or OTP) */}
        {activeTab !== 'OTP' && activeTab !== 'FORGOT_PASSWORD' && (
          <div className="grid grid-cols-2 border-b border-[#E6DFD5] text-center text-xs uppercase tracking-[0.2em] font-medium">
            <button
              type="button"
              onClick={() => {
                setActiveTab('LOGIN');
                setErrorMessage(null);
                setSuccessMessage(null);
              }}
              className={`pb-3 transition-colors ${
                activeTab === 'LOGIN'
                  ? 'border-b-2 border-[#1C1917] text-[#1C1917]'
                  : 'text-[#1C1917]/40 hover:text-[#1C1917]'
              }`}
            >
              {t('LOG IN', 'লগইন')}
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab('REGISTER');
                setErrorMessage(null);
                setSuccessMessage(null);
              }}
              className={`pb-3 transition-colors ${
                activeTab === 'REGISTER'
                  ? 'border-b-2 border-[#1C1917] text-[#1C1917]'
                  : 'text-[#1C1917]/40 hover:text-[#1C1917]'
              }`}
            >
              {t('CREATE ACCOUNT', 'অ্যাকাউন্ট খুলুন')}
            </button>
          </div>
        )}

        {/* Feedback Messages */}
        {errorMessage && (
          <div className="p-3 bg-[#E6DFD5]/40 border border-[#E6DFD5] text-xs text-red-700 font-light leading-relaxed">
            {errorMessage}
          </div>
        )}
        {successMessage && (
          <div className="p-3 bg-[#E6DFD5]/40 border border-[#C7A97B] text-xs text-[#1C1917] font-light leading-relaxed flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-[#C7A97B] shrink-0 mt-0.5" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 1: SIMPLE LOG IN (Phone/Gmail + Password) */}
        {/* ========================================================================= */}
        {activeTab === 'LOGIN' && (
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1">
              <label className="text-[10px] uppercase tracking-[0.2em] font-medium text-[#1C1917]/70 block">
                {t('PHONE NUMBER OR GMAIL', 'মোবাইল নম্বর অথবা Gmail')}
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={loginIdentifier}
                  onChange={(e) => setLoginIdentifier(e.target.value)}
                  placeholder="017XXXXXXXX or name@gmail.com"
                  className="w-full bg-[#F9F6F0] border border-[#E6DFD5] focus:border-[#1C1917] px-3.5 py-3 text-xs tracking-[0.1em] text-[#1C1917] placeholder:text-[#1C1917]/35 focus:outline-none transition-colors"
                  required
                />
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-[10px] uppercase tracking-[0.2em] font-medium text-[#1C1917]/70 block">
                  {t('PASSWORD', 'পাসওয়ার্ড')}
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('FORGOT_PASSWORD');
                    setForgotStep('REQUEST_CODE');
                    setForgotEmail(loginIdentifier.includes('@') ? loginIdentifier : '');
                    setErrorMessage(null);
                    setSuccessMessage(null);
                  }}
                  className="text-[10px] tracking-[0.05em] text-[#C7A97B] hover:text-[#1C1917] underline transition-colors"
                >
                  {t('Forgot password?', 'পাসওয়ার্ড ভুলে গেছেন?')}
                </button>
              </div>
              <div className="relative flex items-center">
                <input
                  type={showLoginPassword ? 'text' : 'password'}
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-[#F9F6F0] border border-[#E6DFD5] focus:border-[#1C1917] px-3.5 pr-10 py-3 text-xs tracking-[0.15em] text-[#1C1917] placeholder:text-[#1C1917]/35 focus:outline-none transition-colors"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowLoginPassword((v) => !v)}
                  aria-label={showLoginPassword ? 'Hide password' : 'Show password'}
                  className="absolute right-3 text-[#1C1917]/40 hover:text-[#C7A97B] transition-colors p-1"
                >
                  {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 bg-[#1C1917] text-[#F9F6F0] text-xs uppercase tracking-[0.25em] font-medium hover:bg-[#1C1917]/90 transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin text-[#C7A97B]" />
              ) : (
                <>
                  <span>{t('LOG IN TO ACCOUNT', 'প্রবেশ করুন')}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        )}

        {/* ========================================================================= */}
        {/* TAB 2: SIMPLE REGISTRATION (Name + Phone + Gmail + Password) */}
        {/* ========================================================================= */}
        {activeTab === 'REGISTER' && (
          <form onSubmit={handleRegister} className="space-y-3.5">
            <div className="space-y-1">
              <label className="text-[10px] uppercase tracking-[0.2em] font-medium text-[#1C1917]/70 block">
                {t('YOUR FULL NAME', 'আপনার নাম')}
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder={t('Enter your full name', 'আপনার পুরো নাম লিখুন')}
                className="w-full bg-[#F9F6F0] border border-[#E6DFD5] focus:border-[#1C1917] px-3.5 py-2.5 text-xs tracking-[0.08em] text-[#1C1917] placeholder:text-[#1C1917]/35 focus:outline-none transition-colors"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] uppercase tracking-[0.2em] font-medium text-[#1C1917]/70 block">
                {t('MOBILE NUMBER (11 DIGITS)', 'মোবাইল নম্বর')}
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="017XXXXXXXX"
                className="w-full bg-[#F9F6F0] border border-[#E6DFD5] focus:border-[#1C1917] px-3.5 py-2.5 text-xs tracking-[0.12em] text-[#1C1917] placeholder:text-[#1C1917]/35 focus:outline-none transition-colors"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] uppercase tracking-[0.2em] font-medium text-[#1C1917]/70 block">
                {t('GMAIL / EMAIL ADDRESS', 'Gmail বা ইমেইল')}
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="yourname@gmail.com"
                className="w-full bg-[#F9F6F0] border border-[#E6DFD5] focus:border-[#1C1917] px-3.5 py-2.5 text-xs tracking-[0.08em] text-[#1C1917] placeholder:text-[#1C1917]/35 focus:outline-none transition-colors"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] uppercase tracking-[0.2em] font-medium text-[#1C1917]/70 block">
                {t('SET A PASSWORD (MIN 6 CHARACTERS)', 'পাসওয়ার্ড (কমপক্ষে ৬ অক্ষর)')}
              </label>
              <div className="relative flex items-center">
                <input
                  type={showRegisterPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-[#F9F6F0] border border-[#E6DFD5] focus:border-[#1C1917] px-3.5 pr-10 py-2.5 text-xs tracking-[0.15em] text-[#1C1917] placeholder:text-[#1C1917]/35 focus:outline-none transition-colors"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowRegisterPassword((v) => !v)}
                  aria-label={showRegisterPassword ? 'Hide password' : 'Show password'}
                  className="absolute right-3 text-[#1C1917]/40 hover:text-[#C7A97B] transition-colors p-1"
                >
                  {showRegisterPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 py-3.5 bg-[#1C1917] text-[#F9F6F0] text-xs uppercase tracking-[0.25em] font-medium hover:bg-[#1C1917]/90 transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin text-[#C7A97B]" />
              ) : (
                <>
                  <span>{t('CREATE ACCOUNT', 'অ্যাকাউন্ট খুলুন')}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        )}

        {/* ========================================================================= */}
        {/* TAB 3: FORGOT PASSWORD FLOW (RESEND EMAIL 6-DIGIT CODE + NEW PASSWORD) */}
        {/* ========================================================================= */}
        {activeTab === 'FORGOT_PASSWORD' && (
          <div className="space-y-4">
            {forgotStep === 'REQUEST_CODE' ? (
              <form onSubmit={handleSendResetCode} className="space-y-4">
                <div className="text-center space-y-1">
                  <p className="text-xs text-[#1C1917]/80 leading-relaxed font-light">
                    {t(
                      'Enter your registered Gmail or email address. We will dispatch a 6-digit code to securely reset your password.',
                      'পাসওয়ার্ড পরিবর্তনের জন্য আপনার রেজিস্টার্ড Gmail বা ইমেইল ঠিকানা দিন। আপনার ইনবক্সে ৬ ডিজিটের ভেরিফিকেশন কোড পাঠানো হবে।'
                    )}
                  </p>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] uppercase tracking-[0.2em] font-medium text-[#1C1917]/70 block">
                    {t('GMAIL / EMAIL ADDRESS', 'Gmail বা ইমেইল')}
                  </label>
                  <input
                    type="email"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    placeholder="e.g. yourname@gmail.com"
                    className="w-full bg-[#F9F6F0] border border-[#E6DFD5] focus:border-[#1C1917] px-3.5 py-3 text-xs tracking-[0.08em] text-[#1C1917] placeholder:text-[#1C1917]/35 focus:outline-none transition-colors"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3.5 bg-[#1C1917] text-[#F9F6F0] text-xs uppercase tracking-[0.25em] font-medium hover:bg-[#1C1917]/90 transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
                >
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin text-[#C7A97B]" />
                  ) : (
                    <>
                      <span>{t('SEND RESET CODE', 'কোড পাঠান')}</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>

                <div className="pt-2 text-center">
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab('LOGIN');
                      setErrorMessage(null);
                      setSuccessMessage(null);
                    }}
                    className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-[0.15em] text-[#1C1917]/60 hover:text-[#1C1917] transition-colors"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>{t('Back to Login', 'লগইনে ফিরে যান')}</span>
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleConfirmResetPassword} className="space-y-3.5">
                <div className="p-3 bg-[#E6DFD5]/40 border border-[#E6DFD5] text-[11px] text-[#1C1917]/80 leading-relaxed font-light">
                  {t('We dispatched a 6-digit verification code to', 'আমরা একটি ৬ ডিজিটের ভেরিফিকেশন কোড পাঠিয়েছি:')}{' '}
                  <strong className="font-semibold text-[#1C1917]">{forgotEmail}</strong>.{' '}
                  {t('Please check your Inbox and Spam folder.', 'ইনবক্স অথবা স্প্যাম ফোল্ডার চেক করুন।')}
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] uppercase tracking-[0.2em] font-medium text-[#1C1917]/70 block">
                      {t('6-DIGIT VERIFICATION CODE', '৬ ডিজিটের কোড')}
                    </label>
                    {resendCooldown > 0 ? (
                      <span className="text-[9px] text-[#1C1917]/40 tracking-[0.05em]">
                        {t(`Resend in ${resendCooldown}s`, `${resendCooldown} সেকেন্ড পর পুনরায় পাঠানো যাবে`)}
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={handleSendResetCode}
                        disabled={isLoading}
                        className="text-[9px] text-[#C7A97B] hover:text-[#1C1917] tracking-[0.05em] underline"
                      >
                        {t('Resend Code', 'পুনরায় পাঠান')}
                      </button>
                    )}
                  </div>
                  <input
                    type="text"
                    maxLength={6}
                    value={resetCode}
                    onChange={(e) => setResetCode(e.target.value.replace(/\D/g, ''))}
                    placeholder="• • • • • •"
                    className="w-full bg-[#F9F6F0] border border-[#E6DFD5] focus:border-[#C7A97B] px-3.5 py-2.5 text-center text-lg tracking-[0.35em] font-mono font-bold text-[#1C1917] focus:outline-none transition-colors"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] uppercase tracking-[0.2em] font-medium text-[#1C1917]/70 block">
                    {t('NEW PASSWORD (MIN 6 CHARACTERS)', 'নতুন পাসওয়ার্ড (কমপক্ষে ৬ অক্ষর)')}
                  </label>
                  <div className="relative flex items-center">
                    <input
                      type={showResetPassword ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-[#F9F6F0] border border-[#E6DFD5] focus:border-[#1C1917] px-3.5 pr-10 py-2.5 text-xs tracking-[0.15em] text-[#1C1917] placeholder:text-[#1C1917]/35 focus:outline-none transition-colors"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowResetPassword((v) => !v)}
                      aria-label={showResetPassword ? 'Hide password' : 'Show password'}
                      className="absolute right-3 text-[#1C1917]/40 hover:text-[#C7A97B] transition-colors p-1"
                    >
                      {showResetPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] uppercase tracking-[0.2em] font-medium text-[#1C1917]/70 block">
                    {t('CONFIRM NEW PASSWORD', 'পুনরায় নতুন পাসওয়ার্ড')}
                  </label>
                  <div className="relative flex items-center">
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-[#F9F6F0] border border-[#E6DFD5] focus:border-[#1C1917] px-3.5 pr-10 py-2.5 text-xs tracking-[0.15em] text-[#1C1917] placeholder:text-[#1C1917]/35 focus:outline-none transition-colors"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword((v) => !v)}
                      aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                      className="absolute right-3 text-[#1C1917]/40 hover:text-[#C7A97B] transition-colors p-1"
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full mt-2 py-3.5 bg-[#1C1917] text-[#F9F6F0] text-xs uppercase tracking-[0.25em] font-medium hover:bg-[#1C1917]/90 transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
                >
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin text-[#C7A97B]" />
                  ) : (
                    <>
                      <span>{t('SAVE PASSWORD & SIGN IN', 'পাসওয়ার্ড সংরক্ষণ ও লগইন')}</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>

                <div className="pt-2 text-center">
                  <button
                    type="button"
                    onClick={() => {
                      setForgotStep('REQUEST_CODE');
                      setErrorMessage(null);
                      setSuccessMessage(null);
                    }}
                    className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-[0.15em] text-[#1C1917]/60 hover:text-[#1C1917] transition-colors"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>{t('Change email address', 'ইমেইল পরিবর্তন করুন')}</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* OPTIONAL TAB: SMS OTP (FOR USERS WHO PREFER OTP) */}
        {/* ========================================================================= */}
        {activeTab === 'OTP' && (
          <div className="space-y-4">
            <div className="space-y-1">
              <label className="text-[10px] uppercase tracking-[0.2em] font-medium text-[#1C1917]/70 block">
                {t('ENTER PHONE NUMBER', 'মোবাইল নম্বর দিন')}
              </label>
              <div className="flex gap-2">
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="017XXXXXXXX"
                  className="flex-1 bg-[#F9F6F0] border border-[#E6DFD5] px-3 py-2.5 text-xs text-[#1C1917] focus:outline-none"
                />
                <button
                  type="button"
                  onClick={handleSendOtp}
                  disabled={isLoading}
                  className="px-3.5 py-2.5 border border-[#1C1917] text-[10px] uppercase tracking-[0.15em] font-medium hover:bg-[#1C1917] hover:text-[#F9F6F0]"
                >
                  {t('SEND CODE', 'কোড পাঠান')}
                </button>
              </div>
            </div>

            <form onSubmit={handleVerifyOtp} className="space-y-3 pt-2">
              <div className="space-y-1">
                <label className="text-[10px] uppercase tracking-[0.2em] font-medium text-[#1C1917]/70 block">
                  {t('ENTER 6-DIGIT CODE', '৬ ডিজিটের কোড দিন')}
                </label>
                <input
                  type="text"
                  maxLength={6}
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value)}
                  placeholder="123456"
                  className="w-full bg-[#F9F6F0] border border-[#E6DFD5] px-3.5 py-2.5 text-center text-sm tracking-[0.3em] font-mono focus:outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading || otpCode.length !== 6}
                className="w-full py-3 bg-[#1C1917] text-[#F9F6F0] text-xs uppercase tracking-[0.2em] font-medium hover:bg-[#1C1917]/90 disabled:opacity-50"
              >
                {t('VERIFY & LOGIN', 'যাচাই ও প্রবেশ')}
              </button>
            </form>

            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => {
                  setActiveTab('LOGIN');
                  setErrorMessage(null);
                  setSuccessMessage(null);
                }}
                className="text-[10px] uppercase tracking-[0.15em] text-[#1C1917]/60 underline"
              >
                {t('Back to normal login', 'পাসওয়ার্ড দিয়ে সাধারণ লগইনে ফিরে যান')}
              </button>
            </div>
          </div>
        )}

        {/* Security / Privacy Quiet Reassurance */}
        <div className="pt-2 border-t border-[#E6DFD5] flex items-center justify-center space-x-2 text-[9px] uppercase tracking-[0.15em] text-[#1C1917]/60">
          <ShieldCheck className="w-3.5 h-3.5 text-[#C7A97B]" />
          <span>{t('SAFE & CONFIDENTIAL CLIENT DATA', 'আপনার তথ্যের সম্পূর্ণ গোপনীয়তা নিশ্চিত')}</span>
        </div>

      </div>
    </div>
  );
}
