"use client"
import { useState } from 'react';

export default function Home() {
  const [item, setItem] = useState("");

  const submitRequest = () => {
    alert(`Requisition for ${item} sent to Hardware Shop!`);
    // Here is where you will link your Supabase "insert" logic later
  };

  return (
    <main className="p-10 bg-gray-50 min-h-screen">
      <h1 className="text-2xl font-bold mb-4">PNG Contractor Requisition</h1>
      <div className="bg-white p-6 rounded shadow-md max-w-md">
        <label className="block mb-2 text-sm">Material Needed (e.g., Cement)</label>
        <input 
          onChange={(e) => setItem(e.target.value)}
          className="border p-2 w-full mb-4 rounded" 
          placeholder="Enter item name..."
        />
        <button 
          onClick={submitRequest}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 w-full">
          Submit Requisition
        </button>
      </div>
    </main>
  );
}
