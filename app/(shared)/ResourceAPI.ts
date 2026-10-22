import React from "react";

export type Folder = {
  id: string;
  name: string;
  credit: string;
  createdAt: string;
  fileCount: number;
};

export const apiUrl = "https://api.emmaus.wien";
export const apiEndpoint = `${apiUrl}/files.php`;
export const token = process.env.EMMAUS_API_TOKEN!;

export const getFolders = React.cache(async function getFolders(): Promise<
  Folder[]
> {
  const response = await fetch(`${apiEndpoint}?action=listFolders`, {
    headers: {
      "x-token": token,
    },
  });
  return response.json();
});

export type FileInfo = {
  filename: string;
  fullUrl: string;
  thumbUrl: string;
  width?: number;
  height?: number;
};

export const getFiles = React.cache(async function getFiles(
  folderId: string,
): Promise<FileInfo[]> {
  return await fetch(`${apiEndpoint}?action=listFiles&folderId=${folderId}`, {
    headers: {
      "x-token": token,
    },
  }).then((r) => r.json());
});

export async function createFolder(
  name: string,
  credit: string,
): Promise<{ success: boolean; id: string }> {
  const response = await fetch(`${apiEndpoint}?action=createFolder`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ name, credit }),
  });

  if (!response.ok) {
    throw new Error(`Create folder failed: ${response.statusText}`);
  }

  return response.json();
}

export async function uploadFile(file: File, folderId: string): Promise<void> {
  // Validate that the file is an image
  if (!file.type.startsWith("image/")) {
    throw new Error("Only image files are allowed");
  }

  // Create FormData for multipart/form-data upload
  const formData = new FormData();
  formData.append("file", file);
  formData.append("folderId", folderId);

  const response = await fetch(`${apiEndpoint}?action=uploadFile`, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    console.error(response);
    throw new Error(`Upload failed: ${response.statusText}`);
  }
  console.log("success", response);
}

export async function renameFolder(
  folderId: string,
  name: string,
  credit?: string,
): Promise<void> {
  const response = await fetch(`${apiEndpoint}?action=renameFolder`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-token": token,
    },
    body: JSON.stringify({ folderId, name, credit }),
  });

  if (!response.ok) {
    throw new Error(`Rename folder failed: ${response.statusText}`);
  }
}

export async function deleteFolder(folderId: string): Promise<void> {
  const response = await fetch(
    `${apiEndpoint}?action=deleteFolder&folderId=${folderId}`,
    {
      method: "DELETE",
      headers: {
        "x-token": token,
      },
    },
  );

  if (!response.ok) {
    throw new Error(`Delete folder failed: ${response.statusText}`);
  }
}
