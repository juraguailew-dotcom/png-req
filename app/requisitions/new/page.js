'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/app/lib/supabase';
import Header from '@/app/components/shared/Header';
import CreateRequisition from '@/app/components/contractor/CreateRequisition';

export default function NewRequisitionPage() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => setUser(user));
  }, []);

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <Header user={user} />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <CreateRequisition />
      </main>
    </div>
  );
}
