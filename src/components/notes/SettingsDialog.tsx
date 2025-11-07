import { createContext, useContext, useState, useEffect } from "react";
import { Settings as SettingsIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";

interface SettingsDialogProps {
  children?: React.ReactNode;
}

const SETTINGS_KEYS = {
  showUpgradeButton: "settings_showUpgradeButton",
  showLimits: "settings_showLimits",
} as const;

interface SettingsContextType {
  showUpgradeButton: boolean;
  setShowUpgradeButton: (value: boolean) => void;
  showLimits: boolean;
  setShowLimits: (value: boolean) => void;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider = ({ children }: { children: React.ReactNode }) => {
  const [showUpgradeButton, setShowUpgradeButtonState] = useState(() => {
    const saved = localStorage.getItem(SETTINGS_KEYS.showUpgradeButton);
    return saved !== null ? saved === "true" : true; // Default to true
  });

  const [showLimits, setShowLimitsState] = useState(() => {
    const saved = localStorage.getItem(SETTINGS_KEYS.showLimits);
    return saved !== null ? saved === "true" : true; // Default to true
  });

  useEffect(() => {
    localStorage.setItem(SETTINGS_KEYS.showUpgradeButton, showUpgradeButton.toString());
  }, [showUpgradeButton]);

  useEffect(() => {
    localStorage.setItem(SETTINGS_KEYS.showLimits, showLimits.toString());
  }, [showLimits]);

  const setShowUpgradeButton = (value: boolean) => {
    setShowUpgradeButtonState(value);
  };

  const setShowLimits = (value: boolean) => {
    setShowLimitsState(value);
  };

  return (
    <SettingsContext.Provider
      value={{
        showUpgradeButton,
        setShowUpgradeButton,
        showLimits,
        setShowLimits,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error("useSettings must be used within a SettingsProvider");
  }
  return context;
};

export const SettingsDialog = ({ children }: SettingsDialogProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const {
    showUpgradeButton,
    setShowUpgradeButton,
    showLimits,
    setShowLimits,
  } = useSettings();

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button variant="ghost" size="icon" aria-label="Settings">
            <SettingsIcon className="h-5 w-5" />
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
        </DialogHeader>
        <div className="space-y-6 py-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="show-upgrade-button" className="text-base">
                  Show Upgrade Button
                </Label>
                <p className="text-sm text-muted-foreground">
                  Display the upgrade to premium button in the sidebar
                </p>
              </div>
              <Switch
                id="show-upgrade-button"
                checked={showUpgradeButton}
                onCheckedChange={setShowUpgradeButton}
              />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="show-limits" className="text-base">
                  Show Limits Overview
                </Label>
                <p className="text-sm text-muted-foreground">
                  Display the limits overview (notes, folders, favorites, tags) in the sidebar
                </p>
              </div>
              <Switch
                id="show-limits"
                checked={showLimits}
                onCheckedChange={setShowLimits}
              />
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

