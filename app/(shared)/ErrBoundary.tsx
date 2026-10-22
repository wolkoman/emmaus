"use client";

import { ErrorBoundary } from "next/dist/client/components/error-boundary";
import { ReactNode } from "react";

function ErrorComponent(props: { error: unknown }) {
  return <div>Error</div>;
}

export function ErrBoundary(props: { children: ReactNode }) {
  return (
    <ErrorBoundary errorComponent={ErrorComponent}>
      {props.children}
    </ErrorBoundary>
  );
}
