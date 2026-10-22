"use client";

import React from "react";
import Site from "@/components/Site";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <Site title="Fehler">
      <div className="mx-auto max-w-xl">
        <div className="mb-6 mt-6 text-3xl font-bold text-red-600 lg:mt-20">
          Fehler beim Laden der Seite
        </div>

        <div className="space-y-4">
          <p className="text-gray-700">
            Es ist ein unerwarteter Fehler aufgetreten. Bitte versuchen Sie es erneut.
          </p>

          {process.env.NODE_ENV === "development" && (
            <details className="mt-4 rounded border border-red-200 bg-red-50 p-4">
              <summary className="cursor-pointer font-semibold text-red-700">
                Fehlerdetails (nur in Entwicklung sichtbar)
              </summary>
              <pre className="mt-2 overflow-auto text-sm text-red-600">
                {error.message}
              </pre>
            </details>
          )}

          <div className="flex gap-4">
            <button
              onClick={reset}
              className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
            >
              Erneut versuchen
            </button>

            <a
              href="/"
              className="rounded border border-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-50"
            >
              Zur Startseite
            </a>
          </div>
        </div>
      </div>
    </Site>
  );
}
