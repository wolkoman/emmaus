export function LedgerLines({ x, ys }: { x: number; ys: number[] }) {
  return (
    <>
      {ys.map((ledgerY, index) => (
        <line
          key={`${ledgerY}-${index}`}
          x1={x - 14}
          y1={ledgerY}
          x2={x + 14}
          y2={ledgerY}
          stroke="#1f2937"
          strokeWidth="1.5"
        />
      ))}
    </>
  );
}
