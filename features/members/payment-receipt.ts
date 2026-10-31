import { createReceiptPdf, pdfColors } from "@/features/documents/receipt-pdf";
import { money, paymentLabels } from "@/mocks/internal-data";
import type { Payment } from "@/mocks/internal-data";

export async function downloadReceipt(payment: Payment, name: string, plan: string) {
  const { doc, margin, right, contentWidth, write, splitText, writeTotal, save } =
    await createReceiptPdf({
      id: payment.id,
      date: payment.date,
      title: "Comprobante de pago",
      numberLabel: "N° de comprobante",
      filePrefix: "comprobante",
    });

  // Cliente
  write("Cliente", margin, 82, { size: 9, color: pdfColors.muted });
  const nameLines = splitText(name, contentWidth, 11, "bold");
  write(nameLines, margin, 88, { size: 11, style: "bold" });

  // Detalle
  const columns = {
    plan: margin + 4,
    amount: margin + 86,
    method: margin + 124,
    status: right - 4,
  };
  const tableTop = 88 + nameLines.length * 5 + 8;
  doc.setFillColor(pdfColors.brand).rect(margin, tableTop, contentWidth, 10, "F");
  const header = { size: 9, style: "bold", color: pdfColors.white } as const;
  const headerY = tableTop + 6.5;
  write("Plan", columns.plan, headerY, header);
  write("Importe", columns.amount, headerY, { ...header, align: "right" });
  write("Método de pago", columns.method, headerY, { ...header, align: "right" });
  write("Estado", columns.status, headerY, { ...header, align: "right" });

  const planLines = splitText(plan, 60, 10, "normal");
  const rowTop = tableTop + 10;
  const rowHeight = 8 + planLines.length * 5;
  const rowY = rowTop + 7.5;
  write(planLines, columns.plan, rowY);
  write(money(payment.cents), columns.amount, rowY, { align: "right" });
  write(paymentLabels[payment.method], columns.method, rowY, { align: "right" });
  write("Pagado", columns.status, rowY, { style: "bold", color: "#2e9452", align: "right" });
  doc
    .setDrawColor(pdfColors.line)
    .setLineWidth(0.3)
    .line(margin, rowTop + rowHeight, right, rowTop + rowHeight);

  writeTotal(rowTop + rowHeight + 8, payment.cents);
  save();
}
