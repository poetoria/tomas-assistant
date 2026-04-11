import { useState, useEffect, useMemo } from 'react';
import { FileCheck, AlertTriangle, AlertCircle, Info, Check, X, Edit2, Download, Copy, HelpCircle, ShieldCheck, ShieldAlert } from 'lucide-react';
import DOMPurify from 'dompurify';
import { RichTextEditor } from '@/components/RichTextEditor';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useToast } from '@/hooks/use-toast';
import { useGlobalSettings } from '@/hooks/useSettingsStorage';
import { checkCompliance } from '@/services/styleGuideService';
import type { ComplianceResult, ComplianceSeverity } from '@/types/translation';

const MAX_WORDS = 250;

const CONTENT_TYPES = [
  'Marketing',
  'Promotional offer',
  'Safer gambling',
  'Verification / KYC / AML',
  'Account restriction / intervention',
  'Transactional / service update',
  'Help / support',
  'Legal / terms / policy',
  'UI microcopy',
  'Other',
] as const;

type ContentType = (typeof CONTENT_TYPES)[number];

const TYPE_KEYWORDS: Record<string, ContentType> = {
  bonus: 'Promotional offer',
  'free spins': 'Promotional offer',
  'free bet': 'Promotional offer',
  deposit: 'Promotional offer',
  wagering: 'Promotional offer',
  promo: 'Promotional offer',
  offer: 'Promotional offer',
  responsible: 'Safer gambling',
  'safer gambling': 'Safer gambling',
  'self-exclusion': 'Safer gambling',
  'deposit limit': 'Safer gambling',
  'cool off': 'Safer gambling',
  'take a break': 'Safer gambling',
  gamstop: 'Safer gambling',
  verify: 'Verification / KYC / AML',
  kyc: 'Verification / KYC / AML',
  aml: 'Verification / KYC / AML',
  identity: 'Verification / KYC / AML',
  document: 'Verification / KYC / AML',
  passport: 'Verification / KYC / AML',
  suspended: 'Account restriction / intervention',
  restricted: 'Account restriction / intervention',
  closed: 'Account restriction / intervention',
  intervention: 'Account restriction / intervention',
  confirm: 'Transactional / service update',
  update: 'Transactional / service update',
  transaction: 'Transactional / service update',
  receipt: 'Transactional / service update',
  help: 'Help / support',
  support: 'Help / support',
  contact: 'Help / support',
  faq: 'Help / support',
  terms: 'Legal / terms / policy',
  conditions: 'Legal / terms / policy',
  privacy: 'Legal / terms / policy',
  policy: 'Legal / terms / policy',
  legal: 'Legal / terms / policy',
  button: 'UI microcopy',
  label: 'UI microcopy',
  placeholder: 'UI microcopy',
  tooltip: 'UI microcopy',
  cta: 'UI microcopy',
  campaign: 'Marketing',
  brand: 'Marketing',
  launch: 'Marketing',
  awareness: 'Marketing',
};

function detectContentType(text: string): ContentType {
  const lower = text.toLowerCase();
  const scores: Partial<Record<ContentType, number>> = {};
  for (const [keyword, type] of Object.entries(TYPE_KEYWORDS)) {
    const regex = new RegExp(`\\b${keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');
    const matches = lower.match(regex);
    if (matches) {
      scores[type] = (scores[type] || 0) + matches.length;
    }
  }
  const entries = Object.entries(scores) as [ContentType, number][];
  if (entries.length === 0) return 'Other';
  entries.sort((a, b) => b[1] - a[1]);
  return entries[0][0];
}

function formatRewrittenContent(text: string): string {
  const formatted = text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/\n/g, '<br/>');
  return DOMPurify.sanitize(formatted);
}

const severityConfig: Record<ComplianceSeverity, { icon: React.ElementType; color: string; label: string }> = {
  high: { icon: AlertCircle, color: 'text-destructive', label: 'High' },
  medium: { icon: AlertTriangle, color: 'text-amber-500', label: 'Medium' },
  low: { icon: Info, color: 'text-blue-500', label: 'Low' },
};

type IssueStatus = 'pending' | 'accepted' | 'rejected';

export function ComplianceChecker() {
  const { toast } = useToast();
  const { settings } = useGlobalSettings();

  const [content, setContent] = useState('');
  const [isChecking, setIsChecking] = useState(false);
  const [result, setResult] = useState<ComplianceResult | null>(null);
  const [editedRewrite, setEditedRewrite] = useState('');
  const [isEditingRewrite, setIsEditingRewrite] = useState(false);

  // Content type state
  const [detectedContentType, setDetectedContentType] = useState<ContentType>('Other');
  const [selectedContentType, setSelectedContentType] = useState<ContentType>('Other');
  const [isManualTypeOverride, setIsManualTypeOverride] = useState(false);

  // Issue statuses
  const [issueStatuses, setIssueStatuses] = useState<Record<string, IssueStatus>>({});

  const wordCount = content.trim().split(/\s+/).filter(Boolean).length;
  const isOverLimit = wordCount > MAX_WORDS;

  // Auto-detect content type
  useEffect(() => {
    if (wordCount >= 10) {
      const detected = detectContentType(content);
      setDetectedContentType(detected);
      if (!isManualTypeOverride) {
        setSelectedContentType(detected);
      }
    } else {
      setDetectedContentType('Other');
      if (!isManualTypeOverride) {
        setSelectedContentType('Other');
      }
    }
  }, [content, wordCount, isManualTypeOverride]);

  const handleTypeChange = (value: string) => {
    setSelectedContentType(value as ContentType);
    setIsManualTypeOverride(value !== detectedContentType);
  };

  const handleCheck = async () => {
    if (!content.trim() || isOverLimit || isChecking) return;
    setIsChecking(true);
    setResult(null);
    setIssueStatuses({});

    try {
      const response = await checkCompliance(content, settings, selectedContentType);
      setResult(response);
      setEditedRewrite(response.rewrittenContent);
      const statuses: Record<string, IssueStatus> = {};
      response.issues.forEach(i => { statuses[i.id] = 'pending'; });
      setIssueStatuses(statuses);
    } catch (error) {
      toast({ title: 'Error', description: error instanceof Error ? error.message : 'Failed to check compliance', variant: 'destructive' });
    } finally {
      setIsChecking(false);
    }
  };

  const setStatus = (id: string, status: IssueStatus) => {
    setIssueStatuses(prev => ({ ...prev, [id]: status }));
  };

  const handleAcceptAll = () => {
    if (!result) return;
    const updated: Record<string, IssueStatus> = {};
    result.issues.forEach(i => { updated[i.id] = 'accepted'; });
    setIssueStatuses(updated);
  };

  const handleRejectAll = () => {
    if (!result) return;
    const updated: Record<string, IssueStatus> = {};
    result.issues.forEach(i => { updated[i.id] = 'rejected'; });
    setIssueStatuses(updated);
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: 'Copied to clipboard' });
  };

  const statusCounts = useMemo(() => {
    const values = Object.values(issueStatuses);
    return {
      accepted: values.filter(s => s === 'accepted').length,
      rejected: values.filter(s => s === 'rejected').length,
      pending: values.filter(s => s === 'pending').length,
    };
  }, [issueStatuses]);

  const allRejected = result && result.issues.length > 0 && statusCounts.rejected === result.issues.length;

  const handleExportReport = () => {
    if (!result) return;
    const report = `COMPLIANCE CHECK REPORT
Generated: ${new Date().toLocaleString()}
Content type: ${selectedContentType}${isManualTypeOverride ? ' (manual selection)' : ' (auto-detected)'}

ORIGINAL CONTENT:
${content}

SUMMARY:
${result.summary}

ISSUES FOUND (${result.issues.length}):
${result.issues.map((issue, i) => `
${i + 1}. [${issue.severity.toUpperCase()}] ${issue.issue}
   Original: "${issue.originalText}"
   Suggestion: "${issue.suggestion}"
   Status: ${(issueStatuses[issue.id] || 'pending').charAt(0).toUpperCase() + (issueStatuses[issue.id] || 'pending').slice(1)}
`).join('')}

REWRITTEN CONTENT:
${editedRewrite || result.rewrittenContent}
`;
    const blob = new Blob([report], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `compliance-report-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const SeverityIcon = ({ severity }: { severity: ComplianceSeverity }) => {
    const config = severityConfig[severity];
    const Icon = config.icon;
    return <Icon className={`w-4 h-4 ${config.color}`} />;
  };

  return (
    <div className="space-y-6">
      {/* Input Section */}
      <Card>
        <CardHeader>
          <CardTitle>Content Input</CardTitle>
          <CardDescription>
            Paste your English content below. Tomas will find style guide or compliance issues and suggest clear improvements.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="relative">
            <RichTextEditor
              value={content}
              onChange={setContent}
              placeholder="Paste or type your content here..."
              className="min-h-[200px]"
            />
            <div className={`absolute bottom-3 right-3 text-xs ${isOverLimit ? 'text-destructive' : 'text-muted-foreground'}`}>
              {wordCount}/{MAX_WORDS} words
            </div>
          </div>

          {/* Content Type Selector */}
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>Detected content type:</span>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <HelpCircle className="w-3.5 h-3.5 text-muted-foreground/60 cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent side="top" className="max-w-[240px]">
                    <p className="text-xs">This helps Tomas apply the most relevant compliance rules and writing guidance.</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <Select value={selectedContentType} onValueChange={handleTypeChange}>
              <SelectTrigger className="w-[260px] h-8 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CONTENT_TYPES.map(type => (
                  <SelectItem key={type} value={type}>{type}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {isManualTypeOverride && (
              <Badge variant="outline" className="text-xs">Manual selection</Badge>
            )}
          </div>

          <Button
            onClick={handleCheck}
            disabled={!content.trim() || isOverLimit || isChecking}
            className="w-full sm:w-auto"
          >
            <FileCheck className="w-4 h-4 mr-2" />
            {isChecking ? 'Checking...' : 'Check Compliance'}
          </Button>
        </CardContent>
      </Card>

      {/* Results */}
      {result && (
        <>
          {/* Summary */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Results Summary</CardTitle>
                <Button variant="outline" size="sm" onClick={handleExportReport}>
                  <Download className="w-4 h-4 mr-2" />
                  Export Report
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Checked as: <span className="font-medium text-foreground">{selectedContentType}</span>
              </p>
              {result.validated === true && (
                <div className="flex items-center gap-2 text-sm text-primary">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Suggestions verified — all fixes pass the same rules</span>
                </div>
              )}
              {result.validated === false && (
                <div className="flex items-center gap-2 text-sm text-amber-600 dark:text-amber-400">
                  <ShieldAlert className="w-4 h-4" />
                  <span>{result.validationNote || 'Some suggestions could not be fully validated'}</span>
                </div>
              )}
              <div
                className="prose prose-sm dark:prose-invert max-w-none text-muted-foreground"
                dangerouslySetInnerHTML={{ __html: formatRewrittenContent(result.summary) }}
              />
              <div className="flex gap-3 flex-wrap">
                <Badge variant="destructive" className="text-sm px-3 py-1">
                  {result.issues.filter(i => i.severity === 'high').length} High
                </Badge>
                <Badge className="bg-amber-500 text-sm px-3 py-1">
                  {result.issues.filter(i => i.severity === 'medium').length} Medium
                </Badge>
                <Badge className="bg-blue-500 text-sm px-3 py-1">
                  {result.issues.filter(i => i.severity === 'low').length} Low
                </Badge>
              </div>
              {result.issues.length > 0 && (
                <div className="flex gap-3 text-sm text-muted-foreground pt-1">
                  <span>{statusCounts.accepted} accepted</span>
                  <span>·</span>
                  <span>{statusCounts.rejected} rejected</span>
                  <span>·</span>
                  <span>{statusCounts.pending} pending</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Issues List */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Issues ({result.issues.length})</CardTitle>
                {result.issues.length > 0 && (
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={handleAcceptAll}>
                      <Check className="w-4 h-4 mr-1" />
                      Accept All
                    </Button>
                    <Button variant="outline" size="sm" onClick={handleRejectAll}>
                      <X className="w-4 h-4 mr-1" />
                      Reject All
                    </Button>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                {result.issues.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Check className="w-12 h-12 mx-auto mb-4 text-primary" />
                    <p>No issues found! Your content complies with the style guide.</p>
                  </div>
                ) : allRejected ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <p>No suggestions were applied.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {result.issues.map((issue) => {
                      const status = issueStatuses[issue.id] || 'pending';
                      return (
                        <div
                          key={issue.id}
                          className={`p-4 rounded-lg border ${
                            status === 'accepted'
                              ? 'bg-primary/5 border-primary/20'
                              : status === 'rejected'
                              ? 'bg-muted/30 border-muted opacity-60'
                              : 'bg-muted/50'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 space-y-2">
                              <div className="flex items-center gap-2">
                                <SeverityIcon severity={issue.severity} />
                                <Badge variant="outline">{severityConfig[issue.severity].label}</Badge>
                                {status === 'accepted' && <Badge className="bg-primary/10 text-primary text-xs">Accepted</Badge>}
                                {status === 'rejected' && <Badge variant="secondary" className="text-xs">Rejected</Badge>}
                              </div>
                              <p className={`font-medium ${status === 'rejected' ? 'line-through' : ''}`}>{issue.issue}</p>
                              <div className="text-sm space-y-1">
                                <p>
                                  <span className="text-muted-foreground">Original: </span>
                                  <span className="line-through text-destructive/70">"{issue.originalText}"</span>
                                </p>
                                <p>
                                  <span className="text-muted-foreground">Suggestion: </span>
                                  <span className="text-primary">"{issue.suggestion}"</span>
                                </p>
                              </div>
                            </div>
                            <div className="flex gap-2 shrink-0">
                              <Button variant="ghost" size="icon" onClick={() => handleCopy(issue.suggestion)}>
                                <Copy className="w-4 h-4" />
                              </Button>
                              {status === 'pending' && (
                                <>
                                  <Button variant="outline" size="sm" onClick={() => setStatus(issue.id, 'accepted')}>
                                    <Check className="w-4 h-4 mr-1" />
                                    Accept
                                  </Button>
                                  <Button variant="outline" size="sm" onClick={() => setStatus(issue.id, 'rejected')}>
                                    <X className="w-4 h-4 mr-1" />
                                    Reject
                                  </Button>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Rewritten Content */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Rewritten Content</CardTitle>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => setIsEditingRewrite(!isEditingRewrite)}>
                    <Edit2 className="w-4 h-4 mr-2" />
                    {isEditingRewrite ? 'Done' : 'Edit'}
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => handleCopy(editedRewrite || result.rewrittenContent)}>
                    <Copy className="w-4 h-4 mr-2" />
                    Copy
                  </Button>
                </div>
              </div>
              <CardDescription>
                A corrected version from Tomas with all suggestions applied. Review before using.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isEditingRewrite ? (
                <RichTextEditor
                  value={editedRewrite}
                  onChange={setEditedRewrite}
                  className="min-h-[200px]"
                />
              ) : (
                <div
                  className="p-4 rounded-lg bg-primary/5 border border-primary/20 prose prose-sm dark:prose-invert max-w-none"
                  dangerouslySetInnerHTML={{ __html: formatRewrittenContent(editedRewrite || result.rewrittenContent) }}
                />
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
