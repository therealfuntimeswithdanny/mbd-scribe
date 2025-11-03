import { useState } from "react";
import { Search, Plus, LogOut, LayoutGrid, List, Star, Trash2, FolderPlus } from "lucide-react";
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
  isOpen: boolean;
  onToggle: () => void;
  viewMode: "all" | "favorites" | "trash";
  onViewModeChange: (mode: "all" | "favorites" | "trash") => void;
}

export const Sidebar = ({
  selectedFolderId,
  onFolderSelect,
  selectedNoteId,
  onNoteSelect,
  onNewNote,
  searchQuery,
  onSearchChange,
  isOpen,
  onToggle,
  viewMode: filterMode,
  onViewModeChange,
}: SidebarProps) => {
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");
  const [showNewFolderDialog, setShowNewFolderDialog] = useState(false);

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

            <div className="flex items-center gap-2">
              <Button onClick={onNewNote} className="flex-1">
                <Plus className="h-4 w-4 mr-2" />
                New Note
              </Button>
              <Button onClick={() => setShowNewFolderDialog(true)} size="icon" variant="outline" title="New Folder">
                <FolderPlus className="h-5 w-5" />
              </Button>
              <Button
                size="icon"
                variant={viewMode === "list" ? "secondary" : "outline"}
                onClick={() => setViewMode("list")}
                title="List View"
              >
                <List className="h-4 w-4" />
              </Button>
              <Button
                size="icon"
                variant={viewMode === "grid" ? "secondary" : "outline"}
                onClick={() => setViewMode("grid")}
                title="Grid View"
              >
                <LayoutGrid className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <Separator />

          {/* Folders & Notes */}
          <ScrollArea className="flex-1 px-4">
            <div className="py-4 space-y-4">
              <div className="space-y-2">
                <Button
                  variant={filterMode === "all" ? "secondary" : "ghost"}
                  className="w-full justify-start"
                  onClick={() => {
                    onViewModeChange("all");
                    onFolderSelect(null);
                  }}
                >
                  <List className="h-4 w-4 mr-2" />
                  All Notes
                </Button>
                <Button
                  variant={filterMode === "favorites" ? "secondary" : "ghost"}
                  className="w-full justify-start"
                  onClick={() => {
                    onViewModeChange("favorites");
                    onFolderSelect(null);
                  }}
                >
                  <Star className="h-4 w-4 mr-2" />
                  Favorites
                </Button>
                <Button
                  variant={filterMode === "trash" ? "secondary" : "ghost"}
                  className="w-full justify-start"
                  onClick={() => {
                    onViewModeChange("trash");
                    onFolderSelect(null);
                  }}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Trash
                </Button>
              </div>

              <Separator />

              <FolderList
                selectedFolderId={selectedFolderId}
                onFolderSelect={(id) => {
                  onFolderSelect(id);
                  onViewModeChange("all");
                }}
                showNewFolderDialog={showNewFolderDialog}
                onNewFolderDialogChange={setShowNewFolderDialog}
              />
              
              <Separator />

              <NotesList
                selectedFolderId={selectedFolderId}
                selectedNoteId={selectedNoteId}
                onNoteSelect={onNoteSelect}
                searchQuery={searchQuery}
                viewMode={viewMode}
                filterMode={filterMode}
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
          onClick={onToggle}
        />
      )}
    </>
  );
};