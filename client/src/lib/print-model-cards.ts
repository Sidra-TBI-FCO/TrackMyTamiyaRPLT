import jsPDF from "jspdf";
import { ModelWithRelations } from "@/types";

import tamiyaLogo from "@/assets/brand_logos/Tamiya.png";
import vwLogo from "@/assets/brand_logos/VW.png";
import bmwLogo from "@/assets/brand_logos/BMW.png";
import audiLogo from "@/assets/brand_logos/audi.png";
import lanciaLogo from "@/assets/brand_logos/Lancia.png";

const BRAND_LOGO_MAP: Record<string, string> = {
  vw: vwLogo,
  bmw: bmwLogo,
  audi: audiLogo,
  lancia: lanciaLogo,
};

function detectBrand(modelName: string): string | null {
  const lower = modelName.toLowerCase();
  for (const keyword of Object.keys(BRAND_LOGO_MAP)) {
    if (lower.includes(keyword)) return keyword;
  }
  return null;
}

function loadImageAsDataUrl(src: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext("2d");
      if (!ctx) return reject(new Error("Canvas context unavailable"));
      ctx.drawImage(img, 0, 0);
      resolve(canvas.toDataURL("image/png"));
    };
    img.onerror = () => reject(new Error(`Failed to load image: ${src}`));
    img.src = src;
  });
}

function drawCropMarks(
  doc: jsPDF,
  x: number,
  y: number,
  w: number,
  h: number
) {
  const markLen = 3;
  const offset = 1;
  doc.setDrawColor(180, 180, 180);
  doc.setLineWidth(0.2);

  const corners = [
    { cx: x, cy: y, dx: -1, dy: -1 },
    { cx: x + w, cy: y, dx: 1, dy: -1 },
    { cx: x, cy: y + h, dx: -1, dy: 1 },
    { cx: x + w, cy: y + h, dx: 1, dy: 1 },
  ];

  for (const { cx, cy, dx, dy } of corners) {
    doc.line(cx + dx * offset, cy, cx + dx * (offset + markLen), cy);
    doc.line(cx, cy + dy * offset, cx, cy + dy * (offset + markLen));
  }
}

function addImageSafe(
  doc: jsPDF,
  dataUrl: string | null,
  x: number,
  y: number,
  w: number,
  h: number
) {
  if (!dataUrl) return;
  try {
    doc.addImage(dataUrl, "PNG", x, y, w, h);
  } catch {
  }
}

function wrapText(text: string, maxChars: number): string[] {
  const words = text.split(" ");
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    if ((current + " " + word).trim().length <= maxChars) {
      current = (current + " " + word).trim();
    } else {
      if (current) lines.push(current);
      current = word;
    }
  }
  if (current) lines.push(current);
  return lines;
}

export async function printModelCards(models: ModelWithRelations[]) {
  if (!models || models.length === 0) {
    alert("No models to print.");
    return;
  }

  let tamiyaData: string | null = null;
  const brandCache: Record<string, string | null> = {};

  try {
    tamiyaData = await loadImageAsDataUrl(tamiyaLogo);
  } catch {
    tamiyaData = null;
  }

  for (const [key, url] of Object.entries(BRAND_LOGO_MAP)) {
    try {
      brandCache[key] = await loadImageAsDataUrl(url);
    } catch {
      brandCache[key] = null;
    }
  }

  const doc = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait" });

  const cardW = 90;
  const cardH = 60;
  const marginX = 10;
  const marginY = 10;
  const colGap = 10;
  const rowGap = 5;
  const cols = 2;

  const col0X = marginX;
  const col1X = marginX + cardW + colGap;

  let row = 0;
  let col = 0;
  let firstCard = true;

  for (const model of models) {
    const cardX = col === 0 ? col0X : col1X;
    const cardY = marginY + row * (cardH + rowGap);

    if (!firstCard && cardY + cardH > 287) {
      doc.addPage();
      row = 0;
      col = 0;
    }
    firstCard = false;

    const cx = col === 0 ? col0X : col1X;
    const cy = marginY + row * (cardH + rowGap);

    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(220, 220, 220);
    doc.setLineWidth(0.3);
    doc.rect(cx, cy, cardW, cardH, "FD");

    drawCropMarks(doc, cx, cy, cardW, cardH);

    const tamiyaW = 22;
    const tamiyaH = 9;
    addImageSafe(doc, tamiyaData, cx + 3, cy + 3, tamiyaW, tamiyaH);

    const brand = detectBrand(model.name);
    if (brand && brandCache[brand]) {
      const brandW = 22;
      const brandH = 9;
      addImageSafe(
        doc,
        brandCache[brand],
        cx + cardW - brandW - 3,
        cy + 3,
        brandW,
        brandH
      );
    }

    const centerY = cy + cardH / 2;

    const nameLines = wrapText(model.name, 28);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(30, 30, 30);

    const lineHeight = 4.5;
    const totalTextH =
      nameLines.length * lineHeight + (model.chassis ? lineHeight : 0);
    let textY = centerY - totalTextH / 2 + lineHeight;

    for (const line of nameLines) {
      doc.text(line, cx + cardW / 2, textY, { align: "center" });
      textY += lineHeight;
    }

    if (model.chassis) {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(6.5);
      doc.setTextColor(90, 90, 90);
      doc.text(model.chassis, cx + cardW / 2, textY, { align: "center" });
    }

    doc.setFont("courier", "normal");
    doc.setFontSize(6);
    doc.setTextColor(60, 60, 60);

    const bottomY = cy + cardH - 4;

    if (model.scale) {
      doc.text(model.scale, cx + 3, bottomY);
    }
    if (model.itemNumber) {
      doc.text(model.itemNumber, cx + cardW - 3, bottomY, { align: "right" });
    }

    col++;
    if (col >= cols) {
      col = 0;
      row++;
    }
  }

  doc.save("model-cards.pdf");
}
