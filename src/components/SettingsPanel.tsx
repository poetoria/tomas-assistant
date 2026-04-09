import { useState, useRef, useEffect, useCallback } from 'react';
import { ArrowLeft, Upload, Trash2, Plus, FileText, Eye, Search, Download, X, RefreshCw, FileJson, Save, RotateCcw, Link, Loader2, Clock, Shield, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { useGlobalSettings, useGlossary } from '@/hooks/useSettingsStorage';
import { parseDocument } from '@/services/documentService';
import type { GlossaryEntry, StyleGuideDocument, StyleGuideUrl, TrainingConfig, SyncFrequency, BrandGovernanceSettings } from '@/types/translation';
import { DEFAULT_TRAINING_CONFIG, DEFAULT_BRAND_GOVERNANCE } from '@/types/translation';
import { fetchStyleGuideFromUrl } from '@/services/styleGuideUrlService';

const MAX_DOCUMENTS = 5;

const SYNC_FREQUENCY_LABELS: Record<SyncFrequency, string> = {
  'manual': 'Manual only',
  '5min': 'Every 5 min',
  '15min': 'Every 15 min',
  'hourly': 'Hourly',
  'daily': 'Daily',
};

const SYNC_FREQUENCY_MS: Record<SyncFrequency, number | null> = {
  'manual': null,
  '5min': 5 * 60 * 1000,
  '15min': 15 * 60 * 1000,
  'hourly': 60 * 60 * 1000,
  'daily': 24 * 60 * 60 * 1000,
};

interface SettingsPanelProps {
  onBack: () => void;
}

// Reusable component for document list + upload
function DocumentManager({
  documents,
  maxDocs,
  isUploading,
  uploadingDocId,
  onUpload,
  onReplace,
  onRemove,
  onPreview,
  onDownload,
}: {
  documents: StyleGuideDocument[];
  maxDocs: number;
  isUploading: boolean;
  uploadingDocId: string | null;
  onUpload: (file: File) => void;
  onReplace: (file: File, docId: string) => void;
  onRemove: (docId: string) => void;
  onPreview: (docId: string) => void;
  onDownload: (doc: StyleGuideDocument) => void;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const replaceFileInputRef = useRef<HTMLInputElement>(null);
  const [replaceDocId, setReplaceDocId] = useState<string | null>(null);

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-GB', {
      day: 'numeric', month: 'short', year: 'numeric',
    });
  };

  return (
    <div className="space-y-2">
      {documents.map((doc) => {
        const isReplacing = uploadingDocId === doc.id;
        return (
          <div key={doc.id} className="flex items-center gap-3 p-3 rounded-lg border border-border bg-muted/30 group">
            {doc.fileName.toLowerCase().endsWith('.json') ? (
              <FileJson className="w-5 h-5 text-primary shrink-0" />
            ) : (
              <FileText className="w-5 h-5 text-primary shrink-0" />
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{doc.fileName}</p>
              <p className="text-xs text-muted-foreground">
                {doc.extractedText.length.toLocaleString()} chars
                {doc.fileSize ? ` · ${formatFileSize(doc.fileSize)}` : ''}
                {' · '}{formatDate(doc.uploadedAt)}
              </p>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <Button variant="ghost" size="icon" className="h-8 w-8" title="View" onClick={() => onPreview(doc.id)}>
                <Eye className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8" title="Download" onClick={() => onDownload(doc)}>
                <Download className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8" title="Replace" disabled={isUploading}
                onClick={() => { setReplaceDocId(doc.id); replaceFileInputRef.current?.click(); }}>
                <RefreshCw className={`w-4 h-4 ${isReplacing ? 'animate-spin' : ''}`} />
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8" title="Remove" disabled={isUploading}
                onClick={() => onRemove(doc.id)}>
                <Trash2 className="w-4 h-4 text-destructive" />
              </Button>
            </div>
          </div>
        );
      })}

      {documents.length < maxDocs && (
        <>
          <input type="file" ref={fileInputRef} onChange={(e) => { const f = e.target.files?.[0]; if (f) onUpload(f); e.target.value = ''; }} accept=".pdf,.doc,.docx,.json" className="hidden" />
          <Button variant="outline" onClick={() => fileInputRef.current?.click()} disabled={isUploading && !uploadingDocId} className="w-full border-dashed">
            {isUploading && !uploadingDocId ? (
              <><RefreshCw className="w-4 h-4 mr-2 animate-spin" />Processing...</>
            ) : (
              <><Plus className="w-4 h-4 mr-2" />Add Document ({documents.length}/{maxDocs})</>
            )}
          </Button>
        </>
      )}

      <input type="file" ref={replaceFileInputRef}
        onChange={(e) => { const f = e.target.files?.[0]; if (f && replaceDocId) onReplace(f, replaceDocId); e.target.value = ''; }}
        accept=".pdf,.doc,.docx,.json" className="hidden" />

      {documents.length === 0 && (
        <div className="text-center py-6 text-muted-foreground">
          <Upload className="w-8 h-8 mx-auto mb-3 opacity-50" />
          <p className="text-sm">No documents uploaded yet.</p>
          <p className="text-xs mt-1">Supported: PDF, Word (.docx), JSON</p>
        </div>
      )}
    </div>
  );
}

// Reusable component for live URL management
function LiveUrlManager({
  urls,
  syncingUrlId,
  onAdd,
  onSync,
  onRemove,
  onUpdateFrequency,
}: {
  urls: StyleGuideUrl[];
  syncingUrlId: string | null;
  onAdd: (url: string) => void;
  onSync: (entry: StyleGuideUrl) => void;
  onRemove: (id: string) => void;
  onUpdateFrequency: (id: string, freq: SyncFrequency) => void;
}) {
  const [newUrl, setNewUrl] = useState('');

  const formatTimestamp = (ts?: number) => {
    if (!ts) return 'Never';
    const d = new Date(ts);
    const now = Date.now();
    const diff = now - ts;
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
  };

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <Input placeholder="https://example.com/style-guide" value={newUrl}
          onChange={(e) => setNewUrl(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && newUrl.trim()) { onAdd(newUrl.trim()); setNewUrl(''); } }} />
        <Button onClick={() => { if (newUrl.trim()) { onAdd(newUrl.trim()); setNewUrl(''); } }} disabled={!newUrl.trim()}>
          <Plus className="w-4 h-4" />
        </Button>
      </div>

      {urls.map((entry) => {
        const isSyncing = syncingUrlId === entry.id;
        return (
          <div key={entry.id} className="p-3 rounded-lg border border-border bg-muted/30 space-y-2">
            <div className="flex items-center gap-3">
              <Link className="w-4 h-4 text-primary shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{entry.url}</p>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  {entry.status === 'synced' ? (
                    <><span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block" /> Synced {formatTimestamp(entry.lastSyncedAt)}</>
                  ) : entry.status === 'error' ? (
                    <><span className="w-1.5 h-1.5 rounded-full bg-destructive inline-block" /> {entry.error || 'Failed'}</>
                  ) : (
                    <><span className="w-1.5 h-1.5 rounded-full bg-yellow-500 inline-block" /> Not yet synced</>
                  )}
                </p>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <Button variant="ghost" size="icon" className="h-8 w-8" title="Sync now" disabled={isSyncing}
                  onClick={() => onSync(entry)}>
                  <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8" title="Remove"
                  onClick={() => onRemove(entry.id)}>
                  <Trash2 className="w-4 h-4 text-destructive" />
                </Button>
              </div>
            </div>
            <div className="flex items-center gap-2 pl-7">
              <Clock className="w-3 h-3 text-muted-foreground" />
              <Select value={entry.syncFrequency || 'manual'}
                onValueChange={(v) => onUpdateFrequency(entry.id, v as SyncFrequency)}>
                <SelectTrigger className="h-7 text-xs w-[140px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(SYNC_FREQUENCY_LABELS).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        );
      })}

      {urls.length === 0 && (
        <p className="text-center text-xs text-muted-foreground py-4">
          No live documents configured. Add a URL to get started.
        </p>
      )}
    </div>
  );
}

export function SettingsPanel({ onBack }: SettingsPanelProps) {
  const { settings, updateSettings, isSyncing, saveNow, restoreBackup } = useGlobalSettings();
  const { glossary, addEntry, updateEntry, removeEntry, bulkImport, clearGlossary } = useGlossary();
  const { toast } = useToast();
  
  const [isUploading, setIsUploading] = useState(false);
  const [uploadingDocId, setUploadingDocId] = useState<string | null>(null);
  const [previewDocId, setPreviewDocId] = useState<string | null>(null);
  const [glossarySearch, setGlossarySearch] = useState('');
  const [newTerm, setNewTerm] = useState({ sourceTerm: '', targetTerm: '', notes: '' });
  const [bulkInput, setBulkInput] = useState('');
  const [showBulkImport, setShowBulkImport] = useState(false);
  const [syncingUrlId, setSyncingUrlId] = useState<string | null>(null);
  // Brand tab
  const [brandIsUploading, setBrandIsUploading] = useState(false);
  const [brandUploadingDocId, setBrandUploadingDocId] = useState<string | null>(null);
  const [brandSyncingUrlId, setBrandSyncingUrlId] = useState<string | null>(null);

  const documents = settings.styleGuideDocuments || [];
  const styleGuideUrls: StyleGuideUrl[] = settings.styleGuideUrls || [];
  const brandGov: BrandGovernanceSettings = settings.brandGovernance || DEFAULT_BRAND_GOVERNANCE;

  // Auto-sync timer
  useEffect(() => {
    const allUrls = [...styleGuideUrls, ...brandGov.urls];
    const urlsToSync = allUrls.filter(u => {
      const freq = u.syncFrequency || 'manual';
      const interval = SYNC_FREQUENCY_MS[freq];
      if (!interval) return false;
      if (!u.lastSyncedAt) return true;
      return Date.now() - u.lastSyncedAt > interval;
    });

    if (urlsToSync.length === 0) return;

    // Sync each due URL
    urlsToSync.forEach(u => {
      const isStyleGuide = styleGuideUrls.some(sg => sg.id === u.id);
      if (isStyleGuide) {
        handleSyncStyleGuideUrl(u);
      } else {
        handleSyncBrandUrl(u);
      }
    });
    // Only run on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // --- Style guide file handlers ---
  const handleStyleGuideUpload = async (file: File, replaceDocId?: string) => {
    const validTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/msword', 'application/json'];
    const isJsonByExt = file.name.toLowerCase().endsWith('.json');
    if (!validTypes.includes(file.type) && !isJsonByExt) {
      toast({ title: 'Invalid file type', description: 'Please upload a PDF, Word document, or JSON file.', variant: 'destructive' });
      return;
    }
    if (!replaceDocId && documents.length >= MAX_DOCUMENTS) {
      toast({ title: 'Maximum documents reached', description: `You can upload up to ${MAX_DOCUMENTS} documents.`, variant: 'destructive' });
      return;
    }
    setIsUploading(true);
    if (replaceDocId) setUploadingDocId(replaceDocId);
    try {
      const extractedText = await parseDocument(file);
      const newDoc: StyleGuideDocument = {
        id: replaceDocId || `doc-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        fileName: file.name, extractedText, uploadedAt: Date.now(), fileSize: file.size,
      };
      const updatedDocs = replaceDocId ? documents.map(d => d.id === replaceDocId ? newDoc : d) : [...documents, newDoc];
      updateSettings({ styleGuideDocuments: updatedDocs });
      toast({ title: replaceDocId ? 'Document updated' : 'Document uploaded', description: `${file.name} processed successfully.` });
    } catch (error) {
      toast({ title: 'Upload failed', description: error instanceof Error ? error.message : 'Failed to process document', variant: 'destructive' });
    } finally {
      setIsUploading(false);
      setUploadingDocId(null);
    }
  };

  const handleDownloadDocument = (doc: StyleGuideDocument) => {
    const blob = new Blob([doc.extractedText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${doc.fileName.replace(/\.[^.]+$/, '')}_extracted.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // --- Style guide URL handlers ---
  const handleAddStyleGuideUrl = (url: string) => {
    try { new URL(url.startsWith('http') ? url : `https://${url}`); } catch {
      toast({ title: 'Invalid URL', variant: 'destructive' }); return;
    }
    const entry: StyleGuideUrl = {
      id: `url-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      url: url.startsWith('http') ? url : `https://${url}`,
      status: 'pending', syncFrequency: 'daily',
    };
    updateSettings({ styleGuideUrls: [...styleGuideUrls, entry] });
    toast({ title: 'URL added', description: 'Click sync to fetch content.' });
  };

  const handleSyncStyleGuideUrl = async (urlEntry: StyleGuideUrl) => {
    setSyncingUrlId(urlEntry.id);
    try {
      const text = await fetchStyleGuideFromUrl(urlEntry.url);
      const docId = `url-doc-${urlEntry.id}`;
      const existingDocs = documents.filter(d => d.id !== docId);
      const newDoc: StyleGuideDocument = { id: docId, fileName: `🔗 ${new URL(urlEntry.url).hostname}`, extractedText: text, uploadedAt: Date.now() };
      const updatedUrls = styleGuideUrls.map(u => u.id === urlEntry.id ? { ...u, status: 'synced' as const, lastSyncedAt: Date.now(), error: undefined } : u);
      updateSettings({ styleGuideDocuments: [...existingDocs, newDoc], styleGuideUrls: updatedUrls });
      toast({ title: 'Synced', description: `Content fetched from ${urlEntry.url}` });
    } catch (err) {
      const updatedUrls = styleGuideUrls.map(u => u.id === urlEntry.id ? { ...u, status: 'error' as const, error: err instanceof Error ? err.message : 'Failed' } : u);
      updateSettings({ styleGuideUrls: updatedUrls });
      toast({ title: 'Sync failed', description: err instanceof Error ? err.message : 'Failed to fetch URL', variant: 'destructive' });
    } finally { setSyncingUrlId(null); }
  };

  const handleRemoveStyleGuideUrl = (urlId: string) => {
    const docId = `url-doc-${urlId}`;
    updateSettings({ styleGuideUrls: styleGuideUrls.filter(u => u.id !== urlId), styleGuideDocuments: documents.filter(d => d.id !== docId) });
    toast({ title: 'URL removed' });
  };

  const handleUpdateStyleGuideUrlFrequency = (urlId: string, freq: SyncFrequency) => {
    updateSettings({ styleGuideUrls: styleGuideUrls.map(u => u.id === urlId ? { ...u, syncFrequency: freq } : u) });
  };

  // --- Brand governance handlers ---
  const handleBrandUpload = async (file: File, replaceDocId?: string) => {
    const validTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/msword', 'application/json'];
    const isJsonByExt = file.name.toLowerCase().endsWith('.json');
    if (!validTypes.includes(file.type) && !isJsonByExt) {
      toast({ title: 'Invalid file type', description: 'Please upload a PDF, Word document, or JSON file.', variant: 'destructive' });
      return;
    }
    if (!replaceDocId && brandGov.documents.length >= MAX_DOCUMENTS) {
      toast({ title: 'Maximum documents reached', variant: 'destructive' });
      return;
    }
    setBrandIsUploading(true);
    if (replaceDocId) setBrandUploadingDocId(replaceDocId);
    try {
      const extractedText = await parseDocument(file);
      const newDoc: StyleGuideDocument = {
        id: replaceDocId || `brand-doc-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        fileName: file.name, extractedText, uploadedAt: Date.now(), fileSize: file.size,
      };
      const updatedDocs = replaceDocId ? brandGov.documents.map(d => d.id === replaceDocId ? newDoc : d) : [...brandGov.documents, newDoc];
      updateSettings({ brandGovernance: { ...brandGov, documents: updatedDocs } });
      toast({ title: replaceDocId ? 'Document updated' : 'Document uploaded', description: `${file.name} processed.` });
    } catch (error) {
      toast({ title: 'Upload failed', description: error instanceof Error ? error.message : 'Failed', variant: 'destructive' });
    } finally { setBrandIsUploading(false); setBrandUploadingDocId(null); }
  };

  const handleAddBrandUrl = (url: string) => {
    try { new URL(url.startsWith('http') ? url : `https://${url}`); } catch {
      toast({ title: 'Invalid URL', variant: 'destructive' }); return;
    }
    const entry: StyleGuideUrl = {
      id: `brand-url-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      url: url.startsWith('http') ? url : `https://${url}`,
      status: 'pending', syncFrequency: 'daily',
    };
    updateSettings({ brandGovernance: { ...brandGov, urls: [...brandGov.urls, entry] } });
    toast({ title: 'URL added' });
  };

  const handleSyncBrandUrl = async (urlEntry: StyleGuideUrl) => {
    setBrandSyncingUrlId(urlEntry.id);
    try {
      const text = await fetchStyleGuideFromUrl(urlEntry.url);
      const docId = `brand-url-doc-${urlEntry.id}`;
      const existingDocs = brandGov.documents.filter(d => d.id !== docId);
      const newDoc: StyleGuideDocument = { id: docId, fileName: `🔗 ${new URL(urlEntry.url).hostname}`, extractedText: text, uploadedAt: Date.now() };
      const updatedUrls = brandGov.urls.map(u => u.id === urlEntry.id ? { ...u, status: 'synced' as const, lastSyncedAt: Date.now(), error: undefined } : u);
      updateSettings({ brandGovernance: { ...brandGov, documents: [...existingDocs, newDoc], urls: updatedUrls } });
      toast({ title: 'Synced', description: `Content fetched from ${urlEntry.url}` });
    } catch (err) {
      const updatedUrls = brandGov.urls.map(u => u.id === urlEntry.id ? { ...u, status: 'error' as const, error: err instanceof Error ? err.message : 'Failed' } : u);
      updateSettings({ brandGovernance: { ...brandGov, urls: updatedUrls } });
      toast({ title: 'Sync failed', description: err instanceof Error ? err.message : 'Failed', variant: 'destructive' });
    } finally { setBrandSyncingUrlId(null); }
  };

  const handleRemoveBrandUrl = (urlId: string) => {
    const docId = `brand-url-doc-${urlId}`;
    updateSettings({ brandGovernance: { ...brandGov, urls: brandGov.urls.filter(u => u.id !== urlId), documents: brandGov.documents.filter(d => d.id !== docId) } });
    toast({ title: 'URL removed' });
  };

  const handleUpdateBrandUrlFrequency = (urlId: string, freq: SyncFrequency) => {
    updateSettings({ brandGovernance: { ...brandGov, urls: brandGov.urls.map(u => u.id === urlId ? { ...u, syncFrequency: freq } : u) } });
  };

  // --- Glossary ---
  const handleAddGlossaryEntry = () => {
    if (!newTerm.sourceTerm.trim() || !newTerm.targetTerm.trim()) {
      toast({ title: 'Missing fields', description: 'Both source and target terms are required.', variant: 'destructive' });
      return;
    }
    addEntry(newTerm);
    setNewTerm({ sourceTerm: '', targetTerm: '', notes: '' });
    toast({ title: 'Term added' });
  };

  const handleBulkImport = () => {
    const lines = bulkInput.trim().split('\n').filter(line => line.trim());
    const entries: Omit<GlossaryEntry, 'id'>[] = [];
    for (const line of lines) {
      const parts = line.split(/[,\t]/).map(p => p.trim());
      if (parts.length >= 2) entries.push({ sourceTerm: parts[0], targetTerm: parts[1], notes: parts[2] || '' });
    }
    if (entries.length === 0) {
      toast({ title: 'No valid entries', description: 'Use format: source, target, notes (one per line)', variant: 'destructive' });
      return;
    }
    bulkImport(entries);
    setBulkInput('');
    setShowBulkImport(false);
    toast({ title: 'Import complete', description: `${entries.length} entries added.` });
  };

  const filteredGlossary = glossary.filter(entry =>
    entry.sourceTerm.toLowerCase().includes(glossarySearch.toLowerCase()) ||
    entry.targetTerm.toLowerCase().includes(glossarySearch.toLowerCase())
  );

  const allDocs = [...documents, ...brandGov.documents];
  const previewDoc = allDocs.find(d => d.id === previewDocId);

  return (
    <div className="min-h-screen bg-background p-4 sm:p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={onBack}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-2xl font-display font-bold">Settings</h1>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => {
              const restored = restoreBackup();
              toast({ title: restored ? 'Settings restored' : 'No backup found', variant: restored ? 'default' : 'destructive' });
            }}>
              <RotateCcw className="w-4 h-4 mr-2" />Restore
            </Button>
            <Button size="sm" onClick={async () => { await saveNow(); toast({ title: 'Settings saved', description: 'All changes synced.' }); }} disabled={isSyncing}>
              {isSyncing ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Saving...</> : <><Save className="w-4 h-4 mr-2" />Save</>}
            </Button>
          </div>
        </div>

        <Tabs defaultValue="instructions" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="instructions">Instructions</TabsTrigger>
            <TabsTrigger value="training">Training</TabsTrigger>
            <TabsTrigger value="glossary">Glossary</TabsTrigger>
            <TabsTrigger value="styleguide">Style guide</TabsTrigger>
            <TabsTrigger value="brand">Brand</TabsTrigger>
          </TabsList>

          {/* Instructions Tab */}
          <TabsContent value="instructions">
            <Card>
              <CardHeader>
                <CardTitle>Global instructions</CardTitle>
                <CardDescription>These instructions guide Tomas during style checks and compliance reviews.</CardDescription>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={settings.globalInstructions}
                  onChange={(e) => updateSettings({ globalInstructions: e.target.value })}
                  placeholder="Enter instructions for Tomas to follow during style checks and compliance reviews..."
                  className="min-h-[300px] resize-y"
                />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Training Tab */}
          <TabsContent value="training">
            <Card>
              <CardHeader>
                <CardTitle>Training configuration</CardTitle>
                <CardDescription>Fine-tune how Tomas writes and responds. These settings apply across all features.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="target-audience">Target audience</Label>
                  <Input id="target-audience" value={settings.trainingConfig?.targetAudience || ''}
                    onChange={(e) => updateSettings({ trainingConfig: { ...(settings.trainingConfig || DEFAULT_TRAINING_CONFIG), targetAudience: e.target.value } })}
                    placeholder="e.g. 18-35 sports bettors, NHS patients, small business owners" />
                  <p className="text-xs text-muted-foreground">Who is the content for?</p>
                </div>
                <div className="space-y-2">
                  <Label>Reading level</Label>
                  <Select value={settings.trainingConfig?.readingLevel || 'standard'}
                    onValueChange={(value) => updateSettings({ trainingConfig: { ...(settings.trainingConfig || DEFAULT_TRAINING_CONFIG), readingLevel: value as TrainingConfig['readingLevel'] } })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="simple">Simple (age 9–11)</SelectItem>
                      <SelectItem value="standard">Standard (age 12–15)</SelectItem>
                      <SelectItem value="advanced">Advanced (age 16+)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Spelling convention</Label>
                  <Select value={settings.trainingConfig?.spellingConvention || 'british'}
                    onValueChange={(value) => updateSettings({ trainingConfig: { ...(settings.trainingConfig || DEFAULT_TRAINING_CONFIG), spellingConvention: value as TrainingConfig['spellingConvention'] } })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="british">British English</SelectItem>
                      <SelectItem value="american">American English</SelectItem>
                      <SelectItem value="australian">Australian English</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Content type focus</Label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {['Marketing', 'Legal', 'UX/UI copy', 'Editorial', 'Social media'].map((type) => {
                      const currentTypes = settings.trainingConfig?.contentTypeFocus || [];
                      const isChecked = currentTypes.includes(type);
                      return (
                        <label key={type} className="flex items-center gap-2 text-sm cursor-pointer">
                          <Checkbox checked={isChecked} onCheckedChange={(checked) => {
                            const updated = checked ? [...currentTypes, type] : currentTypes.filter(t => t !== type);
                            updateSettings({ trainingConfig: { ...(settings.trainingConfig || DEFAULT_TRAINING_CONFIG), contentTypeFocus: updated } });
                          }} />
                          {type}
                        </label>
                      );
                    })}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="banned-words">Banned words and phrases</Label>
                  <Textarea id="banned-words" value={settings.trainingConfig?.bannedWords || ''}
                    onChange={(e) => updateSettings({ trainingConfig: { ...(settings.trainingConfig || DEFAULT_TRAINING_CONFIG), bannedWords: e.target.value } })}
                    placeholder={"click here\nplease\nsimply\njust"} className="min-h-[120px] resize-y" />
                  <p className="text-xs text-muted-foreground">One word or phrase per line.</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="preferred-alternatives">Preferred alternatives</Label>
                  <Textarea id="preferred-alternatives" value={settings.trainingConfig?.preferredAlternatives || ''}
                    onChange={(e) => updateSettings({ trainingConfig: { ...(settings.trainingConfig || DEFAULT_TRAINING_CONFIG), preferredAlternatives: e.target.value } })}
                    placeholder={"use 'select' instead of 'click'\nuse 'start' instead of 'commence'"} className="min-h-[120px] resize-y" />
                  <p className="text-xs text-muted-foreground">One rule per line.</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Glossary Tab */}
          <TabsContent value="glossary">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Glossary manager</span>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => setShowBulkImport(true)}>
                      <Download className="w-4 h-4 mr-2" />Bulk Import
                    </Button>
                    {glossary.length > 0 && (
                      <Button variant="outline" size="sm" onClick={clearGlossary}>
                        <Trash2 className="w-4 h-4 mr-2" />Clear All
                      </Button>
                    )}
                  </div>
                </CardTitle>
                <CardDescription>Define terms that should be consistently used across all content.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <Input placeholder="Source term" value={newTerm.sourceTerm} onChange={(e) => setNewTerm(prev => ({ ...prev, sourceTerm: e.target.value }))} />
                  <Input placeholder="Target term" value={newTerm.targetTerm} onChange={(e) => setNewTerm(prev => ({ ...prev, targetTerm: e.target.value }))} />
                  <div className="flex gap-2">
                    <Input placeholder="Notes (optional)" value={newTerm.notes} onChange={(e) => setNewTerm(prev => ({ ...prev, notes: e.target.value }))} />
                    <Button onClick={handleAddGlossaryEntry}><Plus className="w-4 h-4" /></Button>
                  </div>
                </div>
                {glossary.length > 0 && (
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input placeholder="Search glossary..." value={glossarySearch} onChange={(e) => setGlossarySearch(e.target.value)} className="pl-10" />
                  </div>
                )}
                <ScrollArea className="h-[300px]">
                  {filteredGlossary.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">
                      {glossary.length === 0 ? 'No glossary entries yet.' : 'No matching entries.'}
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {filteredGlossary.map((entry) => (
                        <div key={entry.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50 group">
                          <div className="flex-1 grid grid-cols-3 gap-2 text-sm">
                            <span className="font-medium">{entry.sourceTerm}</span>
                            <span>{entry.targetTerm}</span>
                            <span className="text-muted-foreground">{entry.notes}</span>
                          </div>
                          <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => removeEntry(entry.id)}>
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Style Guide Tab */}
          <TabsContent value="styleguide">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><BookOpen className="w-5 h-5" /> Style guide documents</CardTitle>
                <CardDescription>How we write — upload up to {MAX_DOCUMENTS} documents (PDF, Word, JSON) to define writing standards.</CardDescription>
              </CardHeader>
              <CardContent>
                <DocumentManager
                  documents={documents}
                  maxDocs={MAX_DOCUMENTS}
                  isUploading={isUploading}
                  uploadingDocId={uploadingDocId}
                  onUpload={(f) => handleStyleGuideUpload(f)}
                  onReplace={(f, id) => handleStyleGuideUpload(f, id)}
                  onRemove={(id) => { updateSettings({ styleGuideDocuments: documents.filter(d => d.id !== id) }); toast({ title: 'Document removed' }); }}
                  onPreview={(id) => setPreviewDocId(id)}
                  onDownload={handleDownloadDocument}
                />
              </CardContent>
            </Card>
            <Card className="mt-4">
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Link className="w-4 h-4" /> Live documents</CardTitle>
                <CardDescription>Add URLs to online style guides. Tomas will fetch and use their content.</CardDescription>
              </CardHeader>
              <CardContent>
                <LiveUrlManager
                  urls={styleGuideUrls}
                  syncingUrlId={syncingUrlId}
                  onAdd={handleAddStyleGuideUrl}
                  onSync={handleSyncStyleGuideUrl}
                  onRemove={handleRemoveStyleGuideUrl}
                  onUpdateFrequency={handleUpdateStyleGuideUrlFrequency}
                />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Brand Tab — Governance Layer */}
          <TabsContent value="brand">
            <Card>
              <CardHeader>
                <CardTitle>Brand and industry</CardTitle>
                <CardDescription>Core brand identity that Tomas uses across all features.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="brand-name">Brand Name</Label>
                  <Input id="brand-name" value={settings.brandName} onChange={(e) => updateSettings({ brandName: e.target.value })} placeholder="e.g., Apple, NHS, BBC..." />
                  <p className="text-xs text-muted-foreground">Tomas uses publicly available information about well-known brands.</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="industry">Industry / Sector</Label>
                  <Input id="industry" value={settings.industry} onChange={(e) => updateSettings({ industry: e.target.value })} placeholder="e.g., Healthcare, Finance, Technology..." />
                </div>
              </CardContent>
            </Card>

            <Card className="mt-4">
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Shield className="w-5 h-5" /> Compliance &amp; governance documents</CardTitle>
                <CardDescription>What we must comply with — upload brand guidelines, internal policies, regulatory frameworks, or compliance documents.</CardDescription>
              </CardHeader>
              <CardContent>
                <DocumentManager
                  documents={brandGov.documents}
                  maxDocs={MAX_DOCUMENTS}
                  isUploading={brandIsUploading}
                  uploadingDocId={brandUploadingDocId}
                  onUpload={(f) => handleBrandUpload(f)}
                  onReplace={(f, id) => handleBrandUpload(f, id)}
                  onRemove={(id) => { updateSettings({ brandGovernance: { ...brandGov, documents: brandGov.documents.filter(d => d.id !== id) } }); toast({ title: 'Document removed' }); }}
                  onPreview={(id) => setPreviewDocId(id)}
                  onDownload={handleDownloadDocument}
                />
              </CardContent>
            </Card>

            <Card className="mt-4">
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Link className="w-4 h-4" /> Regulatory &amp; policy links</CardTitle>
                <CardDescription>Add links to government, regulatory, or industry standard pages (e.g. FCA, NHS, gov.uk). Tomas will fetch and monitor their content.</CardDescription>
              </CardHeader>
              <CardContent>
                <LiveUrlManager
                  urls={brandGov.urls}
                  syncingUrlId={brandSyncingUrlId}
                  onAdd={handleAddBrandUrl}
                  onSync={handleSyncBrandUrl}
                  onRemove={handleRemoveBrandUrl}
                  onUpdateFrequency={handleUpdateBrandUrlFrequency}
                />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Bulk Import Dialog */}
      <Dialog open={showBulkImport} onOpenChange={setShowBulkImport}>
        <DialogContent>
          <DialogHeader><DialogTitle>Bulk import glossary</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">Paste entries in CSV format: source, target, notes (one per line)</p>
            <Textarea value={bulkInput} onChange={(e) => setBulkInput(e.target.value)}
              placeholder="click, tap, Use for mobile&#10;homepage, home page, UK spelling" className="min-h-[200px]" />
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowBulkImport(false)}>Cancel</Button>
              <Button onClick={handleBulkImport}>Import</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Document Preview Dialog */}
      <Dialog open={!!previewDocId} onOpenChange={(open) => !open && setPreviewDocId(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh]">
          <DialogHeader><DialogTitle>{previewDoc?.fileName || 'Document preview'}</DialogTitle></DialogHeader>
          <ScrollArea className="h-[500px] mt-4">
            <pre className="whitespace-pre-wrap text-sm p-4 bg-muted rounded-lg">{previewDoc?.extractedText}</pre>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
}
