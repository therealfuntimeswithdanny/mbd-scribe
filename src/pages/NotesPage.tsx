import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Sidebar } from "@/components/notes/Sidebar";
import { NoteEditor } from "@/components/notes/NoteEditor";
import { Session } from "@supabase/supabase-js";

export const NotesPage = () => {
  const navigate = useNavigate();
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

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

    if (data && !error) {
      setSelectedNoteId(data.id);
    }
  };

  if (isLoading || !session) {
    return null;
  }

  return (
    <div className="flex h-screen bg-background">
      <Sidebar
        selectedFolderId={selectedFolderId}
        onFolderSelect={setSelectedFolderId}
        selectedNoteId={selectedNoteId}
        onNoteSelect={setSelectedNoteId}
        onNewNote={handleNewNote}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />
      <NoteEditor noteId={selectedNoteId} />
    </div>
  );
};
