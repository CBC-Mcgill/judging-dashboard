'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';

export default function SignupPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (!fullName && !email && !password) {
      setError('Full name, email, and password are required.');
      return;
    }
    if (!fullName) {
      setError('Full name is required.');
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
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);

    const supabase = createClient();
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
      },
    });

    if (error) {
      if (error.message.toLowerCase().includes('already registered') || error.message.toLowerCase().includes('already exists')) {
        setError('An account with this email already exists.\nTry signing in instead.');
      } else {
        setError(error.message);
      }
      setLoading(false);
    } else if (data.user && data.user.identities?.length === 0) {
      setError('An account with this email already exists.\nTry signing in instead.');
      setLoading(false);
    } else {
      router.push('/dashboard');
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-full max-w-sm px-6">
        <div className="text-center mb-8">
          <img src="/icon.svg" alt="Logo" className="w-12 h-12 mx-auto mb-4" />
          <h1 className="font-serif text-2xl">Create Account</h1>
        </div>

        <form onSubmit={handleSignup} className="space-y-4">
          {error && (
            <div className="bg-bg-red border border-red/20 text-red text-sm px-4 py-3 rounded-lg whitespace-pre-line">
              {error}
            </div>
          )}
          <div>
            <label className="text-xs font-semibold text-text-secondary block mb-1.5">Full Name</label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full px-3.5 py-2.5 border border-border rounded-lg bg-bg-input text-sm focus:outline-none focus:border-terracotta focus:ring-2 focus:ring-terracotta-light transition-all"
            />
          </div>
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
            {loading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        <p className="text-center text-sm text-text-muted mt-6">
          Already have an account?{' '}
          <Link href="/auth/login" className="text-terracotta font-semibold hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
