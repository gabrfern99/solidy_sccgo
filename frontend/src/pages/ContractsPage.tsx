import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Search, PenLine, Eye } from "lucide-react";
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

export default function ContractsPage() {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [category, setCategory] = useState("");

  function load() {
    const params: Record<string, string> = {};
    if (search) params.search = search;
    if (status) params.status = status;
    if (category) params.category = category;
    api.get("/contracts", { params }).then((r) => setContracts(r.data));
  }

  useEffect(() => {
    const t = setTimeout(load, 250);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, status, category]);

  return (
    <div>
      <PageHeader
        title="Contratos"
        subtitle="Todos os contratos celebrados pela empresa"
        actions={
          <Link to="/contratos/novo" className="btn-primary">
            <PenLine size={16} /> Novo Contrato
          </Link>
        }
      />

      <div className="card mb-4 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[220px]">
          <Search size={16} className="absolute left-3 top-2.5 text-slate-400" />
          <input
            className="input pl-9"
            placeholder="Buscar por título, parte ou documento..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select className="input w-auto" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">Todos os status</option>
          {Object.entries(CONTRACT_STATUS_LABELS).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
        <select className="input w-auto" value={category} onChange={(e) => setCategory(e.target.value)}>
          <option value="">Todas as categorias</option>
          {Object.entries(CATEGORY_LABELS).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
      </div>

      {contracts.length === 0 ? (
        <EmptyState message="Nenhum contrato encontrado." />
      ) : (
        <div className="card overflow-x-auto p-0">
          <table className="w-full text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-left text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3">Título</th>
                <th className="px-4 py-3">Parte relacionada</th>
                <th className="px-4 py-3">Categoria</th>
                <th className="px-4 py-3">Valor</th>
                <th className="px-4 py-3">Vigência</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {contracts.map((c) => (
                <tr key={c.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium text-slate-700">{c.title}</td>
                  <td className="px-4 py-3 text-slate-600">{c.counterparty}</td>
                  <td className="px-4 py-3 text-slate-600">{CATEGORY_LABELS[c.category]}</td>
                  <td className="px-4 py-3 text-slate-600">
                    {formatCurrency(c.value)}
                    {c.isMonthly && <span className="text-xs text-slate-400">/mês</span>}
                  </td>
                  <td className="px-4 py-3 text-slate-500">{c.endDate ? formatDate(c.endDate) : "-"}</td>
                  <td className="px-4 py-3">
                    <Badge className={CONTRACT_STATUS_COLORS[c.status]}>
                      {CONTRACT_STATUS_LABELS[c.status]}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link to={`/contratos/${c.id}`} className="btn-secondary px-2 py-1">
                      <Eye size={15} />
                    </Link>
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
