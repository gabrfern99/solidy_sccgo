import { useEffect, useState } from "react";
import { Plus, Trash2, Building2, ScrollText } from "lucide-react";
import { api, apiError } from "../lib/api";
import type { PayerCompany } from "../lib/types";
import { EmptyState, PageHeader } from "../components/ui";
import { formatDate } from "../lib/format";

export default function ConfigPage() {
  const [company, setCompany] = useState<any>(null);
  const [payers, setPayers] = useState<PayerCompany[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [form, setForm] = useState({ name: "", cnpj: "" });
  const [error, setError] = useState("");

  function load() {
    api.get("/config/company").then((r) => setCompany(r.data));
    api.get("/config/payers").then((r) => setPayers(r.data));
    api.get("/config/audit-logs").then((r) => setLogs(r.data));
  }
  useEffect(load, []);

  async function addPayer(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    try {
      await api.post("/config/payers", form);
      setForm({ name: "", cnpj: "" });
      load();
    } catch (err) {
      setError(apiError(err, "Falha ao adicionar"));
    }
  }
  async function removePayer(id: string) {
    await api.delete(`/config/payers/${id}`);
    load();
  }

  return (
    <div>
      <PageHeader title="Parametrização" subtitle="Configurações da empresa, CNPJs pagadores e auditoria" />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="card">
          <h3 className="mb-3 flex items-center gap-2 font-semibold text-slate-700"><Building2 size={18} /> Dados da empresa</h3>
          {company && (
            <div className="space-y-2 text-sm">
              <Row label="Razão social" value={company.name} />
              <Row label="CNPJ" value={company.cnpj} />
              <Row label="E-mail" value={company.email || "-"} />
              <Row label="Telefone" value={company.phone || "-"} />
            </div>
          )}
        </div>

        <div className="card">
          <h3 className="mb-3 font-semibold text-slate-700">CNPJs Pagadores (para O.C.)</h3>
          <form onSubmit={addPayer} className="mb-3 flex gap-2">
            <input className="input" placeholder="Nome/Razão" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            <input className="input" placeholder="CNPJ" value={form.cnpj} onChange={(e) => setForm({ ...form, cnpj: e.target.value })} required />
            <button className="btn-primary"><Plus size={16} /></button>
          </form>
          {error && <p className="mb-2 text-sm text-red-600">{error}</p>}
          <div className="space-y-2">
            {payers.map((p) => (
              <div key={p.id} className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2 text-sm">
                <span>{p.name} <span className="text-slate-400">({p.cnpj})</span></span>
                <button onClick={() => removePayer(p.id)} className="text-slate-400 hover:text-red-500"><Trash2 size={15} /></button>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="card mt-6">
        <h3 className="mb-3 flex items-center gap-2 font-semibold text-slate-700"><ScrollText size={18} /> Log de auditoria (rastreabilidade)</h3>
        {logs.length === 0 ? (
          <EmptyState message="Sem registros." />
        ) : (
          <div className="max-h-80 space-y-1 overflow-y-auto text-sm">
            {logs.map((l) => (
              <div key={l.id} className="flex items-center justify-between border-b border-slate-100 py-1.5">
                <span className="text-slate-600">
                  <span className="font-mono text-xs text-brand-600">{l.action}</span> · {l.entityType}
                  {l.user && <span className="text-slate-400"> por {l.user.name}</span>}
                </span>
                <span className="text-xs text-slate-400">{formatDate(l.createdAt)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-slate-500">{label}</span>
      <span className="font-medium text-slate-700">{value}</span>
    </div>
  );
}
