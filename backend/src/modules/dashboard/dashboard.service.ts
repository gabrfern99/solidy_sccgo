import { ContractStatus } from "@prisma/client";
import { prisma } from "../../config/prisma.js";
import { deriveStatus } from "../../utils/vigencia.js";

export async function metrics(companyId: string) {
  const [contracts, obras, custos, pos, pendingSignatures] = await Promise.all([
    prisma.contract.findMany({
      where: { companyId },
      select: { status: true, endDate: true, value: true, category: true },
    }),
    prisma.obra.findMany({
      where: { companyId },
      select: { status: true, budgetPlanned: true },
    }),
    prisma.obraCusto.findMany({
      where: { obra: { companyId } },
      select: { amount: true },
    }),
    prisma.purchaseOrder.findMany({
      where: { companyId },
      select: { amount: true, status: true },
    }),
    prisma.signatureRequest.count({
      where: { contract: { companyId }, status: "AGUARDANDO" },
    }),
  ]);

  const statusCount: Record<string, number> = {};
  let totalContractValue = 0;
  let vencendo = 0;
  const categoryCount: Record<string, number> = {};
  for (const c of contracts) {
    const eff = deriveStatus(c.status, c.endDate);
    statusCount[eff] = (statusCount[eff] ?? 0) + 1;
    totalContractValue += Number(c.value);
    categoryCount[c.category] = (categoryCount[c.category] ?? 0) + 1;
    if (eff === ContractStatus.VENCENDO) vencendo += 1;
  }

  const totalBudgetPlanned = obras.reduce((a, o) => a + Number(o.budgetPlanned), 0);
  const totalRealized = custos.reduce((a, c) => a + Number(c.amount), 0);
  const totalPO = pos.reduce((a, p) => a + Number(p.amount), 0);

  const obrasStatus: Record<string, number> = {};
  for (const o of obras) obrasStatus[o.status] = (obrasStatus[o.status] ?? 0) + 1;

  return {
    contracts: {
      total: contracts.length,
      totalValue: totalContractValue,
      byStatus: statusCount,
      byCategory: categoryCount,
      vencendo,
      pendingSignatures,
    },
    obras: {
      total: obras.length,
      byStatus: obrasStatus,
      budgetPlanned: totalBudgetPlanned,
      budgetRealized: totalRealized,
      budgetBalance: totalBudgetPlanned - totalRealized,
    },
    purchaseOrders: {
      total: pos.length,
      totalValue: totalPO,
    },
  };
}

export async function alerts(companyId: string) {
  const contracts = await prisma.contract.findMany({
    where: { companyId },
    select: { id: true, title: true, status: true, endDate: true, counterparty: true },
  });
  return contracts
    .map((c) => ({ ...c, effective: deriveStatus(c.status, c.endDate) }))
    .filter((c) => c.effective === ContractStatus.VENCENDO)
    .sort((a, b) => (a.endDate?.getTime() ?? 0) - (b.endDate?.getTime() ?? 0));
}

// Relatórios: custos por categoria, orçamento previsto vs realizado por obra
export async function reports(companyId: string) {
  const obras = await prisma.obra.findMany({
    where: { companyId },
    select: {
      id: true,
      name: true,
      budgetPlanned: true,
      custos: { select: { amount: true, categoria: true } },
    },
  });

  const byObra = obras.map((o) => {
    const realized = o.custos.reduce((a, c) => a + Number(c.amount), 0);
    return {
      id: o.id,
      name: o.name,
      planned: Number(o.budgetPlanned),
      realized,
      balance: Number(o.budgetPlanned) - realized,
    };
  });

  const byCategory: Record<string, number> = {};
  for (const o of obras)
    for (const c of o.custos)
      byCategory[c.categoria] = (byCategory[c.categoria] ?? 0) + Number(c.amount);

  return { byObra, byCategory };
}
