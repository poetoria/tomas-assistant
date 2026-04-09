import { useState, useEffect, useCallback } from 'react';
import { Search, ChevronDown, ChevronUp, Plus, Download, Trash2, Eye, CheckCircle, Clock, AlertTriangle, Pencil, Save, X } from 'lucide-react';
import DOMPurify from 'dompurify';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { RichTextEditor } from '@/components/RichTextEditor';

function formatRichContent(text: string): string {
  const formatted = text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/^[-•]\s+(.+)/gm, '<li>$1</li>')
    .replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>')
    .replace(/\n/g, '<br/>');

  return DOMPurify.sanitize(formatted);
}

interface GapItem {
  id: string;
  user_query: string;
  tomas_response: string;
  confidence_signal: string | null;
  status: string;
  created_at: string;
}

interface SupplementalRule {
  id: string;
  rule_text: string;
  source_gap_id: string | null;
  source_query: string | null;
  review_note: string | null;
  reviewer_name: string | null;
  created_at: string;
}

type GapDialogMode = 'add' | 'edit';

const STATUS_CONFIG: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  new: { label: 'New', icon: <AlertTriangle className="w-3 h-3" />, color: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20' },
  reviewed: { label: 'Reviewed', icon: <Eye className="w-3 h-3" />, color: 'bg-blue-500/10 text-blue-500 border-blue-500/20' },
  added: { label: 'Added', icon: <CheckCircle className="w-3 h-3" />, color: 'bg-green-500/10 text-green-500 border-green-500/20' },
};

export function StyleGuideGaps() {
  const { toast } = useToast();
  const [gaps, setGaps] = useState<GapItem[]>([]);
  const [rules, setRules] = useState<SupplementalRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');
  const [selectedGap, setSelectedGap] = useState<GapItem | null>(null);
  const [gapDialogMode, setGapDialogMode] = useState<GapDialogMode>('edit');
  const [ruleText, setRuleText] = useState('');
  const [reviewNote, setReviewNote] = useState('');
  const [reviewerName, setReviewerName] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editingRuleId, setEditingRuleId] = useState<string | null>(null);
  const [editRuleText, setEditRuleText] = useState('');
  const [editReviewNote, setEditReviewNote] = useState('');

  const fetchData = useCallback(async () => {
    setLoading(true);

    try {
      const [gapsRes, rulesRes] = await Promise.all([
        supabase.from('style_guide_gaps').select('*').order('created_at', { ascending: false }),
        supabase.from('supplemental_rules').select('*').order('created_at', { ascending: false }),
      ]);

      if (gapsRes.data) setGaps(gapsRes.data as unknown as GapItem[]);
      if (rulesRes.data) setRules(rulesRes.data as unknown as SupplementalRule[]);
    } catch (e) {
      console.error('Failed to fetch gaps:', e);
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const closeGapDialog = () => {
    setSelectedGap(null);
    setGapDialogMode('edit');
    setRuleText('');
    setReviewNote('');
  };

  const openGapDialog = (gap: GapItem, mode: GapDialogMode) => {
    setSelectedGap(gap);
    setGapDialogMode(mode);
    setRuleText(gap.tomas_response);
    setReviewNote('');
  };

  const updateGapStatus = async (id: string, status: string) => {
    const { error } = await supabase.from('style_guide_gaps').update({ status } as never).eq('id', id);

    if (error) {
      toast({ title: 'Failed to update gap', variant: 'destructive' });
      return false;
    }

    setGaps(prev => prev.map(g => (g.id === id ? { ...g, status } : g)));
    return true;
  };

  const handlePromoteToRule = async () => {
    if (!selectedGap || !ruleText.trim()) return;

    if (!reviewerName.trim()) {
      toast({
        title: 'Reviewer name required',
        description: 'Please enter your name before adding a rule.',
        variant: 'destructive',
      });
      return;
    }

    const { data, error } = await supabase.from('supplemental_rules').insert({
      rule_text: ruleText.trim(),
      source_gap_id: selectedGap.id,
      source_query: selectedGap.user_query,
      review_note: reviewNote.trim() || null,
      reviewer_name: reviewerName.trim(),
    } as never).select().single();

    if (error) {
      toast({ title: 'Failed to add rule', variant: 'destructive' });
      return;
    }

    const didUpdate = await updateGapStatus(selectedGap.id, 'added');
    if (!didUpdate) return;

    if (data) {
      setRules(prev => [data as unknown as SupplementalRule, ...prev]);
    } else {
      fetchData();
    }

    closeGapDialog();
    setExpandedId(current => (current === selectedGap.id ? null : current));
    toast({ title: 'Rule added', description: 'This rule has been moved to Supplemental rules and is now used by Tomas.' });
  };

  const handleEditRule = (rule: SupplementalRule) => {
    setEditingRuleId(rule.id);
    setEditRuleText(rule.rule_text);
    setEditReviewNote(rule.review_note || '');
  };

  const handleSaveRuleEdit = async () => {
    if (!editingRuleId || !editRuleText.trim()) return;

    const { error } = await supabase.from('supplemental_rules').update({
      rule_text: editRuleText.trim(),
      review_note: editReviewNote.trim() || null,
    } as never).eq('id', editingRuleId);

    if (error) {
      toast({ title: 'Failed to update rule', variant: 'destructive' });
      return;
    }

    setRules(prev => prev.map(rule => (
      rule.id === editingRuleId
        ? { ...rule, rule_text: editRuleText.trim(), review_note: editReviewNote.trim() || null }
        : rule
    )));
    setEditingRuleId(null);
    toast({ title: 'Rule updated' });
  };

  const handleDeleteGap = async (id: string) => {
    const { error } = await supabase.from('style_guide_gaps').delete().eq('id', id);

    if (error) {
      toast({ title: 'Failed to remove gap', variant: 'destructive' });
      return;
    }

    setGaps(prev => prev.filter(gap => gap.id !== id));
    toast({ title: 'Gap removed' });
  };

  const handleDeleteRule = async (id: string) => {
    const { error } = await supabase.from('supplemental_rules').delete().eq('id', id);

    if (error) {
      toast({ title: 'Failed to remove rule', variant: 'destructive' });
      return;
    }

    setRules(prev => prev.filter(rule => rule.id !== id));
    toast({ title: 'Rule removed' });
  };

  const handleExportRules = () => {
    const exportData = rules.map(rule => ({
      query: rule.source_query,
      rule: rule.rule_text,
      reviewer: rule.reviewer_name,
      note: rule.review_note,
      created: rule.created_at,
    }));

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `supplemental-rules-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const visibleGaps = gaps.filter(gap => gap.status !== 'added');

  const filtered = visibleGaps
    .filter(gap => {
      if (statusFilter !== 'all' && gap.status !== statusFilter) return false;
      if (!search.trim()) return true;

      const query = search.toLowerCase();
      return gap.user_query.toLowerCase().includes(query) || gap.tomas_response.toLowerCase().includes(query);
    })
    .sort((a, b) => (
      sortOrder === 'newest'
        ? new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        : new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    ));

  const formatDate = (value: string) => new Date(value).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between gap-3">
            <span>Content gaps</span>
            <Badge variant="outline" className="font-normal">
              {visibleGaps.filter(gap => gap.status === 'new').length} new
            </Badge>
          </CardTitle>
          <CardDescription>
            Queries where Tomas inferred an answer because the style guide didn&apos;t explicitly cover the topic.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-2 sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search queries..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All status</SelectItem>
                <SelectItem value="new">New</SelectItem>
                <SelectItem value="reviewed">Reviewed</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setSortOrder(current => (current === 'newest' ? 'oldest' : 'newest'))}
              title={sortOrder === 'newest' ? 'Showing newest first' : 'Showing oldest first'}
            >
              {sortOrder === 'newest' ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
            </Button>
          </div>

          <ScrollArea className="max-h-[520px] pr-2">
            {loading ? (
              <p className="py-8 text-center text-muted-foreground">Loading...</p>
            ) : filtered.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground">
                <AlertTriangle className="mx-auto mb-3 h-8 w-8 opacity-50" />
                <p className="text-sm">
                  {visibleGaps.length === 0
                    ? 'No gaps detected yet. Ask Tomas questions to start capturing uncovered topics.'
                    : 'No matching gaps.'}
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {filtered.map((gap) => {
                  const statusCfg = STATUS_CONFIG[gap.status] || STATUS_CONFIG.new;
                  const isExpanded = expandedId === gap.id;

                  return (
                    <div key={gap.id} className="overflow-hidden rounded-lg border border-border bg-muted/30">
                      <div
                        className="flex cursor-pointer items-start gap-3 p-3 transition-colors hover:bg-muted/50"
                        onClick={() => setExpandedId(isExpanded ? null : gap.id)}
                      >
                        <div className="min-w-0 flex-1">
                          <p className="line-clamp-2 text-sm font-medium">{gap.user_query}</p>
                          <div className="mt-1 flex flex-wrap items-center gap-2">
                            <Badge variant="outline" className={`px-1.5 py-0 text-[10px] ${statusCfg.color}`}>
                              {statusCfg.icon}
                              <span className="ml-1">{statusCfg.label}</span>
                            </Badge>
                            <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                              <Clock className="h-3 w-3" />
                              {formatDate(gap.created_at)}
                            </span>
                          </div>
                        </div>
                        <div className="mt-0.5 flex shrink-0 items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 hover:bg-destructive/10"
                            onClick={(event) => {
                              event.stopPropagation();
                              handleDeleteGap(gap.id);
                            }}
                            title="Delete gap"
                          >
                            <Trash2 className="h-3.5 w-3.5 text-destructive" />
                          </Button>
                          {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                        </div>
                      </div>

                      {isExpanded && (
                        <div className="border-t border-border px-3 pb-3 pt-3">
                          <div className="mb-3 max-h-[240px] space-y-3 overflow-y-auto pr-2">
                            <div>
                              <p className="mb-1 text-[10px] uppercase tracking-wider text-muted-foreground">Tomas response</p>
                              <div
                                className="prose prose-xs max-w-none text-xs text-muted-foreground dark:prose-invert"
                                dangerouslySetInnerHTML={{ __html: formatRichContent(gap.tomas_response) }}
                              />
                            </div>
                            {gap.confidence_signal && (
                              <div>
                                <p className="mb-1 text-[10px] uppercase tracking-wider text-muted-foreground">Signal</p>
                                <p className="text-xs text-muted-foreground">{gap.confidence_signal}</p>
                              </div>
                            )}
                          </div>

                          <div className="flex flex-wrap items-center gap-2 border-t border-border/50 pt-2">
                            <Button
                              size="sm"
                              variant="default"
                              className="shrink-0"
                              onClick={(event) => {
                                event.stopPropagation();
                                openGapDialog(gap, 'add');
                              }}
                            >
                              <Plus className="mr-1 h-3 w-3" />
                              Add as rule
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="shrink-0"
                              onClick={(event) => {
                                event.stopPropagation();
                                openGapDialog(gap, 'edit');
                              }}
                            >
                              <Pencil className="mr-1 h-3 w-3" />
                              Edit
                            </Button>
                            {gap.status === 'new' && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="shrink-0"
                                onClick={(event) => {
                                  event.stopPropagation();
                                  updateGapStatus(gap.id, 'reviewed');
                                }}
                              >
                                Mark reviewed
                              </Button>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between gap-3">
            <span>Supplemental rules</span>
            {rules.length > 0 && (
              <Button variant="outline" size="sm" onClick={handleExportRules}>
                <Download className="mr-2 h-4 w-4" />
                Export JSON
              </Button>
            )}
          </CardTitle>
          <CardDescription>
            Working rules created from gaps. These are used by Tomas but kept separate from the main style guide.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {rules.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              No supplemental rules yet. Promote gaps to create working rules.
            </p>
          ) : (
            <ScrollArea className="max-h-[400px] pr-2">
              <div className="space-y-2">
                {rules.map((rule) => (
                  <div key={rule.id} className="overflow-hidden rounded-lg border border-border bg-muted/30">
                    {rule.source_query && (
                      <div className="px-3 pb-1 pt-2.5">
                        <p className="mb-0.5 text-[10px] uppercase tracking-wider text-muted-foreground">Query</p>
                        <p className="line-clamp-2 text-xs font-medium">{rule.source_query}</p>
                      </div>
                    )}
                    <div className="p-3 pt-1.5">
                      <div className="flex items-start gap-2">
                        <div className="min-w-0 flex-1">
                          <div
                            className="prose prose-sm max-w-none text-sm dark:prose-invert"
                            dangerouslySetInnerHTML={{ __html: formatRichContent(rule.rule_text) }}
                          />
                          <div className="mt-1.5 flex flex-wrap items-center gap-2 text-[10px] text-muted-foreground">
                            <span>{formatDate(rule.created_at)}</span>
                            {rule.reviewer_name && (
                              <>
                                <span>·</span>
                                <span>by {rule.reviewer_name}</span>
                              </>
                            )}
                          </div>
                          {rule.review_note && (
                            <p className="mt-1 text-xs italic text-muted-foreground">Note: {rule.review_note}</p>
                          )}
                        </div>
                        <div className="flex shrink-0 items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => handleEditRule(rule)}
                            title="Edit rule"
                          >
                            <Pencil className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 hover:bg-destructive/10"
                            onClick={() => handleDeleteRule(rule.id)}
                            title="Delete rule"
                          >
                            <Trash2 className="h-3 w-3 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!selectedGap} onOpenChange={(open) => { if (!open) closeGapDialog(); }}>
        <DialogContent className="flex max-h-[90vh] max-w-2xl flex-col gap-0 overflow-hidden p-0">
          <DialogHeader className="shrink-0 border-b border-border px-6 pb-4 pt-6">
            <DialogTitle>
              {gapDialogMode === 'add' ? 'Add as supplemental rule' : 'Edit before adding as supplemental rule'}
            </DialogTitle>
          </DialogHeader>

          <div className="flex-1 space-y-4 overflow-y-auto px-6 py-4">
            <div>
              <Label className="text-xs text-muted-foreground">Original query</Label>
              <p className="mt-1 rounded-lg bg-muted p-3 text-sm">{selectedGap?.user_query}</p>
            </div>

            {gapDialogMode === 'edit' ? (
              <div className="space-y-1.5">
                <Label className="text-xs">Rule text</Label>
                <RichTextEditor
                  value={ruleText}
                  onChange={setRuleText}
                  placeholder="Edit the response into a clear, concise rule..."
                  className="min-h-[280px]"
                />
                <p className="text-xs text-muted-foreground">
                  Refine Tomas&apos; response into a clear rule. This will be used as supplemental guidance.
                </p>
              </div>
            ) : (
              <div className="space-y-1.5">
                <Label className="text-xs">Rule preview</Label>
                <div className="max-h-[320px] overflow-y-auto rounded-2xl border border-border/50 bg-card p-4 pr-3 shadow-sm">
                  <div
                    className="prose prose-sm max-w-none text-sm dark:prose-invert"
                    dangerouslySetInnerHTML={{ __html: formatRichContent(ruleText) }}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  This will be added to Supplemental rules exactly as shown.
                </p>
              </div>
            )}

            <div className="space-y-1.5">
              <Label className="text-xs">
                Review note <span className="text-muted-foreground">(optional)</span>
              </Label>
              <Textarea
                value={reviewNote}
                onChange={(event) => setReviewNote(event.target.value)}
                placeholder="Add context about why this rule was added, any caveats, etc."
                className="min-h-[100px] resize-y text-sm"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Your name</Label>
              <Input
                value={reviewerName}
                onChange={(event) => setReviewerName(event.target.value)}
                placeholder="Enter your name"
              />
            </div>
          </div>

          <div className="flex shrink-0 justify-end gap-2 border-t border-border bg-background px-6 py-4">
            <Button variant="outline" onClick={closeGapDialog}>
              Cancel
            </Button>
            <Button onClick={handlePromoteToRule} disabled={!ruleText.trim() || !reviewerName.trim()}>
              <Plus className="mr-2 h-4 w-4" />
              {gapDialogMode === 'edit' ? 'Save and add rule' : 'Add rule'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!editingRuleId} onOpenChange={(open) => { if (!open) setEditingRuleId(null); }}>
        <DialogContent className="flex max-h-[90vh] max-w-2xl flex-col gap-0 overflow-hidden p-0">
          <DialogHeader className="shrink-0 border-b border-border px-6 pb-4 pt-6">
            <DialogTitle>Edit supplemental rule</DialogTitle>
          </DialogHeader>

          <div className="flex-1 space-y-4 overflow-y-auto px-6 py-4">
            <div className="space-y-1.5">
              <Label className="text-xs">Rule text</Label>
              <RichTextEditor
                value={editRuleText}
                onChange={setEditRuleText}
                placeholder="Edit rule..."
                className="min-h-[280px]"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">
                Review note <span className="text-muted-foreground">(optional)</span>
              </Label>
              <Textarea
                value={editReviewNote}
                onChange={(event) => setEditReviewNote(event.target.value)}
                placeholder="Update review note..."
                className="min-h-[100px] resize-y text-sm"
              />
            </div>
          </div>

          <div className="flex shrink-0 justify-end gap-2 border-t border-border bg-background px-6 py-4">
            <Button variant="outline" onClick={() => setEditingRuleId(null)}>
              <X className="mr-2 h-4 w-4" />
              Cancel
            </Button>
            <Button onClick={handleSaveRuleEdit} disabled={!editRuleText.trim()}>
              <Save className="mr-2 h-4 w-4" />
              Save changes
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
