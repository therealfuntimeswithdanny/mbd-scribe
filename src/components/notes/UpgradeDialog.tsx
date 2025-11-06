import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Sparkles } from "lucide-react";

interface UpgradeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpgradeSuccess: () => void;
}

const VALID_CODES_URL = "https://scribeupgradecodes.madebydanny.uk/";

export const UpgradeDialog = ({ open, onOpenChange, onUpgradeSuccess }: UpgradeDialogProps) => {
  const [code, setCode] = useState("");
  const [isValidating, setIsValidating] = useState(false);

  const validateAndUpgrade = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return;

    setIsValidating(true);

    try {
      // Fetch valid codes from the URL
      const response = await fetch(VALID_CODES_URL);
      const text = await response.text();
      
      // Extract codes from the response (they appear as "code1", "code2", etc.)
      const validCodes: string[] = text.match(/code\d+/g) || [];
      
      if (!validCodes.includes(code.trim())) {
        toast.error("Invalid upgrade code. Please check and try again.");
        setIsValidating(false);
        return;
      }

      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("You must be logged in to upgrade");
        setIsValidating(false);
        return;
      }

      // Update user profile to premium
      const { error } = await supabase
        .from("profiles")
        .update({ 
          is_premium: true,
          upgraded_at: new Date().toISOString()
        })
        .eq("id", user.id);

      if (error) {
        toast.error("Failed to upgrade account. Please try again.");
        console.error(error);
      } else {
        toast.success("🎉 Account upgraded! All limits doubled!");
        setCode("");
        onOpenChange(false);
        onUpgradeSuccess();
      }
    } catch (error) {
      toast.error("Failed to validate code. Please try again.");
      console.error(error);
    } finally {
      setIsValidating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Upgrade to Premium
          </DialogTitle>
          <DialogDescription>
            Enter your upgrade code to double all limits:
            <ul className="mt-2 space-y-1 text-sm">
              <li>• Notes: 100 → 200</li>
              <li>• Folders: 10 → 20</li>
              <li>• Favorites: 10 → 20</li>
              <li>• Tags: 50 → 100</li>
            </ul>
            <br>
            <a href="mailto:danielmorrisey@pm.me" target="_blank">Get a code here</a>
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={validateAndUpgrade} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="upgradeCode">Upgrade Code</Label>
            <Input
              id="upgradeCode"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Enter code (e.g., code1)"
              required
              autoFocus
              disabled={isValidating}
            />
          </div>
          <Button type="submit" className="w-full" disabled={isValidating}>
            {isValidating ? "Validating..." : "Upgrade Account"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};
