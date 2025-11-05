import { useEffect, useState } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import Image from "@tiptap/extension-image";
import Heading from "@tiptap/extension-heading";
import Link from "@tiptap/extension-link";
import Highlight from "@tiptap/extension-highlight";
import { TextStyle } from "@tiptap/extension-text-style";
import Color from "@tiptap/extension-color";
import FontFamily from "@tiptap/extension-font-family";
import { Node } from "@tiptap/core";
import {
  Bold,
  Italic,
  List,
  ListOrdered,
  Heading1,
  Heading2,
  Heading3,
  Quote,
  Code,
  Undo,
  Redo,
  ImagePlus,
  Video,
  Link as LinkIcon,
  Highlighter,
  Type,
  Palette,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface RichTextEditorProps {
  content: string;
  onChange: (content: string) => void;
  editable?: boolean;
}

// Custom Video extension
const VideoExtension = Node.create({
  name: "video",
  group: "block",
  atom: true,
  addAttributes() {
    return {
      src: { default: null },
      "data-size": { default: null },
    };
  },
  parseHTML() {
    return [{ tag: "video" }];
  },
  renderHTML({ HTMLAttributes }) {
    return ["video", { ...HTMLAttributes, controls: true }];
  },
  addCommands() {
    return {
      setVideo:
        (options: { src: string; size?: number }) =>
        ({ commands }: any) => {
          return commands.insertContent({
            type: this.name,
            attrs: { src: options.src, "data-size": options.size },
          });
        },
    } as any;
  },
});

// Extend Image to support data-size attribute
const CustomImage = Image.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      "data-size": { default: null },
    };
  },
});

export const RichTextEditor = ({ content, onChange, editable = true }: RichTextEditorProps) => {
  const [isMounted, setIsMounted] = useState(false);
  const [isLinkDialogOpen, setIsLinkDialogOpen] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: false,
      }),
      Heading.configure({
        levels: [1, 2, 3],
      }),
      TextStyle,
      Color,
      FontFamily.configure({
        types: ['textStyle'],
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: "text-primary underline cursor-pointer hover:text-primary/80",
        },
      }),
      Highlight.configure({
        multicolor: false,
      }),
      CustomImage.configure({
        inline: true,
        allowBase64: true,
      }),
      VideoExtension,
      Placeholder.configure({
        placeholder: "Start writing your note...",
      }),
    ],
    content,
    editable,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: "prose prose-sm sm:prose-base max-w-none focus:outline-none min-h-[400px] px-6 py-4",
      },
    },
  });

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content);
    }
  }, [content, editor]);

  const handleImageUpload = async () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      if (file.size > 10 * 1024 * 1024) {
        toast.error("Image must be less than 10MB");
        return;
      }

      try {
        const formData = new FormData();
        formData.append("file", file);

        const response = await fetch("https://cdn.madebydanny.uk/upload", {
          method: "POST",
          body: formData,
        });

        if (!response.ok) throw new Error("Upload failed");

        const data = await response.json();
        const img = new window.Image();
        img.src = data.url;
        img.onload = () => {
          editor?.chain().focus().setImage({ 
            src: data.url,
            alt: "",
          } as any).updateAttributes("image", { "data-size": file.size }).run();
        };
        toast.success("Image uploaded successfully");
      } catch (error) {
        toast.error("Failed to upload image");
        console.error("Image upload error:", error);
      }
    };
    input.click();
  };

  const handleVideoUpload = async () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "video/*";
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      if (file.size > 100 * 1024 * 1024) {
        toast.error("Video must be less than 100MB");
        return;
      }

      try {
        const formData = new FormData();
        formData.append("file", file);

        toast.info("Uploading video...");
        const response = await fetch("https://cdn.madebydanny.uk/upload", {
          method: "POST",
          body: formData,
        });

        if (!response.ok) throw new Error("Upload failed");

        const data = await response.json();
        (editor?.commands as any).setVideo({ src: data.url, size: file.size });
        toast.success("Video uploaded successfully");
      } catch (error) {
        toast.error("Failed to upload video");
        console.error("Video upload error:", error);
      }
    };
    input.click();
  };

  const handleLinkClick = () => {
    const previousUrl = editor?.getAttributes("link").href;
    setLinkUrl(previousUrl || "");
    setIsLinkDialogOpen(true);
  };

  const handleSetLink = () => {
    if (!linkUrl) {
      editor?.chain().focus().unsetLink().run();
      setIsLinkDialogOpen(false);
      return;
    }

    editor?.chain().focus().setLink({ href: linkUrl }).run();
    setIsLinkDialogOpen(false);
    setLinkUrl("");
  };

  if (!isMounted || !editor) {
    return null;
  }

  const ToolbarButton = ({
    onClick,
    active,
    children,
    disabled,
  }: {
    onClick: () => void;
    active?: boolean;
    children: React.ReactNode;
    disabled?: boolean;
  }) => (
    <Button
      variant="ghost"
      size="icon"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "h-9 w-9",
        active && "bg-secondary"
      )}
    >
      {children}
    </Button>
  );

  return (
    <div className="border border-border rounded-lg overflow-hidden bg-card">
      <div className="flex items-center gap-1 p-2 border-b border-border bg-muted/50 overflow-x-auto">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-9 w-9">
              <Type className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={() => editor.chain().focus().setFontFamily('Inter').run()}>
              Inter
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => editor.chain().focus().setFontFamily('Merriweather').run()}>
              Merriweather
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => editor.chain().focus().setFontFamily('Playfair Display').run()}>
              Playfair Display
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => editor.chain().focus().setFontFamily('Open Sans').run()}>
              Open Sans
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => editor.chain().focus().setFontFamily('Roboto Mono').run()}>
              Roboto Mono
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => editor.chain().focus().unsetFontFamily().run()}>
              Default
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-9 w-9">
              <Palette className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={() => editor.chain().focus().setColor('#000000').run()}>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded" style={{ backgroundColor: '#000000' }} />
                Black
              </div>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => editor.chain().focus().setColor('#ef4444').run()}>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded" style={{ backgroundColor: '#ef4444' }} />
                Red
              </div>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => editor.chain().focus().setColor('#3b82f6').run()}>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded" style={{ backgroundColor: '#3b82f6' }} />
                Blue
              </div>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => editor.chain().focus().setColor('#22c55e').run()}>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded" style={{ backgroundColor: '#22c55e' }} />
                Green
              </div>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => editor.chain().focus().setColor('#f59e0b').run()}>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded" style={{ backgroundColor: '#f59e0b' }} />
                Orange
              </div>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => editor.chain().focus().setColor('#8b5cf6').run()}>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded" style={{ backgroundColor: '#8b5cf6' }} />
                Purple
              </div>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => editor.chain().focus().unsetColor().run()}>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded border border-border" />
                Default
              </div>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <Separator orientation="vertical" className="mx-1 h-6" />

        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBold().run()}
          active={editor.isActive("bold")}
        >
          <Bold className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleItalic().run()}
          active={editor.isActive("italic")}
        >
          <Italic className="h-4 w-4" />
        </ToolbarButton>

        <Separator orientation="vertical" className="mx-1 h-6" />

        <ToolbarButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          active={editor.isActive("heading", { level: 1 })}
        >
          <Heading1 className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          active={editor.isActive("heading", { level: 2 })}
        >
          <Heading2 className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          active={editor.isActive("heading", { level: 3 })}
        >
          <Heading3 className="h-4 w-4" />
        </ToolbarButton>

        <Separator orientation="vertical" className="mx-1 h-6" />

        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          active={editor.isActive("bulletList")}
        >
          <List className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          active={editor.isActive("orderedList")}
        >
          <ListOrdered className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          active={editor.isActive("blockquote")}
        >
          <Quote className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
          active={editor.isActive("codeBlock")}
        >
          <Code className="h-4 w-4" />
        </ToolbarButton>

        <Separator orientation="vertical" className="mx-1 h-6" />

        <ToolbarButton
          onClick={handleLinkClick}
          active={editor.isActive("link")}
        >
          <LinkIcon className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleHighlight().run()}
          active={editor.isActive("highlight")}
        >
          <Highlighter className="h-4 w-4" />
        </ToolbarButton>

        <Separator orientation="vertical" className="mx-1 h-6" />

        <ToolbarButton onClick={handleImageUpload}>
          <ImagePlus className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton onClick={handleVideoUpload}>
          <Video className="h-4 w-4" />
        </ToolbarButton>

        <Separator orientation="vertical" className="mx-1 h-6" />

        <ToolbarButton
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
        >
          <Undo className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
        >
          <Redo className="h-4 w-4" />
        </ToolbarButton>
      </div>

      <EditorContent editor={editor} className="[&_img]:max-w-full [&_img]:h-auto [&_img]:rounded-lg [&_video]:max-w-full [&_video]:h-auto [&_video]:rounded-lg" />

      <Dialog open={isLinkDialogOpen} onOpenChange={setIsLinkDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Insert Link</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              placeholder="https://example.com"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleSetLink();
                }
              }}
            />
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsLinkDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSetLink}>
                {linkUrl ? "Set Link" : "Remove Link"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};