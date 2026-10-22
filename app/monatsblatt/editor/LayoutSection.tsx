import { ReactNode } from "react";

/**
 * One printable layout in the Monatsblatt editor: a sticky bar with the
 * format and the controls that only concern this layout, above the sheets.
 */
export function LayoutSection(props: {
  hint: string;
  actions?: ReactNode;
  children: ReactNode;
}) {
  return (
    <>
      <div className="sticky top-0 left-0 z-40 flex h-11 items-center gap-4 border-b border-neutral-200 bg-white/90 px-4 text-sm backdrop-blur print:hidden">
        <span className="text-black/50">{props.hint}</span>
        <div className="ml-auto flex items-center gap-4">{props.actions}</div>
      </div>
      <div className="mx-auto flex w-fit flex-col items-center gap-3 px-8 py-8">
        {props.children}
      </div>
    </>
  );
}
