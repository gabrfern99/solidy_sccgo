import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api, apiError } from "../lib/api";
import type { Template } from "../lib/types";
import { PageHeader } from "../components/ui";
import { CATEGORY_LABELS } from "../lib/format";

export default function NewContractPage() {
  const navigate = useNavigate();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [templateId, setTemplateId] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    title: "",
    category: "SERVICO",
    counterparty: "",
    counterpartyDoc: "",
    value: 0,
    isMonthly: false,
    startDate: "",
    endDate: "",
    body: "",
  });
  const [fieldValues, setFieldValues] = useState<Record<string, string>>({});

  useEffect(() => {
    api.get("/templates").then((r) => setTemplates(r.data));
  }, []);

  const selectedTemplate = templates.find((t) => t.id === templateId);

  function applyTemplate(id: string) {
    setTemplateId(id);
    const tpl = templates.find((t) => t.id === id);
    if (tpl) {
      setForm((f) => ({ ...f, category: tpl.category, body: tpl.body, title: f.title || tpl.name }));
      setFieldValues({});
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      const payload: any = {
        ...form,
        value: Number(form.value),
        templateId: templateId || null,
        fieldValues: Object.keys(fieldValues).length ? fieldValues : null,
        startDate: form.startDate ? new Date(form.startDate).toISOString() : null,
        endDate: form.endDate ? new Date(form.endDate).toISOString() : null,
        counterpartyDoc: form.counterpartyDoc || null,
      };
      const { data } = await api.post("/contracts", payload);
      navigate(`/contratos/${data.id}`);
    } catch (err) {
      setError(apiError(err, "Falha ao criar contrato"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-3xl">
      <PageHeader title="Novo Contrato" subtitle="Criação e preenchimento guiado" />

      <form onSubmit={submit} className="space-y-5">
        <div className="card">
          <h3 className="mb-3 font-semibold text-slate-700">1. Escolha um template (opcional)</h3>
          <select className="input" value={templateId} onChange={(e) => applyTemplate(e.target.value)}>
            <option value="">Criar do zero (sem template)</option>
            {templates.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name} — {CATEGORY_LABELS[t.category]}
              </option>
            ))}
          </select>
        </div>

        <div className="card space-y-4">
          <h3 className="font-semibold text-slate-700">2. Dados do contrato</h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="label">Título</label>
              <input
                className="input"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="label">Categoria</label>
              <select
                className="input"
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
              >
                {Object.entries(CATEGORY_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Parte relacionada</label>
              <input
                className="input"
                value={form.counterparty}
                onChange={(e) => setForm({ ...form, counterparty: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="label">CPF/CNPJ da parte</label>
              <input
                className="input"
                value={form.counterpartyDoc}
                onChange={(e) => setForm({ ...form, counterpartyDoc: e.target.value })}
              />
            </div>
            <div>
              <label className="label">Valor (R$)</label>
              <input
                type="number"
                step="0.01"
                className="input"
                value={form.value}
                onChange={(e) => setForm({ ...form, value: Number(e.target.value) })}
              />
            </div>
            <div>
              <label className="label">Data de início</label>
              <input
                type="date"
                className="input"
                value={form.startDate}
                onChange={(e) => setForm({ ...form, startDate: e.target.value })}
              />
            </div>
            <div>
              <label className="label">Data de encerramento</label>
              <input
                type="date"
                className="input"
                value={form.endDate}
                onChange={(e) => setForm({ ...form, endDate: e.target.value })}
              />
            </div>
            <div className="flex items-center gap-2 sm:col-span-2">
              <input
                id="monthly"
                type="checkbox"
                checked={form.isMonthly}
                onChange={(e) => setForm({ ...form, isMonthly: e.target.checked })}
              />
              <label htmlFor="monthly" className="text-sm text-slate-600">
                Valor mensal (recorrente)
              </label>
            </div>
          </div>
        </div>

        {selectedTemplate && selectedTemplate.fields.length > 0 && (
          <div className="card space-y-4">
            <h3 className="font-semibold text-slate-700">3. Campos do template</h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {selectedTemplate.fields.map((f) => (
                <div key={f.key} className={f.type === "textarea" ? "sm:col-span-2" : ""}>
                  <label className="label">
                    {f.label}
                    {f.required && <span className="text-red-500"> *</span>}
                  </label>
                  <input
                    className="input"
                    type={f.type === "date" ? "date" : f.type === "number" || f.type === "currency" ? "number" : f.type === "time" ? "time" : "text"}
                    required={f.required}
                    value={fieldValues[f.key] ?? ""}
                    onChange={(e) => setFieldValues({ ...fieldValues, [f.key]: e.target.value })}
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="card">
          <h3 className="mb-3 font-semibold text-slate-700">4. Corpo do contrato</h3>
          <textarea
            className="input min-h-[160px]"
            value={form.body}
            onChange={(e) => setForm({ ...form, body: e.target.value })}
            placeholder="Texto do contrato..."
          />
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="flex gap-2">
          <button type="submit" disabled={saving} className="btn-primary">
            {saving ? "Salvando..." : "Salvar como rascunho"}
          </button>
          <button type="button" className="btn-secondary" onClick={() => navigate("/contratos")}>
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
}
