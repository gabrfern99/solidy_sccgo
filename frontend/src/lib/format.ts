export function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value ?? 0);
}

export function formatDate(date?: string | null) {
  if (!date) return "-";
  return new Intl.DateTimeFormat("pt-BR").format(new Date(date));
}

export const CONTRACT_STATUS_LABELS: Record<string, string> = {
  RASCUNHO: "Rascunho",
  AGUARDANDO_ASSINATURA: "Aguardando assinatura",
  ASSINADO: "Assinado",
  ATIVO: "Ativo",
  VENCENDO: "Vencendo",
  ENCERRADO: "Encerrado",
  EXPIRADO: "Expirado",
};

export const CONTRACT_STATUS_COLORS: Record<string, string> = {
  RASCUNHO: "bg-slate-100 text-slate-700",
  AGUARDANDO_ASSINATURA: "bg-amber-100 text-amber-800",
  ASSINADO: "bg-emerald-100 text-emerald-800",
  ATIVO: "bg-emerald-100 text-emerald-800",
  VENCENDO: "bg-orange-100 text-orange-800",
  ENCERRADO: "bg-slate-200 text-slate-600",
  EXPIRADO: "bg-red-100 text-red-700",
};

export const CATEGORY_LABELS: Record<string, string> = {
  SERVICO: "Serviço",
  TRABALHO: "Trabalho",
  OBRA: "Obra",
  LOCACAO: "Locação",
  OUTRO: "Outro",
};

export const OBRA_STATUS_LABELS: Record<string, string> = {
  PLANEJAMENTO: "Planejamento",
  EM_EXECUCAO: "Em execução",
  CONCLUIDA: "Concluída",
  PARALISADA: "Paralisada",
};

export const OBRA_STATUS_COLORS: Record<string, string> = {
  PLANEJAMENTO: "bg-sky-100 text-sky-800",
  EM_EXECUCAO: "bg-brand-100 text-brand-800",
  CONCLUIDA: "bg-emerald-100 text-emerald-800",
  PARALISADA: "bg-red-100 text-red-700",
};

export const PO_STATUS_LABELS: Record<string, string> = {
  ABERTA: "Aberta",
  APROVADA: "Aprovada",
  RECEBIDA: "Recebida",
  CANCELADA: "Cancelada",
};

export const CUSTO_CATEGORIA_LABELS: Record<string, string> = {
  MATERIAL: "Material",
  MAO_DE_OBRA: "Mão de obra",
  EQUIPAMENTO: "Equipamento",
  SERVICO_TERCEIRO: "Serviço terceiro",
  MANUTENCAO: "Manutenção",
  OUTRO: "Outro",
};
