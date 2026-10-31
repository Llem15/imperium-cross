import { money } from "@/mocks/internal-data";

export const pdfColors = {
  brand: "#a81e18",
  ink: "#0f0f0f",
  muted: "#6b6b6b",
  line: "#e3e3e3",
  surface: "#fff6ed",
  white: "#ffffff",
};

type WriteOptions = {
  size?: number;
  style?: "normal" | "bold";
  color?: string;
  align?: "left" | "right" | "center";
};

async function fetchBytes(path: string) {
  const response = await fetch(path);
  if (!response.ok) throw new Error(`No se pudo cargar ${path}`);
  return new Uint8Array(await response.arrayBuffer());
}

function toBase64(bytes: Uint8Array) {
  let binary = "";
  for (let start = 0; start < bytes.length; start += 0x8000) {
    binary += String.fromCharCode(...bytes.subarray(start, start + 0x8000));
  }
  return btoa(binary);
}

// El número es ficticio, pero estable: un mismo registro conserva su número en cada descarga.
function documentNumber(id: string) {
  let hash = 0;
  for (const character of id) {
    hash = (hash * 31 + character.charCodeAt(0)) % 1000000;
  }
  return `0001-${String(hash).padStart(6, "0")}`;
}

function formatDate(date: string) {
  return date.split("-").reverse().join("/");
}

export async function createReceiptPdf({
  id,
  date,
  title,
  numberLabel,
  filePrefix,
}: {
  id: string;
  date: string;
  title: string;
  numberLabel: string;
  filePrefix: string;
}) {
  // Se cargan al pulsar descargar
  const [{ jsPDF }, logo, regular, bold] = await Promise.all([
    import("jspdf"),
    fetchBytes("/landing/logo-header.png"),
    fetchBytes("/fonts/Inter-Regular.ttf"),
    fetchBytes("/fonts/Inter-Bold.ttf"),
  ]);

  const doc = new jsPDF({ format: "a4", unit: "mm", compress: true });
  doc.addFileToVFS("Inter-Regular.ttf", toBase64(regular));
  doc.addFont("Inter-Regular.ttf", "Inter", "normal");
  doc.addFileToVFS("Inter-Bold.ttf", toBase64(bold));
  doc.addFont("Inter-Bold.ttf", "Inter", "bold");

  const number = documentNumber(id);
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  const right = pageWidth - margin;
  const contentWidth = right - margin;
  // Límite inferior del contenido, por encima del pie de página.
  const contentBottom = pageHeight - 34;

  function write(
    text: string | string[],
    x: number,
    y: number,
    { size = 10, style = "normal", color = pdfColors.ink, align = "left" }: WriteOptions = {},
  ) {
    doc.setFont("Inter", style).setFontSize(size).setTextColor(color);
    doc.text(text, x, y, { align });
  }

  function splitText(text: string, width: number, size: number, style: "normal" | "bold") {
    doc.setFont("Inter", style).setFontSize(size);
    return doc.splitTextToSize(text, width) as string[];
  }

  function writeTotal(top: number, cents: number) {
    doc.setFillColor(pdfColors.surface).roundedRect(right - 80, top, 80, 18, 2, 2, "F");
    write("Total", right - 75, top + 11, { size: 11, style: "bold" });
    write(money(cents), right - 5, top + 11.5, {
      size: 16,
      style: "bold",
      color: pdfColors.brand,
      align: "right",
    });
  }

  function save() {
    const pages = doc.getNumberOfPages();
    for (let page = 1; page <= pages; page += 1) {
      doc.setPage(page);
      doc
        .setDrawColor(pdfColors.line)
        .setLineWidth(0.3)
        .line(margin, pageHeight - 28, right, pageHeight - 28);
      write("Gracias por entrenar con Imperium Cross", pageWidth / 2, pageHeight - 20, {
        style: "bold",
        color: pdfColors.brand,
        align: "center",
      });
    }
    doc.setProperties({ title: `${title} ${number}`, author: "Imperium Cross" });
    doc.save(`${filePrefix}-${number}.pdf`);
  }

  // Encabezado
  doc.addImage(logo, "PNG", margin, 14, 30, 30);
  write(title, right, 28, { size: 20, style: "bold", align: "right" });
  write("Imperium Cross", right, 35, { color: pdfColors.muted, align: "right" });
  doc.setFillColor(pdfColors.brand).rect(margin, 48, contentWidth, 1, "F");

  // Número y fecha
  write(numberLabel, margin, 62, { size: 9, color: pdfColors.muted });
  write(`N° ${number}`, margin, 68, { size: 11, style: "bold" });
  write("Fecha de emisión", right, 62, { size: 9, color: pdfColors.muted, align: "right" });
  write(formatDate(date), right, 68, { size: 11, style: "bold", align: "right" });

  return { doc, margin, right, contentWidth, contentBottom, write, splitText, writeTotal, save };
}
