'use client';

import React, { useState, useEffect, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Library } from 'lucide-react';
import { Button } from '@/components/common/Button';
import { useAuth } from '@/components/auth/AuthProvider';
import { useLanguage } from '@/i18n';
import { checkRegistrationOpen } from '@/services/auth';

type AuthMode = 'login' | 'register';

export default function LoginPage() {
  const { isAuthenticated, isLoading, login, register } = useAuth();
  const { t } = useLanguage();
  const router = useRouter();

  const [mode, setMode] = useState<AuthMode>('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [registrationOpen, setRegistrationOpen] = useState(true);

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.replace('/');
    }
  }, [isAuthenticated, isLoading, router]);

  useEffect(() => {
    checkRegistrationOpen().then(setRegistrationOpen);
  }, []);

  function validate(): string | null {
    if (!username.trim()) return t('auth.usernameRequired');
    if (password.length < 8) return t('auth.passwordTooShort');
    return null;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');

    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsSubmitting(true);
    try {
      if (mode === 'login') {
        await login(username, password);
      } else {
        await register(username, password);
      }
      router.replace('/');
    } catch (err) {
      if (err instanceof Error) {
        if (err.message.includes('already exists')) {
          setError(t('auth.registrationLocked'));
        } else {
          setError(mode === 'login' ? t('auth.loginFailed') : err.message);
        }
      } else {
        setError(t('auth.loginFailed'));
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isLoading || isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-950">
        <svg
          className="animate-spin h-8 w-8 text-indigo-500"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-950 px-4">
      <div className="w-full max-w-md">
        {/* Branding */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg shadow-indigo-500/25 mb-4">
            <Library className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">BookShelf</h1>
          <p className="text-gray-400 mt-1">{t('auth.signInToContinue')}</p>
        </div>

        {/* Card */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 shadow-xl">
          {/* Tabs */}
          <div className="flex rounded-lg bg-gray-800 p-1 mb-6">
            <button
              type="button"
              onClick={() => { setMode('login'); setError(''); }}
              className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${
                mode === 'login'
                  ? 'bg-gray-700 text-white shadow-sm'
                  : 'text-gray-400 hover:text-gray-300'
              }`}
            >
              {t('auth.login')}
            </button>
            <button
              type="button"
              disabled={!registrationOpen}
              onClick={() => { if (registrationOpen) { setMode('register'); setError(''); } }}
              className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${
                !registrationOpen
                  ? 'text-gray-600 cursor-not-allowed'
                  : mode === 'register'
                    ? 'bg-gray-700 text-white shadow-sm'
                    : 'text-gray-400 hover:text-gray-300'
              }`}
            >
              {t('auth.createAccount')}
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-300 mb-1.5">
                {t('auth.username')}
              </label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-1.5">
                {t('auth.password')}
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors"
              />
            </div>

            {error && (
              <div className="text-sm text-red-400 bg-red-400/10 border border-red-400/20 rounded-lg px-3 py-2">
                {error}
              </div>
            )}

            <Button
              type="submit"
              variant="primary"
              size="lg"
              isLoading={isSubmitting}
              className="w-full"
            >
              {isSubmitting
                ? (mode === 'login' ? t('auth.loggingIn') : t('auth.creatingAccount'))
                : (mode === 'login' ? t('auth.login') : t('auth.createAccount'))
              }
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
