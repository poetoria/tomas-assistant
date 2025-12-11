export type TranslationMode = 'text' | 'screenshot';

export type TranslationTone = 'functional' | 'marketing';

export interface Language {
  code: string;
  name: string;
  flag: string;
}

export interface TranslationSettings {
  mode: TranslationMode;
  sourceLanguage: string;
  targetLanguage: string;
  tone: TranslationTone;
  sourceText: string;
  screenshotData?: string;
  requirements?: string;
}

export interface TranslationResult {
  id: string;
  timestamp: number;
  settings: TranslationSettings;
  segments: TranslationSegment[];
}

export interface TranslationSegment {
  id: string;
  sourceText: string;
  translatedText: string;
  rationale: string;
  type: 'paragraph' | 'heading' | 'button' | 'list-item';
}

export interface StoredPreferences {
  lastTargetLanguage: string;
  lastTone: TranslationTone;
  recentLanguages: string[];
  rememberChoices: boolean;
}

// Glossary types
export interface GlossaryEntry {
  id: string;
  sourceTerm: string;
  targetTerm: string;
  notes?: string;
}

// Style Guide Settings
export interface StyleGuideSettings {
  globalInstructions: string;
  brandName: string;
  industry: string;
  extractedStyleGuideText: string;
  glossary: GlossaryEntry[];
}

// Style Check types
export interface StyleCheckMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

export interface StyleCheckConversation {
  id: string;
  title: string;
  messages: StyleCheckMessage[];
  createdAt: number;
  updatedAt: number;
}

export type ComplianceSeverity = 'low' | 'medium' | 'high';

export interface ComplianceIssue {
  id: string;
  originalText: string;
  issue: string;
  severity: ComplianceSeverity;
  suggestion: string;
  accepted?: boolean;
}

export interface ComplianceResult {
  issues: ComplianceIssue[];
  rewrittenContent: string;
  summary: string;
}

export const SUPPORTED_LANGUAGES: Language[] = [
  { code: 'en', name: 'English', flag: '🇬🇧' },
  { code: 'fr', name: 'French', flag: '🇫🇷' },
  { code: 'de', name: 'German', flag: '🇩🇪' },
  { code: 'es', name: 'Spanish', flag: '🇪🇸' },
  { code: 'it', name: 'Italian', flag: '🇮🇹' },
  { code: 'pt', name: 'Portuguese', flag: '🇵🇹' },
  { code: 'nl', name: 'Dutch', flag: '🇳🇱' },
  { code: 'pl', name: 'Polish', flag: '🇵🇱' },
  { code: 'ru', name: 'Russian', flag: '🇷🇺' },
  { code: 'ja', name: 'Japanese', flag: '🇯🇵' },
  { code: 'zh', name: 'Chinese', flag: '🇨🇳' },
  { code: 'ko', name: 'Korean', flag: '🇰🇷' },
  { code: 'ar', name: 'Arabic', flag: '🇸🇦' },
  { code: 'hi', name: 'Hindi', flag: '🇮🇳' },
  { code: 'tr', name: 'Turkish', flag: '🇹🇷' },
  { code: 'sv', name: 'Swedish', flag: '🇸🇪' },
  { code: 'da', name: 'Danish', flag: '🇩🇰' },
  { code: 'no', name: 'Norwegian', flag: '🇳🇴' },
  { code: 'fi', name: 'Finnish', flag: '🇫🇮' },
  { code: 'el', name: 'Greek', flag: '🇬🇷' },
];
