import { useState, useRef, useCallback, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Camera, Upload, ScanLine, RotateCcw, Check, Loader2, Scan } from "lucide-react";

interface Point { x: number; y: number; }

interface DocumentScannerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onResult: (file: File) => void;
}

// ─── Perspective math ────────────────────────────────────────────────────────

function gaussianElimination(A: number[][], b: number[]): number[] {
  const n = 8;
  const M = A.map((row, i) => [...row, b[i]]);
  for (let col = 0; col < n; col++) {
    let maxRow = col;
    for (let row = col + 1; row < n; row++) {
      if (Math.abs(M[row][col]) > Math.abs(M[maxRow][col])) maxRow = row;
    }
    [M[col], M[maxRow]] = [M[maxRow], M[col]];
    if (Math.abs(M[col][col]) < 1e-10) continue;
    for (let row = 0; row < n; row++) {
      if (row === col) continue;
      const f = M[row][col] / M[col][col];
      for (let k = col; k <= n; k++) M[row][k] -= f * M[col][k];
    }
  }
  return M.map((row, i) => row[n] / row[i]);
}

function computeHomography(src: Point[], dst: Point[]): number[] {
  const A: number[][] = [];
  const b: number[] = [];
  for (let i = 0; i < 4; i++) {
    const { x: dx, y: dy } = dst[i];
    const { x: sx, y: sy } = src[i];
    A.push([dx, dy, 1, 0, 0, 0, -dx * sx, -dy * sx]);
    b.push(sx);
    A.push([0, 0, 0, dx, dy, 1, -dx * sy, -dy * sy]);
    b.push(sy);
  }
  return gaussianElimination(A, b);
}

function dist(a: Point, b: Point) {
  return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
}

function warpPerspective(
  src: HTMLCanvasElement,
  corners: Point[], // [TL, TR, BR, BL]
  outW: number,
  outH: number
): HTMLCanvasElement {
  const out = document.createElement("canvas");
  out.width = outW;
  out.height = outH;
  const outCtx = out.getContext("2d")!;
  const srcCtx = src.getContext("2d")!;
  const srcImg = srcCtx.getImageData(0, 0, src.width, src.height);
  const outImg = outCtx.createImageData(outW, outH);
  const sd = srcImg.data;
  const od = outImg.data;
  const W = src.width;
  const H = src.height;

  const dstCorners: Point[] = [
    { x: 0, y: 0 },
    { x: outW - 1, y: 0 },
    { x: outW - 1, y: outH - 1 },
    { x: 0, y: outH - 1 },
  ];
  const h = computeHomography(corners, dstCorners);
  const [h0, h1, h2, h3, h4, h5, h6, h7] = h;

  for (let oy = 0; oy < outH; oy++) {
    for (let ox = 0; ox < outW; ox++) {
      const w = h6 * ox + h7 * oy + 1;
      const sx = (h0 * ox + h1 * oy + h2) / w;
      const sy = (h3 * ox + h4 * oy + h5) / w;

      const x0 = Math.floor(sx);
      const y0 = Math.floor(sy);
      const x1 = x0 + 1;
      const y1 = y0 + 1;
      const fx = sx - x0;
      const fy = sy - y0;
      const outIdx = (oy * outW + ox) * 4;

      if (x0 < 0 || y0 < 0 || x1 >= W || y1 >= H) {
        od[outIdx] = od[outIdx + 1] = od[outIdx + 2] = 255;
        od[outIdx + 3] = 255;
        continue;
      }

      const i00 = (y0 * W + x0) * 4;
      const i10 = (y0 * W + x1) * 4;
      const i01 = (y1 * W + x0) * 4;
      const i11 = (y1 * W + x1) * 4;

      for (let c = 0; c < 3; c++) {
        od[outIdx + c] = Math.round(
          sd[i00 + c] * (1 - fx) * (1 - fy) +
          sd[i10 + c] * fx * (1 - fy) +
          sd[i01 + c] * (1 - fx) * fy +
          sd[i11 + c] * fx * fy
        );
      }
      od[outIdx + 3] = 255;
    }
  }
  outCtx.putImageData(outImg, 0, 0);
  return out;
}

// ─── Automatic document-corner detection ─────────────────────────────────────
// Works by downsampling, running Sobel edge detection, then finding the four
// "extreme" edge pixels that correspond to each corner of the document quadrilateral.

function detectDocumentCorners(canvas: HTMLCanvasElement): Point[] | null {
  const THUMB_LONG = 300;
  const scale = THUMB_LONG / Math.max(canvas.width, canvas.height);
  const tw = Math.round(canvas.width * scale);
  const th = Math.round(canvas.height * scale);

  const thumb = document.createElement("canvas");
  thumb.width = tw;
  thumb.height = th;
  const tctx = thumb.getContext("2d")!;
  tctx.drawImage(canvas, 0, 0, tw, th);
  const imgData = tctx.getImageData(0, 0, tw, th);
  const d = imgData.data;

  // Grayscale
  const gray = new Float32Array(tw * th);
  for (let i = 0; i < tw * th; i++) {
    gray[i] = d[i * 4] * 0.299 + d[i * 4 + 1] * 0.587 + d[i * 4 + 2] * 0.114;
  }

  // Sobel edge magnitude
  const edgeMag = new Float32Array(tw * th);
  let maxMag = 0;
  for (let y = 1; y < th - 1; y++) {
    for (let x = 1; x < tw - 1; x++) {
      const gx =
        -gray[(y - 1) * tw + (x - 1)] + gray[(y - 1) * tw + (x + 1)] +
        -2 * gray[y * tw + (x - 1)] + 2 * gray[y * tw + (x + 1)] +
        -gray[(y + 1) * tw + (x - 1)] + gray[(y + 1) * tw + (x + 1)];
      const gy =
        -gray[(y - 1) * tw + (x - 1)] - 2 * gray[(y - 1) * tw + x] - gray[(y - 1) * tw + (x + 1)] +
        gray[(y + 1) * tw + (x - 1)] + 2 * gray[(y + 1) * tw + x] + gray[(y + 1) * tw + (x + 1)];
      const mag = Math.sqrt(gx * gx + gy * gy);
      edgeMag[y * tw + x] = mag;
      if (mag > maxMag) maxMag = mag;
    }
  }

  // Dynamic threshold: 15% of max magnitude, minimum 15
  const threshold = Math.max(15, maxMag * 0.15);

  // Count qualifying edge pixels
  let edgeCount = 0;
  for (let i = 0; i < tw * th; i++) if (edgeMag[i] >= threshold) edgeCount++;

  // Need at least 0.5% of pixels to be edge pixels for a reliable detection
  if (edgeCount < tw * th * 0.005) return null;

  // Find 4 corner representatives among edge pixels:
  // TL = min(x + y), TR = min(-x + y), BR = max(x + y), BL = max(-x + y)
  let bestTL = Infinity, bestTR = Infinity, bestBR = -Infinity, bestBL = -Infinity;
  let ptTL = { x: tw * 0.1, y: th * 0.1 };
  let ptTR = { x: tw * 0.9, y: th * 0.1 };
  let ptBR = { x: tw * 0.9, y: th * 0.9 };
  let ptBL = { x: tw * 0.1, y: th * 0.9 };

  for (let y = 1; y < th - 1; y++) {
    for (let x = 1; x < tw - 1; x++) {
      if (edgeMag[y * tw + x] < threshold) continue;
      const s = x + y;       // TL score (lower = more TL)
      const d1 = -x + y;     // TR score (lower = more TR)
      const s2 = x - y;      // BL score (higher = more BL)
      const d2 = -(x + y);   // BR score (more negative = more BR, i.e. we want max x+y)

      if (s < bestTL) { bestTL = s; ptTL = { x, y }; }
      if (d1 < bestTR) { bestTR = d1; ptTR = { x, y }; }
      if (-d2 > bestBR) { bestBR = -d2; ptBR = { x, y }; }
      if (s2 > bestBL) { bestBL = s2; ptBL = { x, y }; }
    }
  }

  // Sanity check: detected quad should have reasonable area
  const detectedArea =
    0.5 * Math.abs(
      (ptTR.x - ptTL.x) * (ptBR.y - ptTL.y) -
      (ptBR.x - ptTL.x) * (ptTR.y - ptTL.y)
    );
  const imageArea = tw * th;
  if (detectedArea < imageArea * 0.05) return null; // quad too small, detection unreliable

  // Scale corners back to display canvas size
  const invScale = 1 / scale;
  return [ptTL, ptTR, ptBR, ptBL].map(p => ({
    x: p.x * invScale,
    y: p.y * invScale,
  }));
}

// ─── Component ───────────────────────────────────────────────────────────────

type Stage = "pick" | "adjust" | "processing" | "preview";

export default function DocumentScanner({ open, onOpenChange, onResult }: DocumentScannerProps) {
  const [stage, setStage] = useState<Stage>("pick");
  const [originalName, setOriginalName] = useState("scan.jpg");
  const [corners, setCorners] = useState<Point[]>([]);
  const [dragging, setDragging] = useState<number | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewFile, setPreviewFile] = useState<File | null>(null);
  const [autoDetected, setAutoDetected] = useState(false);

  const srcCanvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const srcOffscreenRef = useRef<HTMLCanvasElement | null>(null);

  const resetState = useCallback(() => {
    setStage("pick");
    setCorners([]);
    setDragging(null);
    setPreviewUrl(null);
    setPreviewFile(null);
    setAutoDetected(false);
    srcOffscreenRef.current = null;
  }, []);

  useEffect(() => {
    if (!open) resetState();
  }, [open, resetState]);

  const defaultCorners = (dw: number, dh: number): Point[] => {
    const inX = dw * 0.08;
    const inY = dh * 0.08;
    return [
      { x: inX, y: inY },
      { x: dw - inX, y: inY },
      { x: dw - inX, y: dh - inY },
      { x: inX, y: dh - inY },
    ];
  };

  const loadImage = useCallback((file: File) => {
    setOriginalName(file.name);
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      const maxDim = 1400;
      const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
      const iw = Math.round(img.width * scale);
      const ih = Math.round(img.height * scale);

      const offscreen = document.createElement("canvas");
      offscreen.width = iw;
      offscreen.height = ih;
      offscreen.getContext("2d")!.drawImage(img, 0, 0, iw, ih);
      srcOffscreenRef.current = offscreen;

      const canvas = srcCanvasRef.current;
      if (!canvas) return;
      const maxW = Math.min((containerRef.current?.clientWidth ?? 700), 700);
      const maxH = 460;
      const dispScale = Math.min(maxW / iw, maxH / ih, 1);
      const dw = Math.round(iw * dispScale);
      const dh = Math.round(ih * dispScale);
      canvas.width = dw;
      canvas.height = dh;
      canvas.getContext("2d")!.drawImage(offscreen, 0, 0, dw, dh);

      // Auto-detect corners on display canvas
      const detected = detectDocumentCorners(canvas);
      if (detected) {
        // Clamp detected corners to canvas bounds
        const clamped = detected.map(p => ({
          x: Math.max(0, Math.min(dw, p.x)),
          y: Math.max(0, Math.min(dh, p.y)),
        }));
        setCorners(clamped);
        setAutoDetected(true);
      } else {
        setCorners(defaultCorners(dw, dh));
        setAutoDetected(false);
      }
      setStage("adjust");
    };
    img.src = url;
  }, []);

  const resetCorners = useCallback(() => {
    const canvas = srcCanvasRef.current;
    if (!canvas) return;
    const detected = detectDocumentCorners(canvas);
    if (detected) {
      setCorners(detected.map(p => ({
        x: Math.max(0, Math.min(canvas.width, p.x)),
        y: Math.max(0, Math.min(canvas.height, p.y)),
      })));
      setAutoDetected(true);
    } else {
      setCorners(defaultCorners(canvas.width, canvas.height));
      setAutoDetected(false);
    }
  }, []);

  const applyWarp = useCallback(async () => {
    const srcCanvas = srcCanvasRef.current;
    const offscreen = srcOffscreenRef.current;
    if (!srcCanvas || !offscreen || corners.length !== 4) return;

    setStage("processing");

    const scaleX = offscreen.width / srcCanvas.width;
    const scaleY = offscreen.height / srcCanvas.height;
    const scaledCorners = corners.map(p => ({ x: p.x * scaleX, y: p.y * scaleY }));

    const [TL, TR, BR, BL] = scaledCorners;
    const outW = Math.round((dist(TL, TR) + dist(BL, BR)) / 2);
    const outH = Math.round((dist(TL, BL) + dist(TR, BR)) / 2);

    await new Promise(resolve => setTimeout(resolve, 10));
    const warped = warpPerspective(offscreen, scaledCorners, outW, outH);

    warped.toBlob((blob) => {
      if (!blob) return;
      const fname = originalName.replace(/\.[^.]+$/, "") + "_corrected.jpg";
      const file = new File([blob], fname, { type: "image/jpeg" });
      const url = URL.createObjectURL(blob);
      setPreviewUrl(url);
      setPreviewFile(file);
      setStage("preview");
    }, "image/jpeg", 0.92);
  }, [corners, originalName]);

  const handlePointerDown = useCallback((e: React.PointerEvent, idx: number) => {
    e.preventDefault();
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    setDragging(idx);
  }, []);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (dragging === null) return;
    const canvas = srcCanvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = Math.max(0, Math.min(canvas.width, e.clientX - rect.left));
    const y = Math.max(0, Math.min(canvas.height, e.clientY - rect.top));
    setCorners(prev => prev.map((p, i) => i === dragging ? { x, y } : p));
  }, [dragging]);

  const handlePointerUp = useCallback(() => setDragging(null), []);

  // Redraw canvas overlay whenever corners change
  const drawOverlay = useCallback(() => {
    const canvas = srcCanvasRef.current;
    if (!canvas || corners.length !== 4 || stage !== "adjust") return;
    const ctx = canvas.getContext("2d")!;
    const offscreen = srcOffscreenRef.current;
    if (offscreen) ctx.drawImage(offscreen, 0, 0, canvas.width, canvas.height);

    // Draw the quadrilateral
    ctx.strokeStyle = "#22c55e";
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 4]);
    ctx.beginPath();
    corners.forEach((p, i) => { if (i === 0) ctx.moveTo(p.x, p.y); else ctx.lineTo(p.x, p.y); });
    ctx.closePath();
    ctx.stroke();
    ctx.setLineDash([]);
  }, [corners, stage]);

  useEffect(() => { drawOverlay(); }, [drawOverlay]);

  const handleUse = () => {
    if (!previewFile) return;
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    onResult(previewFile);
    onOpenChange(false);
  };

  const HANDLE_SIZE = 24;
  const CORNER_LABELS = ["TL", "TR", "BR", "BL"];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl w-full p-0 gap-0">
        <DialogHeader className="px-5 pt-5 pb-3">
          <DialogTitle className="flex items-center gap-2">
            <ScanLine className="h-5 w-5 text-green-600" />
            Scan Document
          </DialogTitle>
        </DialogHeader>

        <div className="px-5 pb-5" ref={containerRef}>
          {stage === "pick" && (
            <div className="flex flex-col items-center gap-4 py-10">
              <p className="text-sm text-muted-foreground text-center">
                Take a photo of your document or choose an existing image.<br />
                Document edges will be detected automatically so you can fine-tune.
              </p>
              <div className="flex gap-3">
                <Button variant="outline" className="flex items-center gap-2" onClick={() => cameraInputRef.current?.click()}>
                  <Camera className="h-4 w-4" /> Take Photo
                </Button>
                <Button variant="outline" className="flex items-center gap-2" onClick={() => fileInputRef.current?.click()}>
                  <Upload className="h-4 w-4" /> Choose Image
                </Button>
              </div>
              <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" className="hidden"
                onChange={e => e.target.files?.[0] && loadImage(e.target.files[0])} />
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden"
                onChange={e => e.target.files?.[0] && loadImage(e.target.files[0])} />
            </div>
          )}

          {(stage === "adjust" || stage === "processing") && (
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <p className="text-sm text-muted-foreground flex-1">
                  {autoDetected
                    ? <><span className="text-green-600 font-medium">Document edges detected.</span> Drag the corner handles to refine, then click <strong>Correct &amp; Use</strong>.</>
                    : <>Drag the <span className="font-medium text-green-600">corner handles</span> to align with document edges, then click <strong>Correct &amp; Use</strong>.</>}
                </p>
                <Button size="sm" variant="ghost" className="text-xs shrink-0" onClick={resetCorners}>
                  <Scan className="h-3 w-3 mr-1" /> Re-detect
                </Button>
              </div>
              <div
                className="relative mx-auto select-none"
                style={{ touchAction: "none" }}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
              >
                <canvas ref={srcCanvasRef} className="block rounded border border-muted" />
                {corners.map((p, i) => (
                  <div
                    key={i}
                    onPointerDown={e => handlePointerDown(e, i)}
                    className="absolute rounded-full bg-green-500 border-2 border-white text-white text-[9px] font-bold flex items-center justify-center cursor-grab active:cursor-grabbing shadow-md"
                    style={{ width: HANDLE_SIZE, height: HANDLE_SIZE, left: p.x - HANDLE_SIZE / 2, top: p.y - HANDLE_SIZE / 2 }}
                  >
                    {CORNER_LABELS[i]}
                  </div>
                ))}
              </div>
              <div className="flex gap-2 justify-end">
                <Button variant="ghost" size="sm" onClick={resetState}>
                  <RotateCcw className="h-4 w-4 mr-1" /> Retake
                </Button>
                <Button className="bg-green-600 hover:bg-green-700 text-white" size="sm" onClick={applyWarp} disabled={stage === "processing"}>
                  {stage === "processing"
                    ? <><Loader2 className="h-4 w-4 mr-1 animate-spin" />Processing…</>
                    : <><Check className="h-4 w-4 mr-1" />Correct &amp; Use</>}
                </Button>
              </div>
            </div>
          )}

          {stage === "preview" && previewUrl && (
            <div className="flex flex-col gap-3">
              <p className="text-sm text-muted-foreground">
                Perspective-corrected result. Click <strong>Use This</strong> to upload.
              </p>
              <img src={previewUrl} alt="Corrected scan" className="max-h-80 object-contain mx-auto rounded border border-muted" />
              <div className="flex gap-2 justify-end">
                <Button variant="ghost" size="sm" onClick={resetState}>
                  <RotateCcw className="h-4 w-4 mr-1" /> Start Over
                </Button>
                <Button className="bg-green-600 hover:bg-green-700 text-white" size="sm" onClick={handleUse}>
                  <Check className="h-4 w-4 mr-1" /> Use This
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
