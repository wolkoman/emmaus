type Field = {
  name: string;
  type: string;
  required?: boolean;
  values?: string[];
  maxSelect?: number;
  max?: number;
  maxSize?: number;
  onlyInt?: boolean;
};

export function migrationAssetUrl(host: string, path: string): string {
  return new URL(path, host.replace(/\/$/, "") + "/").href;
}

export function assertMediaResponse(
  contentType: string,
  bytes: Uint8Array,
): void {
  const prefix = new TextDecoder().decode(bytes.subarray(0, 256)).trimStart();
  if (
    /text\/html/i.test(contentType) ||
    /^(<!doctype html|<html)/i.test(prefix)
  ) {
    throw new Error("Expected a media file, received HTML");
  }
}

export function validateMigrationPayload(
  payload: Record<string, unknown>,
  fields: Field[],
): string[] {
  const errors: string[] = [];
  const schema = new Map(fields.map((field) => [field.name, field]));
  for (const [name, value] of Object.entries(payload)) {
    const field = schema.get(name);
    if (!field) {
      errors.push(`${name}: unknown target field`);
      continue;
    }
    if (
      field.required &&
      (value == null || value === "" || (Array.isArray(value) && !value.length))
    ) {
      errors.push(`${name}: required value missing`);
    }
    if (field.type === "select") {
      const values = Array.isArray(value) ? value : value ? [value] : [];
      if (values.some((v) => !field.values?.includes(String(v)))) {
        errors.push(`${name}: unsupported select value`);
      }
      if (values.length > (field.maxSelect || 1)) {
        errors.push(`${name}: too many selected values`);
      }
    }
    if (
      field.type === "text" &&
      String(value ?? "").length > (field.max || 5000)
    ) {
      errors.push(`${name}: text exceeds maximum length`);
    }
    if (field.type === "editor" || field.type === "json") {
      const serialized =
        field.type === "json"
          ? JSON.stringify(value ?? null)
          : String(value ?? "");
      if (field.maxSize && Buffer.byteLength(serialized) > field.maxSize) {
        errors.push(`${name}: value exceeds maximum size`);
      }
    }
    if (field.type === "number") {
      const number = Number(value ?? 0);
      if (
        !Number.isFinite(number) ||
        (field.onlyInt && !Number.isInteger(number))
      ) {
        errors.push(`${name}: invalid number`);
      }
    }
  }
  return errors;
}

export function assertNoMigrationFailures(failures: string[]): void {
  if (failures.length) {
    throw new Error(`Migration incomplete:\n${failures.join("\n")}`);
  }
}
