import { cn } from "@/util/utils";

/** Live length of the Google Doc against the article's target. */
export function LengthProgress(props: {
  count: number;
  min: number;
  max: number;
}) {
  const state =
    props.count < props.min ? "short" : props.count > props.max ? "long" : "ok";
  const format = (n: number) => n.toLocaleString("de-AT");
  return (
    <div className="flex w-full flex-col gap-1.5">
      <div className="h-2 overflow-hidden rounded-full bg-neutral-200">
        <div
          className={cn(
            "h-full rounded-full",
            { short: "bg-emmaus", ok: "bg-green-600", long: "bg-amber-500" }[
              state
            ],
          )}
          style={{
            width: `${Math.min(100, (100 * props.count) / props.max)}%`,
          }}
        />
      </div>
      <div className="flex justify-between gap-4 text-sm whitespace-nowrap">
        <span className="text-black/60">
          {format(props.count)} von {format(props.min)}–{format(props.max)}{" "}
          Zeichen
        </span>
        <span
          className={cn(
            "font-medium",
            {
              short: "text-black/60",
              ok: "text-green-700",
              long: "text-amber-700",
            }[state],
          )}
        >
          {
            {
              short: `${format(props.min - props.count)} fehlen noch`,
              ok: "Passt",
              long: `${format(props.count - props.max)} zu viel`,
            }[state]
          }
        </span>
      </div>
    </div>
  );
}

/** Same footprint as LengthProgress while the Google Docs count loads. */
export function LengthProgressShadow() {
  return (
    <div className="flex w-full animate-pulse flex-col gap-1.5">
      <div className="h-2 rounded-full bg-neutral-200" />
      <div className="h-5 w-48 rounded-md bg-black/5" />
    </div>
  );
}
