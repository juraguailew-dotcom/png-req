"use client"
import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default function Home() {
  const [item, setItem] = useState("");
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);

  // 1. Function to get data from Supabase
  const fetchRequests = async () => {
    const { data, error } = await supabase
      .from('requisitions')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (!error) setRequests(data);
  };

  // 2. Run fetch when the page first opens
  useEffect(() => {
    fetchRequests();
  }, []);

  const submitRequest = async () => {
    if (!item) return alert("Please enter an item!");
    setLoading(true);
    
    const { error } = await supabase
      .from('requisitions')
      .insert([{ item_name: item, quantity: 1, status: 'Pending' }]);

    if (error) {
      alert("Error: " + error.message);
    } else {
      setItem("");
      fetchRequests(); // Refresh the list after submitting
    }
    setLoading(false);
  };

  return (
    <main className="p-6 md:p-12 bg-slate-50 min-h-screen text-slate-900">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-black mb-2 text-blue-900">PNG Requisition System</h1>
        <p className="text-slate-500 mb-8">Contractor Portal | Digital Field Requests</p>
        
        <div className="grid md:grid-cols-2 gap-10">
          {/* LEFT SIDE: THE FORM */}
          <section>
            <div className="bg-white p-6 rounded-xl shadow-lg border border-slate-200">
              <h2 className="text-xl font-bold mb-4">New Request</h2>
              <label className="block mb-2 text-sm font-bold text-slate-600">Material Name</label>
              <input 
                type="text"
                value={item}
                onChange={(e) => setItem(e.target.value)}
                className="border-2 border-slate-200 p-3 w-full mb-4 rounded-lg text-black focus:border-blue-500 outline-none" 
                placeholder="e.g. 10x Roofing Sheets"
              />
              <button 
                onClick={submitRequest}
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg w-full shadow-md transition-all">
                {loading ? 'Processing...' : 'Submit to Shop'}
              </button>
            </div>
          </section>

          {/* RIGHT SIDE: THE LIVE LIST */}
          <section>
            <h2 className="text-xl font-bold mb-4">Recent Submissions</h2>
            <div className="space-y-3">
              {requests.length === 0 && <p className="text-slate-400 italic">No requests found yet.</p>}
              {requests.map((req) => (
                <div key={req.id} className="bg-white p-4 rounded-lg shadow-sm border-l-4 border-blue-500 flex justify-between items-center">
                  <div>
                    <p className="font-bold text-slate-800">{req.item_name}</p>
                    <p className="text-xs text-slate-500">{new Date(req.created_at).toLocaleDateString()}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-black uppercase ${
                    req.status === 'Pending' ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'
                  }`}>
                    {req.status}
                  </span>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
