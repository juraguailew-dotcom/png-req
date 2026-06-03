'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/app/components/shared/Header';
import { createClient } from '@/app/lib/supabase';

const PNG_CITIES = [
  'Port Moresby', 'Lae', 'Mount Hagen', 'Madang', 'Wewak',
  'Goroka', 'Kokopo', 'Kimbe', 'Alotau', 'Popondetta',
  'Mendi', 'Kavieng', 'Vanimo', 'Daru', 'Lorengau',
];

const ROLE_LABELS = {
  contractor: 'Contractor',
  hardware_shop: 'Hardware Shop',
  admin: 'Administrator',
};

function Field({ label, hint, children }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      {hint && <p className="text-xs text-gray-400 mb-1">{hint}</p>}
      {children}
    </div>
  );
}

function Input({ className = '', ...props }) {
  return (
    <input
      className={`w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:text-gray-500 ${className}`}
      {...props}
    />
  );
}

export default function ProfilePage() {
  const [user, setUser] = useState(null);
  const [form, setForm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null); // { type: 'success'|'error', msg }
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { router.push('/login'); return; }
      setUser(user);
      fetch('/api/users/profile')
        .then(r => r.json())
        .then(d => { if (d.user) setForm(d.user); })
        .finally(() => setLoading(false));
    });
  }, [router]);

  const set = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

  const showToast = (type, msg) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 4000);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form) return;
    setSaving(true);
    try {
      const res = await fetch('/api/users/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: form.full_name,
          phone: form.phone,
          city: form.city,
          address: form.address,
          business_name: form.business_name,
          business_registration: form.business_registration,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Unable to save changes');
      setForm(data.user);
      showToast('success', 'Profile updated successfully.');
    } catch (err) {
      showToast('error', err.message);
    } finally {
      setSaving(false);
    }
  };

  if (!user || loading || !form) return null;

  const role = form.role || user.app_metadata?.role;
  const initials = (form.full_name || form.email || '?')
    .split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  const isShop = role === 'hardware_shop';

  return (
    <div className="min-h-screen bg-gray-50">
      <Header user={user} />

      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-5 py-3 rounded-lg shadow-lg text-sm font-medium text-white transition-all ${toast.type === 'success' ? 'bg-green-600' : 'bg-red-600'}`}>
          {toast.type === 'success' ? '✓ ' : '✕ '}{toast.msg}
        </div>
      )}

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Profile Settings</h1>
          <p className="text-gray-500 mt-1">Manage your account information and contact details.</p>
        </div>

        <form onSubmit={handleSave} className="space-y-6">

          {/* ── Avatar + role card ── */}
          <div className="bg-white border border-gray-200 rounded-xl p-6 flex items-center gap-5">
            <div className="w-16 h-16 rounded-full bg-blue-600 flex items-center justify-center text-white text-xl font-bold shrink-0">
              {initials}
            </div>
            <div>
              <p className="text-lg font-semibold text-gray-900">{form.full_name || '—'}</p>
              <p className="text-sm text-gray-500">{form.email}</p>
              <span className="mt-1 inline-block px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                {ROLE_LABELS[role] || role || 'User'}
              </span>
            </div>
          </div>

          {/* ── Basic info ── */}
          <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-5">
            <h2 className="text-sm font-bold uppercase tracking-wider text-gray-500">Account Information</h2>

            <Field label="Email">
              <Input type="email" value={form.email || ''} disabled />
            </Field>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <Field label="Full Name">
                <Input
                  type="text"
                  value={form.full_name || ''}
                  onChange={e => set('full_name', e.target.value)}
                  placeholder="Your full name"
                  required
                />
              </Field>
              <Field label="Phone Number" hint="PNG format e.g. 7xxx xxxx">
                <Input
                  type="tel"
                  value={form.phone || ''}
                  onChange={e => set('phone', e.target.value)}
                  placeholder="70000000"
                />
              </Field>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <Field label="City / Town">
                <select
                  value={form.city || ''}
                  onChange={e => set('city', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  <option value="">— Select city —</option>
                  {PNG_CITIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </Field>
              <Field label="Street Address">
                <Input
                  type="text"
                  value={form.address || ''}
                  onChange={e => set('address', e.target.value)}
                  placeholder="Section 12, Lot 4, Waigani Drive"
                />
              </Field>
            </div>
          </div>

          {/* ── Business info (all roles, mandatory for shops) ── */}
          <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-5">
            <h2 className="text-sm font-bold uppercase tracking-wider text-gray-500">
              {isShop ? 'Business Information' : 'Company / Project Details'}
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <Field label={isShop ? 'Business / Trading Name' : 'Company Name'}>
                <Input
                  type="text"
                  value={form.business_name || ''}
                  onChange={e => set('business_name', e.target.value)}
                  placeholder={isShop ? 'ABC Hardware Ltd' : 'My Construction Co.'}
                />
              </Field>
              <Field label="Business Registration No." hint="IPA registration number if applicable">
                <Input
                  type="text"
                  value={form.business_registration || ''}
                  onChange={e => set('business_registration', e.target.value)}
                  placeholder="1-12345"
                />
              </Field>
            </div>
          </div>

          {/* ── Account meta (read-only) ── */}
          <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-4">
            <h2 className="text-sm font-bold uppercase tracking-wider text-gray-500">Account Details</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 text-sm">
              <div>
                <p className="text-gray-400 text-xs mb-1">Account Role</p>
                <p className="font-medium text-gray-800">{ROLE_LABELS[role] || role || '—'}</p>
              </div>
              <div>
                <p className="text-gray-400 text-xs mb-1">Member Since</p>
                <p className="font-medium text-gray-800">
                  {form.created_at ? new Date(form.created_at).toLocaleDateString('en-PG', { day: '2-digit', month: 'long', year: 'numeric' }) : '—'}
                </p>
              </div>
              <div>
                <p className="text-gray-400 text-xs mb-1">Account Status</p>
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${form.active !== false ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${form.active !== false ? 'bg-green-500' : 'bg-red-500'}`} />
                  {form.active !== false ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>
          </div>

          {/* ── Save ── */}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="px-8 py-2.5 bg-red-600 text-white rounded-lg text-sm font-bold uppercase tracking-wide hover:bg-red-700 disabled:opacity-50"
            >
              {saving ? 'Saving…' : 'Save Changes'}
            </button>
          </div>

        </form>
      </main>
    </div>
  );
}
