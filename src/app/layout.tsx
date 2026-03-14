import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Judging Dashboard',
  description: 'Claude Builder Club McGill Hackathon Judging Dashboard',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
