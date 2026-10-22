import { PiSpinnerBold } from "react-icons/pi";

export function Loading(props: { noPadding?: boolean }) {
  return (
    <div
      className={`w-full ${props.noPadding ? "" : "h-80"} flex items-center justify-center`}
    >
      <PiSpinnerBold className="animate-spin" />
    </div>
  );
}
