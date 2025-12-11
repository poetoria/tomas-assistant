import { useState, useRef } from 'react';
import { ArrowLeft, Upload, Trash2, Plus, FileText, Eye, Search, Download, X } from 'lucide-react';
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
import type { GlossaryEntry } from '@/types/translation';

interface SettingsPanelProps {
  onBack: () => void;
}

export function SettingsPanel({ onBack }: SettingsPanelProps) {
  const { settings, updateSettings } = useGlobalSettings();
  const { glossary, addEntry, updateEntry, removeEntry, bulkImport, clearGlossary } = useGlossary();
  const { toast } = useToast();
  
  const [isUploading, setIsUploading] = useState(false);
  const [showStyleGuidePreview, setShowStyleGuidePreview] = useState(false);
  const [glossarySearch, setGlossarySearch] = useState('');
  const [newTerm, setNewTerm] = useState({ sourceTerm: '', targetTerm: '', notes: '' });
  const [bulkInput, setBulkInput] = useState('');
  const [showBulkImport, setShowBulkImport] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/msword'
    ];
    
    if (!validTypes.includes(file.type)) {
      toast({
        title: 'Invalid file type',
        description: 'Please upload a PDF or Word document.',
        variant: 'destructive',
      });
      return;
    }

    setIsUploading(true);
    try {
      const extractedText = await parseDocument(file);
      updateSettings({ extractedStyleGuideText: extractedText });
      toast({
        title: 'Style guide uploaded',
        description: 'Text has been extracted and saved successfully.',
      });
    } catch (error) {
      toast({
        title: 'Upload failed',
        description: error instanceof Error ? error.message : 'Failed to process document',
        variant: 'destructive',
      });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

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
                <CardTitle>Global Instructions</CardTitle>
                <CardDescription>
                  These instructions will guide all translations and style checks.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={settings.globalInstructions}
                  onChange={(e) => updateSettings({ globalInstructions: e.target.value })}
                  placeholder="Enter instructions for the AI to follow during translations and style checks. For example: 'Always use active voice', 'Avoid jargon', 'Keep sentences under 20 words'..."
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
                  <span>Glossary Manager</span>
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
                <CardTitle>Style Guide Upload</CardTitle>
                <CardDescription>
                  Upload your brand's style guide (PDF or Word) to extract guidelines.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-3">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    accept=".pdf,.doc,.docx"
                    className="hidden"
                  />
                  <Button
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                    className="flex-1"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    {isUploading ? 'Processing...' : 'Upload Document'}
                  </Button>
                  {settings.extractedStyleGuideText && (
                    <Button
                      variant="outline"
                      onClick={() => setShowStyleGuidePreview(true)}
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      View Extracted Text
                    </Button>
                  )}
                </div>
                
                {settings.extractedStyleGuideText && (
                  <div className="p-4 rounded-lg bg-accent/50 flex items-center gap-3">
                    <FileText className="w-5 h-5 text-primary" />
                    <span className="text-sm">
                      Style guide uploaded ({settings.extractedStyleGuideText.length.toLocaleString()} characters)
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="ml-auto"
                      onClick={() => updateSettings({ extractedStyleGuideText: '' })}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Brand Tab */}
          <TabsContent value="brand">
            <Card>
              <CardHeader>
                <CardTitle>Brand & Industry</CardTitle>
                <CardDescription>
                  Provide brand context to enhance AI responses.
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
                    If this is a well-known brand, the AI can use publicly available information.
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
            <DialogTitle>Bulk Import Glossary</DialogTitle>
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

      {/* Style Guide Preview Dialog */}
      <Dialog open={showStyleGuidePreview} onOpenChange={setShowStyleGuidePreview}>
        <DialogContent className="max-w-2xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Extracted Style Guide Text</DialogTitle>
          </DialogHeader>
          <ScrollArea className="h-[500px] mt-4">
            <pre className="whitespace-pre-wrap text-sm p-4 bg-muted rounded-lg">
              {settings.extractedStyleGuideText}
            </pre>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
}
