'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/app/components/shared/Header';
import { createClient } from '@/app/lib/supabase';

export default function ProfilePage() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }
      setUser(user);
      fetchProfile();
    };
    init();
  }, [router]);

  const fetchProfile = async () => {
    try {
      const res = await fetch('/api/users/profile');
      const data = await res.json();
      if (res.ok) {
        setProfile(data.user);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field, value) => {
    setProfile((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!profile) return;

    setSaving(true);
    setMessage('');
    try {
      const res = await fetch('/api/users/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: profile.full_name,
          phone: profile.phone,
          city: profile.city,
          business_name: profile.business_name,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Unable to save changes');
      setProfile(data.user);
      setMessage('Profile updated successfully.');
    } catch (error) {
      setMessage(error.message);
    } finally {
      setSaving(false);
    }
  };

  if (!user || loading) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <Header user={user} />
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Profile Settings</h1>
          <p className="text-gray-600 mt-1">Manage your account information and contact details.</p>
        </div>

        <div className="bg-white rounded-xl shadow p-6">
          <div className="grid grid-cols-1 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700">Email</label>
              <input
                type="text"
                value={profile.email || ''}
                disabled
                className="mt-2 w-full border-gray-200 rounded-lg bg-gray-50 px-4 py-3 text-sm text-gray-900"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Full Name</label>
              <input
                type="text"
                value={profile.full_name || ''}
                onChange={(e) => handleChange('full_name', e.target.value)}
                className="mt-2 w-full border rounded-lg px-4 py-3 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Phone</label>
              <input
                type="text"
                value={profile.phone || ''}
                onChange={(e) => handleChange('phone', e.target.value)}
                className="mt-2 w-full border rounded-lg px-4 py-3 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">City</label>
              <input
                type="text"
                value={profile.city || ''}
                onChange={(e) => handleChange('city', e.target.value)}
                className="mt-2 w-full border rounded-lg px-4 py-3 text-sm"
              />
            </div>
            {profile.app_metadata?.role === 'hardware_shop' && (
              <div>
                <label className="block text-sm font-medium text-gray-700">Business Name</label>
                <input
                  type="text"
                  value={profile.business_name || ''}
                  onChange={(e) => handleChange('business_name', e.target.value)}
                  className="mt-2 w-full border rounded-lg px-4 py-3 text-sm"
                />
              </div>
            )}
          </div>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              {message && <p className="text-sm text-green-700">{message}</p>}
            </div>
            <button
              onClick={handleSave}
              disabled={saving}
              className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-6 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
