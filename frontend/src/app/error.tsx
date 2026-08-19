'use client';

import React, { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('App Error Boundary caught:', error);
  }, [error]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-surface p-6 text-center">
      <div className="rounded-xl border border-danger/20 bg-danger-soft p-6 max-w-md">
        <h2 className="text-xl font-bold text-danger mb-2">Something went wrong!</h2>
        <p className="text-text-secondary text-sm mb-5 leading-relaxed">
          {error.message || 'An unexpected runtime exception occurred.'}
        </p>
        <button
          onClick={() => reset()}
          className="px-4 py-2 bg-primary text-white text-sm font-semibold rounded-md hover:bg-primary/90 transition-colors"
        >
          Try again
        </button>
      </div>
    </div>
  );
}
