import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../lib/api";
import type { PurchaseOrder } from "../lib/types";
import { Badge, EmptyState, PageHeader } from "../components/ui";
import { PO_STATUS_LABELS, formatCurrency, formatDate } from "../lib/format";

const PO_COLORS: Record<string, string> = {
  ABERTA: "bg-slate-100 text-slate-700",
  APROVADA: "bg-brand-100 text-brand-800",
  RECEBIDA: "bg-emerald-100 text-emerald-800",
  CANCELADA: "bg-red-100 text-red-700",
};
const NEXT: Record<string, string> = { ABERTA: "APROVADA", APROVADA: "RECEBIDA", RECEBIDA: "RECEBIDA", CANCELADA: "CANCELADA" };

export default function PurchaseOrdersPage() {
  const navigate = useNavigate();
  const [pos, setPos] = useState<PurchaseOrder[]>([]);

  function load() {
    api.get("/purchase-orders").then((r) => setPos(r.data));
  }
  useEffect(load, []);

  async function advance(po: PurchaseOrder) {
    await api.patch(`/purchase-orders/${po.id}/status`, { status: NEXT[po.status] });
    load();
  }

  return (
    <div>
      <PageHeader title="Ordens de Compra" subtitle="Emissão e acompanhamento de O.C. vinculadas às obras" />

      {pos.length === 0 ? (
        <EmptyState message="Nenhuma ordem de compra. Gere a partir de uma obra." />
      ) : (
        <div className="card p-0 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-left text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3">Número</th>
                <th className="px-4 py-3">Obra</th>
                <th className="px-4 py-3">Fornecedor</th>
                <th className="px-4 py-3">CNPJ Pagador</th>
                <th className="px-4 py-3">Valor</th>
                <th className="px-4 py-3">Emissão</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {pos.map((po) => (
                <tr key={po.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium text-slate-700">{po.number}</td>
                  <td className="px-4 py-3 text-brand-600 cursor-pointer" onClick={() => po.obra && navigate(`/obras/${po.obra.id}`)}>{po.obra?.name}</td>
                  <td className="px-4 py-3 text-slate-600">{po.supplier}</td>
                  <td className="px-4 py-3 text-slate-500">{po.payer?.name}<br /><span className="text-xs">{po.payer?.cnpj}</span></td>
                  <td className="px-4 py-3 font-medium text-slate-700">{formatCurrency(po.amount)}</td>
                  <td className="px-4 py-3 text-slate-500">{formatDate(po.createdAt)}</td>
                  <td className="px-4 py-3"><Badge className={PO_COLORS[po.status]}>{PO_STATUS_LABELS[po.status]}</Badge></td>
                  <td className="px-4 py-3 text-right">
                    {po.status !== "RECEBIDA" && po.status !== "CANCELADA" && (
                      <button className="btn-secondary px-2 py-1 text-xs" onClick={() => advance(po)}>Avançar status</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
