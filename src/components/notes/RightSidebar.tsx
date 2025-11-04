import { useEffect, useState } from "react";
import { FileText, Folder, Star, Trash2, Plus, FolderPlus, LogOut } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { UserProfile } from "./UserProfile";
import { ThemeSwitcher } from "../theme/ThemeSwitcher";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface RightSidebarProps {
  selectedNoteId: string | null;
  onNoteSelect: (noteId: string) => void;
  onNewNote: () => void;
  refreshTrigger?: number;
}

export const RightSidebar = ({
  selectedNoteId,
  onNoteSelect,
  onNewNote,
  refreshTrigger,
}: RightSidebarProps) => {
  const [notes, setNotes] = useState<any[]>([]);
  const [folders, setFolders] = useState<any[]>([]);
  const [tags, setTags] = useState<any[]>([]);
  const [favoritesCount, setFavoritesCount] = useState(0);
  const [activeTab, setActiveTab] = useState("all");
  const [isNewFolderDialogOpen, setIsNewFolderDialogOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");

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
    loadTags();
    loadFavoritesCount();
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

  const loadTags = async () => {
    const { data } = await supabase
      .from("tags")
      .select("*")
      .order("name");
    if (data) setTags(data);
  };

  const loadFavoritesCount = async () => {
    const { count } = await supabase
      .from("notes")
      .select("*", { count: "exact", head: true })
      .eq("is_favorited", true)
      .is("deleted_at", null);
    setFavoritesCount(count || 0);
  };

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast.error("Failed to sign out");
    } else {
      toast.success("Signed out successfully");
    }
  };

  const handleCreateFolder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFolderName.trim()) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase
      .from("folders")
      .insert({ name: newFolderName, user_id: user.id });

    if (error) {
      if (error.message.includes("Folder limit reached")) {
        toast.error("Folder limit reached (10 max)");
      } else {
        toast.error("Failed to create folder");
      }
    } else {
      toast.success("Folder created!");
      setNewFolderName("");
      setIsNewFolderDialogOpen(false);
      loadFolders();
    }
  };

  const handleNewFolderClick = () => {
    setIsNewFolderDialogOpen(true);
  };

  const stripHtml = (html: string) => html.replace(/<[^>]*>/g, "");

  return (
    <aside className="w-80 border-l border-border bg-card flex flex-col h-screen">
      {/* Header with User Profile */}
      <div className="p-4 space-y-3">
        <UserProfile />
        
        <div className="flex items-center gap-2">
          <Button onClick={onNewNote} className="flex-1" size="sm">
            <Plus className="h-4 w-4 mr-2" />
            New Note
          </Button>
          <Button onClick={handleNewFolderClick} size="sm" variant="outline" title="New Folder">
            <FolderPlus className="h-4 w-4" />
          </Button>
        </div>

        {/* Limits Overview */}
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="p-2 rounded-md bg-secondary/50">
            <div className="font-medium text-muted-foreground">Notes</div>
            <div className="text-lg font-bold">{notes.length}/100</div>
          </div>
          <div className="p-2 rounded-md bg-secondary/50">
            <div className="font-medium text-muted-foreground">Folders</div>
            <div className="text-lg font-bold">{folders.length}/10</div>
          </div>
          <div className="p-2 rounded-md bg-secondary/50">
            <div className="font-medium text-muted-foreground">Favorites</div>
            <div className="text-lg font-bold">{favoritesCount}/10</div>
          </div>
          <div className="p-2 rounded-md bg-secondary/50">
            <div className="font-medium text-muted-foreground">Tags</div>
            <div className="text-lg font-bold">{tags.length}/50</div>
          </div>
        </div>
      </div>

      <Separator />

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
                    Folders
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
                  All Notes
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
                Starred Notes
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

      {/* New Folder Dialog */}
      <Dialog open={isNewFolderDialogOpen} onOpenChange={setIsNewFolderDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New Folder</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateFolder} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="folderName">Folder Name</Label>
              <Input
                id="folderName"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                placeholder="My Folder"
                required
                autoFocus
              />
            </div>
            <Button type="submit" className="w-full">
              Create Folder
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </aside>
  );
};
