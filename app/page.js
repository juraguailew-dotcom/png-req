"use client";
import { useState, useEffect } from "react";
import { createClient } from "./lib/supabase";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();

  const [user, setUser] = useState(null);
  const [item, setItem] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();

    const fetchRequests = async (uid) => {
      const { data, error } = await supabase
        .from("requisitions")
        .select("*")
        .eq("user_id", uid)
        .order("created_at", { ascending: false });
      if (!error) setRequests(data);
    };

    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/login"); return; }
      setUser(user);
      await fetchRequests(user.id);
      setPageLoading(false);
    };
    init();
  }, []);

  const submitRequest = async () => {
    if (!item.trim()) return alert("Please enter an item name.");
    if (quantity < 1) return alert("Quantity must be at least 1.");
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.from("requisitions").insert([{
      item_name: item.trim(),
      quantity,
      status: "Pending",
      user_id: user.id,
      submitted_by: user.user_metadata?.full_name || user.email,
    }]);
    if (error) alert("Error: " + error.message);
    else {
      setItem("");
      setQuantity(1);
      const { data } = await supabase.from("requisitions").select("*").eq("user_id", user.id).order("created_at", { ascending: false });
      if (data) setRequests(data);
    }
    setLoading(false);
  };

  const deleteRequest = async (id) => {
    if (!confirm("Delete this request?")) return;
    const supabase = createClient();
    const { error } = await supabase.from("requisitions").delete().eq("id", id).eq("user_id", user.id);
    if (!error) setRequests((prev) => prev.filter((r) => r.id !== id));
  };

  const signOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  };

  const statusStyle = {
    Pending: "bg-yellow-100 text-yellow-700",
    Approved: "bg-green-100 text-green-700",
    Rejected: "bg-red-100 text-red-700",
  };

  if (pageLoading) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <p className="text-slate-400 animate-pulse">Loading...</p>
    </div>
  );

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      {/* Navbar */}
      <nav className="bg-white border-b border-slate-200 px-6 py-4 flex justify-between items-center shadow-sm">
        <div>
          <h1 className="text-lg font-black text-blue-900">PNG Requisition System</h1>
          <p className="text-xs text-slate-400">Welcome, {user?.user_metadata?.full_name || user?.email}</p>
        </div>
        <button onClick={signOut} className="text-sm text-slate-500 hover:text-red-600 font-semibold transition-colors">
          Sign Out
        </button>
      </nav>

      <div className="max-w-4xl mx-auto p-6 md:p-10">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            { label: "Total", value: requests.length, color: "text-blue-600" },
            { label: "Pending", value: requests.filter(r => r.status === "Pending").length, color: "text-yellow-600" },
            { label: "Approved", value: requests.filter(r => r.status === "Approved").length, color: "text-green-600" },
          ].map(({ label, value, color }) => (
            <div key={label} className="bg-white rounded-xl p-4 shadow-sm border border-slate-200 text-center">
              <p className={`text-2xl font-black ${color}`}>{value}</p>
              <p className="text-xs text-slate-500 font-semibold mt-1">{label}</p>
            </div>
          ))}
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Form */}
          <section className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <h2 className="text-lg font-bold mb-4">New Request</h2>
            <label className="block text-sm font-bold text-slate-600 mb-1">Material / Item Name</label>
            <input
              type="text" value={item} onChange={(e) => setItem(e.target.value)}
              className="border-2 border-slate-200 p-3 w-full mb-4 rounded-lg text-sm focus:border-blue-500 outline-none"
              placeholder="e.g. Roofing Sheets"
            />
            <label className="block text-sm font-bold text-slate-600 mb-1">Quantity</label>
            <input
              type="number" min={1} value={quantity} onChange={(e) => setQuantity(Number(e.target.value))}
              className="border-2 border-slate-200 p-3 w-full mb-4 rounded-lg text-sm focus:border-blue-500 outline-none"
            />
            <button
              onClick={submitRequest} disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-bold py-3 px-4 rounded-lg w-full transition-all"
            >
              {loading ? "Submitting..." : "Submit Request"}
            </button>
          </section>

          {/* List */}
          <section>
            <h2 className="text-lg font-bold mb-4">My Requests</h2>
            <div className="space-y-3 max-h-[480px] overflow-y-auto pr-1">
              {requests.length === 0 && (
                <p className="text-slate-400 italic text-sm">No requests yet. Submit one!</p>
              )}
              {requests.map((req) => (
                <div key={req.id} className="bg-white p-4 rounded-lg shadow-sm border border-slate-200 flex justify-between items-start">
                  <div>
                    <p className="font-bold text-slate-800 text-sm">{req.item_name}</p>
                    <p className="text-xs text-slate-500">Qty: {req.quantity} · {new Date(req.created_at).toLocaleDateString()}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-black uppercase ${statusStyle[req.status] || "bg-slate-100 text-slate-600"}`}>
                      {req.status}
                    </span>
                    {req.status === "Pending" && (
                      <button onClick={() => deleteRequest(req.id)} className="text-slate-300 hover:text-red-500 transition-colors text-lg leading-none">×</button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
