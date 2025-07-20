import { useState } from "react";
import { TamiyaModelData } from "@/types";

export function useTamiyaScraper() {
  const [isLoading, setIsLoading] = useState(false);

  const scrapeModelData = async (itemNumber: string): Promise<TamiyaModelData | null> => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/scrape-tamiya", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ itemNumber }),
      });

      if (!response.ok) {
        throw new Error("Failed to scrape model data");
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Failed to scrape Tamiya data:", error);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    scrapeModelData,
    isLoading,
  };
}
