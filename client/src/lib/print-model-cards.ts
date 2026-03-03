import jsPDF from "jspdf";
import { ModelWithRelations } from "@/types";

interface BrandLogo {
  id: number;
  keyword: string;
  displayName: string;
  url: string;
  isTamiyaStamp: boolean;
}

const STATIC_FALLBACKS: Record<string, string> = {
  tamiya: "/brand_logos/Tamiya.png",
  volkswagen: "/brand_logos/volkswagen.png",
  vw: "/brand_logos/volkswagen.png",
  bmw: "/brand_logos/BMW.png",
  audi: "/brand_logos/audi.png",
  lancia: "/brand_logos/Lancia.png",
  mazda: "/brand_logos/mazda.png",
  nissan: "/brand_logos/nissan.png",
  opel: "/brand_logos/opel.png",
  porsche: "/brand_logos/porsche.png",
};

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

function drawCropMarks(doc: jsPDF, x: number, y: number, w: number, h: number) {
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

function addImageProportional(
  doc: jsPDF,
  dataUrl: string | null,
  boxX: number,
  boxY: number,
  boxW: number,
  boxH: number,
  align: "left" | "right" = "left"
) {
  if (!dataUrl) return;
  try {
    const props = doc.getImageProperties(dataUrl);
    const imgAspect = props.width / props.height;
    const boxAspect = boxW / boxH;
    let drawW: number, drawH: number;
    if (imgAspect > boxAspect) {
      drawW = boxW;
      drawH = boxW / imgAspect;
    } else {
      drawH = boxH;
      drawW = boxH * imgAspect;
    }
    const drawX = align === "right" ? boxX + boxW - drawW : boxX;
    const drawY = boxY + (boxH - drawH) / 2;
    doc.addImage(dataUrl, "PNG", drawX, drawY, drawW, drawH);
  } catch {}
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

  let dbLogos: BrandLogo[] = [];
  try {
    const res = await fetch("/api/brand-logos");
    if (res.ok) dbLogos = await res.json();
  } catch {}

  const dbBrandMap: Record<string, string> = {};
  let stampUrl: string | null = null;

  for (const logo of dbLogos) {
    if (logo.isTamiyaStamp) {
      stampUrl = logo.url;
    } else {
      dbBrandMap[logo.keyword.toLowerCase()] = logo.url;
    }
  }

  if (!stampUrl) stampUrl = STATIC_FALLBACKS.tamiya;

  const brandLogoMap: Record<string, string> = { ...STATIC_FALLBACKS };
  for (const [kw, url] of Object.entries(dbBrandMap)) {
    brandLogoMap[kw] = url;
  }

  let stampData: string | null = null;
  try {
    stampData = await loadImageAsDataUrl(stampUrl);
  } catch {}

  function getBrandSearchText(model: ModelWithRelations): string {
    const parts = [model.bodyManufacturer, model.bodyName].filter(Boolean);
    return parts.length > 0 ? parts.join(" ") : model.name;
  }

  const brandCache: Record<string, string | null> = {};
  const uniqueUrls = new Map<string, string>();
  for (const model of models) {
    const lower = getBrandSearchText(model).toLowerCase();
    for (const [kw, url] of Object.entries(brandLogoMap)) {
      if (kw === "tamiya") continue;
      if (lower.includes(kw) && !uniqueUrls.has(url)) {
        uniqueUrls.set(url, kw);
      }
    }
  }
  for (const [url, kw] of uniqueUrls) {
    try {
      const data = await loadImageAsDataUrl(url);
      brandCache[kw] = data;
      for (const [k, u] of Object.entries(brandLogoMap)) {
        if (u === url) brandCache[k] = data;
      }
    } catch {
      brandCache[kw] = null;
    }
  }

  function detectBrand(model: ModelWithRelations): string | null {
    const lower = getBrandSearchText(model).toLowerCase();
    for (const kw of Object.keys(brandLogoMap)) {
      if (kw === "tamiya") continue;
      if (lower.includes(kw) && brandCache[kw]) return kw;
    }
    return null;
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

    const logoBoxW = 39;
    const logoBoxH = 21;
    addImageProportional(doc, stampData, cx + 3, cy + 3, logoBoxW, logoBoxH, "left");

    const brand = detectBrand(model);
    if (brand) {
      addImageProportional(doc, brandCache[brand] ?? null, cx + cardW - logoBoxW - 3, cy + 3, logoBoxW, logoBoxH, "right");
    }

    const centerY = cy + cardH / 2;
    const nameLines = wrapText(model.name, 22);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(30, 30, 30);

    const nameLineH = 6;
    const chassisLineH = 5;
    const totalTextH = nameLines.length * nameLineH + (model.chassis ? chassisLineH : 0);
    let textY = centerY - totalTextH / 2 + nameLineH;

    for (const line of nameLines) {
      doc.text(line, cx + cardW / 2, textY, { align: "center" });
      textY += nameLineH;
    }

    if (model.chassis) {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8.5);
      doc.setTextColor(90, 90, 90);
      doc.text(model.chassis, cx + cardW / 2, textY, { align: "center" });
    }

    doc.setFont("courier", "normal");
    doc.setFontSize(6);
    doc.setTextColor(60, 60, 60);
    const bottomY = cy + cardH - 4;
    if (model.scale) doc.text(model.scale, cx + 3, bottomY);
    if (model.itemNumber) doc.text(model.itemNumber, cx + cardW - 3, bottomY, { align: "right" });

    col++;
    if (col >= cols) {
      col = 0;
      row++;
    }
  }

  doc.save("model-cards.pdf");
}
