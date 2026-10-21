/**
 * The shared state: sections (e.g. `live`, `obs`) of string fields. The schema
 * says what each field may hold; the control page renders itself from it.
 */

export type Field =
  /** One of `values`; the first is the initial value. */
  | { kind: "choice"; values: string[]; initial: string; readOnly?: boolean }
  /** A time of day, "HH:MM". */
  | { kind: "time"; initial: string }
  /** Free text, e.g. a name. */
  | { kind: "text"; initial: string; maxLength: number };

export type Schema = Record<string, Record<string, Field>>;
export type Patch = Record<string, string>;
export type State = Record<string, Patch>;

/** `readOnly` fields are set by the server (e.g. from OBS), never by clients. */
export const choice = (values: string[], options: { readOnly?: boolean } = {}): Field => ({
  kind: "choice",
  values,
  initial: values[0],
  ...options,
});
export const time = (initial: string): Field => ({ kind: "time", initial });
export const text = (initial = "", maxLength = 40): Field => ({ kind: "text", initial, maxLength });

const TIME = /^([01]\d|2[0-3]):[0-5]\d$/;

export function createStore(schema: Schema) {
  const state: State = Object.fromEntries(
    Object.entries(schema).map(([section, fields]) => [
      section,
      Object.fromEntries(Object.entries(fields).map(([name, field]) => [name, field.initial])),
    ]),
  );
  const listeners = new Set<(state: State) => void>();

  return {
    schema,
    state: state as Readonly<State>,

    /** Checks a client's patch; returns an error message, or null if it may be applied. */
    validate(section: string, patch: unknown): string | null {
      if (!Object.hasOwn(schema, section)) return `unknown section "${section}"`;
      const fields = schema[section];
      if (typeof patch !== "object" || patch === null) return "patch must be an object";
      const entries = Object.entries(patch);
      if (entries.length === 0) return "patch is empty";
      for (const [name, value] of entries) {
        const where = `"${section}.${name}"`;
        if (!Object.hasOwn(fields, name)) return `unknown field ${where}`;
        const field = fields[name];
        if (typeof value !== "string") return `${where} must be a string`;
        if (field.kind === "choice" && field.readOnly) return `${where} is set by the server`;
        if (field.kind === "choice" && !field.values.includes(value)) {
          return `${where} must be one of: ${field.values.join(", ")}`;
        }
        if (field.kind === "time" && !TIME.test(value)) return `${where} must be a time like 16:55`;
        if (field.kind === "text" && value.length > field.maxLength) {
          return `${where} must be at most ${field.maxLength} characters`;
        }
      }
      return null;
    },

    /** Applies a patch (validated, or from the server itself) and notifies listeners if anything changed. */
    apply(section: string, patch: Patch) {
      const current = state[section];
      const changed = Object.entries(patch).filter(([name, value]) => current[name] !== value);
      if (changed.length === 0) return;
      Object.assign(current, patch);
      console.log(`${section} ←`, Object.fromEntries(changed));
      for (const listener of listeners) listener(state);
    },

    subscribe(listener: (state: State) => void) {
      listeners.add(listener);
    },
  };
}

export type Store = ReturnType<typeof createStore>;
