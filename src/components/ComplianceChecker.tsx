import { useState } from 'react';
import { FileCheck, AlertTriangle, AlertCircle, Info, Check, Edit2, Download, Copy } from 'lucide-react';
import { RichTextEditor } from '@/components/RichTextEditor';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { useGlobalSettings } from '@/hooks/useSettingsStorage';
import { checkCompliance } from '@/services/styleGuideService';
import type { ComplianceResult, ComplianceIssue, ComplianceSeverity } from '@/types/translation';

const MAX_WORDS = 250;

// Helper function to format rewritten content for display
function formatRewrittenContent(text: string): string {
  return text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/\n/g, '<br/>');
}

const severityConfig: Record<ComplianceSeverity, { icon: React.ElementType; color: string; label: string }> = {
  high: { icon: AlertCircle, color: 'text-destructive', label: 'High' },
  medium: { icon: AlertTriangle, color: 'text-amber-500', label: 'Medium' },
  low: { icon: Info, color: 'text-blue-500', label: 'Low' },
};

export function ComplianceChecker() {
  const { toast } = useToast();
  const { settings } = useGlobalSettings();
  
  const [content, setContent] = useState('');
  const [isChecking, setIsChecking] = useState(false);
  const [result, setResult] = useState<ComplianceResult | null>(null);
  const [acceptedIssues, setAcceptedIssues] = useState<Set<string>>(new Set());
  const [editedRewrite, setEditedRewrite] = useState('');
  const [isEditingRewrite, setIsEditingRewrite] = useState(false);

  const wordCount = content.trim().split(/\s+/).filter(Boolean).length;
  const isOverLimit = wordCount > MAX_WORDS;

  const handleCheck = async () => {
    if (!content.trim() || isOverLimit || isChecking) return;

    setIsChecking(true);
    setResult(null);
    setAcceptedIssues(new Set());

    try {
      const response = await checkCompliance(content, settings);
      setResult(response);
      setEditedRewrite(response.rewrittenContent);
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to check compliance',
        variant: 'destructive',
      });
    } finally {
      setIsChecking(false);
    }
  };

  const handleAcceptIssue = (issueId: string) => {
    setAcceptedIssues(prev => new Set([...prev, issueId]));
  };

  const handleAcceptAll = () => {
    if (result) {
      setAcceptedIssues(new Set(result.issues.map(i => i.id)));
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: 'Copied to clipboard' });
  };

  const handleExportReport = () => {
    if (!result) return;

    const report = `COMPLIANCE CHECK REPORT
Generated: ${new Date().toLocaleString()}

ORIGINAL CONTENT:
${content}

SUMMARY:
${result.summary}

ISSUES FOUND (${result.issues.length}):
${result.issues.map((issue, i) => `
${i + 1}. [${issue.severity.toUpperCase()}] ${issue.issue}
   Original: "${issue.originalText}"
   Suggestion: "${issue.suggestion}"
   Status: ${acceptedIssues.has(issue.id) ? 'Accepted' : 'Pending'}
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
            Paste your content below to check it against your style guide (max {MAX_WORDS} words).
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

      {/* Results Section */}
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
            <CardContent>
              <p className="text-muted-foreground">{result.summary}</p>
              <div className="flex gap-4 mt-4">
                <Badge variant="destructive">
                  {result.issues.filter(i => i.severity === 'high').length} High
                </Badge>
                <Badge className="bg-amber-500">
                  {result.issues.filter(i => i.severity === 'medium').length} Medium
                </Badge>
                <Badge className="bg-blue-500">
                  {result.issues.filter(i => i.severity === 'low').length} Low
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Issues List */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Issues ({result.issues.length})</CardTitle>
                {result.issues.length > 0 && (
                  <Button variant="outline" size="sm" onClick={handleAcceptAll}>
                    <Check className="w-4 h-4 mr-2" />
                    Accept All
                  </Button>
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
                ) : (
                  <div className="space-y-4">
                    {result.issues.map((issue) => (
                      <div
                        key={issue.id}
                        className={`p-4 rounded-lg border ${
                          acceptedIssues.has(issue.id) ? 'bg-primary/5 border-primary/20' : 'bg-muted/50'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 space-y-2">
                            <div className="flex items-center gap-2">
                              <SeverityIcon severity={issue.severity} />
                              <Badge variant="outline">{severityConfig[issue.severity].label}</Badge>
                            </div>
                            <p className="font-medium">{issue.issue}</p>
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
                          <div className="flex gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleCopy(issue.suggestion)}
                            >
                              <Copy className="w-4 h-4" />
                            </Button>
                            {!acceptedIssues.has(issue.id) && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleAcceptIssue(issue.id)}
                              >
                                <Check className="w-4 h-4 mr-1" />
                                Accept
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
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
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsEditingRewrite(!isEditingRewrite)}
                  >
                    <Edit2 className="w-4 h-4 mr-2" />
                    {isEditingRewrite ? 'Done' : 'Edit'}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleCopy(editedRewrite || result.rewrittenContent)}
                  >
                    <Copy className="w-4 h-4 mr-2" />
                    Copy
                  </Button>
                </div>
              </div>
              <CardDescription>
                AI-generated compliant version with all suggestions applied.
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
