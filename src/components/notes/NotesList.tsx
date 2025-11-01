import { useEffect, useState } from "react";
import { FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";

interface NotesListProps {
  selectedFolderId: string | null;
  selectedNoteId: string | null;
  onNoteSelect: (noteId: string) => void;
  searchQuery: string;
  viewMode: "list" | "grid";
}

export const NotesList = ({
  selectedFolderId,
  selectedNoteId,
  onNoteSelect,
  searchQuery,
  viewMode,
}: NotesListProps) => {
  const [notes, setNotes] = useState<any[]>([]);

  useEffect(() => {
    loadNotes();

    const channel = supabase
      .channel("notes")
      .on("postgres_changes", { event: "*", schema: "public", table: "notes" }, () => {
        loadNotes();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedFolderId, searchQuery]);

  const loadNotes = async () => {
    let query = supabase
      .from("notes")
      .select("*")
      .order("updated_at", { ascending: false });

    if (selectedFolderId) {
      query = query.eq("folder_id", selectedFolderId);
    }

    if (searchQuery) {
      const sanitized = searchQuery.replace(/[%_(),]/g, "").slice(0, 100);
      query = query.or(`title.ilike.%${sanitized}%,content.ilike.%${sanitized}%`);
    }

    const { data } = await query;
    
    if (data) {
      setNotes(data);
    }
  };

  const stripHtml = (html: string) => html.replace(/<[^>]*>/g, "");

  if (viewMode === "grid") {
    return (
      <div className="grid grid-cols-2 gap-3">
        {notes.map((note) => (
          <Card
            key={note.id}
            className={cn(
              "cursor-pointer transition-all hover:border-primary/50",
              selectedNoteId === note.id && "border-primary bg-secondary/50"
            )}
            onClick={() => onNoteSelect(note.id)}
          >
            <CardContent className="p-4 space-y-2">
              <div className="flex items-start gap-2">
                <FileText className="h-4 w-4 mt-1 flex-shrink-0 text-primary" />
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium truncate text-sm">{note.title}</h3>
                </div>
              </div>
              <p className="text-xs text-muted-foreground line-clamp-3">
                {stripHtml(note.content) || "No content"}
              </p>
              <div className="text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(note.updated_at), { addSuffix: true })}
              </div>
            </CardContent>
          </Card>
        ))}
        {notes.length === 0 && (
          <div className="col-span-2 text-center py-8 text-muted-foreground text-sm">
            No notes found
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-semibold text-muted-foreground px-2">Notes</h3>
      {notes.length === 0 ? (
        <p className="text-sm text-muted-foreground px-2 py-4 text-center">
          No notes yet
        </p>
      ) : (
        notes.map((note) => (
          <Button
            key={note.id}
            variant="ghost"
            className={cn(
              "w-full justify-start h-auto py-3 px-3 flex-col items-start",
              selectedNoteId === note.id && "bg-secondary"
            )}
            onClick={() => onNoteSelect(note.id)}
          >
            <div className="flex items-center gap-2 w-full">
              <FileText className="h-4 w-4 flex-shrink-0" />
              <span className="font-medium truncate">{note.title}</span>
            </div>
            <span className="text-xs text-muted-foreground mt-1">
              {formatDistanceToNow(new Date(note.updated_at), { addSuffix: true })}
            </span>
          </Button>
        ))
      )}
    </div>
  );
};