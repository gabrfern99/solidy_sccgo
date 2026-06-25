import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, RefreshCw, XCircle, FilePlus2 } from "lucide-react";
import { api } from "../lib/api";
import type { Contract } from "../lib/types";
import { Badge, EmptyState, PageHeader } from "../components/ui";
import {
  CATEGORY_LABELS,
  CONTRACT_STATUS_COLORS,
  CONTRACT_STATUS_LABELS,
  formatCurrency,
  formatDate,
} from "../lib/format";

// Gerenciador: contratos ativos com vigência (Ativo / Vencendo / Encerrado / Aguardando)
const MANAGED = ["ATIVO", "VENCENDO", "ENCERRADO", "AGUARDANDO_ASSINATURA"];

export default function ManagerPage() {
  const navigate = useNavigate();
  const [contracts, setContracts] = useState<Contract[]>([]);

  function load() {
    api.get("/contracts").then((r) =>
      setContracts(r.data.filter((c: Contract) => MANAGED.includes(c.status)))
    );
  }
  useEffect(load, []);

  async function renew(id: string) {
    const months = Number(prompt("Renovar por quantos meses?", "12"));
    if (!months) return;
    await api.post(`/contracts/${id}/renew`, { months });
    load();
  }

  async function close(id: string) {
    if (!confirm("Encerrar este contrato?")) return;
    await api.post(`/contracts/${id}/close`);
    load();
  }

  return (
    <div>
      <PageHeader
        title="Gerenciador de Contratos"
        subtitle="Contratos ativos com vigência e ações rápidas"
      />

      {contracts.length === 0 ? (
        <EmptyState message="Nenhum contrato ativo." />
      ) : (
        <div className="card overflow-x-auto p-0">
          <table className="w-full text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-left text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3">Parte relacionada</th>
                <th className="px-4 py-3">Tipo</th>
                <th className="px-4 py-3">Valor</th>
                <th className="px-4 py-3">Início</th>
                <th className="px-4 py-3">Encerramento</th>
                <th className="px-4 py-3">Vigência restante</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Ações rápidas</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {contracts.map((c) => (
                <tr key={c.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <p className="font-medium text-slate-700">{c.counterparty}</p>
                    <p className="text-xs text-slate-400">{c.title}</p>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{CATEGORY_LABELS[c.category]}</td>
                  <td className="px-4 py-3 text-slate-600">
                    {formatCurrency(c.value)}{c.isMonthly && <span className="text-xs text-slate-400">/mês</span>}
                  </td>
                  <td className="px-4 py-3 text-slate-500">{formatDate(c.startDate)}</td>
                  <td className="px-4 py-3 text-slate-500">{formatDate(c.endDate)}</td>
                  <td className="px-4 py-3">
                    <span className={c.vigencia?.daysRemaining !== null && c.vigencia.daysRemaining <= 30 ? "font-semibold text-orange-600" : "text-slate-600"}>
                      {c.vigencia?.label}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <Badge className={CONTRACT_STATUS_COLORS[c.status]}>{CONTRACT_STATUS_LABELS[c.status]}</Badge>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      <button title="Visualizar" className="btn-secondary px-2 py-1" onClick={() => navigate(`/contratos/${c.id}`)}><Eye size={14} /></button>
                      <button title="Renovar" className="btn-secondary px-2 py-1" onClick={() => renew(c.id)}><RefreshCw size={14} /></button>
                      <button title="Gerar aditivo" className="btn-secondary px-2 py-1" onClick={() => renew(c.id)}><FilePlus2 size={14} /></button>
                      <button title="Encerrar" className="btn-secondary px-2 py-1 text-red-600" onClick={() => close(c.id)}><XCircle size={14} /></button>
                    </div>
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
