import { Textarea } from "@/components/ui/textarea";
import type { ParseError } from "./music-format";

export function MusicInput({
  source,
  onSourceChange,
  errors,
}: {
  source: string;
  onSourceChange: (source: string) => void;
  errors: ParseError[];
}) {
  return (
    <div className="flex flex-col gap-4 rounded-3xl border border-gray-200 bg-white p-5 shadow-sm">
      <div>
        <h3 className="text-lg font-semibold text-gray-950">Notation</h3>
        <p className="mt-1 text-sm text-gray-600">
          Group voices with `staff name clef "Label"`. Then enter one note per
          line with optional lyrics in quotes. Use `w`, `h`, `q`, `e`, `s`,
          dotted values like `q.`, ties with `-`, and `3e` or `3s` for triplets.
        </p>
      </div>

      <Textarea
        value={source}
        onChange={(event) => onSourceChange(event.target.value)}
        className="min-h-[320px] font-mono text-sm"
        spellCheck={false}
      />

      {errors.length > 0 && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <div className="font-semibold">Please fix these lines first:</div>
          <ul className="mt-2 space-y-2">
            {errors.map((error) => (
              <li key={`${error.line ?? "general"}-${error.message}`}>
                <div>
                  {error.line !== null ? `Line ${error.line}: ` : ""}
                  {error.message}
                </div>
                {error.content && (
                  <pre className="mt-1 overflow-x-auto rounded bg-red-100 px-2 py-1 font-mono text-xs text-red-900">
                    {error.content}
                  </pre>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
