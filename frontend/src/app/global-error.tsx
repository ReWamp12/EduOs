'use client';

import React from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-6 text-center font-sans">
        <div className="bg-white rounded-xl shadow-lg border border-red-200 p-8 max-w-md">
          <h2 className="text-xl font-bold text-red-600 mb-2">Global System Error</h2>
          <p className="text-gray-600 text-sm mb-6">
            {error.message || 'A critical error occurred while loading the application.'}
          </p>
          <button
            onClick={() => reset()}
            className="px-5 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
          >
            Reload EduOS
          </button>
        </div>
      </body>
    </html>
  );
}
