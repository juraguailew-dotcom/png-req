"use client";
import { useState } from "react";
import { createClient } from "../lib/supabase";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState("contractor");
  const [loading, setLoading] = useState(false);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [pendingConfirmation, setPendingConfirmation] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");
    setPendingConfirmation(false);
    const supabase = createClient();
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      const msg = error.message || "Unable to sign in.";
      setError(msg);
      if (/confirm|confirmed|verification/i.test(msg)) {
        setPendingConfirmation(true);
        setMessage("Your email is not confirmed. Use the button below to confirm immediately.");
      }
    } else {
      const userRole = data.user.app_metadata?.role;
      if (userRole === "admin") router.push("/admin");
      else if (userRole === "hardware_shop") router.push("/shop");
      else router.push("/");
      router.refresh();
    }
    setLoading(false);
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, full_name: fullName, role }),
    });
    const data = await res.json();
    if (!res.ok) {
      if (res.status === 409 && data.existingUser) {
        setMessage(data.message);
        setMode("login");
      } else {
        setError(data.error || "Unable to create account.");
      }
    } else {
      setMessage(data.message);
      setMode("login");
    }
    setLoading(false);
  };

  const handleConfirmPendingUser = async () => {
    setConfirmLoading(true);
    setError("");
    setMessage("");
    const res = await fetch("/api/auth/confirm-pending", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Unable to confirm your account right now.");
    } else {
      setPendingConfirmation(false);
      setMessage(data.message || "Account confirmed. Please sign in.");
    }
    setConfirmLoading(false);
  };

  const switchMode = (m) => { setMode(m); setError(""); setMessage(""); };

  return (
    <div className="min-h-screen flex">
      {/* ── Left panel — branding ── */}
      <div className="hidden lg:flex lg:w-1/2 xl:w-3/5 relative overflow-hidden"
        style={{ background: "linear-gradient(135deg, #1e3a8a 0%, #1d4ed8 50%, #2563eb 100%)" }}>
        {/* Subtle grid pattern */}
        <div className="absolute inset-0 opacity-10"
          style={{ backgroundImage: "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.4) 1px, transparent 0)", backgroundSize: "32px 32px" }} />
        {/* Content */}
        <div className="relative z-10 flex flex-col justify-between p-12 text-white w-full">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center font-bold text-lg">
              MR
            </div>
            <div>
              <p className="font-bold text-base leading-tight">Material Requisition</p>
              <p className="text-blue-200 text-xs">System</p>
            </div>
          </div>
          {/* Hero text */}
          <div>
            <h1 className="text-4xl xl:text-5xl font-bold text-white leading-tight mb-4">
              Streamline your<br />procurement workflow
            </h1>
            <p className="text-blue-100 text-lg max-w-md leading-relaxed">
              A centralised platform for contractors and hardware suppliers to manage material requests, quotations, and fulfilment.
            </p>
            {/* Feature pills */}
            <div className="flex flex-wrap gap-2 mt-8">
              {["Digital Requisitions", "Real-time Quotations", "PDF Generation", "Inventory Tracking", "Role-based Access"].map((f) => (
                <span key={f} className="px-3 py-1 bg-white/15 backdrop-blur rounded-full text-sm text-blue-50 border border-white/20">
                  {f}
                </span>
              ))}
            </div>
          </div>
          {/* Footer note */}
          <p className="text-blue-300 text-sm">
            Material Requisition System © {new Date().getFullYear()}
          </p>
        </div>
      </div>

      {/* ── Right panel — form ── */}
      <div className="flex-1 flex items-center justify-center p-6 bg-slate-50">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-3 mb-8 justify-center">
            <div className="w-10 h-10 bg-blue-700 rounded-xl flex items-center justify-center text-white font-bold text-lg">
              MR
            </div>
            <div>
              <p className="font-bold text-gray-900">Material Requisition System</p>
              <p className="text-gray-500 text-xs">Electrical Contractor Portal</p>
            </div>
          </div>

          {/* Heading */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900">
              {mode === "login" ? "Welcome back" : "Create an account"}
            </h2>
            <p className="text-gray-500 text-sm mt-1">
              {mode === "login"
                ? "Sign in to access your dashboard"
                : "Register to start submitting material requests"}
            </p>
          </div>

          {/* Tab switcher */}
          <div className="flex bg-gray-100 rounded-lg p-1 mb-6 gap-1">
            {["login", "register"].map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => switchMode(m)}
                className={`flex-1 py-2 px-4 rounded-md text-sm font-semibold transition-all ${
                  mode === m
                    ? "bg-white text-blue-700 shadow-sm border border-gray-200"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                {m === "login" ? "Sign In" : "Register"}
              </button>
            ))}
          </div>

          {/* Alerts */}
          {error && (
            <div className="flex items-start gap-2 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3 mb-4">
              <svg className="w-4 h-4 mt-0.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <span>{error}</span>
            </div>
          )}
          {message && (
            <div className="flex items-start gap-2 bg-green-50 border border-green-200 text-green-700 text-sm rounded-lg px-4 py-3 mb-4">
              <svg className="w-4 h-4 mt-0.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span>{message}</span>
            </div>
          )}
          {pendingConfirmation && (
            <div className="bg-amber-50 border border-amber-200 text-amber-800 text-sm rounded-lg px-4 py-3 mb-4">
              <p className="font-semibold mb-1">Email confirmation required</p>
              <p className="text-amber-700 mb-3">Click below to confirm your account and sign in immediately.</p>
              <button
                type="button"
                onClick={handleConfirmPendingUser}
                disabled={confirmLoading}
                className="btn btn-sm bg-amber-600 hover:bg-amber-700 text-white border-amber-600 disabled:opacity-50"
              >
                {confirmLoading ? "Confirming…" : "Confirm my account"}
              </button>
            </div>
          )}

          {/* Forms */}
          {mode === "login" ? (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label htmlFor="loginEmail" className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Email address
                </label>
                <input
                  id="loginEmail"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition"
                />
              </div>
              <div>
                <label htmlFor="loginPassword" className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Password
                </label>
                <input
                  id="loginPassword"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 px-4 bg-blue-700 hover:bg-blue-800 text-white font-semibold rounded-lg text-sm transition disabled:opacity-50 mt-2"
              >
                {loading ? "Signing in…" : "Sign In"}
              </button>
            </form>
          ) : (
            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <label htmlFor="registerFullName" className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Full Name
                </label>
                <input
                  id="registerFullName"
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="John Doe"
                  className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition"
                />
              </div>
              <div>
                <label htmlFor="registerEmail" className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Email address
                </label>
                <input
                  id="registerEmail"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition"
                />
              </div>
              <div>
                <label htmlFor="registerPassword" className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Password
                </label>
                <input
                  id="registerPassword"
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min. 6 characters"
                  className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition"
                />
              </div>
              <div>
                <label htmlFor="registerRole" className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Account Type
                </label>
                <select
                  id="registerRole"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none bg-white transition"
                >
                  <option value="contractor">Contractor</option>
                  <option value="hardware_shop">Hardware Shop</option>
                </select>
                <p className="text-xs text-gray-400 mt-1.5">
                  {role === "hardware_shop"
                    ? "Hardware Shop accounts require admin verification before receiving requests."
                    : "Contractors can immediately submit material requisitions after registration."}
                </p>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 px-4 bg-blue-700 hover:bg-blue-800 text-white font-semibold rounded-lg text-sm transition disabled:opacity-50 mt-2"
              >
                {loading ? "Creating account…" : "Create Account"}
              </button>
            </form>
          )}

          <p className="text-center text-xs text-gray-400 mt-6">
            By continuing you agree to our Terms of Service and Privacy Policy.
          </p>
        </div>
      </div>
    </div>
  );
}
