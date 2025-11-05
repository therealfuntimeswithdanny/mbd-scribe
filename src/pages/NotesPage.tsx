import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { NoteEditor } from "@/components/notes/NoteEditor";
import { RightSidebar } from "@/components/notes/RightSidebar";
import { Session } from "@supabase/supabase-js";
import { useIsMobile } from "@/hooks/use-mobile";
import { toast } from "sonner";

export const NotesPage = () => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setIsLoading(false);
      if (!session) {
        navigate("/");
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        setIsLoading(false);
        if (!session) {
          navigate("/");
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleNewNote = async () => {
    if (!session?.user) return;

    const { data, error } = await supabase
      .from("notes")
      .insert({
        title: "Untitled",
        content: "",
        user_id: session.user.id,
        folder_id: selectedFolderId,
      })
      .select()
      .single();

    if (error) {
      if (error.message.includes("Note limit reached")) {
        toast.error("Note limit reached! Maximum 100 notes allowed.");
      } else {
        toast.error("Failed to create note");
      }
    } else if (data) {
      setSelectedNoteId(data.id);
      setRefreshTrigger(prev => prev + 1);
    }
  };

  if (isLoading || !session) {
    return null;
  }

  return (
    <div className="flex h-screen bg-background">
      <RightSidebar
        selectedNoteId={selectedNoteId}
        onNoteSelect={setSelectedNoteId}
        onNewNote={handleNewNote}
        refreshTrigger={refreshTrigger}
      />
      <NoteEditor 
        noteId={selectedNoteId} 
        onBack={() => {}}
      />
    </div>
  );
};
