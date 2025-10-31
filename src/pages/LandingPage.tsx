import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { FileText, FolderOpen, Tag, Search, Sparkles, Zap } from "lucide-react";

export const LandingPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      {/* Hero Section */}
      <header className="container mx-auto px-4 py-6">
        <nav className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="rounded-full bg-primary p-2">
              <FileText className="h-6 w-6 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold">MBD Scribe</span>
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" onClick={() => navigate("/auth")}>
              Sign In
            </Button>
            <Button onClick={() => navigate("/auth")}>
              Get Started
            </Button>
          </div>
        </nav>
      </header>

      {/* Hero */}
      <section className="container mx-auto px-4 py-24 text-center">
        <div className="mx-auto max-w-3xl space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-sm font-medium text-primary">
            <Sparkles className="h-4 w-4" />
            Free For Life!
          </div>
          
          <h1 className="text-5xl font-bold tracking-tight sm:text-6xl">
            Organize Your Thoughts,
            <br />
            <span className="text-primary">For Free</span>
          </h1>
          
          <p className="text-xl text-muted-foreground">
            A simple notes app with rich text editing, folders, tags, sync, and more.
            Keep your ideas organized and accessible from anywhere at anytime.
          </p>

          <div className="flex gap-4 justify-center pt-4">
            <Button size="lg" onClick={() => navigate("/auth")}>
              launch app
            </Button>
            <Button size="lg" variant="outline" onClick={() => navigate("/auth")}>
              Learn More
            </Button>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="container mx-auto px-4 py-24">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold mb-4">Everything you need, all in open app</h2>
          <p className="text-lg text-muted-foreground">
            Powerful tools to help you stay organized, all free forever
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Card className="border-border/50 hover:border-primary/50 transition-colors">
            <CardContent className="p-6 space-y-3">
              <div className="rounded-lg bg-primary/10 w-12 h-12 flex items-center justify-center">
                <FileText className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold text-lg">Rich Text Editor</h3>
              <p className="text-muted-foreground">
                Format your notes with bold, italic, lists, headings, and more. A beautiful writing experience.
              </p>
            </CardContent>
          </Card>

          <Card className="border-border/50 hover:border-primary/50 transition-colors">
            <CardContent className="p-6 space-y-3">
              <div className="rounded-lg bg-primary/10 w-12 h-12 flex items-center justify-center">
                <FolderOpen className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold text-lg">Folders</h3>
              <p className="text-muted-foreground">
                Organize notes into folders. Create, rename, and manage your folders with ease.
              </p>
            </CardContent>
          </Card>

          <Card className="border-border/50 hover:border-primary/50 transition-colors">
            <CardContent className="p-6 space-y-3">
              <div className="rounded-lg bg-primary/10 w-12 h-12 flex items-center justify-center">
                <Tag className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold text-lg">Tags</h3>
              <p className="text-muted-foreground">
                Add colorful tags to categorize notes. Find related content quickly with tag filtering.
              </p>
            </CardContent>
          </Card>

          <Card className="border-border/50 hover:border-primary/50 transition-colors">
            <CardContent className="p-6 space-y-3">
              <div className="rounded-lg bg-primary/10 w-12 h-12 flex items-center justify-center">
                <Search className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold text-lg">Live Search</h3>
              <p className="text-muted-foreground">
                Find any note instantly. Search across titles and content with real-time results.
              </p>
            </CardContent>
          </Card>

          <Card className="border-border/50 hover:border-primary/50 transition-colors">
            <CardContent className="p-6 space-y-3">
              <div className="rounded-lg bg-primary/10 w-12 h-12 flex items-center justify-center">
                <Zap className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold text-lg">Auto-save</h3>
              <p className="text-muted-foreground">
                Never lose your work. Notes are automatically saved as you type.
              </p>
            </CardContent>
          </Card>

          <Card className="border-border/50 hover:border-primary/50 transition-colors">
            <CardContent className="p-6 space-y-3">
              <div className="rounded-lg bg-primary/10 w-12 h-12 flex items-center justify-center">
                <Sparkles className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold text-lg">Beautiful Themes</h3>
              <p className="text-muted-foreground">
                Choose from multiple color themes. Make the app feel like yours.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* CTA */}
      <section className="container mx-auto px-4 py-24">
        <Card className="bg-gradient-to-r from-primary/10 via-accent/10 to-primary/10 border-primary/20">
          <CardContent className="p-12 text-center space-y-6">
            <h2 className="text-3xl font-bold">Get Started For Free</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Join thousands of people organizing their thoughts and ideas with MBD Scribe.
            </p>
            <Button size="lg" onClick={() => navigate("/auth")}>
              Create Your Free Account
            </Button>
          </CardContent>
        </Card>
      </section>

      {/* Footer */}
      <footer className="border-t border-border">
        <div className="container mx-auto px-4 py-8 text-center text-sm text-muted-foreground">
          <p>&copy; 2024-2025 Made by Danny UK</p>
        </div>
      </footer>
    </div>
  );
};
