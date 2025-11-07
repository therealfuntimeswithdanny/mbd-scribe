import { useEffect, useState } from "react";
import { FileText, Folder, Star, Trash2, Plus, FolderPlus, LogOut, Sparkles } from "lucide-react";
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
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { UpgradeDialog } from "./UpgradeDialog";
import { SettingsDialog, useSettings } from "./SettingsDialog";

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
  const [allNotes, setAllNotes] = useState<any[]>([]);
  const [folders, setFolders] = useState<any[]>([]);
  const [tags, setTags] = useState<any[]>([]);
  const [favoritesCount, setFavoritesCount] = useState(0);
  const [activeTab, setActiveTab] = useState("all");
  const [isNewFolderDialogOpen, setIsNewFolderDialogOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [folderNotes, setFolderNotes] = useState<Record<string, any[]>>({});
  const [isPremium, setIsPremium] = useState(false);
  const [isUpgradeDialogOpen, setIsUpgradeDialogOpen] = useState(false);
  const { showUpgradeButton, showLimits } = useSettings();

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
    loadAllNotes();
    loadFolders();
    loadTags();
    loadFavoritesCount();
    loadPremiumStatus();
  };

  const loadAllNotes = async () => {
    const { data } = await supabase
      .from("notes")
      .select("*");
    if (data) setAllNotes(data);
  };

  const loadPremiumStatus = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from("profiles")
      .select("is_premium")
      .eq("id", user.id)
      .single();
    
    if (data) setIsPremium(data.is_premium);
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
      
      // Group notes by folder
      const notesByFolder: Record<string, any[]> = {};
      data.forEach(note => {
        if (note.folder_id) {
          if (!notesByFolder[note.folder_id]) {
            notesByFolder[note.folder_id] = [];
          }
          notesByFolder[note.folder_id].push(note);
        }
      });
      setFolderNotes(notesByFolder);
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

  const toggleFolder = (folderId: string) => {
    setExpandedFolders(prev => {
      const newSet = new Set(prev);
      if (newSet.has(folderId)) {
        newSet.delete(folderId);
      } else {
        newSet.add(folderId);
      }
      return newSet;
    });
  };

  const stripHtml = (html: string) => html.replace(/<[^>]*>/g, "");

  const limits = {
    notes: isPremium ? 200 : 100,
    folders: isPremium ? 20 : 10,
    favorites: isPremium ? 20 : 10,
    tags: isPremium ? 100 : 50,
  };

  return (
    <aside className="w-80 border-r border-border bg-card flex flex-col h-screen">
      {/* Sticky Header with User Profile */}
      <div className="sticky top-0 z-10 bg-card border-b border-border">
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

          {/* Upgrade Button */}
          {!isPremium && showUpgradeButton && (
            <Button 
              onClick={() => setIsUpgradeDialogOpen(true)} 
              variant="outline" 
              size="sm"
              className="w-full border-primary/50 hover:bg-primary/10"
            >
              <Sparkles className="h-4 w-4 mr-2" />
              Upgrade to Premium
            </Button>
          )}

          {/* Limits Overview */}
          {showLimits && (
            <div className="grid grid-cols-2 gap-2 text-xs">
            <div className={cn(
              "p-2 rounded-md",
              isPremium ? "bg-primary/10 border border-primary/30" : "bg-secondary/50"
            )}>
              <div className="font-medium text-muted-foreground">Notes</div>
              <div className="text-lg font-bold">{allNotes.length}/{limits.notes}</div>
            </div>
            <div className={cn(
              "p-2 rounded-md",
              isPremium ? "bg-primary/10 border border-primary/30" : "bg-secondary/50"
            )}>
              <div className="font-medium text-muted-foreground">Folders</div>
              <div className="text-lg font-bold">{folders.length}/{limits.folders}</div>
            </div>
            <div className={cn(
              "p-2 rounded-md",
              isPremium ? "bg-primary/10 border border-primary/30" : "bg-secondary/50"
            )}>
              <div className="font-medium text-muted-foreground">Favorites</div>
              <div className="text-lg font-bold">{favoritesCount}/{limits.favorites}</div>
            </div>
            <div className={cn(
              "p-2 rounded-md",
              isPremium ? "bg-primary/10 border border-primary/30" : "bg-secondary/50"
            )}>
              <div className="font-medium text-muted-foreground">Tags</div>
              <div className="text-lg font-bold">{tags.length}/{limits.tags}</div>
            </div>
          </div>
          )}

          {isPremium && (
            <div className="flex items-center gap-2 p-2 rounded-md bg-primary/10 border border-primary/30">
              <Sparkles className="h-4 w-4 text-primary" />
              <span className="text-xs font-medium text-primary">Premium Active</span>
            </div>
          )}
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
        {/* Sticky Tabs */}
        <div className="sticky top-0 z-10 bg-card border-b border-border">
          <TabsList className="mx-4 my-2 grid w-[calc(100%-2rem)] grid-cols-3">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="favorites">
              <Star className="h-4 w-4" />
            </TabsTrigger>
            <TabsTrigger value="trash">
              <Trash2 className="h-4 w-4" />
            </TabsTrigger>
          </TabsList>
        </div>

        <ScrollArea className="flex-1">
          <TabsContent value="all" className="p-4 mt-0 space-y-4">
            {/* Folders Section */}
            {folders.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-muted-foreground px-2">
                  Folders
                </h3>
                <div className="space-y-2">
                  {folders.map((folder) => {
                    const notesInFolder = folderNotes[folder.id] || [];
                    const isExpanded = expandedFolders.has(folder.id);
                    
                    return (
                      <Collapsible
                        key={folder.id}
                        open={isExpanded}
                        onOpenChange={() => toggleFolder(folder.id)}
                      >
                        <CollapsibleTrigger asChild>
                          <Card className="cursor-pointer hover:border-primary/50 transition-all">
                            <CardContent className="p-3">
                              <div className="flex items-center gap-2">
                                <Folder className="h-4 w-4 text-primary flex-shrink-0" />
                                <span className="text-sm font-medium truncate flex-1">
                                  {folder.name}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                  {notesInFolder.length}
                                </span>
                              </div>
                            </CardContent>
                          </Card>
                        </CollapsibleTrigger>
                        
                        <CollapsibleContent className="space-y-1 mt-1 ml-4">
                          {notesInFolder.map((note) => (
                            <Card
                              key={note.id}
                              className={cn(
                                "cursor-pointer transition-all hover:border-primary/50",
                                selectedNoteId === note.id && "border-primary bg-secondary/50"
                              )}
                              onClick={() => onNoteSelect(note.id)}
                            >
                              <CardContent className="p-2.5 space-y-1">
                                <div className="flex items-start gap-2">
                                  <FileText className="h-3.5 w-3.5 mt-0.5 flex-shrink-0 text-primary" />
                                  <div className="flex-1 min-w-0">
                                    <h4 className="font-medium truncate text-xs">{note.title}</h4>
                                    <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                                      {stripHtml(note.content) || "No content"}
                                    </p>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                          {notesInFolder.length === 0 && (
                            <p className="text-xs text-muted-foreground text-center py-2">
                              No notes in this folder
                            </p>
                          )}
                        </CollapsibleContent>
                      </Collapsible>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Uncategorized Notes */}
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-muted-foreground px-2">
                Uncategorized ({notes.filter(n => !n.folder_id).length})
              </h3>
              <div className="grid grid-cols-2 gap-2">
                {notes.filter(note => !note.folder_id).map((note) => (
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
              {notes.filter(n => !n.folder_id).length === 0 && (
                <p className="text-center py-8 text-sm text-muted-foreground">
                  No uncategorized notes
                </p>
              )}
            </div>
          </TabsContent>

          <TabsContent value="favorites" className="p-4 mt-0">
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-muted-foreground px-2">
                Starred Notes ({notes.length}/10)
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
                Trash ({notes.length})
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

      {/* Sticky Footer Actions */}
      <div className="sticky bottom-0 z-10 bg-card border-t border-border">
        <div className="p-4">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              className="flex-1 justify-start"
              onClick={handleSignOut}
              size="sm"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
            <SettingsDialog />
            <ThemeSwitcher />
          </div>
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

      {/* Upgrade Dialog */}
      <UpgradeDialog 
        open={isUpgradeDialogOpen} 
        onOpenChange={setIsUpgradeDialogOpen}
        onUpgradeSuccess={loadData}
      />
    </aside>
  );
};
