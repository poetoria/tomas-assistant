// Style Guide URL types
export type SyncFrequency = 'manual' | '5min' | '15min' | 'hourly' | 'daily';

export interface StyleGuideUrl {
  id: string;
  url: string;
  label?: string;
  lastSyncedAt?: number;
  status: 'pending' | 'synced' | 'error';
  error?: string;
  syncFrequency?: SyncFrequency;
}

// Glossary types
export interface GlossaryEntry {
  id: string;
  sourceTerm: string;
  targetTerm: string;
  notes?: string;
}

// Style Guide Document
export interface StyleGuideDocument {
  id: string;
  fileName: string;
  extractedText: string;
  uploadedAt: number;
  fileSize?: number;
}

// Training / fine-tuning configuration
export interface TrainingConfig {
  targetAudience: string;
  readingLevel: 'simple' | 'standard' | 'advanced';
  spellingConvention: 'british' | 'american' | 'australian';
  contentTypeFocus: string[];
  bannedWords: string;
  preferredAlternatives: string;
}

export const DEFAULT_TRAINING_CONFIG: TrainingConfig = {
  targetAudience: '',
  readingLevel: 'standard',
  spellingConvention: 'british',
  contentTypeFocus: [],
  bannedWords: '',
  preferredAlternatives: '',
};

// Brand governance types
export interface BrandGovernanceSettings {
  documents: StyleGuideDocument[];
  urls: StyleGuideUrl[];
}

export const DEFAULT_BRAND_GOVERNANCE: BrandGovernanceSettings = {
  documents: [],
  urls: [],
};

// Style Guide Settings
export interface StyleGuideSettings {
  globalInstructions: string;
  brandName: string;
  industry: string;
  /** @deprecated Use styleGuideDocuments instead */
  extractedStyleGuideText: string;
  styleGuideDocuments: StyleGuideDocument[];
  glossary: GlossaryEntry[];
  trainingConfig: TrainingConfig;
  styleGuideUrls?: StyleGuideUrl[];
  brandGovernance?: BrandGovernanceSettings;
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
