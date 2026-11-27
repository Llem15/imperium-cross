import { createReceiptPdf, pdfColors } from "@/features/documents/receipt-pdf";
import { money } from "@/mocks/internal-data";
import { formatSession, scheduledSessions } from "./registration-model";
import type { WeeklySchedule } from "./registration-model";

type RegistrationReceipt = {
  operationId: string;
  name: string;
  plan: string;
  method: string;
  cents: number;
  schedule: WeeklySchedule;
};

// Reutiliza el comprobante PDF del panel interno
export async function downloadRegistrationReceipt(receipt: RegistrationReceipt) {
  const { doc, margin, right, contentWidth, write, splitText, writeTotal, save } =
    await createReceiptPdf({
      id: receipt.operationId,
      date: new Date().toISOString().slice(0, 10),
      title: "Comprobante de pago",
      numberLabel: "N° de comprobante",
      filePrefix: "comprobante-inscripcion",
    });

  // Cliente y operación
  write("Cliente", margin, 82, { size: 9, color: pdfColors.muted });
  const nameLines = splitText(receipt.name, contentWidth - 60, 11, "bold");
  write(nameLines, margin, 88, { size: 11, style: "bold" });
  write("N.° de operación", right, 82, { size: 9, color: pdfColors.muted, align: "right" });
  write(receipt.operationId, right, 88, { size: 11, style: "bold", align: "right" });

  // Detalle
  const columns = { plan: margin + 4, method: margin + 110, amount: right - 4 };
  const tableTop = 88 + nameLines.length * 5 + 8;
  doc.setFillColor(pdfColors.brand).rect(margin, tableTop, contentWidth, 10, "F");
  const header = { size: 9, style: "bold", color: pdfColors.white } as const;
  const headerY = tableTop + 6.5;
  write("Plan", columns.plan, headerY, header);
  write("Método de pago", columns.method, headerY, { ...header, align: "right" });
  write("Importe", columns.amount, headerY, { ...header, align: "right" });

  const rowTop = tableTop + 10;
  const rowHeight = 13;
  const rowY = rowTop + 7.5;
  write(receipt.plan, columns.plan, rowY);
  write(receipt.method, columns.method, rowY, { align: "right" });
  write(money(receipt.cents), columns.amount, rowY, { align: "right" });
  doc
    .setDrawColor(pdfColors.line)
    .setLineWidth(0.3)
    .line(margin, rowTop + rowHeight, right, rowTop + rowHeight);

  // Horarios semanales
  const scheduleTop = rowTop + rowHeight + 10;
  write("Tu semana", margin, scheduleTop, { size: 9, color: pdfColors.muted });
  scheduledSessions(receipt.schedule).forEach(({ day, start }, index) => {
    const y = scheduleTop + 6 + index * 6;
    const dayName = day.name.charAt(0).toUpperCase() + day.name.slice(1);
    write(`${dayName}: ${formatSession(start)}`, margin, y);
  });

  writeTotal(rowTop + rowHeight + 8, receipt.cents);
  save();
}
