'use client';

import { useEffect } from 'react';
import Link from 'next/link';

export default function Error({ error, reset }) {
  useEffect(() => {
    console.error('Application error:', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <div className="text-6xl font-bold text-red-600 mb-4">⚠️</div>
        
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Something Went Wrong</h1>
        <p className="text-gray-600 mb-2">
          We encountered an unexpected error. Please try again or contact support.
        </p>
        <p className="text-sm text-gray-500 mb-8 break-words">
          {error?.message || 'Unknown error occurred'}
        </p>

        <div className="space-y-3">
          <button
            onClick={reset}
            className="inline-block w-full bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition font-medium"
          >
            Try Again
          </button>
          <Link
            href="/"
            className="inline-block w-full bg-gray-100 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-200 transition font-medium"
          >
            Return Home
          </Link>
        </div>

        <div className="mt-8 pt-8 border-t border-gray-200">
          <p className="text-sm text-gray-600">
            Need help? <a href="/messages" className="text-blue-600 hover:text-blue-800 font-medium">Contact Support</a>
          </p>
        </div>
      </div>
    </div>
  );
}
