"use client";
import { useState, useEffect } from "react";
import { createClient } from "../lib/supabase";
import { useRouter } from "next/navigation";

export default function AdminPage() {
  const supabase = createClient();
  const router = useRouter();

  const [user, setUser] = useState(null);
  const [requests, setRequests] = useState([]);
  const [filter, setFilter] = useState("All");
  const [pageLoading, setPageLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || user.user_metadata?.role !== "admin") { router.push("/"); return; }
      setUser(user);
      await fetchAll();
      setPageLoading(false);
    };
    init();
  }, []);

  const fetchAll = async () => {
    const { data, error } = await supabase
      .from("requisitions")
      .select("*")
      .order("created_at", { ascending: false });
    if (!error) setRequests(data);
  };

  const updateStatus = async (id, status) => {
    const { error } = await supabase
      .from("requisitions")
      .update({ status, reviewed_by: user.user_metadata?.full_name || user.email, reviewed_at: new Date().toISOString() })
      .eq("id", id);
    if (!error) setRequests((prev) => prev.map((r) => r.id === id ? { ...r, status } : r));
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  const statusStyle = {
    Pending: "bg-yellow-100 text-yellow-700",
    Approved: "bg-green-100 text-green-700",
    Rejected: "bg-red-100 text-red-700",
  };

  const filtered = filter === "All" ? requests : requests.filter(r => r.status === filter);

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
          <p className="text-xs text-slate-400">Admin Panel · {user?.user_metadata?.full_name || user?.email}</p>
        </div>
        <button onClick={signOut} className="text-sm text-slate-500 hover:text-red-600 font-semibold transition-colors">
          Sign Out
        </button>
      </nav>

      <div className="max-w-5xl mx-auto p-6 md:p-10">
        {/* Stats */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          {[
            { label: "Total", value: requests.length, color: "text-blue-600" },
            { label: "Pending", value: requests.filter(r => r.status === "Pending").length, color: "text-yellow-600" },
            { label: "Approved", value: requests.filter(r => r.status === "Approved").length, color: "text-green-600" },
            { label: "Rejected", value: requests.filter(r => r.status === "Rejected").length, color: "text-red-600" },
          ].map(({ label, value, color }) => (
            <div key={label} className="bg-white rounded-xl p-4 shadow-sm border border-slate-200 text-center">
              <p className={`text-2xl font-black ${color}`}>{value}</p>
              <p className="text-xs text-slate-500 font-semibold mt-1">{label}</p>
            </div>
          ))}
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 mb-6">
          {["All", "Pending", "Approved", "Rejected"].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${filter === f ? "bg-blue-600 text-white" : "bg-white text-slate-500 border border-slate-200 hover:border-blue-300"}`}
            >
              {f}
            </button>
          ))}
        </div>

        {/* Requests Table */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          {filtered.length === 0 ? (
            <p className="text-slate-400 italic text-sm p-6">No requests found.</p>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  {["Item", "Qty", "Submitted By", "Date", "Status", "Actions"].map((h) => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-black text-slate-500 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((req) => (
                  <tr key={req.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 font-semibold text-slate-800">{req.item_name}</td>
                    <td className="px-4 py-3 text-slate-600">{req.quantity}</td>
                    <td className="px-4 py-3 text-slate-600">{req.submitted_by || "—"}</td>
                    <td className="px-4 py-3 text-slate-500">{new Date(req.created_at).toLocaleDateString()}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-black uppercase ${statusStyle[req.status] || "bg-slate-100 text-slate-600"}`}>
                        {req.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {req.status === "Pending" && (
                        <div className="flex gap-2">
                          <button
                            onClick={() => updateStatus(req.id, "Approved")}
                            className="px-3 py-1 bg-green-500 hover:bg-green-600 text-white text-xs font-bold rounded-lg transition-all"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => updateStatus(req.id, "Rejected")}
                            className="px-3 py-1 bg-red-500 hover:bg-red-600 text-white text-xs font-bold rounded-lg transition-all"
                          >
                            Reject
                          </button>
                        </div>
                      )}
                      {req.status !== "Pending" && (
                        <span className="text-xs text-slate-400 italic">Reviewed</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </main>
  );
}
