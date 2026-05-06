"use client";
import { useState, useEffect, useCallback } from "react";
import { createClient } from "../lib/supabase";
import { useRouter } from "next/navigation";

export default function AdminPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [tab, setTab] = useState("requests");
  const [requests, setRequests] = useState([]);
  const [users, setUsers] = useState([]);
  const [shopUsers, setShopUsers] = useState([]);
  const [filter, setFilter] = useState("All");
  const [pageLoading, setPageLoading] = useState(true);
  const [usersLoading, setUsersLoading] = useState(false);
  const [assignMap, setAssignMap] = useState({});

  const fetchRequests = useCallback(async () => {
    const supabase = createClient();
    const { data } = await supabase.from("requisitions").select("*").order("created_at", { ascending: false });
    if (data) setRequests(data);
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
  }, []);

  useEffect(() => {
    if (tab === "users") { fetchUsers(); }
  }, [tab, fetchUsers]);

  const updateStatus = async (id, status) => {
    const supabase = createClient();
    const req = requests.find(r => r.id === id);
    const { error } = await supabase.from("requisitions").update({
      status,
      reviewed_by: user.user_metadata?.full_name || user.email,
      reviewed_at: new Date().toISOString(),
    }).eq("id", id);
    if (!error) {
      setRequests(prev => prev.map(r => r.id === id
        ? { ...r, status, reviewed_by: user.user_metadata?.full_name || user.email, reviewed_at: new Date().toISOString() }
        : r
      ));
      // Notify contractor
      if (req) {
        await fetch("/api/notifications", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            user_id: req.user_id,
            message: `Your requisition for "${req.item_name}" has been ${status.toLowerCase()}.`,
            requisition_id: id,
          }),
        });
      }
    }
  };

  const assignShop = async (reqId) => {
    const shopId = assignMap[reqId];
    if (!shopId) return alert("Please select a hardware shop.");
    const shop = shopUsers.find(s => s.id === shopId);
    const supabase = createClient();
    const req = requests.find(r => r.id === reqId);
    const { error } = await supabase.from("requisitions").update({
      assigned_shop_id: shopId,
      assigned_shop_name: shop.full_name || shop.email,
    }).eq("id", reqId);
    if (!error) {
      setRequests(prev => prev.map(r => r.id === reqId
        ? { ...r, assigned_shop_id: shopId, assigned_shop_name: shop.full_name || shop.email }
        : r
      ));
      // Notify shop
      await fetch("/api/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: shopId,
          message: `You have been assigned a new requisition: "${req?.item_name}" (Qty: ${req?.quantity}).`,
          requisition_id: reqId,
        }),
      });
      // Notify contractor
      if (req) {
        await fetch("/api/notifications", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            user_id: req.user_id,
            message: `Your requisition for "${req.item_name}" has been assigned to ${shop.full_name || shop.email}.`,
            requisition_id: reqId,
          }),
        });
      }
      setAssignMap(prev => { const n = { ...prev }; delete n[reqId]; return n; });
    } else {
      alert("Error: " + error.message);
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
      setShopUsers(prev => {
        const updated = users.map(u => u.id === userId ? { ...u, role } : u);
        return updated.filter(u => u.role === "hardware_shop");
      });
    }
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
    Fulfilled: "bg-blue-100 text-blue-700",
  };

  const roleStyle = {
    admin: "bg-purple-100 text-purple-700",
    hardware_shop: "bg-orange-100 text-orange-700",
    contractor: "bg-blue-100 text-blue-700",
  };

  const filtered = filter === "All" ? requests : requests.filter(r => r.status === filter);

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
          <p className="text-xs text-slate-400">Admin Panel · {user?.user_metadata?.full_name || user?.email}</p>
        </div>
        <button onClick={signOut} className="text-sm text-slate-500 hover:text-red-600 font-semibold transition-colors">Sign Out</button>
      </nav>

      <div className="max-w-6xl mx-auto p-6 md:p-10">
        {/* Stats */}
        <div className="grid grid-cols-5 gap-4 mb-6">
          {[
            { label: "Total", value: requests.length, color: "text-blue-600" },
            { label: "Pending", value: requests.filter(r => r.status === "Pending").length, color: "text-yellow-600" },
            { label: "Approved", value: requests.filter(r => r.status === "Approved").length, color: "text-green-600" },
            { label: "Rejected", value: requests.filter(r => r.status === "Rejected").length, color: "text-red-600" },
            { label: "Fulfilled", value: requests.filter(r => r.status === "Fulfilled").length, color: "text-blue-400" },
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
            <div className="flex gap-2 mb-4">
              {["All", "Pending", "Approved", "Rejected", "Fulfilled"].map((f) => (
                <button key={f} onClick={() => setFilter(f)}
                  className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${filter === f ? "bg-blue-600 text-white" : "bg-white text-slate-500 border border-slate-200 hover:border-blue-300"}`}>
                  {f}
                </button>
              ))}
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              {filtered.length === 0 ? (
                <p className="text-slate-400 italic text-sm p-6">No requests found.</p>
              ) : (
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      {["Item", "Qty", "Submitted By", "Date", "Status", "Assigned Shop", "Actions"].map(h => (
                        <th key={h} className="text-left px-4 py-3 text-xs font-black text-slate-500 uppercase tracking-wide">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filtered.map((req) => (
                      <tr key={req.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-4 py-3 font-semibold text-slate-800">
                          {req.item_name}
                          {req.comment && <p className="text-xs text-slate-400 italic mt-1">💬 {req.comment}</p>}
                        </td>
                        <td className="px-4 py-3 text-slate-600">{req.quantity}</td>
                        <td className="px-4 py-3 text-slate-600">{req.submitted_by || "—"}</td>
                        <td className="px-4 py-3 text-slate-500">{new Date(req.created_at).toLocaleDateString()}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 rounded-full text-xs font-black uppercase ${statusStyle[req.status] || "bg-slate-100 text-slate-600"}`}>
                            {req.status}
                          </span>
                          {req.status === "Fulfilled" && req.fulfilled_by && (
                            <p className="text-xs text-slate-400 mt-1">by {req.fulfilled_by}</p>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {req.status === "Approved" && !req.assigned_shop_id && shopUsers.length > 0 && (
                            <div className="flex gap-2 items-center">
                              <select value={assignMap[req.id] || ""} onChange={(e) => setAssignMap(prev => ({ ...prev, [req.id]: e.target.value }))}
                                className="border border-slate-200 rounded-lg px-2 py-1 text-xs outline-none focus:border-blue-400 bg-white">
                                <option value="">Select shop</option>
                                {shopUsers.map(s => <option key={s.id} value={s.id}>{s.full_name || s.email}</option>)}
                              </select>
                              <button onClick={() => assignShop(req.id)} className="px-2 py-1 bg-blue-500 hover:bg-blue-600 text-white text-xs font-bold rounded-lg transition-all">
                                Assign
                              </button>
                            </div>
                          )}
                          {req.assigned_shop_name && (
                            <span className="text-xs text-blue-600 font-semibold">🏪 {req.assigned_shop_name}</span>
                          )}
                          {req.status === "Approved" && !req.assigned_shop_id && shopUsers.length === 0 && (
                            <span className="text-xs text-slate-400 italic">No shops registered</span>
                          )}
                          {(req.status === "Pending" || req.status === "Rejected" || req.status === "Fulfilled") && !req.assigned_shop_id && (
                            <span className="text-xs text-slate-400">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {req.status === "Pending" && (
                            <div className="flex gap-2">
                              <button onClick={() => updateStatus(req.id, "Approved")}
                                className="px-3 py-1 bg-green-500 hover:bg-green-600 text-white text-xs font-bold rounded-lg transition-all">
                                Approve
                              </button>
                              <button onClick={() => updateStatus(req.id, "Rejected")}
                                className="px-3 py-1 bg-red-500 hover:bg-red-600 text-white text-xs font-bold rounded-lg transition-all">
                                Reject
                              </button>
                            </div>
                          )}
                          {req.status !== "Pending" && (
                            <span className="text-xs text-slate-400 italic">
                              {req.status === "Fulfilled" ? "Fulfilled" : req.reviewed_by ? `by ${req.reviewed_by}` : "Reviewed"}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
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
              <table className="w-full text-sm">
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
            )}
          </div>
        )}
      </div>
    </main>
  );
}
