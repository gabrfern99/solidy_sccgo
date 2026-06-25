import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from "recharts";
import { FileText, Building2, ShoppingCart, AlertTriangle, PenLine } from "lucide-react";
import { api } from "../lib/api";
import type { Contract, DashboardMetrics } from "../lib/types";
import { PageHeader, StatCard } from "../components/ui";
import { formatCurrency, CATEGORY_LABELS, CONTRACT_STATUS_LABELS } from "../lib/format";

const COLORS = ["#3563ff", "#22c55e", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4"];

export default function DashboardPage() {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [alerts, setAlerts] = useState<Contract[]>([]);

  useEffect(() => {
    api.get("/dashboard/metrics").then((r) => setMetrics(r.data));
    api.get("/dashboard/alerts").then((r) => setAlerts(r.data));
  }, []);

  if (!metrics) return <p className="text-slate-500">Carregando métricas...</p>;

  const categoryData = Object.entries(metrics.contracts.byCategory).map(([k, v]) => ({
    name: CATEGORY_LABELS[k] ?? k,
    value: v,
  }));
  const budgetData = [
    { name: "Previsto", value: metrics.obras.budgetPlanned },
    { name: "Realizado", value: metrics.obras.budgetRealized },
  ];

  return (
    <div>
      <PageHeader
        title="Dashboard"
        subtitle="Visão consolidada de contratos e obras (dados reais do banco)"
        actions={
          <Link to="/contratos/novo" className="btn-primary">
            <PenLine size={16} /> Novo Contrato
          </Link>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Contratos"
          value={String(metrics.contracts.total)}
          hint={`${formatCurrency(metrics.contracts.totalValue)} em valor total`}
          icon={<FileText size={20} />}
        />
        <StatCard
          label="Assinaturas pendentes"
          value={String(metrics.contracts.pendingSignatures)}
          hint="Aguardando assinatura das partes"
          icon={<PenLine size={20} />}
          accent="text-amber-500"
        />
        <StatCard
          label="Obras"
          value={String(metrics.obras.total)}
          hint={`${formatCurrency(metrics.obras.budgetRealized)} realizados`}
          icon={<Building2 size={20} />}
          accent="text-emerald-600"
        />
        <StatCard
          label="Ordens de Compra"
          value={String(metrics.purchaseOrders.total)}
          hint={`${formatCurrency(metrics.purchaseOrders.totalValue)} emitidos`}
          icon={<ShoppingCart size={20} />}
          accent="text-violet-600"
        />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="card">
          <h3 className="mb-4 font-semibold text-slate-700">Contratos por categoria</h3>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={categoryData} dataKey="value" nameKey="name" outerRadius={90} label>
                {categoryData.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <h3 className="mb-4 font-semibold text-slate-700">Orçamento de obras: previsto vs. realizado</h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={budgetData}>
              <XAxis dataKey="name" />
              <YAxis tickFormatter={(v) => `${v / 1000}k`} />
              <Tooltip formatter={(v: number) => formatCurrency(v)} />
              <Bar dataKey="value" fill="#3563ff" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="card">
          <h3 className="mb-3 font-semibold text-slate-700">Status dos contratos</h3>
          <div className="space-y-2">
            {Object.entries(metrics.contracts.byStatus).map(([status, count]) => (
              <div key={status} className="flex items-center justify-between text-sm">
                <span className="text-slate-600">{CONTRACT_STATUS_LABELS[status] ?? status}</span>
                <span className="font-semibold text-slate-800">{count}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <h3 className="mb-3 flex items-center gap-2 font-semibold text-slate-700">
            <AlertTriangle size={18} className="text-orange-500" /> Contratos vencendo (30 dias)
          </h3>
          {alerts.length === 0 ? (
            <p className="text-sm text-slate-400">Nenhum contrato próximo do vencimento.</p>
          ) : (
            <div className="space-y-2">
              {alerts.map((c) => (
                <Link
                  key={c.id}
                  to={`/contratos/${c.id}`}
                  className="flex items-center justify-between rounded-lg border border-orange-100 bg-orange-50 px-3 py-2 text-sm hover:bg-orange-100"
                >
                  <span className="font-medium text-slate-700">{c.title}</span>
                  <span className="text-orange-700">{c.vigencia?.label}</span>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
