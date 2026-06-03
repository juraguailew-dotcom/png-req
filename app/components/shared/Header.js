'use client';

import { useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/app/lib/supabase';
import NotificationBell from './NotificationBell';

export default function Header({ user }) {
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isQuickNavOpen, setIsQuickNavOpen] = useState(false);
  const [quickNavQuery, setQuickNavQuery] = useState('');
  const router = useRouter();
  const pathname = usePathname();
  const supabase = createClient();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  const role = user?.app_metadata?.role;
  const displayName = user?.user_metadata?.full_name || user?.email;

  const getNavLinks = () => {
    if (role === 'admin') {
      return [
        { href: '/admin', label: 'Dashboard' },
        { href: '/admin/users', label: 'Users' },
        { href: '/admin/requisitions', label: 'Requisitions' },
        { href: '/admin/disputes', label: 'Disputes' },
        { href: '/admin/analytics', label: 'Analytics' },
        { href: '/admin/settings', label: 'Settings' },
      ];
    } else if (role === 'hardware_shop') {
      return [
        { href: '/shop', label: 'Dashboard' },
        { href: '/shop/products', label: 'Products' },
        { href: '/shop/requisitions', label: 'Requisitions' },
        { href: '/shop/orders', label: 'Orders' },
        { href: '/shop/inventory', label: 'Inventory' },
        { href: '/messages', label: 'Messages' },
      ];
    } else {
      return [
        { href: '/', label: 'Dashboard' },
        { href: '/requisitions', label: 'My Requisitions' },
        { href: '/requisitions/quoted', label: 'Quoted Requests' },
        { href: '/products', label: 'Browse Products' },
        { href: '/favourites', label: 'Favourites' },
        { href: '/messages', label: 'Messages' },
      ];
    }
  };

  const navLinks = getNavLinks();
  const quickLinks = Array.from(
    new Map(
      [...navLinks, { href: '/profile', label: 'Profile' }, { href: '/messages', label: 'Messages' }]
        .map((link) => [link.href, link])
    ).values()
  );

  const filteredQuickLinks = quickLinks.filter((link) =>
    link.label.toLowerCase().includes(quickNavQuery.toLowerCase()) ||
    link.href.toLowerCase().includes(quickNavQuery.toLowerCase())
  );

  const activeClass = (href) =>
    pathname === href || (href !== '/' && pathname?.startsWith(href))
      ? 'text-blue-600 font-semibold'
      : 'text-gray-700 hover:text-blue-600';

  return (
    <header className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16 gap-6">
          <div className="flex items-center gap-8">
            <Link href={role === 'admin' ? '/admin' : role === 'hardware_shop' ? '/shop' : '/'} className="flex items-center gap-2 hover:opacity-80 transition">
              <div className="w-8 h-8 bg-linear-to-br from-orange-500 to-orange-700 rounded-lg flex items-center justify-center text-white font-bold text-sm">
                PN
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-bold text-gray-900">PNG</span>
                <span className="text-xs text-gray-600 -mt-1">Requisition</span>
              </div>
            </Link>

            <nav className="hidden md:flex space-x-1">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`px-3 py-2 text-sm font-medium rounded-md transition ${
                    activeClass(link.href) === 'text-blue-600 font-semibold'
                      ? 'text-blue-600 bg-blue-50'
                      : 'text-gray-700 hover:text-blue-600 hover:bg-gray-50'
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setIsQuickNavOpen(!isQuickNavOpen);
                setIsUserMenuOpen(false);
                setIsMobileMenuOpen(false);
              }}
              className="hidden md:inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-400 transition"
              title="Quick navigation search"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              Quick Nav
            </button>

            <button
              type="button"
              onClick={() => {
                setIsMobileMenuOpen(false);
                setIsQuickNavOpen(false);
                setIsUserMenuOpen(false);
                router.push('/messages');
              }}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition"
              aria-label="Messages"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
            </button>

            <NotificationBell />

            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setIsUserMenuOpen(!isUserMenuOpen);
                  setIsQuickNavOpen(false);
                  setIsMobileMenuOpen(false);
                }}
                className="flex items-center space-x-2 text-gray-700 hover:text-gray-900 px-2 py-1 rounded-lg hover:bg-gray-100 transition"
              >
                <div className="w-8 h-8 bg-linear-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                  {displayName?.charAt(0).toUpperCase()}
                </div>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {isUserMenuOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                  <div className="px-4 py-3 border-b border-gray-200 bg-gray-50 rounded-t-lg">
                    <p className="text-sm font-semibold text-gray-900">{displayName}</p>
                    <p className="text-xs text-white-500 capitalize mt-1">{role?.replace('_', ' ')}</p>
                  </div>
                  <Link href="/profile" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition">
                    Profile Settings
                  </Link>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition"
                  >
                    Logout
                  </button>
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={() => {
                setIsMobileMenuOpen(!isMobileMenuOpen);
                setIsQuickNavOpen(false);
                setIsUserMenuOpen(false);
              }}
              className="md:hidden p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition"
              aria-label="Toggle mobile menu"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>

        {isQuickNavOpen && (
          <div className="absolute left-0 right-0 top-full z-40 bg-white border-t border-gray-200 shadow-lg">
            <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-sm font-semibold text-gray-900">Smart Navigation</p>
                  <p className="text-xs text-gray-600 mt-1">Search and jump to any section</p>
                </div>
                <div className="w-full md:w-96">
                  <div className="relative">
                    <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <input
                      type="search"
                      value={quickNavQuery}
                      onChange={(event) => setQuickNavQuery(event.target.value)}
                      placeholder="Search pages, messages, profile..."
                      className="w-full rounded-lg border border-gray-300 pl-10 pr-4 py-2 text-sm placeholder-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>
              <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {filteredQuickLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setIsQuickNavOpen(false)}
                    className="rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm font-medium text-gray-700 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-600 transition"
                  >
                    {link.label}
                  </Link>
                ))}
                {filteredQuickLinks.length === 0 && (
                  <div className="col-span-full rounded-lg border border-dashed border-gray-300 bg-gray-50 px-4 py-8 text-center text-sm text-gray-500">
                    No matching sections found.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {isMobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-gray-200 bg-gray-50">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setIsMobileMenuOpen(false)}
                className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition"
              >
                {link.label}
              </Link>
            ))}
            <Link
              href="/profile"
              onClick={() => setIsMobileMenuOpen(false)}
              className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition"
            >
              Profile
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}
