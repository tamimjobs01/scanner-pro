export interface ScannedPage {
  id: string;
  originalUrl: string; // base64 payload
  enhancedUrl: string; // processed base64 payload
  rotation: number; // 0, 90, 180, 270
  brightness: number; // 0 to 100 (default 50)
  contrast: number; // 0 to 100 (default 50)
  saturation: number; // 0 to 100 (default 50)
  sharpness: number; // 0 to 100 (default 0)
  bwEnabled: boolean;
  bwThreshold: number; // 0 to 255 (default 128)
  filter: 'none' | 'sepia' | 'grayscale' | 'invert' | 'blur';
  cropRect: { x: number; y: number; w: number; h: number } | null;
}

export interface ScannedDoc {
  id: string;
  name: string;
  pages: ScannedPage[];
  createdAt: string;
  thumbnail: string;
}

export interface ConversionHistoryItem {
  id: string;
  filename: string;
  type: 'Image -> PDF' | 'PDF -> Images' | 'Image Format' | 'PDF Merger' | 'OCR';
  date: string;
  size: string;
  url?: string;
  extractedText?: string;
}

export type ThemeType = 'light' | 'dark' | 'auto';
export type LanguageType = 'en' | 'bn';

export interface UserPreferences {
  theme: ThemeType;
  language: LanguageType;
  qualityDefault: 'high' | 'medium' | 'low';
  pdfPageSize: 'A4' | 'Letter' | 'Legal';
  pdfOrientation: 'portrait' | 'landscape' | 'auto';
  cameraPref: string;
}
