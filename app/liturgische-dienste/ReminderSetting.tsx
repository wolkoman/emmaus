"use client";
import {
  getLiturgyRemindersEnabled,
  setLiturgyRemindersEnabled,
} from "@/app/liturgische-dienste/(liturgy-roster-store)/reminders";
import { AppCard } from "@/components/intern/AppUI";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useUserStore } from "@/store/UserStore";
import { CpPersonCompetences } from "@/util/cockpit.generated";
import { useEffect, useState } from "react";

/** Opt-out of the reminder mail sent the day before a reading. */
export function ReminderSetting() {
  const person = useUserStore((state) => state.person);
  const isReader = !!person?.competences.includes(CpPersonCompetences.Reader);
  const [enabled, setEnabled] = useState<boolean | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (isReader) getLiturgyRemindersEnabled().then(setEnabled);
  }, [isReader]);

  if (!isReader) return null;

  async function onChange(value: boolean) {
    setEnabled(value);
    setError(false);
    try {
      await setLiturgyRemindersEnabled(value);
    } catch {
      setEnabled(!value);
      setError(true);
    }
  }

  return (
    <AppCard className="flex items-center justify-between gap-4 p-4">
      <div>
        <Label htmlFor="liturgy-reminders" className="font-semibold">
          Erinnerung am Vortag
        </Label>
        <p className="text-sm text-black/60">
          {error
            ? "Die Einstellung konnte nicht gespeichert werden."
            : "E-Mail am Tag vor Ihrem Lesedienst."}
        </p>
      </div>
      <Switch
        id="liturgy-reminders"
        checked={enabled ?? false}
        disabled={enabled === null}
        onCheckedChange={onChange}
      />
    </AppCard>
  );
}
