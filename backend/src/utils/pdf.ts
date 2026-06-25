import PDFDocument from "pdfkit";
import type { Writable } from "node:stream";

export function createPdfDoc(res: Writable, filename: string) {
  const doc = new PDFDocument({ margin: 50, size: "A4" });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (doc as any).info.Title = filename;
  doc.pipe(res);
  return doc;
}

export function brl(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value ?? 0);
}

export function fmtDate(date?: string | Date | null) {
  if (!date) return "-";
  return new Intl.DateTimeFormat("pt-BR").format(new Date(date));
}

export function setHeader(doc: ReturnType<typeof createPdfDoc>, title: string, subtitle?: string) {
  doc
    .fontSize(20)
    .font("Helvetica-Bold")
    .text(title, { align: "center" });
  if (subtitle) {
    doc
      .fontSize(11)
    .font("Helvetica")
    .fillColor("#64748b")
    .text(subtitle, { align: "center" });
  }
  doc.moveDown(0.5);
  doc.moveTo(50, doc.y).lineTo(545, doc.y).strokeColor("#e2e8f0").lineWidth(1).stroke();
  doc.moveDown(1);
  doc.fillColor("#000000");
}

export function field(doc: ReturnType<typeof createPdfDoc>, label: string, value: string) {
  const y = doc.y;
  doc
    .fontSize(9)
    .font("Helvetica")
    .fillColor("#64748b")
    .text(label, 50, y);
  doc
    .fontSize(11)
    .font("Helvetica-Bold")
    .fillColor("#1e293b")
    .text(value, 50, y + 12);
  doc.y = y + 28;
  doc.fillColor("#000000");
}

export function finish(doc: ReturnType<typeof createPdfDoc>) {
  doc.end();
}
