"use client";
import { useState, useEffect } from "react";
import { createClient } from "../lib/supabase";
import { useRouter } from "next/navigation";

export default function ShopPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [tab, setTab] = useState("assigned");
  const [requests, setRequests] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [commentMap, setCommentMap] = useState({});
  const [pageLoading, setPageLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);

  useEffect(() => {
    const supabase = createClient();
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || user.app_metadata?.role !== "hardware_shop") { router.push("/login"); return; }
      setUser(user);

      const [{ data: reqs }, { data: notifs }] = await Promise.all([
        supabase.from("requisitions").select("*").eq("assigned_shop_id", user.id).order("created_at", { ascending: false }),
        supabase.from("notifications").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
      ]);
      if (reqs) setRequests(reqs);
      if (notifs) setNotifications(notifs);
      setPageLoading(false);
    };
    init();
  }, []);

  const fulfill = async (req) => {
    setActionLoading(req.id);
    const supabase = createClient();
    const comment = commentMap[req.id] || "";
    const { error } = await supabase.from("requisitions").update({
      status: "Fulfilled",
      fulfilled_by: user.user_metadata?.full_name || user.email,
      fulfilled_at: new Date().toISOString(),
      comment: comment || null,
    }).eq("id", req.id);
    if (!error) {
      setRequests(prev => prev.map(r => r.id === req.id
        ? { ...r, status: "Fulfilled", fulfilled_by: user.user_metadata?.full_name || user.email, fulfilled_at: new Date().toISOString(), comment }
        : r
      ));
      setCommentMap(prev => { const n = { ...prev }; delete n[req.id]; return n; });
    } else {
      alert("Error: " + error.message);
    }
    setActionLoading(null);
  };

  const markAllRead = async () => {
    const supabase = createClient();
    const unreadIds = notifications.filter(n => !n.read).map(n => n.id);
    if (!unreadIds.length) return;
    await supabase.from("notifications").update({ read: true }).in("id", unreadIds);
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const signOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  };

  const unreadCount = notifications.filter(n => !n.read).length;
  const pending = requests.filter(r => r.status === "Approved");
  const fulfilled = requests.filter(r => r.status === "Fulfilled");

  const statusStyle = {
    Approved: "bg-green-100 text-green-700",
    Fulfilled: "bg-blue-100 text-blue-700",
  };

  if (pageLoading) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <p className="text-slate-400 animate-pulse">Loading...</p>
    </div>
  );

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <nav className="bg-white border-b border-slate-200 px-6 py-4 flex justify-between items-center shadow-sm">
        <div>
          <h1 className="text-lg font-black text-blue-900">PNG Requisition System</h1>
          <p className="text-xs text-slate-400">Hardware Shop · {user?.user_metadata?.full_name || user?.email}</p>
        </div>
        <div className="flex items-center gap-4">
          <button onClick={() => { setTab("notifications"); markAllRead(); }} className="relative text-slate-500 hover:text-blue-600 transition-colors">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 10-12 0v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center font-bold">{unreadCount}</span>
            )}
          </button>
          <button onClick={signOut} className="text-sm text-slate-500 hover:text-red-600 font-semibold transition-colors">Sign Out</button>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto p-6 md:p-10">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          {[
            { label: "Total Assigned", value: requests.length, color: "text-blue-600" },
            { label: "Pending Fulfillment", value: pending.length, color: "text-yellow-600" },
            { label: "Fulfilled", value: fulfilled.length, color: "text-green-600" },
          ].map(({ label, value, color }) => (
            <div key={label} className="bg-white rounded-xl p-4 shadow-sm border border-slate-200 text-center">
              <p className={`text-2xl font-black ${color}`}>{value}</p>
              <p className="text-xs text-slate-500 font-semibold mt-1">{label}</p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          {["assigned", "fulfilled", "notifications", "profile"].map((t) => (
            <button key={t} onClick={() => { setTab(t); if (t === "notifications") markAllRead(); }}
              className={`px-4 py-2 rounded-lg text-sm font-bold capitalize transition-all relative ${tab === t ? "bg-blue-600 text-white" : "bg-white text-slate-500 border border-slate-200 hover:border-blue-300"}`}>
              {t}
              {t === "notifications" && unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center font-bold">{unreadCount}</span>
              )}
            </button>
          ))}
        </div>

        {/* Assigned Tab */}
        {tab === "assigned" && (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            {pending.length === 0 ? (
              <p className="text-slate-400 italic text-sm p-6">No pending requisitions assigned to you.</p>
            ) : (
              <div className="divide-y divide-slate-100">
                {pending.map((req) => (
                  <div key={req.id} className="p-5">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <p className="font-bold text-slate-800">{req.item_name}</p>
                        <p className="text-xs text-slate-500 mt-1">Qty: {req.quantity} · Submitted by {req.submitted_by || "—"} · {new Date(req.created_at).toLocaleDateString()}</p>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-black uppercase ${statusStyle[req.status]}`}>{req.status}</span>
                    </div>
                    <textarea
                      value={commentMap[req.id] || ""}
                      onChange={(e) => setCommentMap(prev => ({ ...prev, [req.id]: e.target.value }))}
                      placeholder="Add a comment (optional)..."
                      rows={2}
                      className="w-full border-2 border-slate-200 rounded-lg px-3 py-2 text-sm focus:border-blue-500 outline-none mb-3 resize-none"
                    />
                    <button
                      onClick={() => fulfill(req)}
                      disabled={actionLoading === req.id}
                      className="px-4 py-2 bg-green-500 hover:bg-green-600 disabled:opacity-60 text-white text-sm font-bold rounded-lg transition-all"
                    >
                      {actionLoading === req.id ? "Processing..." : "Mark as Fulfilled"}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Fulfilled Tab */}
        {tab === "fulfilled" && (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            {fulfilled.length === 0 ? (
              <p className="text-slate-400 italic text-sm p-6">No fulfilled requisitions yet.</p>
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    {["Item", "Qty", "Submitted By", "Fulfilled On", "Comment"].map(h => (
                      <th key={h} className="text-left px-4 py-3 text-xs font-black text-slate-500 uppercase tracking-wide">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {fulfilled.map((req) => (
                    <tr key={req.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 font-semibold text-slate-800">{req.item_name}</td>
                      <td className="px-4 py-3 text-slate-600">{req.quantity}</td>
                      <td className="px-4 py-3 text-slate-600">{req.submitted_by || "—"}</td>
                      <td className="px-4 py-3 text-slate-500">{req.fulfilled_at ? new Date(req.fulfilled_at).toLocaleDateString() : "—"}</td>
                      <td className="px-4 py-3 text-slate-500 italic">{req.comment || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* Notifications Tab */}
        {tab === "notifications" && (
          <section className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h2 className="text-lg font-bold mb-4">Notifications</h2>
            {notifications.length === 0 && <p className="text-slate-400 italic text-sm">No notifications yet.</p>}
            <div className="space-y-3">
              {notifications.map((n) => (
                <div key={n.id} className={`p-3 rounded-lg border text-sm ${n.read ? "bg-white border-slate-100 text-slate-500" : "bg-blue-50 border-blue-200 text-slate-800 font-semibold"}`}>
                  <p>{n.message}</p>
                  <p className="text-xs text-slate-400 mt-1">{new Date(n.created_at).toLocaleString()}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Profile Tab */}
        {tab === "profile" && (
          <section className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 max-w-md">
            <h2 className="text-lg font-bold mb-6">My Profile</h2>
            <div className="space-y-4">
              <div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">Shop / Business Name</p>
                <p className="text-slate-800 font-semibold mt-1">{user?.user_metadata?.full_name || "—"}</p>
              </div>
              <div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">Email</p>
                <p className="text-slate-800 font-semibold mt-1">{user?.email}</p>
              </div>
              <div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">Role</p>
                <span className="inline-block mt-1 px-3 py-1 bg-orange-100 text-orange-700 text-xs font-black rounded-full uppercase">Hardware Shop</span>
              </div>
              <div className="pt-2 border-t border-slate-100">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Summary</p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-slate-50 rounded-lg p-3 text-center">
                    <p className="text-xl font-black text-blue-600">{requests.length}</p>
                    <p className="text-xs text-slate-500">Total Assigned</p>
                  </div>
                  <div className="bg-slate-50 rounded-lg p-3 text-center">
                    <p className="text-xl font-black text-green-600">{fulfilled.length}</p>
                    <p className="text-xs text-slate-500">Fulfilled</p>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
