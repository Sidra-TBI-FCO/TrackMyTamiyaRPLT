import type { ModelWithRelations, Photo, BuildLogEntryWithPhotos, HopUpPart } from "@shared/schema";

export interface CollectionStats {
  totalModels: number;
  activeBuilds: number;
  totalInvestment: string;
  totalPhotos: number;
}

export interface TamiyaModelData {
  name: string;
  chassis?: string;
  releaseYear?: number;
  boxArt?: string;
  manualUrl?: string;
}

export interface VoiceRecording {
  blob: Blob;
  url: string;
  duration: number;
}

export interface PhotoFrameSettings {
  duration: number; // seconds per slide
  shuffle: boolean;
  showModelInfo: boolean;
  filterByFavorites: boolean;
}

export type { ModelWithRelations, Photo, BuildLogEntryWithPhotos, HopUpPart };
