import { useEffect, useState } from "react";
import { Folder, Plus, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface FolderListProps {
  selectedFolderId: string | null;
  onFolderSelect: (folderId: string | null) => void;
  showNewFolderDialog?: boolean;
  onNewFolderDialogChange?: (show: boolean) => void;
}

export const FolderList = ({ 
  selectedFolderId, 
  onFolderSelect,
  showNewFolderDialog,
  onNewFolderDialogChange 
}: FolderListProps) => {
  const [folders, setFolders] = useState<any[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingFolder, setEditingFolder] = useState<any>(null);

  useEffect(() => {
    if (showNewFolderDialog !== undefined) {
      setIsDialogOpen(showNewFolderDialog);
    }
  }, [showNewFolderDialog]);

  useEffect(() => {
    loadFolders();

    const channel = supabase
      .channel("folders")
      .on("postgres_changes", { event: "*", schema: "public", table: "folders" }, () => {
        loadFolders();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const loadFolders = async () => {
    const { data } = await supabase
      .from("folders")
      .select("*")
      .order("created_at", { ascending: true });
    
    if (data) {
      setFolders(data);
    }
  };

  const handleCreateFolder = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const name = formData.get("name") as string;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    if (editingFolder) {
      const { error } = await supabase
        .from("folders")
        .update({ name })
        .eq("id", editingFolder.id);

      if (error) {
        toast.error("Failed to update folder");
      } else {
        toast.success("Folder updated!");
        setIsDialogOpen(false);
        setEditingFolder(null);
        onNewFolderDialogChange?.(false);
      }
    } else {
      const { error } = await supabase
        .from("folders")
        .insert({ name, user_id: user.id });

      if (error) {
        toast.error("Failed to create folder");
      } else {
        toast.success("Folder created!");
        setIsDialogOpen(false);
        onNewFolderDialogChange?.(false);
      }
    }
  };

  const handleDeleteFolder = async (folderId: string) => {
    const { error } = await supabase
      .from("folders")
      .delete()
      .eq("id", folderId);

    if (error) {
      toast.error("Failed to delete folder");
    } else {
      toast.success("Folder deleted!");
      if (selectedFolderId === folderId) {
        onFolderSelect(null);
      }
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between px-2">
        <h3 className="text-sm font-semibold text-muted-foreground">Folders</h3>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6"
          onClick={() => {
            setEditingFolder(null);
            setIsDialogOpen(true);
          }}
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      <Button
        variant="ghost"
        className={cn(
          "w-full justify-start",
          selectedFolderId === null && "bg-secondary"
        )}
        onClick={() => onFolderSelect(null)}
      >
        <Folder className="h-4 w-4 mr-2" />
        All Notes
      </Button>

      {folders.map((folder) => (
        <div key={folder.id} className="group flex items-center gap-1">
          <Button
            variant="ghost"
            className={cn(
              "flex-1 justify-start",
              selectedFolderId === folder.id && "bg-secondary"
            )}
            onClick={() => onFolderSelect(folder.id)}
          >
            <Folder className="h-4 w-4 mr-2" />
            {folder.name}
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 opacity-0 group-hover:opacity-100"
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-popover">
              <DropdownMenuItem
                onClick={() => {
                  setEditingFolder(folder);
                  setIsDialogOpen(true);
                }}
              >
                <Pencil className="h-4 w-4 mr-2" />
                Rename
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-destructive"
                onClick={() => handleDeleteFolder(folder.id)}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      ))}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingFolder ? "Rename Folder" : "New Folder"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateFolder} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Folder Name</Label>
              <Input
                id="name"
                name="name"
                defaultValue={editingFolder?.name || ""}
                placeholder="My Folder"
                required
                autoFocus
              />
            </div>
            <Button type="submit" className="w-full">
              {editingFolder ? "Update" : "Create"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};
