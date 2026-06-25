import { useEffect, useState } from "react";
import { Plus, Trash2, FileStack, Pencil } from "lucide-react";
import { api, apiError } from "../lib/api";
import type { Template, TemplateField } from "../lib/types";
import { Badge, EmptyState, Modal, PageHeader } from "../components/ui";
import { CATEGORY_LABELS } from "../lib/format";

const FIELD_TYPES = ["text", "textarea", "number", "currency", "date", "time", "address", "party", "signature"];

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ name: "", category: "SERVICO", description: "", body: "" });
  const [fields, setFields] = useState<TemplateField[]>([]);

  function load() {
    api.get("/templates").then((r) => setTemplates(r.data));
  }
  useEffect(load, []);

  function openCreate() {
    setEditingId(null);
    setForm({ name: "", category: "SERVICO", description: "", body: "" });
    setFields([]);
    setError("");
    setOpen(true);
  }

  function openEdit(t: Template) {
    setEditingId(t.id);
    setForm({
      name: t.name,
      category: t.category,
      description: t.description ?? "",
      body: t.body ?? "",
    });
    setFields(
      t.fields.map((f, i) => ({
        key: f.key,
        label: f.label,
        type: f.type,
        required: f.required,
        order: f.order ?? i,
      }))
    );
    setError("");
    setOpen(true);
  }

  function addField() {
    setFields([...fields, { key: "", label: "", type: "text", required: false, order: fields.length }]);
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    try {
      if (editingId) {
        await api.put(`/templates/${editingId}`, { ...form, fields });
      } else {
        await api.post("/templates", { ...form, fields });
      }
      setOpen(false);
      setEditingId(null);
      setForm({ name: "", category: "SERVICO", description: "", body: "" });
      setFields([]);
      load();
    } catch (err) {
      setError(apiError(err, "Falha ao salvar template"));
    }
  }

  async function remove(id: string) {
    if (!confirm("Excluir este template?")) return;
    await api.delete(`/templates/${id}`);
    load();
  }

  return (
    <div>
      <PageHeader
        title="Templates"
        subtitle="Biblioteca de modelos de contratos"
        actions={<button className="btn-primary" onClick={openCreate}><Plus size={16} /> Novo Template</button>}
      />

      {templates.length === 0 ? (
        <EmptyState message="Nenhum template cadastrado." />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {templates.map((t) => (
            <div key={t.id} className="card">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <FileStack className="text-brand-500" size={20} />
                  <h3 className="font-semibold text-slate-800">{t.name}</h3>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => openEdit(t)} className="text-slate-400 hover:text-brand-600" title="Editar">
                    <Pencil size={16} />
                  </button>
                  <button onClick={() => remove(t.id)} className="text-slate-400 hover:text-red-500" title="Excluir">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
              <Badge className="mt-2 bg-brand-50 text-brand-700">{CATEGORY_LABELS[t.category]}</Badge>
              <p className="mt-2 text-sm text-slate-500">{t.description || "Sem descrição"}</p>
              <p className="mt-3 text-xs text-slate-400">
                {t.fields.length} campo(s) • {t._count?.contracts ?? 0} contrato(s)
              </p>
            </div>
          ))}
        </div>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title={editingId ? "Editar Template" : "Novo Template"} size="xl">
        <form onSubmit={save} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="label">Nome</label>
              <input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            </div>
            <div>
              <label className="label">Categoria</label>
              <select className="input" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                {Object.entries(CATEGORY_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="label">Descrição</label>
            <input className="input" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>
          <div>
            <label className="label">Corpo do contrato (use {"{{campo}}"} para variáveis)</label>
            <textarea className="input min-h-[120px]" value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} />
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between">
              <label className="label mb-0">Campos dinâmicos</label>
              <button type="button" className="btn-secondary px-2 py-1 text-xs" onClick={addField}>
                <Plus size={14} /> Adicionar campo
              </button>
            </div>
            <div className="space-y-2">
              {fields.map((f, i) => (
                <div key={i} className="grid grid-cols-12 gap-2">
                  <input className="input col-span-3" placeholder="key" value={f.key} onChange={(e) => updateField(i, { key: e.target.value })} />
                  <input className="input col-span-4" placeholder="Rótulo" value={f.label} onChange={(e) => updateField(i, { label: e.target.value })} />
                  <select className="input col-span-3" value={f.type} onChange={(e) => updateField(i, { type: e.target.value })}>
                    {FIELD_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                  <label className="col-span-1 flex items-center justify-center text-xs">
                    <input type="checkbox" checked={f.required} onChange={(e) => updateField(i, { required: e.target.checked })} />
                  </label>
                  <button type="button" className="col-span-1 text-slate-400 hover:text-red-500" onClick={() => setFields(fields.filter((_, idx) => idx !== i))}>
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}
          <button type="submit" className="btn-primary w-full">{editingId ? "Atualizar template" : "Salvar template"}</button>
        </form>
      </Modal>
    </div>
  );

  function updateField(index: number, patch: Partial<TemplateField>) {
    setFields((prev) => prev.map((f, i) => (i === index ? { ...f, ...patch } : f)));
  }
}
