import { useEffect, useState, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { RichTextEditor } from "./RichTextEditor";
import { MoreVertical, Trash2, FolderOpen, Tag, Plus, X, Menu, Download, Star, RotateCcw, Pin, Lock, Unlock } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import TurndownService from "turndown";
import { useSettings } from "./SettingsDialog";
import { Input } from "@/components/ui/input";

interface NoteEditorProps {
  noteId: string | null;
  onBack?: () => void;
}

export const NoteEditor = ({ noteId, onBack }: NoteEditorProps) => {
  const isMobile = useIsMobile();
  const { showWordCount } = useSettings();
  const [note, setNote] = useState<any>(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [isDirty, setIsDirty] = useState(false);
  const [folders, setFolders] = useState<any[]>([]);
  const [tags, setTags] = useState<any[]>([]);
  const [noteTags, setNoteTags] = useState<any[]>([]);
  const [isTagDialogOpen, setIsTagDialogOpen] = useState(false);
  const [newTagName, setNewTagName] = useState("");
  const [isFavorited, setIsFavorited] = useState(false);
  const [isDeleted, setIsDeleted] = useState(false);
  const [isPinned, setIsPinned] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);
  const [passwordInput, setPasswordInput] = useState("");
  const [passwordToSet, setPasswordToSet] = useState("");
  const [isUnlockDialogOpen, setIsUnlockDialogOpen] = useState(false);
  const [unlockPassword, setUnlockPassword] = useState("");

  useEffect(() => {
    if (noteId) {
      loadNote();
      loadNoteTags();
    }
    loadFolders();
    loadTags();
  }, [noteId]);

  useEffect(() => {
    if (isDirty && noteId) {
      const timer = setTimeout(() => {
        saveNote();
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [title, content, isDirty]);

  const loadNote = async () => {
    if (!noteId) return;

    const { data } = await supabase
      .from("notes")
      .select("*")
      .eq("id", noteId)
      .single();

    if (data) {
      setNote(data);
      setTitle(data.title);
      setContent(data.content);
      setIsFavorited(data.is_favorited || false);
      setIsDeleted(!!data.deleted_at);
      setIsPinned(data.is_pinned || false);
      setIsLocked(!!data.password_hash);
      setIsDirty(false);

      // Update last_viewed_at
      await supabase
        .from("notes")
        .update({ last_viewed_at: new Date().toISOString() })
        .eq("id", noteId);

      // Check if note is locked and needs password
      if (data.password_hash) {
        // Check if password is already in session storage
        const sessionKey = `unlocked_note_${noteId}`;
        const unlocked = sessionStorage.getItem(sessionKey);
        if (!unlocked) {
          setIsUnlockDialogOpen(true);
        }
      }
    }
  };

  const loadFolders = async () => {
    const { data } = await supabase
      .from("folders")
      .select("*")
      .order("name");
    if (data) setFolders(data);
  };

  const loadTags = async () => {
    const { data } = await supabase
      .from("tags")
      .select("*")
      .order("name");
    if (data) setTags(data);
  };

  const loadNoteTags = async () => {
    if (!noteId) return;

    const { data } = await supabase
      .from("note_tags")
      .select("tag_id, tags(*)")
      .eq("note_id", noteId);

    if (data) {
      setNoteTags(data.map((nt: any) => nt.tags));
    }
  };

  const saveNote = async () => {
    if (!noteId) return;

    const { error } = await supabase
      .from("notes")
      .update({ title, content })
      .eq("id", noteId);

    if (error) {
      toast.error("Failed to save note");
    } else {
      setIsDirty(false);
    }
  };

  const handleDelete = async () => {
    if (!noteId) return;

    const { error } = await supabase
      .from("notes")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", noteId);

    if (error) {
      toast.error("Failed to move note to trash");
      return;
    }

    toast.success("Note moved to trash");
  };

  const handlePermanentDelete = async () => {
    if (!noteId || !confirm("Permanently delete this note? This cannot be undone.")) return;

    const { error } = await supabase.from("notes").delete().eq("id", noteId);

    if (error) {
      toast.error("Failed to delete note permanently");
      return;
    }

    toast.success("Note deleted permanently");
  };

  const handleRestore = async () => {
    if (!noteId) return;

    const { error } = await supabase
      .from("notes")
      .update({ deleted_at: null })
      .eq("id", noteId);

    if (error) {
      toast.error("Failed to restore note");
      return;
    }

    setIsDeleted(false);
    toast.success("Note restored");
  };

  const handleToggleFavorite = async () => {
    if (!noteId) return;

    const newFavoritedState = !isFavorited;

    const { error } = await supabase
      .from("notes")
      .update({ is_favorited: newFavoritedState })
      .eq("id", noteId);

    if (error) {
      toast.error("Failed to update favorite status");
      return;
    }

    setIsFavorited(newFavoritedState);
    toast.success(newFavoritedState ? "Added to favorites" : "Removed from favorites");
  };

  const handleTogglePin = async () => {
    if (!noteId) return;

    const newPinnedState = !isPinned;

    const { error } = await supabase
      .from("notes")
      .update({ is_pinned: newPinnedState })
      .eq("id", noteId);

    if (error) {
      toast.error("Failed to update pin status");
      return;
    }

    setIsPinned(newPinnedState);
    toast.success(newPinnedState ? "Note pinned" : "Note unpinned");
  };

  const handleSetPassword = async () => {
    if (!noteId || !passwordToSet.trim()) return;

    // Simple hash function (in production, use a proper hashing library)
    const hashPassword = async (password: string) => {
      const encoder = new TextEncoder();
      const data = encoder.encode(password);
      const hashBuffer = await crypto.subtle.digest("SHA-256", data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
    };

    const passwordHash = await hashPassword(passwordToSet);

    const { error } = await supabase
      .from("notes")
      .update({ password_hash: passwordHash })
      .eq("id", noteId);

    if (error) {
      toast.error("Failed to set password");
      return;
    }

    setIsLocked(true);
    setPasswordToSet("");
    setIsPasswordDialogOpen(false);
    toast.success("Note locked with password");
  };

  const handleRemovePassword = async () => {
    if (!noteId) return;

    const { error } = await supabase
      .from("notes")
      .update({ password_hash: null })
      .eq("id", noteId);

    if (error) {
      toast.error("Failed to remove password");
      return;
    }

    setIsLocked(false);
    const sessionKey = `unlocked_note_${noteId}`;
    sessionStorage.removeItem(sessionKey);
    toast.success("Password removed");
  };

  const handleUnlockNote = async () => {
    if (!noteId || !unlockPassword.trim()) return;

    // Hash the input password
    const encoder = new TextEncoder();
    const data = encoder.encode(unlockPassword);
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const inputHash = hashArray.map(b => b.toString(16).padStart(2, "0")).join("");

    // Get the stored hash
    const { data: noteData } = await supabase
      .from("notes")
      .select("password_hash")
      .eq("id", noteId)
      .single();

    if (!noteData || noteData.password_hash !== inputHash) {
      toast.error("Incorrect password");
      setUnlockPassword("");
      return;
    }

    // Store unlocked state in session
    const sessionKey = `unlocked_note_${noteId}`;
    sessionStorage.setItem(sessionKey, "true");
    setIsUnlockDialogOpen(false);
    setUnlockPassword("");
    toast.success("Note unlocked");
  };

  const getWordCount = () => {
    if (!content) return 0;
    const text = content.replace(/<[^>]*>/g, ""); // Remove HTML tags
    const words = text.trim().split(/\s+/).filter(word => word.length > 0);
    return words.length;
  };

  const handleMoveToFolder = async (folderId: string | null) => {
    if (!noteId) return;

    const { error } = await supabase
      .from("notes")
      .update({ folder_id: folderId })
      .eq("id", noteId);

    if (error) {
      toast.error("Failed to move note");
    } else {
      toast.success("Note moved");
      loadNote();
    }
  };

  const handleAddTag = async (tagId: string) => {
    if (!noteId) return;

    const { error } = await supabase
      .from("note_tags")
      .insert({ note_id: noteId, tag_id: tagId });

    if (error) {
      toast.error("Failed to add tag");
    } else {
      loadNoteTags();
    }
  };

  const handleRemoveTag = async (tagId: string) => {
    if (!noteId) return;

    const { error } = await supabase
      .from("note_tags")
      .delete()
      .eq("note_id", noteId)
      .eq("tag_id", tagId);

    if (error) {
      toast.error("Failed to remove tag");
    } else {
      loadNoteTags();
    }
  };

  const handleCreateTag = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTagName.trim()) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from("tags")
      .insert({ name: newTagName, user_id: user.id })
      .select()
      .single();

    if (error) {
      toast.error("Failed to create tag");
    } else {
      toast.success("Tag created");
      setNewTagName("");
      loadTags();
      if (noteId && data) {
        handleAddTag(data.id);
      }
      setIsTagDialogOpen(false);
    }
  };

  const handleExportMarkdown = () => {
    const turndownService = new TurndownService();
    const markdown = turndownService.turndown(content);
    
    const blob = new Blob([`# ${title}\n\n${markdown}`], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${title || "note"}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast.success("Note exported as Markdown");
  };

  if (!noteId) {
    return (
      <div className="flex-1 flex items-center justify-center text-muted-foreground">
        Select a note or create a new one
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-screen">
      <div className="sticky top-0 z-10 bg-background border-b border-border p-4 flex items-center gap-4">
        {isMobile && onBack && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onBack}
            className="shrink-0"
          >
            <Menu className="h-5 w-5" />
          </Button>
        )}
        <Input
          value={title}
          onChange={(e) => {
            setTitle(e.target.value);
            setIsDirty(true);
          }}
          placeholder="Note title"
          className="text-lg font-semibold border-none shadow-none focus-visible:ring-0"
        />
        {isDirty && (
          <Badge variant="secondary" className="shrink-0">
            Saving...
          </Badge>
        )}
        {showWordCount && (
          <Badge variant="outline" className="shrink-0">
            {getWordCount()} words
          </Badge>
        )}
        {!isDeleted && (
          <>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleTogglePin}
              title={isPinned ? "Unpin note" : "Pin note"}
            >
              <Pin className={`h-5 w-5 ${isPinned ? "fill-primary text-primary" : ""}`} />
            </Button>
            <Button
              variant="ghost"
              onClick={isLocked ? handleRemovePassword : () => setIsPasswordDialogOpen(true)}
              title={isLocked ? "Remove password" : "Lock note with password"}
            >
              {isLocked ? (
                <Lock className="h-5 w-5 text-primary" />
              ) : (
                <Unlock className="h-5 w-5" />
              )}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleToggleFavorite}
              title={isFavorited ? "Remove from favorites" : "Add to favorites"}
            >
              <Star className={`h-5 w-5 ${isFavorited ? "fill-yellow-400 text-yellow-400" : ""}`} />
            </Button>
          </>
        )}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreVertical className="h-5 w-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="bg-popover">
            {isDeleted ? (
              <>
                <DropdownMenuItem onClick={handleRestore}>
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Restore Note
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handlePermanentDelete} className="text-destructive">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Permanently
                </DropdownMenuItem>
              </>
            ) : (
              <>
                <DropdownMenuItem onClick={() => setIsTagDialogOpen(true)}>
                  <Tag className="h-4 w-4 mr-2" />
                  Manage Tags
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleExportMarkdown}>
                  <Download className="h-4 w-4 mr-2" />
                  Export as Markdown
                </DropdownMenuItem>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                      <FolderOpen className="h-4 w-4 mr-2" />
                      Move to Folder
                    </DropdownMenuItem>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent side="left" className="bg-popover">
                    <DropdownMenuItem onClick={() => handleMoveToFolder(null)}>
                      No Folder
                    </DropdownMenuItem>
                    {folders.map((folder) => (
                      <DropdownMenuItem
                        key={folder.id}
                        onClick={() => handleMoveToFolder(folder.id)}
                      >
                        {folder.name}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-destructive" onClick={handleDelete}>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Move to Trash
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {noteTags.length > 0 && (
        <div className="sticky top-[73px] z-10 bg-background px-6 pt-4 pb-2 flex flex-wrap gap-2">
          {noteTags.map((tag) => (
            <Badge
              key={tag.id}
              variant="secondary"
              className="gap-1"
              style={{ backgroundColor: tag.color + "20", color: tag.color }}
            >
              {tag.name}
              <button
                onClick={() => handleRemoveTag(tag.id)}
                className="ml-1 hover:opacity-70"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}

      <div className="flex-1 overflow-auto p-6">
        {isLocked && !sessionStorage.getItem(`unlocked_note_${noteId}`) ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center space-y-4">
              <Lock className="h-12 w-12 mx-auto text-muted-foreground" />
              <p className="text-muted-foreground">This note is locked. Please unlock it to view the content.</p>
            </div>
          </div>
        ) : (
          <RichTextEditor
            content={content}
            onChange={(newContent) => {
              setContent(newContent);
              setIsDirty(true);
            }}
            editable={!isLocked || !!sessionStorage.getItem(`unlocked_note_${noteId}`)}
          />
        )}
      </div>

      <Dialog open={isTagDialogOpen} onOpenChange={setIsTagDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Manage Tags</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <form onSubmit={handleCreateTag} className="flex gap-2">
              <Input
                value={newTagName}
                onChange={(e) => setNewTagName(e.target.value)}
                placeholder="New tag name"
              />
              <Button type="submit">
                <Plus className="h-4 w-4" />
              </Button>
            </form>

            <div className="space-y-2">
              <Label>Available Tags</Label>
              <div className="flex flex-wrap gap-2">
                {tags.map((tag) => {
                  const isAdded = noteTags.some((nt) => nt.id === tag.id);
                  return (
                    <Badge
                      key={tag.id}
                      variant={isAdded ? "default" : "outline"}
                      className="cursor-pointer"
                      style={
                        isAdded
                          ? { backgroundColor: tag.color, borderColor: tag.color }
                          : { borderColor: tag.color, color: tag.color }
                      }
                      onClick={() =>
                        isAdded ? handleRemoveTag(tag.id) : handleAddTag(tag.id)
                      }
                    >
                      {tag.name}
                    </Badge>
                  );
                })}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Password Set Dialog */}
      <Dialog open={isPasswordDialogOpen} onOpenChange={setIsPasswordDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Lock Note with Password</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={passwordToSet}
                onChange={(e) => setPasswordToSet(e.target.value)}
                placeholder="Enter password"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleSetPassword();
                  }
                }}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsPasswordDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSetPassword} disabled={!passwordToSet.trim()}>
                Lock Note
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Unlock Dialog */}
      <Dialog open={isUnlockDialogOpen} onOpenChange={() => {}}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Unlock Note</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="unlock-password">Password</Label>
              <Input
                id="unlock-password"
                type="password"
                value={unlockPassword}
                onChange={(e) => setUnlockPassword(e.target.value)}
                placeholder="Enter password"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleUnlockNote();
                  }
                }}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button onClick={handleUnlockNote} disabled={!unlockPassword.trim()}>
                Unlock
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
