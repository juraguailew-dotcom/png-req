"use client"
import { useState } from 'react';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default function Home() {
  const [item, setItem] = useState("");
  const [loading, setLoading] = useState(false);

  const submitRequest = async () => {
    if (!item) return alert("Please enter an item!");
    
    setLoading(true);
    const { error } = await supabase
      .from('requisitions')
      .insert([{ item_name: item, quantity: 1 }]); // 'quantity' matches your table column

    if (error) {
      console.error(error);
      alert("Error saving to database: " + error.message);
    } else {
      alert(`Success! Requisition for ${item} is now in the system.`);
      setItem(""); // Clear the input
    }
    setLoading(false);
  };

  return (
    <main className="p-10 bg-slate-100 min-h-screen text-slate-900">
      <h1 className="text-3xl font-bold mb-6 text-blue-900">PNG Contractor Requisition</h1>
      
      <div className="bg-white p-8 rounded-lg shadow-xl max-w-md border border-slate-200">
        <label className="block mb-2 text-sm font-bold text-slate-700">Material Needed</label>
        <input 
          type="text"
          value={item}
          onChange={(e) => setItem(e.target.value)}
          className="border-2 border-slate-300 p-3 w-full mb-6 rounded-md text-black focus:border-blue-500 outline-none" 
          placeholder="e.g. 50x Bags of Cement"
        />
        
        <button 
          onClick={submitRequest}
          disabled={loading}
          className={`${loading ? 'bg-slate-400' : 'bg-blue-600 hover:bg-blue-700'} text-white font-bold py-3 px-4 rounded-md w-full shadow-lg transition-all`}>
          {loading ? 'Sending to Database...' : 'Submit Requisition'}
        </button>
      </div>
    </main>
  );
}
