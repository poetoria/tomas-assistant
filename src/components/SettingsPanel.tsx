import { useState, useRef } from 'react';
import { ArrowLeft, Upload, Trash2, Plus, FileText, Eye, Search, Download, X, RefreshCw, FileJson } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { useGlobalSettings, useGlossary } from '@/hooks/useSettingsStorage';
import { parseDocument } from '@/services/documentService';
import type { GlossaryEntry, StyleGuideDocument } from '@/types/translation';

const MAX_DOCUMENTS = 5;

interface SettingsPanelProps {
  onBack: () => void;
}

export function SettingsPanel({ onBack }: SettingsPanelProps) {
  const { settings, updateSettings } = useGlobalSettings();
  const { glossary, addEntry, updateEntry, removeEntry, bulkImport, clearGlossary } = useGlossary();
  const { toast } = useToast();
  
  const [isUploading, setIsUploading] = useState(false);
  const [uploadingDocId, setUploadingDocId] = useState<string | null>(null);
  const [previewDocId, setPreviewDocId] = useState<string | null>(null);
  const [glossarySearch, setGlossarySearch] = useState('');
  const [newTerm, setNewTerm] = useState({ sourceTerm: '', targetTerm: '', notes: '' });
  const [bulkInput, setBulkInput] = useState('');
  const [showBulkImport, setShowBulkImport] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const replaceFileInputRef = useRef<HTMLInputElement>(null);

  const documents = settings.styleGuideDocuments || [];

  const handleFileUpload = async (file: File, replaceDocId?: string) => {
    const validTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/msword',
      'application/json',
    ];
    const isJsonByExt = file.name.toLowerCase().endsWith('.json');
    
    if (!validTypes.includes(file.type) && !isJsonByExt) {
      toast({
        title: 'Invalid file type',
        description: 'Please upload a PDF, Word document, or JSON file.',
        variant: 'destructive',
      });
      return;
    }

    if (!replaceDocId && documents.length >= MAX_DOCUMENTS) {
      toast({
        title: 'Maximum documents reached',
        description: `You can upload up to ${MAX_DOCUMENTS} documents. Remove one to add another.`,
        variant: 'destructive',
      });
      return;
    }

    setIsUploading(true);
    if (replaceDocId) setUploadingDocId(replaceDocId);

    try {
      const extractedText = await parseDocument(file);
      
      const newDoc: StyleGuideDocument = {
        id: replaceDocId || `doc-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        fileName: file.name,
        extractedText,
        uploadedAt: Date.now(),
        fileSize: file.size,
      };

      let updatedDocs: StyleGuideDocument[];
      if (replaceDocId) {
        updatedDocs = documents.map(d => d.id === replaceDocId ? newDoc : d);
      } else {
        updatedDocs = [...documents, newDoc];
      }

      updateSettings({ styleGuideDocuments: updatedDocs });
      toast({
        title: replaceDocId ? 'Document updated' : 'Document uploaded',
        description: `${file.name} has been processed successfully.`,
      });
    } catch (error) {
      toast({
        title: 'Upload failed',
        description: error instanceof Error ? error.message : 'Failed to process document',
        variant: 'destructive',
      });
    } finally {
      setIsUploading(false);
      setUploadingDocId(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      if (replaceFileInputRef.current) replaceFileInputRef.current.value = '';
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileUpload(file);
  };

  const handleReplaceFile = (e: React.ChangeEvent<HTMLInputElement>, docId: string) => {
    const file = e.target.files?.[0];
    if (file) handleFileUpload(file, docId);
  };

  const handleRemoveDocument = (docId: string) => {
    const updatedDocs = documents.filter(d => d.id !== docId);
    updateSettings({ styleGuideDocuments: updatedDocs });
    toast({ title: 'Document removed' });
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

  const previewDoc = documents.find(d => d.id === previewDocId);

  const handleAddGlossaryEntry = () => {
    if (!newTerm.sourceTerm.trim() || !newTerm.targetTerm.trim()) {
      toast({
        title: 'Missing fields',
        description: 'Both source and target terms are required.',
        variant: 'destructive',
      });
      return;
    }
    addEntry(newTerm);
    setNewTerm({ sourceTerm: '', targetTerm: '', notes: '' });
    toast({ title: 'Term added', description: 'Glossary entry has been saved.' });
  };

  const handleBulkImport = () => {
    const lines = bulkInput.trim().split('\n').filter(line => line.trim());
    const entries: Omit<GlossaryEntry, 'id'>[] = [];
    
    for (const line of lines) {
      const parts = line.split(/[,\t]/).map(p => p.trim());
      if (parts.length >= 2) {
        entries.push({
          sourceTerm: parts[0],
          targetTerm: parts[1],
          notes: parts[2] || '',
        });
      }
    }

    if (entries.length === 0) {
      toast({
        title: 'No valid entries',
        description: 'Please use format: source, target, notes (one per line)',
        variant: 'destructive',
      });
      return;
    }

    bulkImport(entries);
    setBulkInput('');
    setShowBulkImport(false);
    toast({ title: 'Import complete', description: `${entries.length} entries added to glossary.` });
  };

  const filteredGlossary = glossary.filter(entry =>
    entry.sourceTerm.toLowerCase().includes(glossarySearch.toLowerCase()) ||
    entry.targetTerm.toLowerCase().includes(glossarySearch.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background p-4 sm:p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-2xl font-display font-bold">Settings</h1>
        </div>

        <Tabs defaultValue="instructions" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="instructions">Instructions</TabsTrigger>
            <TabsTrigger value="glossary">Glossary</TabsTrigger>
            <TabsTrigger value="styleguide">Style Guide</TabsTrigger>
            <TabsTrigger value="brand">Brand</TabsTrigger>
          </TabsList>

          {/* Global Instructions Tab */}
          <TabsContent value="instructions">
            <Card>
              <CardHeader>
                <CardTitle>Global instructions</CardTitle>
                <CardDescription>
                  These instructions will guide TINA2 during translations and style checks.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={settings.globalInstructions}
                  onChange={(e) => updateSettings({ globalInstructions: e.target.value })}
                  placeholder="Enter instructions for TINA2 to follow during translations and style checks. For example: 'Always use active voice', 'Avoid jargon', 'Keep sentences under 20 words'..."
                  className="min-h-[300px] resize-y"
                />
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
                      <Download className="w-4 h-4 mr-2" />
                      Bulk Import
                    </Button>
                    {glossary.length > 0 && (
                      <Button variant="outline" size="sm" onClick={clearGlossary}>
                        <Trash2 className="w-4 h-4 mr-2" />
                        Clear All
                      </Button>
                    )}
                  </div>
                </CardTitle>
                <CardDescription>
                  Define terms that should be consistently translated across all content.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Add New Entry */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <Input
                    placeholder="Source term"
                    value={newTerm.sourceTerm}
                    onChange={(e) => setNewTerm(prev => ({ ...prev, sourceTerm: e.target.value }))}
                  />
                  <Input
                    placeholder="Target term"
                    value={newTerm.targetTerm}
                    onChange={(e) => setNewTerm(prev => ({ ...prev, targetTerm: e.target.value }))}
                  />
                  <div className="flex gap-2">
                    <Input
                      placeholder="Notes (optional)"
                      value={newTerm.notes}
                      onChange={(e) => setNewTerm(prev => ({ ...prev, notes: e.target.value }))}
                    />
                    <Button onClick={handleAddGlossaryEntry}>
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {/* Search */}
                {glossary.length > 0 && (
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="Search glossary..."
                      value={glossarySearch}
                      onChange={(e) => setGlossarySearch(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                )}

                {/* Glossary List */}
                <ScrollArea className="h-[300px]">
                  {filteredGlossary.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">
                      {glossary.length === 0 ? 'No glossary entries yet.' : 'No matching entries.'}
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {filteredGlossary.map((entry) => (
                        <div
                          key={entry.id}
                          className="flex items-center justify-between p-3 rounded-lg bg-muted/50 group"
                        >
                          <div className="flex-1 grid grid-cols-3 gap-2 text-sm">
                            <span className="font-medium">{entry.sourceTerm}</span>
                            <span>{entry.targetTerm}</span>
                            <span className="text-muted-foreground">{entry.notes}</span>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => removeEntry(entry.id)}
                          >
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
                <CardTitle>Style guide documents</CardTitle>
                <CardDescription>
                  Upload up to {MAX_DOCUMENTS} documents (PDF, Word, or JSON) to extract guidelines. All documents are combined as context for TINA2.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Document list */}
                {documents.length > 0 && (
                  <div className="space-y-2">
                    {documents.map((doc) => {
                      const isReplacing = uploadingDocId === doc.id;
                      return (
                        <div
                          key={doc.id}
                          className="flex items-center gap-3 p-3 rounded-lg border border-border bg-muted/30 group"
                        >
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
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              title="View extracted text"
                              onClick={() => setPreviewDocId(doc.id)}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              title="Download extracted text"
                              onClick={() => handleDownloadDocument(doc)}
                            >
                              <Download className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              title="Replace with another file"
                              disabled={isUploading}
                              onClick={() => {
                                setUploadingDocId(doc.id);
                                replaceFileInputRef.current?.click();
                              }}
                            >
                              <RefreshCw className={`w-4 h-4 ${isReplacing ? 'animate-spin' : ''}`} />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              title="Remove document"
                              disabled={isUploading}
                              onClick={() => handleRemoveDocument(doc.id)}
                            >
                              <Trash2 className="w-4 h-4 text-destructive" />
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Upload button */}
                {documents.length < MAX_DOCUMENTS && (
                  <>
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileInputChange}
                      accept=".pdf,.doc,.docx,.json"
                      className="hidden"
                    />
                    <Button
                      variant="outline"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploading && !uploadingDocId}
                      className="w-full border-dashed"
                    >
                      {isUploading && !uploadingDocId ? (
                        <>
                          <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          <Plus className="w-4 h-4 mr-2" />
                          Add Document ({documents.length}/{MAX_DOCUMENTS})
                        </>
                      )}
                    </Button>
                  </>
                )}

                {/* Hidden replace file input */}
                <input
                  type="file"
                  ref={replaceFileInputRef}
                  onChange={(e) => uploadingDocId && handleReplaceFile(e, uploadingDocId)}
                  accept=".pdf,.doc,.docx,.json"
                  className="hidden"
                />

                {documents.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <Upload className="w-8 h-8 mx-auto mb-3 opacity-50" />
                    <p className="text-sm">No style guide documents uploaded yet.</p>
                    <p className="text-xs mt-1">Supported formats: PDF, Word (.docx), JSON</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Brand Tab */}
          <TabsContent value="brand">
            <Card>
              <CardHeader>
                <CardTitle>Brand and industry</CardTitle>
                <CardDescription>
                  Provide brand context to help TINA2 give better responses.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="brand-name">Brand Name</Label>
                  <Input
                    id="brand-name"
                    value={settings.brandName}
                    onChange={(e) => updateSettings({ brandName: e.target.value })}
                    placeholder="e.g., Apple, NHS, BBC..."
                  />
                  <p className="text-xs text-muted-foreground">
                    If this is a well-known brand, TINA2 can use publicly available information. Copy and microcopy throughout the app will reference this brand name.
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="industry">Industry / Sector</Label>
                  <Input
                    id="industry"
                    value={settings.industry}
                    onChange={(e) => updateSettings({ industry: e.target.value })}
                    placeholder="e.g., Healthcare, Finance, Technology, Government..."
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Bulk Import Dialog */}
      <Dialog open={showBulkImport} onOpenChange={setShowBulkImport}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Bulk import glossary</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Paste entries in CSV format: source, target, notes (one per line)
            </p>
            <Textarea
              value={bulkInput}
              onChange={(e) => setBulkInput(e.target.value)}
              placeholder="click, tap, Use for mobile&#10;homepage, home page, UK spelling&#10;color, colour, British English"
              className="min-h-[200px]"
            />
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowBulkImport(false)}>
                Cancel
              </Button>
              <Button onClick={handleBulkImport}>Import</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Document Preview Dialog */}
      <Dialog open={!!previewDocId} onOpenChange={(open) => !open && setPreviewDocId(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>{previewDoc?.fileName || 'Document preview'}</DialogTitle>
          </DialogHeader>
          <ScrollArea className="h-[500px] mt-4">
            <pre className="whitespace-pre-wrap text-sm p-4 bg-muted rounded-lg">
              {previewDoc?.extractedText}
            </pre>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
}
