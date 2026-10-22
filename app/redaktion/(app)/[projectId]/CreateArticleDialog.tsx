"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CpPaperArticlesFormat } from "@/util/cockpit.generated";
import { useState } from "react";
import { PiPlus } from "react-icons/pi";
import { createArticleWithGoogleDoc } from "./createArticleWithGoogleDoc";

interface CreateArticleDialogProps {
  projectId: string;
}

export function CreateArticleDialog({ projectId }: CreateArticleDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [format, setFormat] = useState<CpPaperArticlesFormat>(
    CpPaperArticlesFormat["C2200x3000x3/4"],
  );
  const [showSuccess, setShowSuccess] = useState<{
    documentUrl: string;
    statusUrl: string;
  } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const result = await createArticleWithGoogleDoc({
        projectId,
        title,
        author,
        format,
      });

      if (result.success) {
        setShowSuccess({
          documentUrl: result.documentUrl,
          statusUrl: result.statusUpdateUrl,
        });
        setOpen(false);
        // Reset form
        setTitle("");
        setAuthor("");
        setFormat(CpPaperArticlesFormat["C2200x3000x3/4"]);
      } else {
        alert(result.error);
      }
    } catch (error) {
      alert("Fehler beim Erstellen: " + error);
    } finally {
      setLoading(false);
    }
  };

  const formatOptions = Object.values(CpPaperArticlesFormat).map((format) => {
    const parts = format.match(/C(\d+)x(\d+)x(.+)/);
    if (parts) {
      const [, min, max, pages] = parts;
      const pageLabel =
        pages === "~"
          ? "variabel"
          : `${pages} Seite${pages[0] === "1" && pages.length === 1 ? "" : "n"}`;
      return {
        value: format,
        label: `${min}-${max} Zeichen (${pageLabel})`,
      };
    }
    return { value: format, label: format };
  });

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button className="gap-2" variant="outline">
            <PiPlus /> Neuer Artikel
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[500px]">
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>Neuer Artikel erstellen</DialogTitle>
              <DialogDescription>
                Erstellt einen neuen Artikel und ein Google Doc zum Schreiben.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="title">Artikeltitel</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="z.B. Pfarrfest 2024"
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="author">Autor</Label>
                <Input
                  id="author"
                  value={author}
                  onChange={(e) => setAuthor(e.target.value)}
                  placeholder="z.B. Max Mustermann"
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="format">Länge / Format</Label>
                <Select
                  value={format}
                  onValueChange={(value) =>
                    setFormat(value as CpPaperArticlesFormat)
                  }
                >
                  <SelectTrigger id="format" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {formatOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button type="submit" disabled={loading}>
                {loading ? "Erstelle..." : "Artikel erstellen"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {showSuccess && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="max-w-lg rounded-lg bg-white p-6">
            <h2 className="mb-4 text-xl font-bold text-green-600">
              ✅ Artikel erfolgreich erstellt!
            </h2>
            <p className="mb-4">
              Der Artikel wurde erstellt und das Google Doc ist bereit zum
              Schreiben.
            </p>
            <div className="space-y-3">
              <div className="rounded-lg bg-blue-50 p-3">
                <p className="mb-2 text-sm font-semibold">📝 Für den Autor:</p>
                <p className="mb-2 text-sm">
                  Schreibe im Google Doc. Um den Status zu aktualisieren oder
                  die Zeichenanzahl zu sehen, klicke auf den Link im Dokument
                  oder besuche:
                </p>
                <a
                  href={showSuccess.statusUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block rounded bg-blue-600 px-3 py-2 text-center text-sm text-white hover:bg-blue-700"
                >
                  Status-Seite öffnen
                </a>
              </div>
              <a
                href={showSuccess.documentUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button variant="outline" className="w-full">
                  Google Doc öffnen
                </Button>
              </a>
            </div>
            <div className="mt-4 flex justify-end">
              <Button
                onClick={() => {
                  setShowSuccess(null);
                  window.location.reload();
                }}
              >
                Schließen
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
