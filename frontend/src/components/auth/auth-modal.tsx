'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { X, User, Phone, Mail, Lock, ShieldCheck, ArrowRight, Loader2, Sparkles, KeyRound, ArrowLeft, CheckCircle2, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '@/context/auth-context';
import { BRAND } from '@/lib/constants';
import { isValidBdPhone } from '@/lib/formatters';

export function AuthModal() {
  const { isAuthModalOpen, closeAuthModal, register, login, forgotPassword, resetPassword } = useAuth();

  const [activeTab, setActiveTab] = useState<'LOGIN' | 'REGISTER' | 'FORGOT_PASSWORD'>('LOGIN');
  const [forgotStep, setForgotStep] = useState<'REQUEST_CODE' | 'RESET_PASSWORD'>('REQUEST_CODE');

  // Form states
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

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
    if (resendCooldown <= 0) return;
    const interval = setInterval(() => {
      setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [resendCooldown]);

  if (!isAuthModalOpen) return null;

  const getEmailWarning = (emailStr: string): string | null => {
    const val = emailStr.trim().toLowerCase();
    if (val.includes('@gamil.com') || val.includes('@gmai.com') || val.includes('@gmaill.com') || val.includes('@gmial.com')) {
      return 'It looks like a typo. Did you mean @gmail.com?';
    }
    if (val.includes('@hotmial.com') || val.includes('@yaho.com')) {
      return 'Please verify your email domain spelling.';
    }
    return null;
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!fullName.trim() || fullName.trim().length < 2) {
      setErrorMessage('Please enter your full name.');
      return;
    }

    if (!isValidBdPhone(phone)) {
      setErrorMessage('Please enter a valid 11-digit mobile number (e.g. 017XXXXXXXX).');
      return;
    }

    if (!email.trim() || !email.includes('@')) {
      setErrorMessage('Please enter a valid Gmail or email address.');
      return;
    }

    const typoWarning = getEmailWarning(email);
    if (typoWarning) {
      setErrorMessage(typoWarning);
      return;
    }

    if (password.length < 6) {
      setErrorMessage('Password must be at least 6 characters.');
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
      setErrorMessage(err.message || 'Failed to create account. Please check details.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!loginIdentifier.trim()) {
      setErrorMessage('Please enter your phone number or Gmail.');
      return;
    }

    if (!loginPassword) {
      setErrorMessage('Please enter your password.');
      return;
    }

    setIsLoading(true);
    try {
      await login({ identifier: loginIdentifier.trim(), password: loginPassword });
      closeAuthModal();
    } catch (err: any) {
      setErrorMessage(err.message || 'Incorrect phone/email or password.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRequestResetCode = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    const cleanEmail = forgotEmail.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      setErrorMessage('Please enter your registered Gmail or email address.');
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
          'A 6-digit code has been dispatched to your email.'
      );
      setForgotStep('RESET_PASSWORD');
      setResendCooldown(res.expiresInSeconds ? Math.min(res.expiresInSeconds, 60) : 60);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to dispatch reset code.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (resetCode.trim().length !== 6) {
      setErrorMessage('Please enter the 6-digit code received in your email.');
      return;
    }

    if (newPassword.length < 6) {
      setErrorMessage('New password must be at least 6 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage('Passwords do not match. Please re-check.');
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
      setErrorMessage(err.message || 'Invalid or expired code. Please request a new one.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-[#1C1917]/70 backdrop-blur-sm transition-opacity"
        onClick={closeAuthModal}
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-md bg-[#FAF8F5] border border-[#E6DFD5] shadow-2xl p-6 sm:p-8 space-y-6 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Close Button */}
        <button
          onClick={closeAuthModal}
          className="absolute top-4 right-4 text-[#1C1917]/40 hover:text-[#1C1917] transition-colors p-2"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="flex justify-center mb-1">
            <Image
              src="/icon.png"
              alt="SEYVEN"
              width={36}
              height={36}
              className="object-contain"
            />
          </div>
          <span className="font-serif tracking-[0.3em] text-xl font-light text-[#1C1917] block">
            {BRAND.name}
          </span>
          <p className="text-[10px] uppercase tracking-[0.2em] text-[#C7A97B] font-medium">
            {activeTab === 'FORGOT_PASSWORD'
              ? 'PASSWORD RECOVERY'
              : 'CLIENT IDENTITY & ACCESS'}
          </p>
        </div>

        {/* Error / Success Alerts */}
        {errorMessage && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs text-center leading-relaxed">
            {errorMessage}
          </div>
        )}
        {successMessage && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs text-center leading-relaxed flex items-center justify-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Tab Switcher: LOGIN vs CREATE ACCOUNT (Hidden during Forgot Password) */}
        {activeTab !== 'FORGOT_PASSWORD' && (
          <div className="grid grid-cols-2 border-b border-[#E6DFD5]">
            <button
              type="button"
              onClick={() => {
                setActiveTab('LOGIN');
                setErrorMessage(null);
                setSuccessMessage(null);
              }}
              className={`pb-3 text-xs uppercase tracking-[0.2em] font-medium transition-colors relative ${
                activeTab === 'LOGIN'
                  ? 'text-[#1C1917] font-semibold'
                  : 'text-[#1C1917]/40 hover:text-[#1C1917]'
              }`}
            >
              LOG IN
              {activeTab === 'LOGIN' && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#1C1917]" />
              )}
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab('REGISTER');
                setErrorMessage(null);
                setSuccessMessage(null);
              }}
              className={`pb-3 text-xs uppercase tracking-[0.2em] font-medium transition-colors relative ${
                activeTab === 'REGISTER'
                  ? 'text-[#1C1917] font-semibold'
                  : 'text-[#1C1917]/40 hover:text-[#1C1917]'
              }`}
            >
              CREATE ACCOUNT
              {activeTab === 'REGISTER' && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#1C1917]" />
              )}
            </button>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 1: LOGIN */}
        {/* ========================================================================= */}
        {activeTab === 'LOGIN' && (
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1">
              <label className="text-[10px] uppercase tracking-[0.2em] font-medium text-[#1C1917]/70 block">
                PHONE NUMBER OR GMAIL
              </label>
              <div className="relative flex items-center">
                <input
                  type="text"
                  value={loginIdentifier}
                  onChange={(e) => setLoginIdentifier(e.target.value)}
                  placeholder="017XXXXXXXX or client@gmail.com"
                  className="w-full bg-[#F9F6F0] border border-[#E6DFD5] focus:border-[#1C1917] px-3.5 py-2.5 text-xs text-[#1C1917] placeholder:text-[#1C1917]/35 focus:outline-none transition-colors"
                  required
                />
                <User className="w-4 h-4 text-[#1C1917]/30 absolute right-3 pointer-events-none" />
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-[10px] uppercase tracking-[0.2em] font-medium text-[#1C1917]/70">
                  PASSWORD
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
                  className="text-[10px] uppercase tracking-[0.1em] text-[#C7A97B] hover:text-[#1C1917] transition-colors"
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative flex items-center">
                <input
                  type={showLoginPassword ? 'text' : 'password'}
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-[#F9F6F0] border border-[#E6DFD5] focus:border-[#1C1917] px-3.5 pr-10 py-2.5 text-xs tracking-[0.15em] text-[#1C1917] placeholder:text-[#1C1917]/35 focus:outline-none transition-colors"
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
              className="w-full mt-2 py-3.5 bg-[#1C1917] text-[#F9F6F0] text-xs uppercase tracking-[0.25em] font-medium hover:bg-[#1C1917]/90 transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin text-[#C7A97B]" />
              ) : (
                <>
                  <span>LOG IN TO ACCOUNT</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        )}

        {/* ========================================================================= */}
        {/* TAB 2: REGISTER */}
        {/* ========================================================================= */}
        {activeTab === 'REGISTER' && (
          <form onSubmit={handleRegister} className="space-y-3.5">
            <div className="space-y-1">
              <label className="text-[10px] uppercase tracking-[0.2em] font-medium text-[#1C1917]/70 block">
                YOUR FULL NAME
              </label>
              <div className="relative flex items-center">
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Enter your full name"
                  className="w-full bg-[#F9F6F0] border border-[#E6DFD5] focus:border-[#1C1917] px-3.5 py-2.5 text-xs text-[#1C1917] placeholder:text-[#1C1917]/35 focus:outline-none transition-colors"
                  required
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] uppercase tracking-[0.2em] font-medium text-[#1C1917]/70 block">
                MOBILE NUMBER (11 DIGITS)
              </label>
              <div className="relative flex items-center">
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="017XXXXXXXX"
                  className="w-full bg-[#F9F6F0] border border-[#E6DFD5] focus:border-[#1C1917] px-3.5 py-2.5 text-xs text-[#1C1917] placeholder:text-[#1C1917]/35 focus:outline-none transition-colors"
                  required
                />
                <Phone className="w-4 h-4 text-[#1C1917]/30 absolute right-3 pointer-events-none" />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] uppercase tracking-[0.2em] font-medium text-[#1C1917]/70 block">
                GMAIL / EMAIL ADDRESS
              </label>
              <div className="relative flex items-center">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="client@gmail.com"
                  className="w-full bg-[#F9F6F0] border border-[#E6DFD5] focus:border-[#1C1917] px-3.5 py-2.5 text-xs text-[#1C1917] placeholder:text-[#1C1917]/35 focus:outline-none transition-colors"
                  required
                />
                <Mail className="w-4 h-4 text-[#1C1917]/30 absolute right-3 pointer-events-none" />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] uppercase tracking-[0.2em] font-medium text-[#1C1917]/70 block">
                SET A PASSWORD (MIN 6 CHARACTERS)
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
                  <Sparkles className="w-4 h-4 text-[#C7A97B]" />
                  <span>CREATE ACCOUNT</span>
                </>
              )}
            </button>
          </form>
        )}

        {/* ========================================================================= */}
        {/* TAB 3: FORGOT PASSWORD RECOVERY (EMAIL VERIFICATION) */}
        {/* ========================================================================= */}
        {activeTab === 'FORGOT_PASSWORD' && (
          <div className="space-y-4">
            {forgotStep === 'REQUEST_CODE' ? (
              <form onSubmit={handleRequestResetCode} className="space-y-4">
                <p className="text-xs text-[#1C1917]/70 leading-relaxed">
                  Enter your registered Gmail or email address to reset your password. A 6-digit verification code will be sent to your inbox.
                </p>

                <div className="space-y-1">
                  <label className="text-[10px] uppercase tracking-[0.2em] font-medium text-[#1C1917]/70 block">
                    GMAIL / EMAIL ADDRESS
                  </label>
                  <div className="relative flex items-center">
                    <input
                      type="email"
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      placeholder="client@gmail.com"
                      className="w-full bg-[#F9F6F0] border border-[#E6DFD5] focus:border-[#1C1917] px-3.5 py-2.5 text-xs text-[#1C1917] placeholder:text-[#1C1917]/35 focus:outline-none transition-colors"
                      required
                    />
                    <Mail className="w-4 h-4 text-[#1C1917]/30 absolute right-3 pointer-events-none" />
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
                      <KeyRound className="w-4 h-4 text-[#C7A97B]" />
                      <span>SEND RESET CODE</span>
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
                    <span>Back to Login</span>
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleConfirmResetPassword} className="space-y-3.5">
                <div className="p-3 bg-[#FAF8F5] border border-[#E6DFD5] text-[11px] text-[#1C1917]/80 leading-relaxed">
                  We dispatched a 6-digit verification code to <strong className="text-[#1C1917] font-medium">{forgotEmail}</strong>.{' '}
                  Please check your Inbox and Spam folder.
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] uppercase tracking-[0.2em] font-medium text-[#1C1917]/70">
                      6-DIGIT VERIFICATION CODE
                    </label>
                    {resendCooldown > 0 ? (
                      <span className="text-[10px] font-mono text-[#1C1917]/40">
                        Resend in {resendCooldown}s
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleRequestResetCode()}
                        disabled={isLoading}
                        className="text-[10px] uppercase tracking-[0.1em] text-[#C7A97B] hover:text-[#1C1917] transition-colors"
                      >
                        Resend Code
                      </button>
                    )}
                  </div>
                  <input
                    type="text"
                    maxLength={6}
                    value={resetCode}
                    onChange={(e) => setResetCode(e.target.value.replace(/\D/g, ''))}
                    placeholder="123456"
                    className="w-full bg-[#F9F6F0] border border-[#E6DFD5] focus:border-[#1C1917] px-3.5 py-2.5 text-center text-sm font-mono tracking-[0.35em] text-[#1C1917] placeholder:text-[#1C1917]/30 focus:outline-none transition-colors"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] uppercase tracking-[0.2em] font-medium text-[#1C1917]/70 block">
                    NEW PASSWORD (MIN 6 CHARACTERS)
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
                    CONFIRM NEW PASSWORD
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
                      <span>SAVE PASSWORD & SIGN IN</span>
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
                    <span>Change email address</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        )}

        {/* Security / Privacy Quiet Reassurance */}
        <div className="pt-2 border-t border-[#E6DFD5] flex items-center justify-center space-x-2 text-[9px] uppercase tracking-[0.15em] text-[#1C1917]/60">
          <ShieldCheck className="w-3.5 h-3.5 text-[#C7A97B]" />
          <span>SAFE & CONFIDENTIAL CLIENT DATA</span>
        </div>

      </div>
    </div>
  );
}
