import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface SuggestionButtonProps {
  onClick?: () => void;
  label?: string;
  tooltipText?: string;
  position?: "bottom-right" | "bottom-left" | "top-right" | "top-left";
}

const SuggestionButton = ({
  onClick = () => {},
  label = "Suggest",
  tooltipText = "Suggest something to your friends",
  position = "bottom-right",
}: SuggestionButtonProps) => {
  // Position styles based on the position prop
  const positionStyles = {
    "bottom-right": "bottom-4 right-4",
    "bottom-left": "bottom-4 left-4",
    "top-right": "top-4 right-4",
    "top-left": "top-4 left-4",
  }[position];

  return (
    <div className={`fixed ${positionStyles} z-50 bg-background`}>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              onClick={onClick}
              size="lg"
              className="rounded-full shadow-lg hover:shadow-xl transition-all duration-300 bg-primary text-primary-foreground font-semibold flex items-center gap-2"
            >
              <Plus className="h-5 w-5" />
              {label}
            </Button>
          </TooltipTrigger>
          <TooltipContent side="top">
            <p>{tooltipText}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
};

export default SuggestionButton;
