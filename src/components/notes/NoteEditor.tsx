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
import { MoreVertical, Trash2, FolderOpen, Tag, Plus, X, Menu, Download, Star, RotateCcw } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import TurndownService from "turndown";

interface NoteEditorProps {
  noteId: string | null;
  onBack?: () => void;
}

export const NoteEditor = ({ noteId, onBack }: NoteEditorProps) => {
  const isMobile = useIsMobile();
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
      setIsDirty(false);
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
      <div className="border-b border-border p-4 flex items-center gap-4">
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
        {!isDeleted && (
          <Button
            variant="ghost"
            size="icon"
            onClick={handleToggleFavorite}
            title={isFavorited ? "Remove from favorites" : "Add to favorites"}
          >
            <Star className={`h-5 w-5 ${isFavorited ? "fill-yellow-400 text-yellow-400" : ""}`} />
          </Button>
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
        <div className="px-6 pt-4 flex flex-wrap gap-2">
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
        <RichTextEditor
          content={content}
          onChange={(newContent) => {
            setContent(newContent);
            setIsDirty(true);
          }}
        />
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
    </div>
  );
};
