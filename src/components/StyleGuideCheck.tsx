import { useState } from 'react';
import { ArrowLeft, MessageSquare, FileCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { StyleGuideChat } from '@/components/StyleGuideChat';
import { ComplianceChecker } from '@/components/ComplianceChecker';

interface StyleGuideCheckProps {
  onBack: () => void;
  initialConversationId?: string;
  initialTab?: 'chat' | 'compliance';
}

export function StyleGuideCheck({ onBack, initialConversationId, initialTab = 'chat' }: StyleGuideCheckProps) {
  const [activeTab, setActiveTab] = useState<'chat' | 'compliance'>(initialTab);

  return (
    <div className="min-h-screen bg-background px-4 pb-4 pt-20 sm:px-6 sm:pb-6 sm:pt-24">
      <div className="fixed inset-x-0 top-0 z-40 border-b border-border/60 bg-background/95 backdrop-blur-sm">
        <div className="mx-auto max-w-5xl px-4 py-3 sm:px-6">
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'chat' | 'compliance')}>
            <TabsList className="grid w-full max-w-[calc(100%-5.5rem)] grid-cols-2 sm:max-w-md">
              <TabsTrigger value="chat" className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4" />
                Ask Tomas
              </TabsTrigger>
              <TabsTrigger value="compliance" className="flex items-center gap-2">
                <FileCheck className="w-4 h-4" />
                Compliance check
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-2xl font-display font-bold">Style guide check</h1>
        </div>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'chat' | 'compliance')}>
          <div className="pb-4">
            <TabsList className="grid w-full max-w-[calc(100%-5.5rem)] grid-cols-2 sm:max-w-md">
              <TabsTrigger value="chat" className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4" />
                Ask Tomas
              </TabsTrigger>
              <TabsTrigger value="compliance" className="flex items-center gap-2">
                <FileCheck className="w-4 h-4" />
                Compliance check
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="chat" className="mt-0">
            <StyleGuideChat initialConversationId={initialConversationId} />
          </TabsContent>

          <TabsContent value="compliance" className="mt-0">
            <ComplianceChecker />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
