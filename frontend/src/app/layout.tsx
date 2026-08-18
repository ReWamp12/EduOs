import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'EduOS — Multi-Tenant Education Operating System',
  description: 'Full-Stack, Multi-Tenant, White-Label Education Operating System for Coaching Institutes, Schools, and Universities.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
