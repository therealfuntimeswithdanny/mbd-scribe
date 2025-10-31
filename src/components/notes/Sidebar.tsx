import { useState } from "react";
import { Search, Plus, Menu, X, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { UserProfile } from "./UserProfile";
import { FolderList } from "./FolderList";
import { NotesList } from "./NotesList";
import { ThemeSwitcher } from "../theme/ThemeSwitcher";

interface SidebarProps {
  selectedFolderId: string | null;
  onFolderSelect: (folderId: string | null) => void;
  selectedNoteId: string | null;
  onNoteSelect: (noteId: string) => void;
  onNewNote: () => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

export const Sidebar = ({
  selectedFolderId,
  onFolderSelect,
  selectedNoteId,
  onNoteSelect,
  onNewNote,
  searchQuery,
  onSearchChange,
}: SidebarProps) => {
  const [isOpen, setIsOpen] = useState(true);

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast.error("Failed to sign out");
    } else {
      toast.success("Signed out successfully");
    }
  };

  return (
    <>
      {/* Mobile toggle */}
      <Button
        variant="ghost"
        size="icon"
        className="fixed top-4 left-4 z-50 md:hidden"
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </Button>

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 w-80 bg-card border-r border-border transition-transform duration-200 md:relative md:translate-x-0",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-6 space-y-4">
            <UserProfile />

            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search notes..."
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                className="pl-9"
              />
            </div>

            <Button onClick={onNewNote} className="w-full">
              <Plus className="h-4 w-4 mr-2" />
              New Note
            </Button>
          </div>

          <Separator />

          {/* Folders & Notes */}
          <ScrollArea className="flex-1 px-4">
            <div className="py-4 space-y-4">
              <FolderList
                selectedFolderId={selectedFolderId}
                onFolderSelect={onFolderSelect}
              />
              
              <Separator />

              <NotesList
                selectedFolderId={selectedFolderId}
                selectedNoteId={selectedNoteId}
                onNoteSelect={onNoteSelect}
                searchQuery={searchQuery}
              />
            </div>
          </ScrollArea>

          <Separator />

          {/* Footer Actions */}
          <div className="p-4 space-y-2">
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                className="flex-1 justify-start"
                onClick={handleSignOut}
              >
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
              <ThemeSwitcher />
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
};
