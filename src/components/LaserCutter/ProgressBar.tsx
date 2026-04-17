import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { X } from "lucide-react";

interface ProgressBarProps {
    value: number;
    text: string;
    onDismiss: () => void;
}

export const ProgressBar = ({ value, text, onDismiss }: ProgressBarProps) => (
  <div className="fixed bottom-4 right-4 bg-card border rounded-lg p-4 shadow-lg min-w-[300px] z-50">
    <div className="flex items-center justify-between mb-2">
      <span className="text-sm font-medium">Progress</span>
      <Button variant="ghost" size="sm" onClick={onDismiss} className="h-6 w-6 p-0">
        <X className="h-4 w-4" />
      </Button>
    </div>
    <Progress value={value} className="mb-2" />
    <p className="text-xs text-muted-foreground">{text}</p>
  </div>
);