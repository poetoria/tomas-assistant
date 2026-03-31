import { ArrowLeft, Book, MessageSquare, Settings, History, CheckCircle, Zap, Shield } from 'lucide-react';
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
            <h1 className="text-3xl font-bold font-display">Tomas documentation</h1>
            <p className="text-muted-foreground">AI-powered content governance tool for Unibet</p>
          </div>
        </div>

        <ScrollArea className="h-[calc(100vh-150px)]">
          <div className="space-y-8 pr-4">
            {/* Introduction */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Book className="w-5 h-5 text-primary" />
                  What is Tomas?
                </CardTitle>
              </CardHeader>
              <CardContent className="prose prose-sm dark:prose-invert max-w-none">
                <p>
                  Tomas is an AI-powered content governance tool built for Unibet. It turns the static style guide 
                  into a system that can be queried, applied, and enforced in real time.
                </p>
                <p>
                  Chat with Tomas to find the correct rules and UX writing patterns, or paste in content to check 
                  it against brand, terminology, and regulatory requirements.
                </p>
                <h4>Key features:</h4>
                <ul>
                  <li><strong>Style guide chat</strong> — Ask questions about Unibet's style guidelines and content standards</li>
                  <li><strong>Compliance check</strong> — Paste content and get style guide or compliance issues flagged</li>
                  <li><strong>History</strong> — Access your recent conversations</li>
                </ul>
              </CardContent>
            </Card>

            {/* Style Guide Check */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-primary" />
                  Style guide check
                </CardTitle>
              </CardHeader>
              <CardContent className="prose prose-sm dark:prose-invert max-w-none">
                <p>
                  Check your English content against Unibet's style guide rules. Tomas finds issues and suggests improvements.
                </p>

                <h4>Two modes</h4>

                <p><strong>Q&A chat</strong></p>
                <p>
                  Ask questions about Unibet's style guidelines and content standards. Tomas acts as an expert 
                  Content Designer and uses the uploaded style guide to answer.
                </p>
                <p>Examples:</p>
                <ul>
                  <li>"How do we write dates for Unibet?"</li>
                  <li>"What tone of voice should we use?"</li>
                  <li>"How do we write about money?"</li>
                </ul>

                <Separator className="my-4" />

                <p><strong>Compliance checker</strong></p>
                <p>
                  Paste up to 250 words of English content. Tomas checks it against the style guide and returns:
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
                  Add rules for how Tomas should handle content checks. These apply across all features.
                </p>

                <p><strong>Glossary</strong></p>
                <p>
                  Define term mappings. For example: "utilise → use" or "commence → start". 
                  You can add terms one by one or import them in bulk.
                </p>

                <p><strong>Style guide documents</strong></p>
                <p>
                  Upload PDF, Word, or JSON documents. Tomas extracts the text and uses it for style guide checks.
                </p>

                <p><strong>Brand and industry</strong></p>
                <p>
                  Set your brand name and industry sector. Tomas uses this context to give better responses.
                </p>

                <p><strong>Training configuration</strong></p>
                <p>
                  Fine-tune Tomas with target audience, reading level, spelling conventions, banned words, and preferred alternatives.
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
                  Tomas stores your conversation history on your device. Click the history icon to see past chats.
                </p>
                <p>For each conversation you can:</p>
                <ul>
                  <li><strong>Resume</strong> — Continue a previous conversation</li>
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
                  Privacy and data
                </CardTitle>
              </CardHeader>
              <CardContent className="prose prose-sm dark:prose-invert max-w-none">
                <p>
                  Tomas stores conversation history locally on your device. Settings are synced to the cloud so they apply across all devices.
                </p>
                <p>
                  When you check content or ask a question, the text is sent to the AI service to process. 
                  The AI does not store your content after processing.
                </p>
              </CardContent>
            </Card>

            {/* Tips */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="w-5 h-5 text-primary" />
                  Tips for best results
                </CardTitle>
              </CardHeader>
              <CardContent className="prose prose-sm dark:prose-invert max-w-none">
                <ul>
                  <li>Upload your style guide documents first</li>
                  <li>Add common terminology to the glossary</li>
                  <li>Keep compliance check content under 250 words for best results</li>
                  <li>Review Tomas's suggestions — they may need tweaking</li>
                  <li>Set the brand name and industry for more relevant responses</li>
                </ul>
              </CardContent>
            </Card>

            {/* Footer disclaimer */}
            <div className="text-center text-sm text-muted-foreground py-6">
              <p>Tomas — AI-powered content governance for Unibet</p>
            </div>
          </div>
        </ScrollArea>
      </div>
    </div>
  );
};

export default Documentation;
