"use client";

import { RefObject, useEffect, useRef, useState } from "react";

export interface JustifiedTile<T> {
  item: T;
  index: number;
  width: number;
  height: number;
}

interface JustifiedOptions {
  gap?: number;
  targetRowHeight?: number;
}

function computeRows<T extends { aspectRatio: number }>(
  items: T[],
  containerWidth: number,
  gap: number,
  targetRowHeight: number,
): JustifiedTile<T>[][] {
  const rows: JustifiedTile<T>[][] = [];
  let current: { item: T; index: number; ar: number }[] = [];
  let aspectSum = 0;

  const flush = (stretch: boolean) => {
    if (current.length === 0) return;
    const gaps = gap * (current.length - 1);
    const rowHeight = stretch
      ? (containerWidth - gaps) / aspectSum
      : targetRowHeight;
    rows.push(
      current.map((c) => ({
        item: c.item,
        index: c.index,
        width: rowHeight * c.ar,
        height: rowHeight,
      })),
    );
    current = [];
    aspectSum = 0;
  };

  items.forEach((item, index) => {
    const ar = item.aspectRatio > 0 ? item.aspectRatio : 1;
    current.push({ item, index, ar });
    aspectSum += ar;

    const gaps = gap * (current.length - 1);
    const rowWidthAtTarget = aspectSum * targetRowHeight + gaps;
    if (rowWidthAtTarget >= containerWidth) {
      flush(true);
    }
  });

  // Trailing row keeps the target height instead of stretching to full width.
  flush(false);

  return rows;
}

export function useJustifiedLayout<T extends { aspectRatio: number }>(
  items: T[],
  options?: JustifiedOptions,
): {
  containerRef: RefObject<HTMLDivElement | null>;
  rows: JustifiedTile<T>[][];
  gap: number;
  targetRowHeight: number;
} {
  const gap = options?.gap ?? 8;
  const targetRowHeight = options?.targetRowHeight ?? 220;
  const containerRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setWidth(entry.contentRect.width);
      }
    });
    observer.observe(el);
    setWidth(el.clientWidth);

    return () => observer.disconnect();
  }, []);

  const rows = width > 0 ? computeRows(items, width, gap, targetRowHeight) : [];

  return { containerRef, rows, gap, targetRowHeight };
}
