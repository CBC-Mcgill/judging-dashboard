'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState, Suspense } from 'react';
import { createClient } from '@/lib/supabase/client';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const joinToken = searchParams.get('join');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (!email && !password) {
      setError('Email and password are required.');
      return;
    }
    if (!email) {
      setError('Email is required.');
      return;
    }
    if (!password) {
      setError('Password is required.');
      return;
    }

    setLoading(true);

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      router.push(joinToken ? `/join/${joinToken}` : '/dashboard');
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-full max-w-sm px-6">
        <div className="text-center mb-8">
          <img src="/icon.svg" alt="Logo" className="w-12 h-12 mx-auto mb-4" />
          <h1 className="font-serif text-2xl">Sign In</h1>
        </div>

        {joinToken && (
          <div className="bg-terracotta-bg border border-terracotta/20 text-terracotta text-sm px-4 py-3 rounded-lg mb-4 text-center">
            Sign in to join as a judge
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          {error && (
            <div className="bg-bg-red border border-red/20 text-red text-sm px-4 py-3 rounded-lg">
              {error}
            </div>
          )}
          <div>
            <label className="text-xs font-semibold text-text-secondary block mb-1.5">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3.5 py-2.5 border border-border rounded-lg bg-bg-input text-sm focus:outline-none focus:border-terracotta focus:ring-2 focus:ring-terracotta-light transition-all"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-text-secondary block mb-1.5">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3.5 py-2.5 border border-border rounded-lg bg-bg-input text-sm focus:outline-none focus:border-terracotta focus:ring-2 focus:ring-terracotta-light transition-all"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-terracotta text-white py-2.5 rounded-lg font-semibold text-sm hover:bg-terracotta/90 transition-colors disabled:opacity-50"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <p className="text-center text-sm text-text-muted mt-6">
          No account?{' '}
          <Link href={joinToken ? `/auth/signup?join=${joinToken}` : '/auth/signup'} className="text-terracotta font-semibold hover:underline">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
