import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="max-w-md mx-auto text-center py-32 px-6">
        <img src="/icon.svg" alt="Logo" className="w-14 h-14 mx-auto mb-6" />
        <h1 className="font-serif text-3xl mb-2">Hackathon Judging Dashboards</h1>
        <p className="text-text-secondary text-sm mb-10">
          Create and manage judging dashboards for your hackathons.
          Enter scores, rank teams, and collaborate with judges.
          Created by CBC McGill.
        </p>
        <div className="flex flex-col gap-3">
          <Link
            href="/auth/login"
            className="bg-terracotta text-white px-6 py-3 rounded-lg font-semibold text-sm hover:bg-terracotta/90 transition-colors cursor-default"
          >
            Sign In
          </Link>
          <Link
            href="/auth/signup"
            className="border border-border px-6 py-3 rounded-lg font-semibold text-sm hover:bg-bg-warm transition-colors cursor-default"
          >
            Create Account
          </Link>
        </div>
      </div>
    </div>
  );
}
