'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { createClient } from '@/app/lib/supabase';
import { formatCurrency } from '@/app/lib/utils/currency';

const STATUS_CONFIG = {
  pending:   { label: 'Pending',   cls: 'badge-pending' },
  approved:  { label: 'Approved',  cls: 'badge-approved' },
  fulfilled: { label: 'Fulfilled', cls: 'badge-fulfilled' },
  rejected:  { label: 'Rejected',  cls: 'badge-rejected' },
  cancelled: { label: 'Cancelled', cls: 'badge-cancelled' },
  quoted:    { label: 'Quoted',    cls: 'badge-quoted' },
};

function StatCard({ icon, label, value, sub, accent }) {
  return (
    <div className="stat-card">
      <div className={`stat-card-icon ${accent}`}>
        {icon}
      </div>
      <div>
        <div className="stat-card-value">{value}</div>
        <div className="stat-card-label">{label}</div>
        {sub && <div className="text-xs text-gray-400 mt-0.5">{sub}</div>}
      </div>
    </div>
  );
}

function QuickAction({ href, icon, title, desc, color }) {
  return (
    <Link href={href}
      className={`flex items-center gap-4 p-4 rounded-xl border border-gray-200 hover:border-gray-300 bg-white hover:shadow-md transition-all group card-interactive`}>
      <div className={`w-11 h-11 rounded-lg flex items-center justify-center text-2xl shrink-0 ${color}`}>
        {icon}
      </div>
      <div>
        <p className="text-sm font-semibold text-gray-900 group-hover:text-blue-700 transition-colors">{title}</p>
        <p className="text-xs text-gray-500 mt-0.5">{desc}</p>
      </div>
      <svg className="w-4 h-4 text-gray-300 ml-auto group-hover:text-blue-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
      </svg>
    </Link>
  );
}

export default function ContractorDashboard() {
  const [user, setUser] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [recentRequisitions, setRecentRequisitions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => setUser(user));
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [aRes, rRes] = await Promise.all([
        fetch('/api/analytics?period=30'),
        fetch('/api/requisitions?limit=5'),
      ]);
      const [aData, rData] = await Promise.all([aRes.json(), rRes.json()]);
      setAnalytics(aData.analytics);
      setRecentRequisitions(rData.requisitions || []);
    } catch (_) {
      // silently handle
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-3 text-gray-400">
          <svg className="w-8 h-8 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <span className="text-sm">Loading dashboard…</span>
        </div>
      </div>
    );
  }

  const name = user?.user_metadata?.full_name?.split(' ')[0] || 'there';

  return (
    <div className="space-y-6">

      {/* ── Page header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 animate-fade-in">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Good day, {name} 👋</h1>
          <p className="text-gray-500 text-sm mt-0.5">Here's your activity summary for the last 30 days.</p>
        </div>
        <Link href="/requisitions/new"
          className="btn btn-primary inline-flex items-center gap-2 self-start sm:self-auto">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          New Requisition
        </Link>
      </div>

      {/* ── Stats row ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 stagger-children">
        <StatCard
          icon={<svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>}
          label="Total Requisitions"
          value={analytics?.totalRequisitions ?? 0}
          accent="bg-blue-50"
        />
        <StatCard
          icon={<svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
          label="Pending Approval"
          value={analytics?.pendingRequisitions ?? 0}
          accent="bg-amber-50"
        />
        <StatCard
          icon={<svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
          label="Fulfilled"
          value={analytics?.fulfilledRequisitions ?? 0}
          accent="bg-emerald-50"
        />
        <StatCard
          icon={
            <svg className="w-5 h-5 text-violet-600" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
              <text x="50%" y="57%" textAnchor="middle" dominantBaseline="middle"
                fontSize="11" fontWeight="800" fill="currentColor" fontFamily="Arial, sans-serif">K</text>
            </svg>
          }
          label="Total Spent"
          value={formatCurrency(analytics?.totalSpent ?? 0)}
          accent="bg-violet-50"
        />
      </div>

      {/* ── Main content grid ── */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 animate-fade-in">

        {/* Recent Requisitions table — takes 2/3 */}
        <div className="xl:col-span-2 card overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <h2 className="text-base font-semibold text-gray-900">Recent Requisitions</h2>
            <Link href="/requisitions" className="text-sm text-blue-600 hover:text-blue-800 font-medium">
              View all →
            </Link>
          </div>
          {recentRequisitions.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <p className="text-sm font-medium text-gray-600">No requisitions yet</p>
              <Link href="/requisitions/new" className="text-sm text-blue-600 hover:text-blue-700 mt-1 inline-block">
                Create your first request →
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Ref</th>
                    <th>Date</th>
                    <th>Items</th>
                    <th>Total</th>
                    <th>Status</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {recentRequisitions.map((req) => {
                    const s = STATUS_CONFIG[req.status] || { label: req.status, cls: 'badge-cancelled' };
                    return (
                      <tr key={req.id}>
                        <td className="font-mono text-xs text-gray-500">#{req.id.slice(0, 8).toUpperCase()}</td>
                        <td className="text-gray-600">{new Date(req.created_at).toLocaleDateString()}</td>
                        <td className="text-gray-600">{req.items?.length || 0} items</td>
                        <td className="font-semibold text-gray-900">{formatCurrency(req.total_amount)}</td>
                        <td><span className={`badge ${s.cls}`}>{s.label}</span></td>
                        <td>
                          <Link href={`/requisitions/${req.id}`}
                            className="text-sm text-blue-600 hover:text-blue-800 font-medium">
                            View
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Quick actions — takes 1/3 */}
        <div className="space-y-4">
          <h2 className="text-base font-semibold text-gray-900">Quick Actions</h2>
          <div className="flex flex-col gap-3">
            <QuickAction
              href="/requisitions/new"
              icon="📋"
              title="Create Requisition"
              desc="Submit a new material request"
              color="bg-blue-50"
            />
            <QuickAction
              href="/products"
              icon="🛒"
              title="Browse Products"
              desc="Search hardware inventory"
              color="bg-emerald-50"
            />
            <QuickAction
              href="/shops"
              icon="🏪"
              title="Find Shops"
              desc="Locate verified hardware suppliers"
              color="bg-violet-50"
            />
            <QuickAction
              href="/requisitions/quoted"
              icon="📄"
              title="My Quotations"
              desc="View received shop quotations"
              color="bg-amber-50"
            />
            <QuickAction
              href="/favourites"
              icon="⭐"
              title="Saved Products"
              desc="Quick access to favourites"
              color="bg-pink-50"
            />
          </div>
        </div>
      </div>

      {/* Spending chart */}
      {analytics?.spendingByMonth?.length > 0 && (
        <div className="card p-6">
          <h2 className="text-base font-semibold text-gray-900 mb-5">Monthly Spending</h2>
          <div className="flex items-end gap-2 h-48">
            {analytics.spendingByMonth.map((item, i) => {
              const max = Math.max(...analytics.spendingByMonth.map(x => x.amount));
              const pct = max > 0 ? (item.amount / max) * 100 : 0;
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <span className="text-xs text-gray-500 font-medium">{formatCurrency(item.amount)}</span>
                  <div className="w-full bg-blue-600 rounded-t-md hover:bg-blue-700 transition-colors"
                    style={{ height: `${Math.max(pct, 4)}%` }} title={formatCurrency(item.amount)} />
                  <span className="text-xs text-gray-400">
                    {new Date(item.month + '-01').toLocaleDateString('en-US', { month: 'short' })}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
