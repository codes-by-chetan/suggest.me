import { Dialog, DialogContent } from "@/components/ui/dialog";
import { DialogTitle } from "@radix-ui/react-dialog";
import { AuthTab } from "./AuthTab";

interface AuthDialogProps {
  isOpen: boolean;
  onClose: (success?: boolean) => void;
  defaultTab?: "login" | "signup";
}

export default function AuthDialog({
  isOpen,
  onClose,
  defaultTab = "login",
}: AuthDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogTitle></DialogTitle>
      <DialogContent className="sm:max-w-md p-0 gap-0 max-h-[95vh] overflow-hidden [&>button]:hidden">
        <AuthTab onClose={onClose} defaultTab={defaultTab} isOpen={isOpen} />
      </DialogContent>
    </Dialog>
  );
}
