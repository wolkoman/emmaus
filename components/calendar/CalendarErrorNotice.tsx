import React from "react";

export function CalendarErrorNotice() {
  return (
    <div
      className={`flex items-center gap-8 rounded-2xl border-4 bg-black/5 p-4 px-8`}
      data-testid="calendar-error"
    >
      <img src="/calendar-error.svg" className="h-28 animate-pulse" />
      <div>
        <div className="text-lg font-bold">Eine Sekunde noch..</div>
        <div>
          Es gibt Probleme beim Abrufen der Termine. <br />
          Bitte warten Sie noch kurz!
        </div>
      </div>
    </div>
  );
}
