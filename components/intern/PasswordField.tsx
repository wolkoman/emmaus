import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function PasswordField(props: {
  id: string;
  label: string;
  value: string;
  autoComplete: "current-password" | "new-password";
  autoFocus?: boolean;
  onChange: (text: string) => void;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={props.id}>{props.label}</Label>
      <Input
        id={props.id}
        className="h-10 bg-white"
        type="password"
        autoComplete={props.autoComplete}
        autoFocus={props.autoFocus}
        value={props.value}
        onChange={(event) => props.onChange(event.target.value)}
      />
    </div>
  );
}

/** Status line under a form: a success note or an error. */
export function FormMessage(props: { ok: boolean; children: React.ReactNode }) {
  return props.ok ? (
    <p
      role="status"
      className="bg-emmaus/10 text-emmaus rounded-md px-3 py-2 text-sm"
    >
      {props.children}
    </p>
  ) : (
    <p
      role="alert"
      className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700"
    >
      {props.children}
    </p>
  );
}
