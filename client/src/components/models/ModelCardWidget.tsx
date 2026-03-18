import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Printer } from "lucide-react";
import { ModelWithRelations } from "@/types";
import { printSingleModelCard } from "@/lib/print-model-cards";

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

const DEFAULT_PREFS = {
  showRcBrand: true,
  showCarMake: true,
  showChassis: true,
  showScale: true,
  showItemNumber: true,
  showReleaseYear: false,
};

interface BrandLogo {
  id: number;
  keyword: string;
  displayName: string;
  url: string;
  isTamiyaStamp: boolean;
}

interface Props {
  model: ModelWithRelations;
}

export default function ModelCardWidget({ model }: Props) {
  const [isPrinting, setIsPrinting] = useState(false);

  const { data: rawPrefs } = useQuery<Record<string, boolean>>({
    queryKey: ["/api/user/card-print-prefs"],
  });

  const { data: dbLogos = [] } = useQuery<BrandLogo[]>({
    queryKey: ["/api/brand-logos"],
  });

  if (!model.name) return null;

  const prefs = { ...DEFAULT_PREFS, ...(rawPrefs || {}) };

  // Build brand logo map: static fallbacks overridden by DB logos
  const brandLogoMap: Record<string, string> = { ...STATIC_FALLBACKS };
  let stampUrl: string = STATIC_FALLBACKS.tamiya;
  for (const logo of dbLogos) {
    if (logo.isTamiyaStamp) {
      stampUrl = logo.url;
    } else {
      brandLogoMap[logo.keyword.toLowerCase()] = logo.url;
    }
  }

  // Detect which car-make logo matches this model
  const searchText = [model.bodyManufacturer, model.bodyName]
    .filter(Boolean)
    .join(" ") || model.name;
  const lower = searchText.toLowerCase();
  let carMakeLogoUrl: string | null = null;
  for (const [kw, url] of Object.entries(brandLogoMap)) {
    if (kw === "tamiya") continue;
    if (lower.includes(kw)) {
      carMakeLogoUrl = url;
      break;
    }
  }

  const displayName =
    model.buildType === "custom" && model.bodyName ? model.bodyName : model.name;

  const handlePrint = async () => {
    setIsPrinting(true);
    try {
      await printSingleModelCard(model);
    } finally {
      setIsPrinting(false);
    }
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="font-mono text-sm flex items-center gap-2">
          <Printer className="h-4 w-4" />
          Card Preview
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col items-center gap-3 pb-4">
        {/* Card preview — 270×180 px = 90×60 mm at 3 px/mm */}
        <div
          className="relative bg-white rounded overflow-hidden flex-shrink-0"
          style={{
            width: 270,
            height: 180,
            border: "1px solid #ddd",
            boxShadow: "0 1px 4px rgba(0,0,0,0.10)",
          }}
        >
          {/* Crop mark corners */}
          <div className="absolute top-0 left-0 w-3 h-3 border-t border-l border-gray-300" />
          <div className="absolute top-0 right-0 w-3 h-3 border-t border-r border-gray-300" />
          <div className="absolute bottom-0 left-0 w-3 h-3 border-b border-l border-gray-300" />
          <div className="absolute bottom-0 right-0 w-3 h-3 border-b border-r border-gray-300" />

          {/* RC Brand stamp — top-left */}
          {prefs.showRcBrand && (
            <img
              src={stampUrl}
              alt="RC Brand"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = "none";
              }}
              style={{
                position: "absolute",
                top: 9,
                left: 9,
                width: 117,
                height: 63,
                objectFit: "contain",
                objectPosition: "left center",
              }}
            />
          )}

          {/* Car make logo — top-right */}
          {prefs.showCarMake && carMakeLogoUrl && (
            <img
              src={carMakeLogoUrl}
              alt="Car Make"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = "none";
              }}
              style={{
                position: "absolute",
                top: 9,
                right: 9,
                width: 117,
                height: 63,
                objectFit: "contain",
                objectPosition: "right center",
              }}
            />
          )}

          {/* Model name + chassis — vertically centered */}
          <div
            style={{
              position: "absolute",
              top: "50%",
              transform: "translateY(-50%)",
              left: 12,
              right: 12,
              textAlign: "center",
            }}
          >
            <p
              style={{
                fontFamily: "Helvetica, Arial, sans-serif",
                fontWeight: "bold",
                fontSize: 13,
                color: "#1e1e1e",
                margin: 0,
                lineHeight: 1.35,
                wordBreak: "break-word",
              }}
            >
              {displayName}
            </p>
            {prefs.showChassis && model.chassis && (
              <p
                style={{
                  fontFamily: "Helvetica, Arial, sans-serif",
                  fontSize: 10,
                  color: "#5a5a5a",
                  margin: "3px 0 0 0",
                }}
              >
                {model.chassis}
              </p>
            )}
          </div>

          {/* Bottom row — scale / release year / item number */}
          <div
            style={{
              position: "absolute",
              bottom: 8,
              left: 9,
              right: 9,
              display: "flex",
              justifyContent: "space-between",
            }}
          >
            <span
              style={{
                fontFamily: "Courier New, monospace",
                fontSize: 8,
                color: "#3c3c3c",
              }}
            >
              {prefs.showScale && model.scale ? model.scale : ""}
            </span>
            <span
              style={{
                fontFamily: "Courier New, monospace",
                fontSize: 8,
                color: "#3c3c3c",
              }}
            >
              {prefs.showReleaseYear && model.releaseYear
                ? String(model.releaseYear)
                : ""}
            </span>
            <span
              style={{
                fontFamily: "Courier New, monospace",
                fontSize: 8,
                color: "#3c3c3c",
              }}
            >
              {prefs.showItemNumber && model.itemNumber ? model.itemNumber : ""}
            </span>
          </div>
        </div>

        <p className="text-xs font-mono text-gray-400">90 × 60 mm card</p>

        <Button
          onClick={handlePrint}
          disabled={isPrinting}
          size="sm"
          className="w-full font-mono text-white"
          style={{ backgroundColor: "var(--theme-primary)" }}
        >
          <Printer className="h-4 w-4 mr-2" />
          {isPrinting ? "Generating PDF..." : "Print Card"}
        </Button>
      </CardContent>
    </Card>
  );
}
