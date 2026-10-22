import { FileInfo, Folder } from "@/app/(shared)/ResourceAPI";
import { PageHeading } from "@/components/intern/AppUI";
import React, { Suspense } from "react";
import { BaseGallery } from "./BaseGallery";
import { GalleryInfo } from "./GalleryInfo";
import { RenameFolderDialog } from "./RenameFolderDialog";
import { ShareableGallery } from "./ShareableGallery";

interface GalleryViewProps {
  folderPromise: Promise<Folder>;
  filesPromise: Promise<FileInfo[]>;
  createShareables?: boolean;
  showInfo?: boolean;
  editable?: boolean;
  expiration?: string;
}

export function GalleryView({
  folderPromise,
  filesPromise,
  createShareables = false,
  showInfo = false,
  editable = false,
  expiration,
}: GalleryViewProps) {
  return (
    <div className="mx-auto flex max-w-7xl flex-col px-4 py-8">
      <div className="mb-4">
        <PageHeading
          title={
            <span className="flex items-center gap-3">
              <Suspense fallback={<Shadow>Kirchenevent 2025</Shadow>}>
                {folderPromise.then((folder) => (
                  <>
                    <span>{folder.name}</span>
                    {editable && <RenameFolderDialog folder={folder} />}
                  </>
                ))}
              </Suspense>
            </span>
          }
        />
      </div>

      {showInfo && (
        <Suspense
          fallback={
            <div className="mb-6 h-32 animate-pulse rounded-md border border-black/10 bg-black/5" />
          }
        >
          {folderPromise.then((folder) => (
            <GalleryInfo folder={folder} expiration={expiration} />
          ))}
        </Suspense>
      )}

      {createShareables ? (
        <Suspense
          fallback={
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
              {Array.from({ length: 10 }).map((_, i) => (
                <PhotoSkeleton key={i} />
              ))}
            </div>
          }
        >
          <ShareableGallery
            folderPromise={folderPromise}
            filesPromise={filesPromise}
          />
        </Suspense>
      ) : (
        <Suspense
          fallback={
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
              {Array.from({ length: 10 }).map((_, i) => (
                <PhotoSkeleton key={i} />
              ))}
            </div>
          }
        >
          {Promise.all([folderPromise, filesPromise]).then(
            ([folder, files]) => (
              <BaseGallery folder={folder} files={files} />
            ),
          )}
        </Suspense>
      )}
    </div>
  );
}

function Shadow(props: { children: React.ReactNode }) {
  return (
    <span className="inline-block animate-pulse rounded-md bg-black/10 text-black/0">
      {props.children}
    </span>
  );
}

function PhotoSkeleton() {
  return (
    <div className="min-h-[180px] animate-pulse rounded-md border border-black/10 bg-black/5 bg-cover bg-center" />
  );
}
