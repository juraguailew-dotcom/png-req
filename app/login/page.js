"use client";
import { useState } from "react";
import { createClient } from "../lib/supabase";
import { useRouter } from "next/navigation";

const translations = {
  email: "Email",
  password: "Password",
  fullName: "Full Name",
  accountType: "Account Type",
  signIn: "Sign In",
  register: "Register",
  signingIn: "Signing in...",
  createAccount: "Create Account",
  creatingAccount: "Creating account...",
  emailPlaceholder: "you@example.com",
  passwordPlaceholder: "••••••••",
  namePlaceholder: "John Doe",
  passwordMinPlaceholder: "Min. 6 characters",
  contractor: "Contractor",
  hardwareShop: "Hardware Shop",
  appTitle: "PNG Requisition System",
  appSubtitle: "Electrical Contractor Portal | Digital Field Requests",
};

const t = (key) => translations[key] ?? key;

export default function LoginPage() {
  const router = useRouter();

  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState("contractor");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    const supabase = createClient();
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setError(error.message);
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
      setError(data.error);
    } else {
      setMessage(data.message);
      setMode("login");
    }
    setLoading(false);
  };

  const switchMode = (m) => { setMode(m); setError(""); setMessage(""); };

  return (
    <main className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-8">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-2xl mb-4">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <h1 className="text-2xl font-black text-blue-900">{t("appTitle")}</h1>
          <p className="text-slate-500 text-sm mt-1">{t("appSubtitle")}</p>
        </div>

        <div className="flex bg-slate-100 rounded-lg p-1 mb-6">
          <button onClick={() => switchMode("login")} className={`flex-1 py-2 rounded-md text-sm font-bold transition-all ${mode === "login" ? "bg-white shadow text-blue-700" : "text-slate-500"}`}>
            {t("signIn")}
          </button>
          <button onClick={() => switchMode("register")} className={`flex-1 py-2 rounded-md text-sm font-bold transition-all ${mode === "register" ? "bg-white shadow text-blue-700" : "text-slate-500"}`}>
            {t("register")}
          </button>
        </div>

        {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3 mb-4">{error}</div>}
        {message && <div className="bg-green-50 border border-green-200 text-green-700 text-sm rounded-lg px-4 py-3 mb-4">{message}</div>}

        {mode === "login" ? (
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label htmlFor="loginEmail" className="block text-sm font-bold text-slate-600 mb-1">{t("email")}</label>
              <input id="loginEmail" type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                aria-label={t("email")}
                className="w-full border-2 border-slate-200 rounded-lg px-4 py-3 text-sm focus:border-blue-500 outline-none"
                placeholder={t("emailPlaceholder")} />
            </div>
            <div>
              <label htmlFor="loginPassword" className="block text-sm font-bold text-slate-600 mb-1">{t("password")}</label>
              <input id="loginPassword" type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
                aria-label={t("password")}
                className="w-full border-2 border-slate-200 rounded-lg px-4 py-3 text-sm focus:border-blue-500 outline-none"
                placeholder={t("passwordPlaceholder")} />
            </div>
            <button type="submit" disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-bold py-3 rounded-lg transition-all">
              {loading ? t("signingIn") : t("signIn")}
            </button>
          </form>
        ) : (
          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <label htmlFor="registerFullName" className="block text-sm font-bold text-slate-600 mb-1">{t("fullName")}</label>
              <input id="registerFullName" type="text" required value={fullName} onChange={(e) => setFullName(e.target.value)}
                aria-label={t("fullName")}
                className="w-full border-2 border-slate-200 rounded-lg px-4 py-3 text-sm focus:border-blue-500 outline-none"
                placeholder={t("namePlaceholder")} />
            </div>
            <div>
              <label htmlFor="registerEmail" className="block text-sm font-bold text-slate-600 mb-1">{t("email")}</label>
              <input id="registerEmail" type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                aria-label={t("email")}
                className="w-full border-2 border-slate-200 rounded-lg px-4 py-3 text-sm focus:border-blue-500 outline-none"
                placeholder={t("emailPlaceholder")} />
            </div>
            <div>
              <label htmlFor="registerPassword" className="block text-sm font-bold text-slate-600 mb-1">{t("password")}</label>
              <input id="registerPassword" type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)}
                aria-label={t("password")}
                className="w-full border-2 border-slate-200 rounded-lg px-4 py-3 text-sm focus:border-blue-500 outline-none"
                placeholder={t("passwordMinPlaceholder")} />
            </div>
            <div>
              <label htmlFor="registerRole" className="block text-sm font-bold text-slate-600 mb-1">{t("accountType")}</label>
              <select id="registerRole" value={role} onChange={(e) => setRole(e.target.value)}
                aria-label={t("accountType")}
                className="w-full border-2 border-slate-200 rounded-lg px-4 py-3 text-sm focus:border-blue-500 outline-none bg-white">
                <option value="contractor">{t("contractor")}</option>
                <option value="hardware_shop">{t("hardwareShop")}</option>
              </select>
            </div>
            <button type="submit" disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-bold py-3 rounded-lg transition-all">
              {loading ? t("creatingAccount") : t("createAccount")}
            </button>
          </form>
        )}
      </div>
    </main>
  );
}
