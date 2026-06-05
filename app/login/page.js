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
  const [needsEmailConfirmation, setNeedsEmailConfirmation] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  // ── Sign In ──────────────────────────────────────────────────────────────
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");
    setPendingConfirmation(false);

    const supabase = createClient();
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      const msg = error.message || "";
      if (
        msg.toLowerCase().includes("invalid login credentials") ||
        msg.toLowerCase().includes("invalid credentials") ||
        msg.toLowerCase().includes("wrong password")
      ) {
        setError("Incorrect email or password. Please check your details and try again.");
      } else if (
        msg.toLowerCase().includes("email not confirmed") ||
        /confirm|confirmed|verification/i.test(msg)
      ) {
        setPendingConfirmation(true);
        setError("Your email address has not been confirmed.");
        setMessage("Click below to confirm your account and sign in immediately.");
      } else if (msg.toLowerCase().includes("too many")) {
        setError("Too many attempts. Please wait a few minutes and try again.");
      } else {
        setError(msg || "Unable to sign in. Please try again.");
      }
    } else {
      // Read role from app_metadata first, fall back to user_metadata
      const userRole =
        data.user.app_metadata?.role ||
        data.user.user_metadata?.role ||
        "contractor";

      // Use window.location for hard navigation to ensure session cookie
      // is fully set before the new page loads (avoids middleware timing issues)
      if (userRole === "admin") {
        window.location.href = "/admin";
      } else if (userRole === "hardware_shop") {
        window.location.href = "/shop";
      } else {
        window.location.href = "/";
      }
    }
    setLoading(false);
  };

  // ── Register ─────────────────────────────────────────────────────────────
  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");
    setNeedsEmailConfirmation(false);

    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, full_name: fullName, role }),
    });
    const data = await res.json();

    if (!res.ok) {
      if (res.status === 409 && data.existingUser) {
        setMessage("An account with this email already exists. You can sign in below.");
        setMode("login");
      } else {
        setError(data.error || "Unable to create account. Please try again.");
      }
    } else if (data.needsConfirmation) {
      // Supabase sent a confirmation email — user must click it before signing in
      setNeedsEmailConfirmation(true);
      setMessage(data.message);
      setMode("login");
    } else {
      setMessage(data.message || "Account created! You can now sign in.");
      setMode("login");
    }
    setLoading(false);
  };

  // ── Force-confirm (bypass email confirmation) ─────────────────────────────
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
      setMessage("Account confirmed! Please sign in now.");
    }
    setConfirmLoading(false);
  };

  const switchMode = (m) => {
    setMode(m);
    setError("");
    setMessage("");
    setPendingConfirmation(false);
    setNeedsEmailConfirmation(false);
  };

  return (
    <div className="min-h-screen flex">

      {/* ── Left panel — branding with background image ── */}
      <div className="hidden lg:flex lg:w-1/2 xl:w-3/5 relative overflow-hidden">
        {/* Background image */}
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: "url('/login-bg.jpg')" }}
        />
        {/* Dark gradient overlay — fades image so text is clearly readable */}
        <div className="absolute inset-0"
          style={{ background: "linear-gradient(135deg, rgba(10,20,60,0.88) 0%, rgba(15,30,80,0.80) 40%, rgba(20,40,100,0.72) 100%)" }}
        />
        {/* Subtle dot grid on top */}
        <div className="absolute inset-0 opacity-10"
          style={{ backgroundImage: "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.5) 1px, transparent 0)", backgroundSize: "28px 28px" }}
        />
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
              A centralised platform for contractors and hardware suppliers to manage
              material requests, quotations, and fulfilment.
            </p>
            <div className="flex flex-wrap gap-2 mt-8">
              {["Digital Requisitions", "Real-time Quotations", "PDF Generation", "Inventory Tracking", "Role-based Access"].map((f) => (
                <span key={f} className="px-3 py-1 bg-white/15 backdrop-blur rounded-full text-sm text-blue-50 border border-white/20">
                  {f}
                </span>
              ))}
            </div>
          </div>
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
                ? "Sign in with your registered email and password"
                : "Register to start submitting material requests"}
            </p>
          </div>

          {/* Tab switcher */}
          <div className="flex bg-gray-100 rounded-lg p-1 mb-6 gap-1">
            {["login", "register"].map((m) => (
              <button key={m} type="button" onClick={() => switchMode(m)}
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

          {/* Email confirmation notice */}
          {needsEmailConfirmation && (
            <div className="flex items-start gap-3 bg-blue-50 border border-blue-200 rounded-lg px-4 py-3 mb-4">
              <svg className="w-5 h-5 text-blue-600 mt-0.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
              </svg>
              <div>
                <p className="text-sm font-semibold text-blue-800">Check your inbox</p>
                <p className="text-sm text-blue-700 mt-0.5">{message}</p>
              </div>
            </div>
          )}

          {/* Error alert */}
          {error && (
            <div className="flex items-start gap-2 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3 mb-4">
              <svg className="w-4 h-4 mt-0.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <span>{error}</span>
            </div>
          )}

          {/* Success / info alert */}
          {message && !needsEmailConfirmation && (
            <div className="flex items-start gap-2 bg-green-50 border border-green-200 text-green-700 text-sm rounded-lg px-4 py-3 mb-4">
              <svg className="w-4 h-4 mt-0.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span>{message}</span>
            </div>
          )}

          {/* Email confirmation bypass */}
          {pendingConfirmation && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 mb-4">
              <p className="text-sm font-semibold text-amber-800 mb-1">Email confirmation required</p>
              <p className="text-sm text-amber-700 mb-3">
                Your account exists but hasn't been confirmed yet. Click below to confirm immediately.
              </p>
              <button type="button" onClick={handleConfirmPendingUser} disabled={confirmLoading}
                className="inline-flex items-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-sm font-semibold rounded-lg transition disabled:opacity-50">
                {confirmLoading ? "Confirming…" : "Confirm my account"}
              </button>
            </div>
          )}

          {/* ── Sign In form ── */}
          {mode === "login" && (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label htmlFor="loginEmail" className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Email address
                </label>
                <input id="loginEmail" type="email" required autoComplete="email"
                  value={email} onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-900 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition"
                />
              </div>
              <div>
                <label htmlFor="loginPassword" className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Password
                </label>
                <input id="loginPassword" type="password" required autoComplete="current-password"
                  value={password} onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-900 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition"
                />
              </div>
              <button type="submit" disabled={loading}
                className="w-full py-2.5 px-4 bg-blue-700 hover:bg-blue-800 text-white font-semibold rounded-lg text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-2">
                {loading
                  ? <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                      </svg>
                      Signing in…
                    </span>
                  : "Sign In"}
              </button>
              <p className="text-center text-sm text-gray-500">
                Don&apos;t have an account?{" "}
                <button type="button" onClick={() => switchMode("register")}
                  className="text-blue-600 hover:text-blue-700 font-semibold">
                  Register here
                </button>
              </p>
            </form>
          )}

          {/* ── Register form ── */}
          {mode === "register" && (
            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <label htmlFor="registerFullName" className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Full Name
                </label>
                <input id="registerFullName" type="text" required autoComplete="name"
                  value={fullName} onChange={(e) => setFullName(e.target.value)}
                  placeholder="John Doe"
                  className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-900 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition"
                />
              </div>
              <div>
                <label htmlFor="registerEmail" className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Email address
                </label>
                <input id="registerEmail" type="email" required autoComplete="email"
                  value={email} onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-900 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition"
                />
              </div>
              <div>
                <label htmlFor="registerPassword" className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Password
                </label>
                <input id="registerPassword" type="password" required minLength={6}
                  autoComplete="new-password"
                  value={password} onChange={(e) => setPassword(e.target.value)}
                  placeholder="Minimum 6 characters"
                  className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-900 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition"
                />
              </div>
              <div>
                <label htmlFor="registerRole" className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Account Type
                </label>
                <select id="registerRole" value={role} onChange={(e) => setRole(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-900 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition">
                  <option value="contractor">Contractor — Submit material requests</option>
                  <option value="hardware_shop">Hardware Shop — Supply materials</option>
                </select>
                {role === "hardware_shop" && (
                  <p className="text-xs text-amber-600 mt-1.5 flex items-center gap-1">
                    <svg className="w-3 h-3 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    Hardware Shop accounts require admin verification before receiving requests.
                  </p>
                )}
              </div>
              <button type="submit" disabled={loading}
                className="w-full py-2.5 px-4 bg-blue-700 hover:bg-blue-800 text-white font-semibold rounded-lg text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-2">
                {loading
                  ? <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                      </svg>
                      Creating account…
                    </span>
                  : "Create Account"}
              </button>
              <p className="text-center text-sm text-gray-500">
                Already have an account?{" "}
                <button type="button" onClick={() => switchMode("login")}
                  className="text-blue-600 hover:text-blue-700 font-semibold">
                  Sign in here
                </button>
              </p>
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
