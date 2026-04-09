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

  useEffect(() => { fetchData(); }, [fetchData]);

  const updateGapStatus = async (id: string, status: string) => {
    await supabase.from('style_guide_gaps').update({ status } as any).eq('id', id);
    setGaps(prev => prev.map(g => g.id === id ? { ...g, status } : g));
  };

  const handlePromoteToRule = async () => {
    if (!selectedGap || !ruleText.trim()) return;
    if (!reviewerName.trim()) {
      toast({ title: 'Reviewer name required', description: 'Please enter your name before adding a rule.', variant: 'destructive' });
      return;
    }
    const { error } = await supabase.from('supplemental_rules').insert({
      rule_text: ruleText.trim(),
      source_gap_id: selectedGap.id,
      source_query: selectedGap.user_query,
      review_note: reviewNote.trim() || null,
      reviewer_name: reviewerName.trim(),
    } as any);
    if (error) {
      toast({ title: 'Failed to add rule', variant: 'destructive' });
      return;
    }
    await updateGapStatus(selectedGap.id, 'added');
    setSelectedGap(null);
    setRuleText('');
    setReviewNote('');
    fetchData();
    toast({ title: 'Rule added', description: 'This rule will now be used by Tomas.' });
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
    } as any).eq('id', editingRuleId);
    if (error) {
      toast({ title: 'Failed to update rule', variant: 'destructive' });
      return;
    }
    setRules(prev => prev.map(r => r.id === editingRuleId ? { ...r, rule_text: editRuleText.trim(), review_note: editReviewNote.trim() || null } : r));
    setEditingRuleId(null);
    toast({ title: 'Rule updated' });
  };

  const handleDeleteGap = async (id: string) => {
    await supabase.from('style_guide_gaps').delete().eq('id', id);
    setGaps(prev => prev.filter(g => g.id !== id));
    toast({ title: 'Gap removed' });
  };

  const handleDeleteRule = async (id: string) => {
    await supabase.from('supplemental_rules').delete().eq('id', id);
    setRules(prev => prev.filter(r => r.id !== id));
    toast({ title: 'Rule removed' });
  };

  const handleExportRules = () => {
    const exportData = rules.map(r => ({ query: r.source_query, rule: r.rule_text, reviewer: r.reviewer_name, note: r.review_note, created: r.created_at }));
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `supplemental-rules-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const filtered = gaps
    .filter(g => {
      if (statusFilter !== 'all' && g.status !== statusFilter) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        return g.user_query.toLowerCase().includes(q) || g.tomas_response.toLowerCase().includes(q);
      }
      return true;
    })
    .sort((a, b) => sortOrder === 'newest'
      ? new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      : new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );

  const formatDate = (d: string) => new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

  return (
    <div className="space-y-6">
      {/* Gaps List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Content gaps</span>
            <Badge variant="outline" className="font-normal">{gaps.filter(g => g.status === 'new').length} new</Badge>
          </CardTitle>
          <CardDescription>Queries where Tomas inferred an answer because the style guide didn't explicitly cover the topic.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Search queries..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All status</SelectItem>
                <SelectItem value="new">New</SelectItem>
                <SelectItem value="reviewed">Reviewed</SelectItem>
                <SelectItem value="added">Added</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="icon" onClick={() => setSortOrder(s => s === 'newest' ? 'oldest' : 'newest')} title={sortOrder === 'newest' ? 'Showing newest first' : 'Showing oldest first'}>
              {sortOrder === 'newest' ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
            </Button>
          </div>

          {/* List */}
          <ScrollArea className="max-h-[500px] overflow-visible">
            {loading ? (
              <p className="text-center text-muted-foreground py-8">Loading...</p>
            ) : filtered.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <AlertTriangle className="w-8 h-8 mx-auto mb-3 opacity-50" />
                <p className="text-sm">{gaps.length === 0 ? 'No gaps detected yet. Ask Tomas questions to start capturing uncovered topics.' : 'No matching gaps.'}</p>
              </div>
            ) : (
              <div className="space-y-2">
                {filtered.map((gap) => {
                  const statusCfg = STATUS_CONFIG[gap.status] || STATUS_CONFIG.new;
                  const isExpanded = expandedId === gap.id;
                  return (
                    <div key={gap.id} className="rounded-lg border border-border bg-muted/30 overflow-hidden">
                      <div className="flex items-start gap-3 p-3 cursor-pointer hover:bg-muted/50 transition-colors"
                        onClick={() => setExpandedId(isExpanded ? null : gap.id)}>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium line-clamp-2">{gap.user_query}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${statusCfg.color}`}>
                              {statusCfg.icon}
                              <span className="ml-1">{statusCfg.label}</span>
                            </Badge>
                            <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                              <Clock className="w-3 h-3" />{formatDate(gap.created_at)}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 shrink-0 mt-0.5">
                          <Button variant="ghost" size="icon" className="h-7 w-7 hover:bg-destructive/10"
                            onClick={(e) => { e.stopPropagation(); handleDeleteGap(gap.id); }}
                            title="Delete gap">
                            <Trash2 className="w-3.5 h-3.5 text-destructive" />
                          </Button>
                          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </div>
                      </div>
                      {isExpanded && (
                        <div className="px-3 pb-3 border-t border-border pt-3">
                          <div className="max-h-[200px] overflow-y-auto space-y-3 mb-3">
                            <div>
                              <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Tomas response</p>
                              <div
                                className="text-xs text-muted-foreground prose prose-xs dark:prose-invert max-w-none"
                                dangerouslySetInnerHTML={{ __html: formatRichContent(gap.tomas_response) }}
                              />
                            </div>
                            {gap.confidence_signal && (
                              <div>
                                <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Signal</p>
                                <p className="text-xs text-muted-foreground">{gap.confidence_signal}</p>
                              </div>
                            )}
                          </div>
                          {/* Action bar — always visible outside scrollable area */}
                          <div className="flex items-center gap-2 pt-2 border-t border-border/50">
                            <Button size="sm" variant="default" className="shrink-0" onClick={(e) => { e.stopPropagation(); setSelectedGap(gap); setRuleText(gap.tomas_response); setReviewNote(''); }}>
                              <Plus className="w-3 h-3 mr-1" />Add as rule
                            </Button>
                            {gap.status === 'new' && (
                              <Button size="sm" variant="outline" className="shrink-0" onClick={(e) => { e.stopPropagation(); updateGapStatus(gap.id, 'reviewed'); }}>
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

      {/* Supplemental Rules */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Supplemental rules</span>
            <div className="flex gap-2">
              {rules.length > 0 && (
                <Button variant="outline" size="sm" onClick={handleExportRules}>
                  <Download className="w-4 h-4 mr-2" />Export JSON
                </Button>
              )}
            </div>
          </CardTitle>
          <CardDescription>Working rules created from gaps. These are used by Tomas but kept separate from the main style guide.</CardDescription>
        </CardHeader>
        <CardContent>
          {rules.length === 0 ? (
            <p className="text-center text-muted-foreground py-6 text-sm">No supplemental rules yet. Promote gaps to create working rules.</p>
          ) : (
            <ScrollArea className="max-h-[400px]">
              <div className="space-y-2">
                {rules.map((rule) => {
                  const isEditing = editingRuleId === rule.id;
                  return (
                    <div key={rule.id} className="rounded-lg border border-border bg-muted/30 overflow-hidden">
                      {/* Rule header with query title */}
                      {rule.source_query && (
                        <div className="px-3 pt-2.5 pb-1">
                          <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-0.5">Query</p>
                          <p className="text-xs font-medium line-clamp-2">{rule.source_query}</p>
                        </div>
                      )}
                      <div className="p-3 pt-1.5">
                        {isEditing ? (
                          <div className="space-y-3">
                            <div>
                              <Label className="text-xs">Rule text</Label>
                              <RichTextEditor
                                value={editRuleText}
                                onChange={setEditRuleText}
                                placeholder="Edit rule..."
                                className="min-h-[120px] mt-1"
                              />
                            </div>
                            <div>
                              <Label className="text-xs">Review note <span className="text-muted-foreground">(optional)</span></Label>
                              <Textarea
                                value={editReviewNote}
                                onChange={(e) => setEditReviewNote(e.target.value)}
                                placeholder="Update review note..."
                                className="min-h-[60px] resize-y text-sm mt-1"
                              />
                            </div>
                            <div className="flex gap-2">
                              <Button size="sm" onClick={handleSaveRuleEdit} disabled={!editRuleText.trim()}>
                                <Save className="w-3 h-3 mr-1" />Save
                              </Button>
                              <Button size="sm" variant="outline" onClick={() => setEditingRuleId(null)}>
                                <X className="w-3 h-3 mr-1" />Cancel
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-start gap-2">
                            <div className="flex-1 min-w-0">
                              <div className="text-sm prose prose-sm dark:prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: formatRichContent(rule.rule_text) }} />
                              <div className="flex items-center gap-2 mt-1.5 text-[10px] text-muted-foreground">
                                <span>{formatDate(rule.created_at)}</span>
                                {rule.reviewer_name && (
                                  <>
                                    <span>·</span>
                                    <span>by {rule.reviewer_name}</span>
                                  </>
                                )}
                              </div>
                              {rule.review_note && (
                                <p className="text-xs text-muted-foreground mt-1 italic">Note: {rule.review_note}</p>
                              )}
                            </div>
                            <div className="flex items-center gap-1 shrink-0">
                              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleEditRule(rule)} title="Edit rule">
                                <Pencil className="w-3 h-3" />
                              </Button>
                              <Button variant="ghost" size="icon" className="h-7 w-7 hover:bg-destructive/10" onClick={() => handleDeleteRule(rule.id)} title="Delete rule">
                                <Trash2 className="w-3 h-3 text-destructive" />
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      {/* Promote to Rule Modal */}
      <Dialog open={!!selectedGap} onOpenChange={(open) => { if (!open) { setSelectedGap(null); setRuleText(''); setReviewNote(''); } }}>
        <DialogContent className="max-w-xl">
          <DialogHeader><DialogTitle>Add as supplemental rule</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-xs text-muted-foreground">Original query</Label>
              <p className="text-sm mt-1 p-3 rounded-lg bg-muted">{selectedGap?.user_query}</p>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Rule text</Label>
              <RichTextEditor
                value={ruleText}
                onChange={setRuleText}
                placeholder="Edit the response into a clear, concise rule..."
                className="min-h-[150px]"
              />
              <p className="text-xs text-muted-foreground">Refine Tomas' response into a clear rule. This will be used as supplemental guidance.</p>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Review note <span className="text-muted-foreground">(optional)</span></Label>
              <Textarea
                value={reviewNote}
                onChange={(e) => setReviewNote(e.target.value)}
                placeholder="Add context about why this rule was added, any caveats, etc."
                className="min-h-[80px] resize-y text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Your name</Label>
              <Input
                value={reviewerName}
                onChange={(e) => setReviewerName(e.target.value)}
                placeholder="Enter your name"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => { setSelectedGap(null); setRuleText(''); setReviewNote(''); }}>Cancel</Button>
              <Button onClick={handlePromoteToRule} disabled={!ruleText.trim() || !reviewerName.trim()}>
                <Plus className="w-4 h-4 mr-2" />Add rule
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
