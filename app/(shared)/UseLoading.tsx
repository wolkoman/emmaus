import { useState } from "react";

export function useLoading() {
  const [loading, setLoading] = useState(false);
  const [placeholder, setPlaceholder] = useState<string | undefined>();

  function whileLoading(promise: Promise<any>, placeholder?: string) {
    setLoading(true);
    setPlaceholder(placeholder);
    return promise.finally(() => setLoading(false));
  }

  return { loading, whileLoading, placeholder };
}
