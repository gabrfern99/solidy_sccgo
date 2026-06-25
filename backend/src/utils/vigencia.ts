import { ContractStatus } from "@prisma/client";

export interface VigenciaInfo {
  daysRemaining: number | null;
  monthsRemaining: number | null;
  label: string;
}

export function computeVigencia(endDate: Date | null): VigenciaInfo {
  if (!endDate) {
    return { daysRemaining: null, monthsRemaining: null, label: "Indeterminada" };
  }
  const now = new Date();
  const diffMs = endDate.getTime() - now.getTime();
  const days = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  const months = Math.floor(days / 30);

  let label: string;
  if (days < 0) label = "Vencido";
  else if (days === 0) label = "Vence hoje";
  else if (days < 30) label = `${days} dia(s)`;
  else label = `${months} mês(es) e ${days % 30} dia(s)`;

  return { daysRemaining: days, monthsRemaining: months, label };
}

// Deriva o status efetivo considerando a vigência para contratos já ativos/assinados.
export function deriveStatus(
  current: ContractStatus,
  endDate: Date | null
): ContractStatus {
  if (
    current === ContractStatus.ASSINADO ||
    current === ContractStatus.ATIVO ||
    current === ContractStatus.VENCENDO
  ) {
    if (!endDate) return ContractStatus.ATIVO;
    const { daysRemaining } = computeVigencia(endDate);
    if (daysRemaining === null) return ContractStatus.ATIVO;
    if (daysRemaining < 0) return ContractStatus.ENCERRADO;
    if (daysRemaining <= 30) return ContractStatus.VENCENDO;
    return ContractStatus.ATIVO;
  }
  return current;
}
