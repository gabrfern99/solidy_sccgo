import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Building2 } from "lucide-react";
import { api, apiError } from "../lib/api";
import type { Contract, Obra } from "../lib/types";
import { Badge, EmptyState, Modal, PageHeader } from "../components/ui";
import { OBRA_STATUS_COLORS, OBRA_STATUS_LABELS, formatCurrency } from "../lib/format";

export default function ObrasPage() {
  const navigate = useNavigate();
  const [obras, setObras] = useState<Obra[]>([]);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    name: "",
    description: "",
    address: "",
    contractId: "",
    budgetPlanned: 0,
    startDate: "",
    endDate: "",
  });

  function load() {
    api.get("/obras").then((r) => setObras(r.data));
  }
  useEffect(() => {
    load();
    api.get("/contracts").then((r) =>
      setContracts(r.data.filter((c: Contract) => ["LOCACAO", "OBRA", "SERVICO"].includes(c.category)))
    );
  }, []);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    try {
      const { data } = await api.post("/obras", {
        ...form,
        budgetPlanned: Number(form.budgetPlanned),
        contractId: form.contractId || null,
        startDate: form.startDate ? new Date(form.startDate).toISOString() : null,
        endDate: form.endDate ? new Date(form.endDate).toISOString() : null,
      });
      setOpen(false);
      navigate(`/obras/${data.id}`);
    } catch (err) {
      setError(apiError(err, "Falha ao criar obra"));
    }
  }

  return (
    <div>
      <PageHeader
        title="Obras"
        subtitle="Projetos de obra com acompanhamento operacional e financeiro"
        actions={<button className="btn-primary" onClick={() => setOpen(true)}><Plus size={16} /> Nova Obra</button>}
      />

      {obras.length === 0 ? (
        <EmptyState message="Nenhuma obra cadastrada." />
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {obras.map((o) => (
            <button key={o.id} onClick={() => navigate(`/obras/${o.id}`)} className="card text-left transition hover:shadow-md">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <Building2 className="text-brand-500" size={20} />
                  <h3 className="font-semibold text-slate-800">{o.name}</h3>
                </div>
                <Badge className={OBRA_STATUS_COLORS[o.status]}>{OBRA_STATUS_LABELS[o.status]}</Badge>
              </div>
              <p className="mt-2 text-sm text-slate-500">{o.address || "Sem endereço"}</p>
              {o.contract && <p className="mt-1 text-xs text-brand-600">Contrato: {o.contract.title}</p>}
              <div className="mt-4">
                <div className="flex justify-between text-xs text-slate-500">
                  <span>Orçamento</span>
                  <span>{o.budgetUsedPct}% usado</span>
                </div>
                <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-slate-100">
                  <div
                    className={`h-full ${o.budgetUsedPct > 100 ? "bg-red-500" : "bg-brand-500"}`}
                    style={{ width: `${Math.min(o.budgetUsedPct, 100)}%` }}
                  />
                </div>
                <p className="mt-1 text-xs text-slate-400">
                  {formatCurrency(o.budgetRealized)} de {formatCurrency(o.budgetPlanned)}
                </p>
              </div>
            </button>
          ))}
        </div>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title="Nova Obra" size="lg">
        <form onSubmit={save} className="space-y-4">
          <div>
            <label className="label">Nome da obra</label>
            <input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          </div>
          <div>
            <label className="label">Endereço</label>
            <input className="input" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
          </div>
          <div>
            <label className="label">Descrição</label>
            <textarea className="input" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="label">Vincular ao contrato (locação/serviço)</label>
              <select className="input" value={form.contractId} onChange={(e) => setForm({ ...form, contractId: e.target.value })}>
                <option value="">Nenhum</option>
                {contracts.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Orçamento previsto (R$)</label>
              <input type="number" step="0.01" className="input" value={form.budgetPlanned} onChange={(e) => setForm({ ...form, budgetPlanned: Number(e.target.value) })} />
            </div>
            <div>
              <label className="label">Início</label>
              <input type="date" className="input" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} />
            </div>
            <div>
              <label className="label">Término previsto</label>
              <input type="date" className="input" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} />
            </div>
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button type="submit" className="btn-primary w-full">Criar obra</button>
        </form>
      </Modal>
    </div>
  );
}
