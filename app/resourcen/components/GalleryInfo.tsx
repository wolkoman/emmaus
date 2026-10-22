import { Folder } from "@/app/(shared)/ResourceAPI";
import { CalendarDays, Camera, Clock } from "lucide-react";
import { AppCard } from "@/components/intern/AppUI";
import { ReactNode } from "react";

interface GalleryInfoProps {
  folder: Folder;
  expiration?: string;
}

export function GalleryInfo({ folder, expiration }: GalleryInfoProps) {
  return (
    <AppCard className="mb-6 flex flex-wrap gap-x-8 gap-y-4 px-5 py-4">
      <InfoItem icon={<Camera />} label="Fotograf:in" value={folder.credit} />
      <InfoItem
        icon={<CalendarDays />}
        label="Hochgeladen"
        value={new Date(folder.createdAt).toLocaleString("de-AT", {
          dateStyle: "medium",
        })}
      />
      {expiration && (
        <InfoItem
          icon={<Clock />}
          label="Geteilt bis"
          value={new Date(expiration).toLocaleString("de-AT", {
            dateStyle: "long",
            timeStyle: "short",
          })}
        />
      )}
    </AppCard>
  );
}

function InfoItem(props: { icon: ReactNode; label: string; value: ReactNode }) {
  return (
    <div className="flex items-center gap-3">
      <div className="bg-emmaus/10 text-emmaus flex h-9 w-9 shrink-0 items-center justify-center rounded-full [&_svg]:size-4.5">
        {props.icon}
      </div>
      <div className="flex flex-col leading-tight">
        <span className="text-xs font-medium tracking-wide text-gray-500 uppercase">
          {props.label}
        </span>
        <span className="text-sm font-semibold text-gray-900">
          {props.value}
        </span>
      </div>
    </div>
  );
}
