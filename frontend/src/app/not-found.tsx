'use client';

import React from 'react';
import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-surface p-6 text-center">
      <h2 className="text-2xl font-bold text-foreground mb-2">Page Not Found</h2>
      <p className="text-text-secondary text-sm mb-6 max-w-md">
        The requested screen or module does not exist or has been moved.
      </p>
      <Link
        href="/"
        className="px-4 py-2 bg-primary text-white text-sm font-semibold rounded-md hover:bg-primary/90 transition-colors"
      >
        Return to EduOS Workspace
      </Link>
    </div>
  );
}
