'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';

export default function NotFound() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { createClient } = await import('./lib/supabase');
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        setIsAuthenticated(!!user);
      } catch (error) {
        setIsAuthenticated(false);
      }
    };
    checkAuth();
  }, []);

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 to-blue-50 flex items-center justify-center px-4 py-8">
      <div className="max-w-2xl w-full">
        {/* Main 404 Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12 text-center">
          {/* Icon */}
          <div className="inline-flex items-center justify-center w-20 h-20 bg-blue-100 rounded-2xl mb-6">
            <svg className="w-10 h-10 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>

          {/* 404 Text */}
          <div className="mb-4">
            <div className="text-7xl md:text-8xl font-black text-blue-600 leading-none">404</div>
            <div className="text-xl text-blue-500 font-semibold mt-2">Page Not Found</div>
          </div>

          {/* Description */}
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900 mb-4">
            We couldn't find what you're looking for
          </h1>
          <p className="text-slate-600 text-lg mb-8 max-w-md mx-auto">
            The page you're trying to access doesn't exist or has been moved. Let's get you back on track with the PNG Requisition System.
          </p>

          {/* Action Buttons */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            <Link
              href={isAuthenticated ? "/" : "/login"}
              className="inline-flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 shadow-md hover:shadow-lg"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2.149-2.149a4 4 0 015.656 0L12 12m0 0l2.149-2.149a4 4 0 015.656 0L21 12M3 12a9 9 0 1118 0m-9 9v-2m0 0v-6m0 6h6m-6 0H3" />
              </svg>
              {isAuthenticated ? "Go to Dashboard" : "Go to Login"}
            </Link>
            <Link
              href={isAuthenticated ? "/requisitions" : "/"}
              className="inline-flex items-center justify-center bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold py-3 px-6 rounded-lg transition-all duration-200"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              {isAuthenticated ? "View Requisitions" : "Go to Home"}
            </Link>
          </div>

          {/* Quick Links */}
          {isAuthenticated && (
            <div className="bg-blue-50 rounded-xl p-6 mb-8">
              <p className="text-sm font-semibold text-slate-700 mb-4">Quick Navigation</p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <Link href="/" className="text-sm text-blue-600 hover:text-blue-700 font-medium p-2 rounded hover:bg-blue-100 transition">
                  Dashboard
                </Link>
                <Link href="/requisitions" className="text-sm text-blue-600 hover:text-blue-700 font-medium p-2 rounded hover:bg-blue-100 transition">
                  Requisitions
                </Link>
                <Link href="/products" className="text-sm text-blue-600 hover:text-blue-700 font-medium p-2 rounded hover:bg-blue-100 transition">
                  Products
                </Link>
                <Link href="/messages" className="text-sm text-blue-600 hover:text-blue-700 font-medium p-2 rounded hover:bg-blue-100 transition">
                  Messages
                </Link>
              </div>
            </div>
          )}

          {/* Support Section */}
          <div className="pt-8 border-t border-slate-200">
            <p className="text-sm text-slate-600 mb-4">
              Still need help?
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <a
                href="/messages"
                className="text-blue-600 hover:text-blue-700 font-medium text-sm hover:underline"
              >
                Contact Support
              </a>
              <span className="hidden sm:inline text-slate-300">•</span>
              <a
                href="/"
                className="text-blue-600 hover:text-blue-700 font-medium text-sm hover:underline"
              >
                Report Issue
              </a>
            </div>
          </div>
        </div>

        {/* Decorative Elements */}
        <div className="mt-8 text-center text-sm text-slate-400">
          <p>PNG Requisition System © 2026</p>
        </div>
      </div>
    </div>
  );
}
