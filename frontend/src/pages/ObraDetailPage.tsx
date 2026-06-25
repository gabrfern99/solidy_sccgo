import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  CheckCircle2,
  Circle,
  Clock,
  Plus,
  Trash2,
  Upload as UploadIcon,
  ShoppingCart,
} from "lucide-react";
import { api, apiError } from "../lib/api";
import type { Obra, PayerCompany } from "../lib/types";
import { Badge, Modal, PageHeader } from "../components/ui";
import {
  CUSTO_CATEGORIA_LABELS,
  OBRA_STATUS_COLORS,
  OBRA_STATUS_LABELS,
  PO_STATUS_LABELS,
  formatCurrency,
  formatDate,
} from "../lib/format";

const PHASE_LABELS: Record<string, string> = {
  PLANEJAMENTO: "Planejamento",
  EXECUCAO: "Execução",
  ENTREGA: "Entrega",
};
const STEP_ICON = { CONCLUIDO: CheckCircle2, EM_ANDAMENTO: Clock, PENDENTE: Circle };
const STEP_NEXT: Record<string, string> = {
  PENDENTE: "EM_ANDAMENTO",
  EM_ANDAMENTO: "CONCLUIDO",
  CONCLUIDO: "PENDENTE",
};

type Tab = "roteiro" | "custos" | "vistorias" | "oc";

export default function ObraDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [obra, setObra] = useState<Obra | null>(null);
  const [tab, setTab] = useState<Tab>("roteiro");
  const [payers, setPayers] = useState<PayerCompany[]>([]);

  function load() {
    api.get(`/obras/${id}`).then((r) => setObra(r.data));
  }
  useEffect(() => {
    load();
    api.get("/config/payers").then((r) => setPayers(r.data));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  if (!obra) return <p className="text-slate-500">Carregando...</p>;

  async function toggleStep(stepId: string, status: string) {
    await api.put(`/obras/${id}/steps/${stepId}`, { status: STEP_NEXT[status] });
    load();
  }

  async function updateStatus(status: string) {
    await api.put(`/obras/${id}`, { status });
    load();
  }

  return (
    <div>
      <button onClick={() => navigate("/obras")} className="mb-3 flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700">
        <ArrowLeft size={16} /> Obras
      </button>

      <PageHeader
        title={obra.name}
        subtitle={obra.address || undefined}
        actions={
          <select className="input w-auto" value={obra.status} onChange={(e) => updateStatus(e.target.value)}>
            {Object.entries(OBRA_STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        }
      />

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-4">
        <Summary label="Status" value={<Badge className={OBRA_STATUS_COLORS[obra.status]}>{OBRA_STATUS_LABELS[obra.status]}</Badge>} />
        <Summary label="Orçamento previsto" value={formatCurrency(obra.budgetPlanned)} />
        <Summary label="Realizado" value={formatCurrency(obra.budgetRealized)} accent={obra.budgetUsedPct > 100 ? "text-red-600" : "text-slate-800"} />
        <Summary label="Saldo" value={formatCurrency(obra.budgetBalance)} accent={obra.budgetBalance < 0 ? "text-red-600" : "text-emerald-600"} />
      </div>

      {obra.contract && (
        <div className="card mb-6 flex items-center justify-between bg-brand-50">
          <p className="text-sm text-brand-800">Vinculada ao contrato: <strong>{obra.contract.title}</strong></p>
          <button className="text-sm text-brand-600 underline" onClick={() => navigate(`/contratos/${obra.contract!.id}`)}>Ver contrato</button>
        </div>
      )}

      <div className="mb-4 flex gap-1 border-b border-slate-200">
        {([
          ["roteiro", "Roteiro"],
          ["custos", "Custos"],
          ["vistorias", "Vistorias"],
          ["oc", "Ordens de Compra"],
        ] as [Tab, string][]).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`px-4 py-2 text-sm font-medium ${tab === key ? "border-b-2 border-brand-600 text-brand-600" : "text-slate-500"}`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "roteiro" && <RoteiroTab obra={obra} onToggle={toggleStep} reload={load} />}
      {tab === "custos" && <CustosTab obra={obra} reload={load} />}
      {tab === "vistorias" && <VistoriasTab obra={obra} reload={load} />}
      {tab === "oc" && <OcTab obra={obra} payers={payers} reload={load} />}
    </div>
  );
}

function Summary({ label, value, accent = "text-slate-800" }: { label: string; value: React.ReactNode; accent?: string }) {
  return (
    <div className="card">
      <p className="text-sm text-slate-500">{label}</p>
      <p className={`mt-1 text-lg font-bold ${accent}`}>{value}</p>
    </div>
  );
}

function RoteiroTab({ obra, onToggle, reload }: { obra: Obra; onToggle: (id: string, s: string) => void; reload: () => void }) {
  const [title, setTitle] = useState("");
  const phases = ["PLANEJAMENTO", "EXECUCAO", "ENTREGA"];

  async function add() {
    if (!title) return;
    await api.post(`/obras/${obra.id}/steps`, { title, phase: "EXECUCAO", order: (obra.steps?.length ?? 0) });
    setTitle("");
    reload();
  }

  return (
    <div className="space-y-6">
      {phases.map((phase) => {
        const steps = (obra.steps ?? []).filter((s) => s.phase === phase);
        if (!steps.length) return null;
        return (
          <div key={phase} className="card">
            <h3 className="mb-3 font-semibold text-slate-700">{PHASE_LABELS[phase]}</h3>
            <div className="space-y-2">
              {steps.map((s) => {
                const Icon = STEP_ICON[s.status];
                return (
                  <div key={s.id} className="flex items-center gap-3">
                    <button onClick={() => onToggle(s.id, s.status)}>
                      <Icon size={20} className={s.status === "CONCLUIDO" ? "text-emerald-500" : s.status === "EM_ANDAMENTO" ? "text-amber-500" : "text-slate-300"} />
                    </button>
                    <span className={s.status === "CONCLUIDO" ? "text-slate-400 line-through" : "text-slate-700"}>{s.title}</span>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
      <div className="card flex gap-2">
        <input className="input" placeholder="Adicionar etapa..." value={title} onChange={(e) => setTitle(e.target.value)} />
        <button className="btn-primary" onClick={add}><Plus size={16} /> Adicionar</button>
      </div>
    </div>
  );
}

function CustosTab({ obra, reload }: { obra: Obra; reload: () => void }) {
  const [form, setForm] = useState({ description: "", categoria: "MATERIAL", amount: 0, isMaintenance: false });

  async function add(e: React.FormEvent) {
    e.preventDefault();
    await api.post(`/obras/${obra.id}/custos`, { ...form, amount: Number(form.amount) });
    setForm({ description: "", categoria: "MATERIAL", amount: 0, isMaintenance: false });
    reload();
  }
  async function remove(custoId: string) {
    await api.delete(`/obras/${obra.id}/custos/${custoId}`);
    reload();
  }

  return (
    <div className="space-y-4">
      <form onSubmit={add} className="card grid grid-cols-1 gap-3 sm:grid-cols-12">
        <input className="input sm:col-span-4" placeholder="Descrição" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} required />
        <select className="input sm:col-span-3" value={form.categoria} onChange={(e) => setForm({ ...form, categoria: e.target.value })}>
          {Object.entries(CUSTO_CATEGORIA_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <input type="number" step="0.01" className="input sm:col-span-2" placeholder="Valor" value={form.amount} onChange={(e) => setForm({ ...form, amount: Number(e.target.value) })} required />
        <label className="flex items-center gap-1 text-xs text-slate-600 sm:col-span-2">
          <input type="checkbox" checked={form.isMaintenance} onChange={(e) => setForm({ ...form, isMaintenance: e.target.checked })} /> Manutenção
        </label>
        <button className="btn-primary sm:col-span-1"><Plus size={16} /></button>
      </form>

      <div className="card p-0 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-left text-xs uppercase text-slate-500">
            <tr><th className="px-4 py-3">Descrição</th><th className="px-4 py-3">Categoria</th><th className="px-4 py-3">Data</th><th className="px-4 py-3">Valor</th><th></th></tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {(obra.custos ?? []).map((c) => (
              <tr key={c.id}>
                <td className="px-4 py-3 text-slate-700">{c.description} {c.isMaintenance && <Badge className="ml-1 bg-sky-100 text-sky-700">Manutenção</Badge>}</td>
                <td className="px-4 py-3 text-slate-500">{CUSTO_CATEGORIA_LABELS[c.categoria]}</td>
                <td className="px-4 py-3 text-slate-500">{formatDate(c.date)}</td>
                <td className="px-4 py-3 font-medium text-slate-700">{formatCurrency(c.amount)}</td>
                <td className="px-4 py-3 text-right"><button onClick={() => remove(c.id)} className="text-slate-400 hover:text-red-500"><Trash2 size={15} /></button></td>
              </tr>
            ))}
            {(obra.custos ?? []).length === 0 && <tr><td colSpan={5} className="px-4 py-6 text-center text-slate-400">Nenhum custo lançado.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function VistoriasTab({ obra, reload }: { obra: Obra; reload: () => void }) {
  const [open, setOpen] = useState(false);
  const [tipo, setTipo] = useState("INICIAL");
  const [description, setDescription] = useState("");
  const [uploadIds, setUploadIds] = useState<string[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const fd = new FormData();
    fd.append("file", file);
    fd.append("entityType", "obra_vistoria");
    const { data } = await api.post("/uploads", fd);
    setUploadIds((p) => [...p, data.id]);
    setPreviews((p) => [...p, data.url]);
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    try {
      await api.post(`/obras/${obra.id}/vistorias`, { tipo, description, uploadIds });
      setOpen(false);
      setDescription(""); setUploadIds([]); setPreviews([]);
      reload();
    } catch (err) {
      setError(apiError(err, "Falha ao registrar vistoria"));
    }
  }

  const inicial = (obra.vistorias ?? []).filter((v) => v.tipo === "INICIAL");
  const final = (obra.vistorias ?? []).filter((v) => v.tipo === "FINAL");

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button className="btn-primary" onClick={() => setOpen(true)}><Plus size={16} /> Nova vistoria</button>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <VistoriaColumn title="Vistoria inicial" items={inicial} />
        <VistoriaColumn title="Vistoria final (comparativo)" items={final} />
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title="Registrar vistoria">
        <form onSubmit={save} className="space-y-3">
          <div>
            <label className="label">Tipo</label>
            <select className="input" value={tipo} onChange={(e) => setTipo(e.target.value)}>
              <option value="INICIAL">Inicial</option>
              <option value="FINAL">Final</option>
            </select>
          </div>
          <div>
            <label className="label">Descrição do estado</label>
            <textarea className="input min-h-[100px]" value={description} onChange={(e) => setDescription(e.target.value)} required />
          </div>
          <div>
            <label className="label">Registro fotográfico</label>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
            <button type="button" className="btn-secondary" onClick={() => fileRef.current?.click()}>
              <UploadIcon size={16} /> Adicionar foto
            </button>
            <div className="mt-2 flex flex-wrap gap-2">
              {previews.map((p) => <img key={p} src={p} className="h-16 w-16 rounded object-cover" />)}
            </div>
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button type="submit" className="btn-primary w-full">Salvar vistoria</button>
        </form>
      </Modal>
    </div>
  );
}

function VistoriaColumn({ title, items }: { title: string; items: Obra["vistorias"] }) {
  return (
    <div className="card">
      <h3 className="mb-3 font-semibold text-slate-700">{title}</h3>
      {(items ?? []).length === 0 ? (
        <p className="text-sm text-slate-400">Nenhum registro.</p>
      ) : (
        <div className="space-y-3">
          {(items ?? []).map((v) => (
            <div key={v.id} className="rounded-lg border border-slate-200 p-3">
              <p className="text-xs text-slate-400">{formatDate(v.createdAt)}</p>
              <p className="mt-1 text-sm text-slate-700">{v.description}</p>
              {v.uploads.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {v.uploads.map((u) => (
                    <a key={u.id} href={u.url} target="_blank" rel="noreferrer">
                      <img src={u.url} className="h-16 w-16 rounded object-cover" />
                    </a>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function OcTab({ obra, payers, reload }: { obra: Obra; payers: PayerCompany[]; reload: () => void }) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ payerId: "", supplier: "", description: "", amount: 0 });

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    try {
      await api.post("/purchase-orders", { ...form, obraId: obra.id, amount: Number(form.amount) });
      setOpen(false);
      setForm({ payerId: "", supplier: "", description: "", amount: 0 });
      reload();
    } catch (err) {
      setError(apiError(err, "Falha ao gerar O.C."));
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button className="btn-primary" onClick={() => setOpen(true)}><ShoppingCart size={16} /> Gerar Ordem de Compra</button>
      </div>

      <div className="card p-0 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-left text-xs uppercase text-slate-500">
            <tr><th className="px-4 py-3">Número</th><th className="px-4 py-3">Fornecedor</th><th className="px-4 py-3">CNPJ Pagador</th><th className="px-4 py-3">Valor</th><th className="px-4 py-3">Status</th></tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {(obra.purchaseOrders ?? []).map((po) => (
              <tr key={po.id}>
                <td className="px-4 py-3 font-medium text-slate-700">{po.number}</td>
                <td className="px-4 py-3 text-slate-600">{po.supplier}</td>
                <td className="px-4 py-3 text-slate-500">{po.payer?.name} ({po.payer?.cnpj})</td>
                <td className="px-4 py-3 text-slate-700">{formatCurrency(po.amount)}</td>
                <td className="px-4 py-3"><Badge className="bg-slate-100 text-slate-700">{PO_STATUS_LABELS[po.status]}</Badge></td>
              </tr>
            ))}
            {(obra.purchaseOrders ?? []).length === 0 && <tr><td colSpan={5} className="px-4 py-6 text-center text-slate-400">Nenhuma O.C. emitida.</td></tr>}
          </tbody>
        </table>
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title="Gerar Ordem de Compra">
        <form onSubmit={save} className="space-y-3">
          <div>
            <label className="label">CNPJ Pagador</label>
            <select className="input" value={form.payerId} onChange={(e) => setForm({ ...form, payerId: e.target.value })} required>
              <option value="">Selecione...</option>
              {payers.map((p) => <option key={p.id} value={p.id}>{p.name} — {p.cnpj}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Fornecedor</label>
            <input className="input" value={form.supplier} onChange={(e) => setForm({ ...form, supplier: e.target.value })} required />
          </div>
          <div>
            <label className="label">Descrição</label>
            <input className="input" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>
          <div>
            <label className="label">Valor (R$)</label>
            <input type="number" step="0.01" className="input" value={form.amount} onChange={(e) => setForm({ ...form, amount: Number(e.target.value) })} required />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button type="submit" className="btn-primary w-full">Emitir O.C.</button>
        </form>
      </Modal>
    </div>
  );
}
