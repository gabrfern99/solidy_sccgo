import { useEffect, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Download, FileText } from "lucide-react";
import { api } from "../lib/api";
import { EmptyState, PageHeader } from "../components/ui";
import { CUSTO_CATEGORIA_LABELS, formatCurrency } from "../lib/format";

interface ReportData {
  byObra: { id: string; name: string; planned: number; realized: number; balance: number }[];
  byCategory: Record<string, number>;
}

export default function ReportsPage() {
  const [data, setData] = useState<ReportData | null>(null);

  useEffect(() => {
    api.get("/dashboard/reports").then((r) => setData(r.data));
  }, []);

  if (!data) return <p className="text-slate-500">Carregando...</p>;

  const categoryData = Object.entries(data.byCategory).map(([k, v]) => ({
    name: CUSTO_CATEGORIA_LABELS[k] ?? k,
    value: v,
  }));

  function exportCsv() {
    const rows = [
      ["Obra", "Previsto", "Realizado", "Saldo"],
      ...data!.byObra.map((o) => [o.name, o.planned, o.realized, o.balance]),
    ];
    const csv = rows.map((r) => r.join(";")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "relatorio-obras.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  async function exportPdf() {
    const res = await api.get("/dashboard/reports/pdf", { responseType: "blob" });
    const url = URL.createObjectURL(res.data);
    const a = document.createElement("a");
    a.href = url;
    a.download = "relatorio-obras.pdf";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div>
      <PageHeader
        title="Relatórios"
        subtitle="Exportação e consultas de custos e orçamento"
        actions={
          <div className="flex gap-2">
            <button className="btn-secondary" onClick={exportCsv}><Download size={16} /> Exportar CSV</button>
            <button className="btn-primary" onClick={exportPdf}><FileText size={16} /> Exportar PDF</button>
          </div>
        }
      />

      <div className="card mb-6">
        <h3 className="mb-4 font-semibold text-slate-700">Orçamento por obra: previsto vs. realizado</h3>
        {data.byObra.length === 0 ? (
          <EmptyState message="Sem dados de obras." />
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data.byObra}>
              <XAxis dataKey="name" />
              <YAxis tickFormatter={(v) => `${v / 1000}k`} />
              <Tooltip formatter={(v: number) => formatCurrency(v)} />
              <Legend />
              <Bar dataKey="planned" name="Previsto" fill="#94a3b8" radius={[4, 4, 0, 0]} />
              <Bar dataKey="realized" name="Realizado" fill="#3563ff" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="card">
          <h3 className="mb-4 font-semibold text-slate-700">Custos por categoria</h3>
          {categoryData.length === 0 ? (
            <EmptyState message="Sem custos lançados." />
          ) : (
            <div className="space-y-2">
              {categoryData.map((c) => (
                <div key={c.name} className="flex items-center justify-between text-sm">
                  <span className="text-slate-600">{c.name}</span>
                  <span className="font-semibold text-slate-800">{formatCurrency(c.value)}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card">
          <h3 className="mb-4 font-semibold text-slate-700">Saldo orçamentário por obra</h3>
          <div className="space-y-2">
            {data.byObra.map((o) => (
              <div key={o.id} className="flex items-center justify-between text-sm">
                <span className="text-slate-600">{o.name}</span>
                <span className={`font-semibold ${o.balance < 0 ? "text-red-600" : "text-emerald-600"}`}>
                  {formatCurrency(o.balance)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
