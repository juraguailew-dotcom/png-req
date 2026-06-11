"use client";
import { useState, useEffect, useCallback } from "react";
import { createClient } from "../lib/supabase";
import { useRouter } from "next/navigation";
import Header from "../components/shared/Header";

export default function AdminPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [tab, setTab] = useState("requests");
  const [requests, setRequests] = useState([]);
  const [users, setUsers] = useState([]);
  const [shopUsers, setShopUsers] = useState([]);
  const [filter, setFilter] = useState("all");
  const [pageLoading, setPageLoading] = useState(true);
  const [usersLoading, setUsersLoading] = useState(false);
  const [assignMap, setAssignMap] = useState({});

  const fetchRequests = useCallback(async () => {
    const res = await fetch("/api/admin/requisitions");
    const data = await res.json();
    if (data.requisitions) setRequests(data.requisitions);
  }, []);

  const fetchUsers = useCallback(async () => {
    setUsersLoading(true);
    const res = await fetch("/api/admin/users");
    const data = await res.json();
    if (data.users) {
      setUsers(data.users);
      setShopUsers(data.users.filter(u => u.role === "hardware_shop"));
    }
    setUsersLoading(false);
  }, []);

  useEffect(() => {
    const supabase = createClient();
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || user.app_metadata?.role !== "admin") { router.push("/"); return; }
      setUser(user);
      await fetchRequests();
      setPageLoading(false);
    };
    init();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (tab === "users") fetchUsers();
  }, [tab, fetchUsers]);

  // Use the PATCH API with the correct action and field names
  const updateStatus = async (id, action) => {
    const req = requests.find(r => r.id === id);
    const res = await fetch(`/api/requisitions/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    if (res.ok) {
      const data = await res.json();
      setRequests(prev => prev.map(r => r.id === id ? data.requisition : r));
      // Notify contractor via createNotification utility (server handles it in the API)
    } else {
      const err = await res.json();
      alert("Error: " + (err.error || "Unknown error"));
    }
  };

  const assignShop = async (reqId) => {
    const shopId = assignMap[reqId];
    if (!shopId) return alert("Please select a hardware shop.");
    const res = await fetch(`/api/requisitions/${reqId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "assign", shop_id: shopId }),
    });
    if (res.ok) {
      const data = await res.json();
      setRequests(prev => prev.map(r => r.id === reqId ? data.requisition : r));
      setAssignMap(prev => { const n = { ...prev }; delete n[reqId]; return n; });
    } else {
      const err = await res.json();
      alert("Error: " + (err.error || "Unknown error"));
    }
  };

  const updateUserRole = async (userId, role) => {
    const res = await fetch("/api/admin/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: userId, role }),
    });
    if (res.ok) {
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, role } : u));
      setShopUsers(prev => prev
        .map(u => u.id === userId ? { ...u, role } : u)
        .filter(u => u.role === "hardware_shop")
      );
    }
  };

  const signOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  };

  // Status badges use lowercase to match DB schema values
  const statusStyle = {
    pending: "bg-yellow-100 text-yellow-700",
    approved: "bg-green-100 text-green-700",
    rejected: "bg-red-100 text-red-700",
    fulfilled: "bg-blue-100 text-blue-700",
    cancelled: "bg-slate-100 text-slate-600",
  };

  const roleStyle = {
    admin: "bg-purple-100 text-purple-700",
    hardware_shop: "bg-orange-100 text-orange-700",
    contractor: "bg-blue-100 text-blue-700",
  };

  const filtered = filter === "all" ? requests : requests.filter(r => r.status === filter);

  // Helper: get a display label for items (items is a jsonb array)
  const getItemsSummary = (req) => {
    if (!req.items || !Array.isArray(req.items) || req.items.length === 0) return "—";
    const first = req.items[0];
    const name = first.product_name || first.name || "Item";
    return req.items.length > 1 ? `${name} +${req.items.length - 1} more` : name;
  };

  if (pageLoading) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <p className="text-slate-400 animate-pulse">Loading...</p>
    </div>
  );

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <Header user={user} />

      <div className="max-w-6xl mx-auto p-6 md:p-10">
        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-6">
          {[
            { label: "Total", value: requests.length, color: "text-blue-600" },
            { label: "Pending", value: requests.filter(r => r.status === "pending").length, color: "text-yellow-600" },
            { label: "Approved", value: requests.filter(r => r.status === "approved").length, color: "text-green-600" },
            { label: "Rejected", value: requests.filter(r => r.status === "rejected").length, color: "text-red-600" },
            { label: "Fulfilled", value: requests.filter(r => r.status === "fulfilled").length, color: "text-blue-400" },
          ].map(({ label, value, color }) => (
            <div key={label} className="bg-white rounded-xl p-4 shadow-sm border border-slate-200 text-center">
              <p className={`text-2xl font-black ${color}`}>{value}</p>
              <p className="text-xs text-slate-500 font-semibold mt-1">{label}</p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          {["requests", "users"].map((t) => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-4 py-2 rounded-lg text-sm font-bold capitalize transition-all ${tab === t ? "bg-blue-600 text-white" : "bg-white text-slate-500 border border-slate-200 hover:border-blue-300"}`}>
              {t === "users" ? "Manage Users" : "Requisitions"}
            </button>
          ))}
        </div>

        {/* Requests Tab */}
        {tab === "requests" && (
          <>
            <div className="flex gap-2 mb-4 flex-wrap">
              {["all", "pending", "approved", "rejected", "fulfilled"].map((f) => (
                <button key={f} onClick={() => setFilter(f)}
                  className={`px-4 py-2 rounded-lg text-sm font-bold transition-all capitalize ${filter === f ? "bg-blue-600 text-white" : "bg-white text-slate-500 border border-slate-200 hover:border-blue-300"}`}>
                  {f === "all" ? "All" : f.charAt(0).toUpperCase() + f.slice(1)}
                </button>
              ))}
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              {filtered.length === 0 ? (
                <p className="text-slate-400 italic text-sm p-6">No requests found.</p>
              ) : (
                <div className="overflow-x-auto">
                <table className="w-full text-sm min-w-[700px]">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      {["Items", "Contractor", "Total", "Date", "Status", "Assigned Shop", "Actions"].map(h => (
                        <th key={h} className="text-left px-4 py-3 text-xs font-black text-slate-500 uppercase tracking-wide">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filtered.map((req) => (
                      <tr key={req.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-4 py-3 font-semibold text-slate-800">
                          {getItemsSummary(req)}
                          {req.notes && <p className="text-xs text-slate-400 italic mt-1">💬 {req.notes}</p>}
                        </td>
                        <td className="px-4 py-3 text-slate-600">{req.contractor_name || "—"}</td>
                        <td className="px-4 py-3 text-slate-600">
                          {req.total_amount ? `K${parseFloat(req.total_amount).toFixed(2)}` : "—"}
                        </td>
                        <td className="px-4 py-3 text-slate-500">{new Date(req.created_at).toLocaleDateString()}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 rounded-full text-xs font-black uppercase ${statusStyle[req.status] || "bg-slate-100 text-slate-600"}`}>
                            {req.status}
                          </span>
                          {req.status === "fulfilled" && req.fulfilled_by && (
                            <p className="text-xs text-slate-400 mt-1">by {req.fulfilled_by}</p>
                          )}
                          {req.approval_comment && (
                            <p className="text-xs text-slate-400 mt-1 italic">{req.approval_comment}</p>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {req.status === "approved" && !req.assigned_shop_id && shopUsers.length > 0 && (
                            <div className="flex gap-2 items-center">
                              <select value={assignMap[req.id] || ""} onChange={(e) => setAssignMap(prev => ({ ...prev, [req.id]: e.target.value }))}
                                className="border border-slate-200 rounded-lg px-2 py-1 text-xs outline-none focus:border-blue-400 bg-white">
                                <option value="">Select shop</option>
                                {shopUsers.map(s => <option key={s.id} value={s.id}>{s.full_name || s.business_name || s.email}</option>)}
                              </select>
                              <button onClick={() => assignShop(req.id)} className="px-2 py-1 bg-blue-500 hover:bg-blue-600 text-white text-xs font-bold rounded-lg transition-all">
                                Assign
                              </button>
                            </div>
                          )}
                          {req.assigned_shop_name && (
                            <span className="text-xs text-blue-600 font-semibold">🏪 {req.assigned_shop_name}</span>
                          )}
                          {req.status === "approved" && !req.assigned_shop_id && shopUsers.length === 0 && (
                            <span className="text-xs text-slate-400 italic">No shops registered</span>
                          )}
                          {(req.status === "pending" || req.status === "rejected" || req.status === "fulfilled") && !req.assigned_shop_id && (
                            <span className="text-xs text-slate-400">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {req.status === "pending" && (
                            <div className="flex gap-2">
                              <button onClick={() => updateStatus(req.id, "approve")}
                                className="px-3 py-1 bg-green-500 hover:bg-green-600 text-white text-xs font-bold rounded-lg transition-all">
                                Approve
                              </button>
                              <button onClick={() => updateStatus(req.id, "reject")}
                                className="px-3 py-1 bg-red-500 hover:bg-red-600 text-white text-xs font-bold rounded-lg transition-all">
                                Reject
                              </button>
                            </div>
                          )}
                          {req.status !== "pending" && (
                            <span className="text-xs text-slate-400 italic">
                              {req.status === "fulfilled" ? "Fulfilled" : req.approved_by ? `by ${req.approved_by}` : "Reviewed"}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                </div>
              )}
            </div>
          </>
        )}

        {/* Users Tab */}
        {tab === "users" && (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            {usersLoading ? (
              <p className="text-slate-400 animate-pulse text-sm p-6">Loading users...</p>
            ) : users.length === 0 ? (
              <p className="text-slate-400 italic text-sm p-6">No users found.</p>
            ) : (
              <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[600px]">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    {["Name", "Email", "Role", "Joined", "Change Role"].map(h => (
                      <th key={h} className="text-left px-4 py-3 text-xs font-black text-slate-500 uppercase tracking-wide">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {users.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3 font-semibold text-slate-800">{u.full_name || "—"}</td>
                      <td className="px-4 py-3 text-slate-600">{u.email}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-black uppercase ${roleStyle[u.role] || "bg-slate-100 text-slate-600"}`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-500">{new Date(u.created_at).toLocaleDateString()}</td>
                      <td className="px-4 py-3">
                        {u.id !== user?.id ? (
                          <select value={u.role} onChange={(e) => updateUserRole(u.id, e.target.value)}
                            className="border border-slate-200 rounded-lg px-2 py-1 text-xs outline-none focus:border-blue-400 bg-white">
                            <option value="contractor">Contractor</option>
                            <option value="hardware_shop">Hardware Shop</option>
                            <option value="admin">Admin</option>
                          </select>
                        ) : (
                          <span className="text-xs text-slate-400 italic">You</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
