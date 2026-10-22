"use client";

import { createFolder, uploadFile } from "@/app/(shared)/ResourceAPI";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { compressImage } from "./compressImage";

export default function FileUpload() {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [folderName, setFolderName] = useState("");
  const [credit, setCredit] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<string>();

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      setSelectedFiles((prev) => [
        ...prev,
        ...Array.from(files).filter((file) => file.type.startsWith("image/")),
      ]);
    }
  };

  const removeFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const handleUpload = async () => {
    if (!folderName.trim()) {
      setUploadStatus("Bitte geben Sie einen Ordnernamen ein.");
      return;
    }

    if (selectedFiles.length === 0) {
      setUploadStatus("Bitte wählen Sie mindestens eine Datei aus.");
      return;
    }

    setIsUploading(true);
    setUploadStatus("Ordner wird erstellt...");

    try {
      // Create folder first
      const folderResponse = await createFolder(
        folderName.trim(),
        credit.trim(),
      );

      if (!folderResponse.success) {
        throw new Error("Ordner konnte nicht erstellt werden.");
      }

      const total = selectedFiles.length;
      setUploadStatus(`Dateien werden hochgeladen... (0/${total})`);

      // Keep a fixed number of uploads in flight at all times. As soon as one
      // finishes, the next file starts, so the network stays saturated instead
      // of waiting for the slowest file in each batch. Each file is compressed
      // just before it's sent.
      const concurrency = 5;
      let uploadedCount = 0;
      let nextIndex = 0;

      const worker = async () => {
        while (nextIndex < total) {
          const file = selectedFiles[nextIndex++];
          const compressed = await compressImage(file);
          await uploadFile(compressed, folderResponse.id);
          uploadedCount++;
          setUploadStatus(
            `Dateien werden hochgeladen... (${uploadedCount}/${total})`,
          );
        }
      };

      await Promise.all(
        Array.from({ length: Math.min(concurrency, total) }, worker),
      );

      setUploadStatus(
        "Alle Dateien wurden erfolgreich hochgeladen. Danke sehr! 🥳",
      );

      // Reset form
      setSelectedFiles([]);
      setFolderName("");

      // Clear success message after 3 seconds
      setTimeout(() => setUploadStatus(""), 30000);
    } catch (error) {
      console.error("Upload error:", error);
      setUploadStatus(
        `Fehler beim Hochladen: ${error instanceof Error ? error.message : "Unbekannter Fehler"}`,
      );
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="w-full max-w-xl shrink-0 grow rounded-lg border border-black/10 p-6">
      <div className="space-y-6">
        <div>
          <Label className="mb-2 block">Bilder auswählen</Label>
          <Input
            type="file"
            multiple
            accept="image/*"
            className="cursor-pointer"
            onChange={handleFileSelect}
            disabled={isUploading}
          />
        </div>

        {selectedFiles.length > 0 && (
          <div>
            <h3 className="mb-3 text-sm font-medium text-gray-700">
              Ausgewählte Dateien ({selectedFiles.length})
            </h3>
            <div className="max-h-80 overflow-y-auto rounded-md border border-black/10">
              {selectedFiles.map((file, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between border-b border-black/10 py-1 last:border-b-0"
                >
                  <div className="flex min-w-0 flex-1 items-end gap-1 px-4">
                    <p className="truncate">{file.name}</p>
                    <p className="text-sm opacity-70">
                      {formatFileSize(file.size)}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    className="text-xs text-red-500 hover:text-red-700"
                    onClick={() => removeFile(index)}
                    disabled={isUploading}
                  >
                    Entfernen
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Folder Name Input */}
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">
            Sammlungsname
          </label>
          <Input
            type="text"
            value={folderName}
            onChange={(e) => setFolderName(e.target.value)}
            placeholder="Um was geht es?"
            disabled={isUploading}
          />

          <label className="mt-4 mb-2 block text-sm font-medium text-gray-700">
            Fotocredit
          </label>
          <Input
            type="text"
            value={credit}
            onChange={(e) => setCredit(e.target.value)}
            placeholder="Wer hat die Fotos gemacht?"
            disabled={isUploading}
          />
          <Button
            onClick={handleUpload}
            className="mt-4 w-full py-5"
            disabled={
              isUploading || selectedFiles.length === 0 || !folderName.trim()
            }
          >
            {isUploading ? "Wird hochgeladen..." : "Hochladen"}
          </Button>
        </div>

        {/* Status Message */}
        {uploadStatus ? (
          <div
            className={`rounded-md px-6 py-4 text-sm ${
              uploadStatus.includes("Fehler")
                ? "bg-red-50 text-red-700"
                : uploadStatus.includes("erfolgreich")
                  ? "bg-green-50 text-green-700"
                  : "bg-blue-50 text-blue-700"
            }`}
          >
            {uploadStatus}
          </div>
        ) : (
          <div className="-translate-y-4 text-center text-sm italic">
            Mit dem Hochladen übertrage ich die Rechte an den Fotos an die
            Pfarre Emmaus am Wienerberg.
          </div>
        )}
      </div>
    </div>
  );
}
