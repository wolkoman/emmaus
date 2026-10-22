"use client";

import { Folder } from "@/app/(shared)/ResourceAPI";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Pencil, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { deleteFolder } from "../actions/deleteFolder";
import { renameFolder } from "../actions/renameFolder";

interface RenameFolderDialogProps {
  folder: Folder;
}

export function RenameFolderDialog({ folder }: RenameFolderDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(folder.name);
  const [credit, setCredit] = useState(folder.credit);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [error, setError] = useState<string>();

  const busy = isSaving || isDeleting;

  const handleOpenChange = (next: boolean) => {
    if (!next) {
      setName(folder.name);
      setCredit(folder.credit);
      setConfirmingDelete(false);
      setError(undefined);
    }
    setOpen(next);
  };

  const handleSave = async () => {
    if (!name.trim()) {
      setError("Ordnername darf nicht leer sein.");
      return;
    }

    setIsSaving(true);
    setError(undefined);
    try {
      await renameFolder(folder.id, name.trim(), credit.trim());
      setOpen(false);
      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Umbenennen fehlgeschlagen.",
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    setError(undefined);
    try {
      await deleteFolder(folder.id);
      setOpen(false);
      router.push("/resourcen");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Löschen fehlgeschlagen.");
      setIsDeleting(false);
      setConfirmingDelete(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon-sm" aria-label="Ordner bearbeiten">
          <Pencil />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Ordner bearbeiten</DialogTitle>
          <DialogDescription>
            Ändere den Namen und den Fotocredit dieses Ordners.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4 text-base font-normal">
          <div>
            <Label htmlFor="folder-name" className="mb-2 block">
              Sammlungsname
            </Label>
            <Input
              id="folder-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Um was geht es?"
              disabled={isSaving}
            />
          </div>

          <div>
            <Label htmlFor="folder-credit" className="mb-2 block">
              Fotocredit
            </Label>
            <Input
              id="folder-credit"
              type="text"
              value={credit}
              onChange={(e) => setCredit(e.target.value)}
              placeholder="Wer hat die Fotos gemacht?"
              disabled={isSaving}
            />
          </div>

          {error && <div className="text-sm text-red-600">{error}</div>}

          <div className="border-t border-black/10 pt-4">
            {confirmingDelete ? (
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <span className="text-muted-foreground text-sm">
                  Ordner und alle Fotos endgültig löschen?
                </span>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setConfirmingDelete(false)}
                    disabled={busy}
                  >
                    Abbrechen
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={handleDelete}
                    loading={isDeleting}
                  >
                    Endgültig löschen
                  </Button>
                </div>
              </div>
            ) : (
              <Button
                variant="destructive"
                onClick={() => setConfirmingDelete(true)}
                disabled={busy}
              >
                <Trash2 /> Ordner löschen
              </Button>
            )}
          </div>
        </div>

        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline" disabled={busy}>
              Abbrechen
            </Button>
          </DialogClose>
          <Button
            onClick={handleSave}
            loading={isSaving}
            disabled={busy || !name.trim()}
          >
            Speichern
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
