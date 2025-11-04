import { useEffect, useState } from "react";
import { FileText, Folder, Star, Trash2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";

interface RightSidebarProps {
  selectedNoteId: string | null;
  onNoteSelect: (noteId: string) => void;
  refreshTrigger?: number;
}

export const RightSidebar = ({
  selectedNoteId,
  onNoteSelect,
  refreshTrigger,
}: RightSidebarProps) => {
  const [notes, setNotes] = useState<any[]>([]);
  const [folders, setFolders] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState("all");

  useEffect(() => {
    loadData();

    const channel = supabase
      .channel("right-sidebar")
      .on("postgres_changes", { event: "*", schema: "public", table: "notes" }, () => {
        loadData();
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "folders" }, () => {
        loadData();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [activeTab, refreshTrigger]);

  const loadData = async () => {
    loadNotes();
    loadFolders();
  };

  const loadNotes = async () => {
    let query = supabase
      .from("notes")
      .select("*")
      .order("updated_at", { ascending: false });

    if (activeTab === "favorites") {
      query = query.eq("is_favorited", true).is("deleted_at", null);
    } else if (activeTab === "trash") {
      query = query.not("deleted_at", "is", null);
    } else {
      query = query.is("deleted_at", null);
    }

    const { data } = await query;
    if (data) {
      setNotes(data);
    }
  };

  const loadFolders = async () => {
    const { data } = await supabase
      .from("folders")
      .select("*")
      .order("name");
    if (data) setFolders(data);
  };

  const stripHtml = (html: string) => html.replace(/<[^>]*>/g, "");

  return (
    <aside className="w-80 border-l border-border bg-card flex flex-col h-screen">
      <div className="p-4 border-b border-border">
        <h2 className="text-lg font-semibold">Overview</h2>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
        <TabsList className="mx-4 mt-2 grid w-[calc(100%-2rem)] grid-cols-3">
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="favorites">
            <Star className="h-4 w-4" />
          </TabsTrigger>
          <TabsTrigger value="trash">
            <Trash2 className="h-4 w-4" />
          </TabsTrigger>
        </TabsList>

        <ScrollArea className="flex-1">
          <TabsContent value="all" className="p-4 mt-0">
            <div className="space-y-4">
              {folders.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-sm font-semibold text-muted-foreground px-2">
                    Folders ({folders.length}/10)
                  </h3>
                  <div className="grid grid-cols-2 gap-2">
                    {folders.map((folder) => (
                      <Card
                        key={folder.id}
                        className="cursor-pointer hover:border-primary/50 transition-all"
                      >
                        <CardContent className="p-3 space-y-1">
                          <div className="flex items-center gap-2">
                            <Folder className="h-4 w-4 text-primary flex-shrink-0" />
                            <span className="text-sm font-medium truncate">
                              {folder.name}
                            </span>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-muted-foreground px-2">
                  Notes ({notes.length}/100)
                </h3>
                <div className="grid grid-cols-2 gap-2">
                  {notes.map((note) => (
                    <Card
                      key={note.id}
                      className={cn(
                        "cursor-pointer transition-all hover:border-primary/50",
                        selectedNoteId === note.id && "border-primary bg-secondary/50"
                      )}
                      onClick={() => onNoteSelect(note.id)}
                    >
                      <CardContent className="p-3 space-y-2">
                        <div className="flex items-start gap-2">
                          <FileText className="h-4 w-4 mt-1 flex-shrink-0 text-primary" />
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium truncate text-sm">{note.title}</h4>
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-2">
                          {stripHtml(note.content) || "No content"}
                        </p>
                        <div className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(note.updated_at), {
                            addSuffix: true,
                          })}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
                {notes.length === 0 && (
                  <p className="text-center py-8 text-sm text-muted-foreground">
                    No notes found
                  </p>
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="favorites" className="p-4 mt-0">
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-muted-foreground px-2">
                Favorites ({notes.length}/10)
              </h3>
              <div className="grid grid-cols-2 gap-2">
                {notes.map((note) => (
                  <Card
                    key={note.id}
                    className={cn(
                      "cursor-pointer transition-all hover:border-primary/50",
                      selectedNoteId === note.id && "border-primary bg-secondary/50"
                    )}
                    onClick={() => onNoteSelect(note.id)}
                  >
                    <CardContent className="p-3 space-y-2">
                      <div className="flex items-start gap-2">
                        <Star className="h-4 w-4 mt-1 flex-shrink-0 text-yellow-400 fill-yellow-400" />
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium truncate text-sm">{note.title}</h4>
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {stripHtml(note.content) || "No content"}
                      </p>
                      <div className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(note.updated_at), {
                          addSuffix: true,
                        })}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
              {notes.length === 0 && (
                <p className="text-center py-8 text-sm text-muted-foreground">
                  No favorites yet
                </p>
              )}
            </div>
          </TabsContent>

          <TabsContent value="trash" className="p-4 mt-0">
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-muted-foreground px-2">
                Trash
              </h3>
              <div className="grid grid-cols-2 gap-2">
                {notes.map((note) => (
                  <Card
                    key={note.id}
                    className={cn(
                      "cursor-pointer transition-all hover:border-primary/50 opacity-70",
                      selectedNoteId === note.id && "border-primary bg-secondary/50"
                    )}
                    onClick={() => onNoteSelect(note.id)}
                  >
                    <CardContent className="p-3 space-y-2">
                      <div className="flex items-start gap-2">
                        <Trash2 className="h-4 w-4 mt-1 flex-shrink-0 text-destructive" />
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium truncate text-sm">{note.title}</h4>
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {stripHtml(note.content) || "No content"}
                      </p>
                      <div className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(note.updated_at), {
                          addSuffix: true,
                        })}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
              {notes.length === 0 && (
                <p className="text-center py-8 text-sm text-muted-foreground">
                  Trash is empty
                </p>
              )}
            </div>
          </TabsContent>
        </ScrollArea>
      </Tabs>
    </aside>
  );
};
