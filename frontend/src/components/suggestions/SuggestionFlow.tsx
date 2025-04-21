/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState } from "react";
import { Check, ChevronLeft, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import ContentTypeSelector from "./ContentTypeSelector";
import ContentSearch from "./ContentSearch";
import ContentDetailsForm from "./ContentDetailsForm";
import RecipientSelector from "./RecipientSelector";


interface ContentItem {
  id: string;
  title: string;
  type: string;
  imageUrl?: string;
  year?: string;
  creator?: string;
  description?: string;
  [key: string]: any;
}

interface Recipient {
  id: string;
  name: string;
  avatar?: string;
  email?: string;
}

interface SuggestionFlowProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onComplete?: (data: {
    content: ContentItem;
    recipients: Recipient[];
    note?: string;
  }) => void;
}

const SuggestionFlow = ({
  open = true,
  onOpenChange = () => {},
  onComplete = () => {},
}: SuggestionFlowProps) => {
  
  const [step, setStep] = useState(1);
  const [contentType, setContentType] = useState("");
  const [selectedContent, setSelectedContent] = useState<ContentItem | null>(
    null,
  );
  const [contentDetails, setContentDetails] = useState<any>(null);
  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [note, setNote] = useState("");

  const handleContentTypeSelect = (type: string) => {
    setContentType(type);
    setStep(2);
  };

  const handleContentSelect = (content: ContentItem) => {
    setSelectedContent(content);
    setStep(3);
  };

  const handleContentDetailsSubmit = (details: any) => {
    setContentDetails(details);
    setStep(4);
  };

  const handleRecipientsSelect = (selectedRecipients: Recipient[]) => {
    setRecipients(selectedRecipients);
  };

  const handleComplete = () => {
    onComplete({
      content: { ...selectedContent, ...contentDetails },
      recipients,
      note,
    });
    resetFlow();
    onOpenChange(false);
  };

  const resetFlow = () => {
    setStep(1);
    setContentType("");
    setSelectedContent(null);
    setContentDetails(null);
    setRecipients([]);
    setNote("");
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const getStepTitle = () => {
    switch (step) {
      case 1:
        return "What would you like to suggest?";
      case 2:
        return `Search for ${contentType}`;
      case 3:
        return "Add details";
      case 4:
        return "Select recipients";
      case 5:
        return "Confirmation";
      default:
        return "Make a suggestion";
    }
  };

  const renderStepIndicator = () => {
    return (
      <div className="flex justify-center mb-6">
        <div className="flex items-center space-x-2">
          {[1, 2, 3, 4].map((i) => (
            <React.Fragment key={i}>
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center cursor-pointer ${step === i ? "bg-primary text-primary-foreground" : step > i ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"}`}
                onClick={() => i < step && setStep(i)}
                title={i < step ? `Go back to step ${i}` : ""}
              >
                {step > i ? <Check className="h-4 w-4" /> : i}
              </div>
              {i < 4 && (
                <div
                  className={`w-10 h-1 ${step > i ? "bg-primary/20" : "bg-muted"}`}
                />
              )}
            </React.Fragment>
          ))}
        </div>
      </div>
    );
  };

  const renderStepContent = () => {
    switch (step) {
      case 1:
        return (
          <ContentTypeSelector
            onSelect={handleContentTypeSelect}
            selectedType={contentType}
          />
        );
      case 2:
        return (
          <ContentSearch
            contentType={contentType}
            onSelect={handleContentSelect}
          />
        );
      case 3:
        return (
          <ContentDetailsForm
            contentType={contentType as any}
            initialData={selectedContent}
            onSubmit={handleContentDetailsSubmit}
            onBack={handleBack}
            onNext={() => setStep(4)}
          />
        );
      case 4:
        return (
          <RecipientSelector
            onSelect={handleRecipientsSelect}
            onBack={handleBack}
            onComplete={handleComplete}
            preSelectedRecipients={recipients}
          />
        );
      default:
        return null;
    }
  };

  const renderConfirmation = () => {
    return (
      <div className="p-6 text-center">
        <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center mx-auto mb-4">
          <Check className="h-8 w-8 text-green-600 dark:text-green-300" />
        </div>
        <h3 className="text-xl font-semibold mb-2 text-foreground">
          Suggestion Sent!
        </h3>
        <p className="text-muted-foreground mb-6">
          Your suggestion has been sent to {recipients.length}{" "}
          {recipients.length === 1 ? "person" : "people"}.
        </p>
        <div className="flex justify-center gap-4">
          <Button variant="outline" onClick={() => setStep(1)}>
            New Suggestion
          </Button>
          <Button onClick={() => onOpenChange(false)}>Close</Button>
        </div>
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent aria-describedby={"new-suggestion-dialogue-box-content"} aria-description={"new-suggestion-dialogue-box-content"} className="sm:max-w-[600px] md:max-w-[800px] p-0 overflow-auto max-h-[90vh] bg-background border-border">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle className="text-2xl font-bold text-center text-foreground">
            {getStepTitle()}
          </DialogTitle>
        </DialogHeader>

        {renderStepIndicator()}

        <div className="px-6 pb-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              {step === 5 ? renderConfirmation() : renderStepContent()}
            </motion.div>
          </AnimatePresence>
        </div>

        {step > 1 && step < 5 && (
          <DialogFooter className="p-6 pt-0 flex justify-between">
            <Button
              variant="outline"
              onClick={handleBack}
              className="flex items-center gap-1"
            >
              <ChevronLeft className="h-4 w-4" /> Back
            </Button>
            {step < 4 && (
              <Button
                onClick={() => setStep(step + 1)}
                className="flex items-center gap-1"
                disabled={
                  (step === 2 && !selectedContent) ||
                  (step === 3 && !contentDetails)
                }
              >
                Next <ChevronRight className="h-4 w-4" />
              </Button>
            )}
          </DialogFooter>
        )}

        {step === 1 && (
          <DialogFooter className="p-6 pt-0 flex justify-end">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default SuggestionFlow;
