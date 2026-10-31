import { createReceiptPdf, pdfColors } from "@/features/documents/receipt-pdf";
import { money, paymentLabels } from "@/mocks/internal-data";
import type { Sale } from "@/mocks/internal-data";

export async function downloadSaleReceipt(sale: Sale) {
  const { doc, margin, right, contentWidth, contentBottom, write, splitText, writeTotal, save } =
    await createReceiptPdf({
      id: sale.id,
      date: sale.date,
      title: "Constancia de venta",
      numberLabel: "N° de constancia",
      filePrefix: "constancia",
    });

  // Método de pago
  write("Método de pago", margin, 82, { size: 9, color: pdfColors.muted });
  write(paymentLabels[sale.method], margin, 88, { size: 11, style: "bold" });

  // Detalle
  const columns = {
    product: margin + 4,
    quantity: margin + 104,
    price: margin + 136,
    subtotal: right - 4,
  };

  function writeTableHeader(top: number) {
    doc.setFillColor(pdfColors.brand).rect(margin, top, contentWidth, 10, "F");
    const header = { size: 9, style: "bold", color: pdfColors.white } as const;
    const y = top + 6.5;
    write("Producto", columns.product, y, header);
    write("Cantidad", columns.quantity, y, { ...header, align: "right" });
    write("Precio unitario", columns.price, y, { ...header, align: "right" });
    write("Subtotal", columns.subtotal, y, { ...header, align: "right" });
    return top + 10;
  }

  let y = writeTableHeader(98);
  for (const line of sale.lines) {
    const nameLines = splitText(line.name, 80, 10, "normal");
    const rowHeight = 8 + nameLines.length * 5;
    if (y + rowHeight > contentBottom) {
      doc.addPage();
      y = writeTableHeader(20);
    }
    const rowY = y + 7.5;
    write(nameLines, columns.product, rowY);
    write(String(line.quantity), columns.quantity, rowY, { align: "right" });
    write(money(line.cents), columns.price, rowY, { align: "right" });
    write(money(line.cents * line.quantity), columns.subtotal, rowY, { align: "right" });
    y += rowHeight;
    doc.setDrawColor(pdfColors.line).setLineWidth(0.3).line(margin, y, right, y);
  }

  // total 
  if (y + 26 > contentBottom) {
    doc.addPage();
    y = 12;
  }
  writeTotal(y + 8, sale.total);
  save();
}
