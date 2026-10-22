"use client";

import { FileInfo, Folder } from "@/app/(shared)/ResourceAPI";
import { Button } from "@/components/ui/button";
import { CheckCheck, Share2, X } from "lucide-react";
import { use, useState } from "react";
import { createShareLink } from "../actions/createShareLink";
import { BaseGallery } from "./BaseGallery";

interface ShareableGalleryProps {
  folderPromise: Promise<Folder>;
  filesPromise: Promise<FileInfo[]>;
}

export function ShareableGallery({
  folderPromise,
  filesPromise,
}: ShareableGalleryProps) {
  const folder = use(folderPromise);
  const files = use(filesPromise);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedPhotos, setSelectedPhotos] = useState<Set<string>>(new Set());
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [isCreatingLink, setIsCreatingLink] = useState(false);

  const togglePhotoSelection = (filename: string) => {
    setSelectedPhotos((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(filename)) {
        newSet.delete(filename);
      } else {
        newSet.add(filename);
      }
      return newSet;
    });
  };

  const handleCreateShareLink = async () => {
    setIsCreatingLink(true);
    try {
      const photoIds = Array.from(selectedPhotos);
      const result = await createShareLink(folder.id, photoIds);
      setShareUrl(result.shareUrl);
      setIsSelectionMode(false);
      setSelectedPhotos(new Set());
    } catch (error) {
      console.error("Failed to create share link:", error);
      alert("Fehler beim Erstellen des Links. Bitte versuche es erneut.");
    } finally {
      setIsCreatingLink(false);
    }
  };

  const handleCancelSelection = () => {
    setIsSelectionMode(false);
    setSelectedPhotos(new Set());
  };

  const allSelected = files.length > 0 && selectedPhotos.size === files.length;

  const handleToggleSelectAll = () => {
    setSelectedPhotos(
      allSelected ? new Set() : new Set(files.map((file) => file.filename)),
    );
  };

  const controls = (
    <>
      {/* Header with Share Button */}
      {!isSelectionMode && !shareUrl && (
        <div className="mb-4">
          <Button
            onClick={() => setIsSelectionMode(true)}
            variant="outline"
            className="gap-2"
          >
            <Share2 className="h-4 w-4" />
            Fotos teilen
          </Button>
        </div>
      )}

      {isSelectionMode && (
        <div className="mb-4 flex gap-2">
          <Button
            onClick={handleCreateShareLink}
            disabled={selectedPhotos.size === 0 || isCreatingLink}
            className="gap-2"
          >
            <Share2 className="h-4 w-4" />
            {isCreatingLink
              ? "Erstelle Link..."
              : `${selectedPhotos.size} Foto${selectedPhotos.size !== 1 ? "s" : ""} teilen`}
          </Button>
          <Button
            onClick={handleToggleSelectAll}
            disabled={files.length === 0 || isCreatingLink}
            variant="outline"
            className="gap-2"
          >
            {allSelected ? (
              <>
                <X className="h-4 w-4" />
                Auswahl aufheben
              </>
            ) : (
              <>
                <CheckCheck className="h-4 w-4" />
                Alle auswählen
              </>
            )}
          </Button>
          <Button
            onClick={handleCancelSelection}
            variant="outline"
            className="gap-2"
          >
            <X className="h-4 w-4" />
            Abbrechen
          </Button>
        </div>
      )}

      {/* Selection Mode Instruction */}
      {isSelectionMode && (
        <div className="mb-4 rounded-md bg-blue-50 p-4 text-sm text-blue-900">
          Wähle Fotos aus, die geteilt werden sollen
        </div>
      )}

      {/* Share Link Display */}
      {shareUrl && (
        <div className="mb-4 rounded-md border border-green-500 bg-green-50 p-4">
          <p className="mb-2 text-sm font-semibold text-green-900">
            Link erfolgreich erstellt!
          </p>
          <div className="flex gap-2">
            <input
              type="text"
              value={shareUrl}
              readOnly
              className="flex-1 rounded-md border border-green-300 bg-white px-3 py-2 text-sm"
            />
            <Button
              onClick={() => {
                navigator.clipboard.writeText(shareUrl);
                alert("Link kopiert!");
              }}
              variant="outline"
              size="sm"
            >
              Kopieren
            </Button>
          </div>
          <p className="mt-2 text-xs text-green-700">
            Dieser Link ist 30 Tage gültig.
          </p>
          <Button
            onClick={() => setShareUrl(null)}
            variant="ghost"
            size="sm"
            className="mt-2"
          >
            Neuen Link erstellen
          </Button>
        </div>
      )}
    </>
  );

  return (
    <>
      {controls}
      <BaseGallery
        folder={folder}
        files={files}
        selection={{
          enabled: isSelectionMode,
          selected: selectedPhotos,
          onToggle: togglePhotoSelection,
        }}
      />
    </>
  );
}
