import { ArrowLeft, Book, FileText, MessageSquare, Languages, Settings, History, CheckCircle, Zap, Shield } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';

const Documentation = () => {
  return (
    <div className="min-h-screen tina-gradient-bg">
      <div className="max-w-4xl mx-auto p-6 pb-20">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link to="/">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold font-display">TINA 2 Documentation</h1>
            <p className="text-muted-foreground">Plain language translation assistant</p>
          </div>
        </div>

        <ScrollArea className="h-[calc(100vh-150px)]">
          <div className="space-y-8 pr-4">
            {/* Introduction */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Book className="w-5 h-5 text-primary" />
                  What is TINA 2?
                </CardTitle>
              </CardHeader>
              <CardContent className="prose prose-sm dark:prose-invert max-w-none">
                <p>
                  TINA 2 is a plain language translation assistant. It helps you translate text between languages 
                  and check your content against style guides.
                </p>
                <p>
                  The app focuses on clarity and simplicity. Every translation aims to be easy to read and understand.
                </p>
                <h4>Key features:</h4>
                <ul>
                  <li><strong>Translation</strong> — Translate text or screenshots between languages</li>
                  <li><strong>Style Guide Check</strong> — Check content against your style guide rules</li>
                  <li><strong>History</strong> — Access your recent translations quickly</li>
                  <li><strong>Local storage</strong> — All data stays on your device</li>
                </ul>
              </CardContent>
            </Card>

            {/* Translation Feature */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Languages className="w-5 h-5 text-primary" />
                  Translation
                </CardTitle>
              </CardHeader>
              <CardContent className="prose prose-sm dark:prose-invert max-w-none">
                <h4>How to translate text</h4>
                <ol>
                  <li>Click <strong>Translations</strong> on the home screen</li>
                  <li>Choose <strong>Plain Text</strong> or <strong>Screenshot</strong></li>
                  <li>Enter or paste your text (or upload a screenshot)</li>
                  <li>Select your target language</li>
                  <li>Choose a tone: Functional or Marketing</li>
                  <li>Click <strong>Translate</strong></li>
                </ol>

                <Separator className="my-4" />

                <h4>Translation modes</h4>
                <p><strong>Plain Text</strong> — Type or paste text directly. Best for documents, emails, and web content.</p>
                <p><strong>Screenshot</strong> — Upload an image with text. The app extracts the text automatically using OCR.</p>

                <Separator className="my-4" />

                <h4>Tone options</h4>
                <p><strong>Functional</strong> — Clear and direct. Best for technical content, instructions, and formal documents.</p>
                <p><strong>Marketing</strong> — Persuasive and culturally adapted. Best for promotional content and advertising.</p>

                <Separator className="my-4" />

                <h4>Custom requirements</h4>
                <p>
                  Add specific instructions for your translation. For example: "Keep currency in GBP" or 
                  "Use informal tone" or "Preserve formatting".
                </p>

                <Separator className="my-4" />

                <h4>Results</h4>
                <p>Your translation appears in segments. Each segment shows:</p>
                <ul>
                  <li>The original text</li>
                  <li>The translated text</li>
                  <li>A brief explanation of key translation choices</li>
                </ul>
                <p>
                  Use <strong>Continuous View</strong> to see the full translation as a single block of text. 
                  This makes it easier to copy and paste.
                </p>
              </CardContent>
            </Card>

            {/* Style Guide Check */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-primary" />
                  Style Guide Check
                </CardTitle>
              </CardHeader>
              <CardContent className="prose prose-sm dark:prose-invert max-w-none">
                <p>
                  Check your English content against your style guide rules. The app finds issues and suggests improvements.
                </p>

                <h4>Two modes</h4>

                <p><strong>Q&A Chat</strong></p>
                <p>
                  Ask questions about style guidelines and content best practices. The AI acts as an expert 
                  Content Designer and uses your uploaded style guide to answer.
                </p>
                <p>Examples:</p>
                <ul>
                  <li>"How should I write dates?"</li>
                  <li>"What tone should I use for error messages?"</li>
                  <li>"Is it okay to use contractions?"</li>
                </ul>

                <Separator className="my-4" />

                <p><strong>Compliance Checker</strong></p>
                <p>
                  Paste up to 250 words of English content. The app checks it against your style guide and returns:
                </p>
                <ul>
                  <li><strong>Issues</strong> — Problems found, with severity levels (high, medium, low)</li>
                  <li><strong>Suggestions</strong> — Specific fixes for each issue</li>
                  <li><strong>Rewritten content</strong> — A fully corrected version</li>
                </ul>
                <p>
                  You can accept individual suggestions or edit the rewritten content before copying it.
                </p>
              </CardContent>
            </Card>

            {/* Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="w-5 h-5 text-primary" />
                  Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="prose prose-sm dark:prose-invert max-w-none">
                <p>
                  Access settings by clicking the gear icon. Settings are password protected.
                </p>

                <h4>What you can configure</h4>

                <p><strong>Custom instructions</strong></p>
                <p>
                  Add rules for how translations into English should be handled. These apply to all translations.
                </p>

                <p><strong>Glossary</strong></p>
                <p>
                  Define term mappings. For example: "utilise → use" or "commence → start". 
                  You can add terms one by one or import them in bulk.
                </p>

                <p><strong>Style guide document</strong></p>
                <p>
                  Upload a PDF or Word document. The app extracts the text and uses it for Style Guide Check features.
                </p>

                <p><strong>Brand and industry</strong></p>
                <p>
                  Set your brand name and industry sector. The AI uses this context to give better answers.
                </p>
              </CardContent>
            </Card>

            {/* History */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <History className="w-5 h-5 text-primary" />
                  History
                </CardTitle>
              </CardHeader>
              <CardContent className="prose prose-sm dark:prose-invert max-w-none">
                <p>
                  The app stores your last 50 translations on your device. Click the history icon to see them.
                </p>
                <p>For each translation you can:</p>
                <ul>
                  <li><strong>View</strong> — See the full results again</li>
                  <li><strong>Reuse</strong> — Start a new translation with the same settings</li>
                  <li><strong>Delete</strong> — Remove it from history</li>
                </ul>
                <p>
                  You can also clear all history at once.
                </p>
              </CardContent>
            </Card>

            {/* Privacy */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-primary" />
                  Privacy and Data
                </CardTitle>
              </CardHeader>
              <CardContent className="prose prose-sm dark:prose-invert max-w-none">
                <p>
                  TINA 2 stores all data locally on your device. This includes:
                </p>
                <ul>
                  <li>Translation history</li>
                  <li>Settings and preferences</li>
                  <li>Style guide documents</li>
                  <li>Glossary terms</li>
                  <li>Chat conversations</li>
                </ul>
                <p>
                  <strong>Nothing is stored on a server.</strong> Your data stays with you.
                </p>
                <p>
                  When you translate or check content, the text is sent to the AI service to process. 
                  The AI does not store your content after processing.
                </p>
              </CardContent>
            </Card>

            {/* Tips */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="w-5 h-5 text-primary" />
                  Tips for Best Results
                </CardTitle>
              </CardHeader>
              <CardContent className="prose prose-sm dark:prose-invert max-w-none">
                <h4>Translation</h4>
                <ul>
                  <li>Break long documents into smaller sections</li>
                  <li>Use clear screenshots with readable text</li>
                  <li>Add custom requirements for specific needs</li>
                  <li>Choose the right tone for your audience</li>
                </ul>

                <Separator className="my-4" />

                <h4>Style Guide Check</h4>
                <ul>
                  <li>Upload your style guide document first</li>
                  <li>Add common terminology to the glossary</li>
                  <li>Keep content under 250 words for best results</li>
                  <li>Review AI suggestions — they may need tweaking</li>
                </ul>

                <Separator className="my-4" />

                <h4>Important</h4>
                <p className="text-muted-foreground">
                  Always get a native speaker or editor to review translations before use. 
                  AI translations are helpful but may contain errors.
                </p>
              </CardContent>
            </Card>

            {/* Footer disclaimer */}
            <div className="text-center text-sm text-muted-foreground py-6">
              <p>TINA 2 — Plain language translation assistant</p>
              <p className="mt-2">
                Please get a native speaker or editor to review translations before use.
              </p>
            </div>
          </div>
        </ScrollArea>
      </div>
    </div>
  );
};

export default Documentation;
