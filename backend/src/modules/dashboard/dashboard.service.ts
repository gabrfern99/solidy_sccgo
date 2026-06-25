import { ContractStatus } from "@prisma/client";
import { prisma } from "../../config/prisma.js";
import { deriveStatus } from "../../utils/vigencia.js";
import { createPdfDoc, setHeader, finish, brl, fmtDate } from "../../utils/pdf.js";
import type { Writable } from "node:stream";

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

const CATEGORIA_LABELS: Record<string, string> = {
  MATERIAL: "Material",
  MAO_DE_OBRA: "Mão de obra",
  EQUIPAMENTO: "Equipamento",
  SERVICO_TERCEIRO: "Serviço terceiro",
  MANUTENCAO: "Manutenção",
  OUTRO: "Outro",
};

export async function reportsPdf(companyId: string, res: Writable) {
  const data = await reports(companyId);
  const doc = createPdfDoc(res, "Relatório de Obras e Custos");
  setHeader(doc, "RELATÓRIO DE OBRAS E CUSTOS", `Emitido em ${fmtDate(new Date())}`);

  const colX = [50, 230, 340, 450];
  const pageW = 545;
  const rowH = 16;

  // Tabela: orçamento por obra
  doc.fontSize(13).font("Helvetica-Bold").fillColor("#1e293b").text("Orçamento por obra");
  let y = doc.y + 8;

  // Header row
  doc.fontSize(9).font("Helvetica-Bold").fillColor("#64748b");
  ["Obra", "Previsto", "Realizado", "Saldo"].forEach((h, i) => doc.text(h, colX[i], y));
  y += rowH;
  doc.moveTo(50, y).lineTo(pageW, y).strokeColor("#e2e8f0").lineWidth(0.5).stroke();
  y += 6;

  // Data rows
  doc.font("Helvetica").fillColor("#1e293b").fontSize(9);
  for (const o of data.byObra) {
    doc.text(o.name, colX[0], y);
    doc.text(brl(o.planned), colX[1], y);
    doc.text(brl(o.realized), colX[2], y);
    doc.fillColor(o.balance < 0 ? "#dc2626" : "#059669").text(brl(o.balance), colX[3], y);
    doc.fillColor("#1e293b");
    y += rowH;
  }

  // Totals
  doc.moveTo(50, y).lineTo(pageW, y).strokeColor("#e2e8f0").lineWidth(0.5).stroke();
  y += 6;
  doc.font("Helvetica-Bold").fontSize(10);
  doc.text("TOTAL", colX[0], y);
  doc.text(brl(data.byObra.reduce((a, o) => a + o.planned, 0)), colX[1], y);
  doc.text(brl(data.byObra.reduce((a, o) => a + o.realized, 0)), colX[2], y);
  const totalBalance = data.byObra.reduce((a, o) => a + o.balance, 0);
  doc.fillColor(totalBalance < 0 ? "#dc2626" : "#059669").text(brl(totalBalance), colX[3], y);
  doc.fillColor("#1e293b");
  y += rowH + 20;

  // Custos por categoria
  doc.fontSize(13).font("Helvetica-Bold").fillColor("#1e293b").text("Custos por categoria", 50, y);
  y += 20;

  // Header
  doc.fontSize(9).font("Helvetica-Bold").fillColor("#64748b");
  doc.text("Categoria", colX[0], y);
  doc.text("Total", colX[2], y);
  y += rowH;
  doc.moveTo(50, y).lineTo(pageW, y).strokeColor("#e2e8f0").lineWidth(0.5).stroke();
  y += 6;

  // Data rows
  doc.font("Helvetica").fillColor("#1e293b").fontSize(9);
  let catTotal = 0;
  for (const [k, v] of Object.entries(data.byCategory)) {
    doc.text(CATEGORIA_LABELS[k] ?? k, colX[0], y);
    doc.text(brl(v), colX[2], y);
    catTotal += v;
    y += rowH;
  }

  // Total
  doc.moveTo(50, y).lineTo(pageW, y).strokeColor("#e2e8f0").lineWidth(0.5).stroke();
  y += 6;
  doc.font("Helvetica-Bold").fontSize(10);
  doc.text("TOTAL", colX[0], y);
  doc.text(brl(catTotal), colX[2], y);
  y += rowH + 24;

  // Footer
  doc.moveTo(50, y).lineTo(pageW, y).strokeColor("#e2e8f0").lineWidth(1).stroke();
  y += 16;
  doc.fontSize(9).font("Helvetica").fillColor("#94a3b8").text(
    "Documento gerado eletronicamente pelo sistema de Controle de Contratos & Gestão Orçamentária.",
    50, y, { align: "center", width: pageW - 50 }
  );

  finish(doc);
}
