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
      <body style={{ fontFamily: 'system-ui, sans-serif', padding: '2rem', display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', margin: 0, backgroundColor: '#f9fafb' }}>
        <div style={{ backgroundColor: '#ffffff', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '2rem', maxWidth: '480px', textAlign: 'center', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#dc2626', marginBottom: '0.5rem' }}>Application Error</h2>
          <p style={{ fontSize: '0.875rem', color: '#4b5563', marginBottom: '1.5rem' }}>
            {error.message || 'A critical error occurred while loading the application.'}
          </p>
          <button
            onClick={() => reset()}
            style={{ backgroundColor: '#2563eb', color: '#ffffff', border: 'none', padding: '0.625rem 1.25rem', borderRadius: '8px', fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer' }}
          >
            Reload EduOS Workspace
          </button>
        </div>
      </body>
    </html>
  );
}
