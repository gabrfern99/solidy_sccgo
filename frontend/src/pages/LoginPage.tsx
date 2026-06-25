import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { HardHat } from "lucide-react";
import { useAuth } from "../store/auth";
import { apiError } from "../lib/api";

export default function LoginPage() {
  const { login, register } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const [email, setEmail] = useState("admin@solidy.com.br");
  const [password, setPassword] = useState("123456");
  const [companyName, setCompanyName] = useState("");
  const [cnpj, setCnpj] = useState("");
  const [name, setName] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (mode === "login") {
        await login(email, password);
      } else {
        await register({ companyName, cnpj, name, email, password });
      }
      navigate("/");
    } catch (err) {
      setError(apiError(err, "Falha na autenticação"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-900 to-brand-900 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-2xl">
        <div className="mb-6 flex items-center gap-3">
          <div className="rounded-xl bg-brand-600 p-2 text-white">
            <HardHat />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-800">Contratos & Orçamentos</h1>
            <p className="text-xs text-slate-500">Gestão de contratos e obras</p>
          </div>
        </div>

        <div className="mb-5 flex rounded-lg bg-slate-100 p-1 text-sm">
          <button
            className={`flex-1 rounded-md py-1.5 font-medium ${mode === "login" ? "bg-white shadow" : "text-slate-500"}`}
            onClick={() => setMode("login")}
          >
            Entrar
          </button>
          <button
            className={`flex-1 rounded-md py-1.5 font-medium ${mode === "register" ? "bg-white shadow" : "text-slate-500"}`}
            onClick={() => setMode("register")}
          >
            Criar empresa
          </button>
        </div>

        <form onSubmit={submit} className="space-y-3">
          {mode === "register" && (
            <>
              <div>
                <label className="label">Nome da empresa</label>
                <input className="input" value={companyName} onChange={(e) => setCompanyName(e.target.value)} required />
              </div>
              <div>
                <label className="label">CNPJ</label>
                <input className="input" value={cnpj} onChange={(e) => setCnpj(e.target.value)} required />
              </div>
              <div>
                <label className="label">Seu nome</label>
                <input className="input" value={name} onChange={(e) => setName(e.target.value)} required />
              </div>
            </>
          )}
          <div>
            <label className="label">E-mail</label>
            <input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div>
            <label className="label">Senha</label>
            <input className="input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? "Processando..." : mode === "login" ? "Entrar" : "Criar conta"}
          </button>
        </form>

        {mode === "login" && (
          <p className="mt-4 text-center text-xs text-slate-400">
            Demo: admin@solidy.com.br / 123456
          </p>
        )}
      </div>
    </div>
  );
}
