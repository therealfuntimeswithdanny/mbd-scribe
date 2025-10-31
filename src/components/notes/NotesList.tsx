import { useEffect, useState } from "react";
import { FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";

interface NotesListProps {
  selectedFolderId: string | null;
  selectedNoteId: string | null;
  onNoteSelect: (noteId: string) => void;
  searchQuery: string;
}

export const NotesList = ({
  selectedFolderId,
  selectedNoteId,
  onNoteSelect,
  searchQuery,
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
      query = query.or(`title.ilike.%${searchQuery}%,content.ilike.%${searchQuery}%`);
    }

    const { data } = await query;
    
    if (data) {
      setNotes(data);
    }
  };

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
