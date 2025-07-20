interface TamiyaModelData {
  name: string;
  chassis?: string;
  releaseYear?: number;
  boxArt?: string;
  manualUrl?: string;
  scale?: string;
  type?: string;
  description?: string;
}

interface ScrapingResult {
  success: boolean;
  data?: TamiyaModelData;
  error?: string;
  source?: string;
}

/**
 * Scrape Tamiya model data from official sources
 * This implementation focuses on the official Tamiya website and TamiyaBase
 */
export class TamiyaScraper {
  private static readonly TAMIYA_BASE_URL = 'https://www.tamiyabase.com';
  private static readonly TAMIYA_OFFICIAL_URL = 'https://www.tamiya.com';
  private static readonly TIMEOUT = 10000; // 10 seconds

  /**
   * Main scraping method that tries multiple sources
   */
  static async scrapeModelData(itemNumber: string): Promise<ScrapingResult> {
    if (!itemNumber || !/^\d{5}$/.test(itemNumber)) {
      return {
        success: false,
        error: 'Invalid item number format. Expected 5-digit number.'
      };
    }

    // Try TamiyaBase first (community database)
    try {
      const tamiyaBaseResult = await this.scrapeFromTamiyaBase(itemNumber);
      if (tamiyaBaseResult.success) {
        return tamiyaBaseResult;
      }
    } catch (error) {
      console.warn('TamiyaBase scraping failed:', error);
    }

    // Fallback to official Tamiya site
    try {
      const tamiyaOfficialResult = await this.scrapeFromTamiyaOfficial(itemNumber);
      if (tamiyaOfficialResult.success) {
        return tamiyaOfficialResult;
      }
    } catch (error) {
      console.warn('Official Tamiya scraping failed:', error);
    }

    // If all sources fail, return a structured error
    return {
      success: false,
      error: `No data found for item number ${itemNumber}. Please verify the item number and try again.`
    };
  }

  /**
   * Scrape from TamiyaBase community database
   */
  private static async scrapeFromTamiyaBase(itemNumber: string): Promise<ScrapingResult> {
    const url = `${this.TAMIYA_BASE_URL}/database/item/${itemNumber}`;
    
    try {
      // Since we can't directly scrape due to CORS, we'll use the backend API
      const response = await fetch('/api/scrape-tamiya', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          itemNumber,
          source: 'tamiyabase',
          url
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      
      return {
        success: true,
        data: this.normalizeData(data),
        source: 'TamiyaBase'
      };
    } catch (error) {
      return {
        success: false,
        error: `TamiyaBase lookup failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Scrape from official Tamiya website
   */
  private static async scrapeFromTamiyaOfficial(itemNumber: string): Promise<ScrapingResult> {
    try {
      // Use backend API for official Tamiya scraping
      const response = await fetch('/api/scrape-tamiya', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          itemNumber,
          source: 'official'
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      
      return {
        success: true,
        data: this.normalizeData(data),
        source: 'Tamiya Official'
      };
    } catch (error) {
      return {
        success: false,
        error: `Official Tamiya lookup failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Normalize scraped data to consistent format
   */
  private static normalizeData(rawData: any): TamiyaModelData {
    return {
      name: this.cleanString(rawData.name || rawData.title || ''),
      chassis: this.cleanString(rawData.chassis || rawData.chassisType || ''),
      releaseYear: this.parseYear(rawData.releaseYear || rawData.year || rawData.date),
      boxArt: this.cleanUrl(rawData.boxArt || rawData.image || rawData.photo),
      manualUrl: this.cleanUrl(rawData.manualUrl || rawData.manual || rawData.instructions),
      scale: this.cleanString(rawData.scale || ''),
      type: this.cleanString(rawData.type || rawData.category || ''),
      description: this.cleanString(rawData.description || rawData.details || '')
    };
  }

  /**
   * Clean and validate string data
   */
  private static cleanString(str: any): string | undefined {
    if (typeof str !== 'string' || !str.trim()) {
      return undefined;
    }
    return str.trim().replace(/\s+/g, ' ');
  }

  /**
   * Clean and validate URL data
   */
  private static cleanUrl(url: any): string | undefined {
    if (typeof url !== 'string' || !url.trim()) {
      return undefined;
    }

    const cleanUrl = url.trim();
    
    // Basic URL validation
    try {
      new URL(cleanUrl.startsWith('http') ? cleanUrl : `https:${cleanUrl}`);
      return cleanUrl;
    } catch {
      return undefined;
    }
  }

  /**
   * Parse year from various formats
   */
  private static parseYear(yearData: any): number | undefined {
    if (typeof yearData === 'number' && yearData > 1900 && yearData < 2100) {
      return yearData;
    }

    if (typeof yearData === 'string') {
      const match = yearData.match(/(\d{4})/);
      if (match) {
        const year = parseInt(match[1]);
        if (year > 1900 && year < 2100) {
          return year;
        }
      }
    }

    return undefined;
  }

  /**
   * Get chassis information based on item number patterns
   */
  static inferChassisFromItemNumber(itemNumber: string): string | undefined {
    const patterns: Record<string, string> = {
      // TT-02 series
      '^586[0-9][0-9]$': 'TT-02',
      '^587[0-9][0-9]$': 'TT-02',
      
      // TT-01 series
      '^585[0-9][0-9]$': 'TT-01',
      
      // XV-01 series
      '^584[0-9][0-9]$': 'XV-01',
      
      // M-08 series
      '^580[0-9][0-9]$': 'M-08',
      
      // TB-05 series
      '^583[0-9][0-9]$': 'TB-05',
      
      // TA-08 series
      '^582[0-9][0-9]$': 'TA-08',
    };

    for (const [pattern, chassis] of Object.entries(patterns)) {
      if (new RegExp(pattern).test(itemNumber)) {
        return chassis;
      }
    }

    return undefined;
  }

  /**
   * Validate item number format
   */
  static validateItemNumber(itemNumber: string): boolean {
    return /^\d{5}$/.test(itemNumber);
  }
}

/**
 * Convenience function for simple scraping
 */
export async function scrapeModelData(itemNumber: string): Promise<TamiyaModelData | null> {
  const result = await TamiyaScraper.scrapeModelData(itemNumber);
  return result.success ? result.data || null : null;
}

/**
 * Enhanced scraping with detailed result information
 */
export async function scrapeModelDataDetailed(itemNumber: string): Promise<ScrapingResult> {
  return TamiyaScraper.scrapeModelData(itemNumber);
}
