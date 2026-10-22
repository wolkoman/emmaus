"use client";

import {
  AppCard,
  AppSegmented,
  SectionHeading,
} from "@/components/intern/AppUI";
import { CpPaperProjects, CpPaperStats } from "@/util/cockpit.generated";
import { useState } from "react";
import {
  Area,
  CartesianGrid,
  ComposedChart,
  Line,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export function ProjectStatsChart({
  stats,
  project,
  earlierStats,
  liveStats,
  today,
}: {
  stats: CpPaperStats[];
  project: CpPaperProjects;
  earlierStats: { project: CpPaperProjects; stats: CpPaperStats[] }[];
  liveStats: { written: number; corrected: number; finished: number };
  today: string;
}) {
  const [view, setView] = useState<"status" | "written">("status");
  if (stats.length === 0) return null;

  const dayMs = 24 * 60 * 60 * 1000;
  const dateValue = (day: string) => Date.parse(day.slice(0, 10));
  const start = dateValue(stats[0].day);
  const deadline = dateValue(project.deadline);
  const todayValue = dateValue(today);
  const end = project.printrelease
    ? dateValue(project.printrelease)
    : todayValue;

  const earlier = earlierStats.map(({ project: issue, stats }, index) => ({
    key: `earlier-${issue._id}`,
    name: `Geschrieben · ${issue.name}`,
    color: comparisonColors[index % comparisonColors.length],
    byDeadlineDay: new Map(
      stats.map((stat) => [
        Math.round((dateValue(stat.day) - dateValue(issue.deadline)) / dayMs),
        stat.written,
      ]),
    ),
  }));

  const statsMap = new Map(stats.map((stat) => [stat.day, stat]));
  const data = Array.from(
    {
      length: Math.min(
        Math.max(Math.floor((end - start) / dayMs) + 1, 0),
        1000,
      ),
    },
    (_, index) => {
      const date = new Date(start + index * dayMs);
      const dateString = date.toISOString().slice(0, 10);
      const stat = statsMap.get(dateString);
      const formattedDate = date.toLocaleDateString("de-AT", {
        day: "2-digit",
        month: "2-digit",
        timeZone: "UTC",
      });

      const isFuture = date.getTime() > todayValue;
      const currentStats = dateString === today ? liveStats : stat;
      const deadlineDay = Math.round((date.getTime() - deadline) / dayMs);
      return {
        date: formattedDate,
        fullDate: dateString,
        finished: isFuture ? null : (currentStats?.finished ?? null),
        corrected: isFuture ? null : (currentStats?.corrected ?? null),
        written: isFuture ? null : (currentStats?.written ?? null),
        ...Object.fromEntries(
          earlier.map(({ key, byDeadlineDay }) => [
            key,
            byDeadlineDay.get(deadlineDay) ?? null,
          ]),
        ),
      };
    },
  );

  const deadlineIndex = Number.isFinite(deadline)
    ? data.findIndex(
        (d) => d.fullDate === new Date(deadline).toISOString().slice(0, 10),
      )
    : -1;

  return (
    <section>
      <SectionHeading title="Projektstatus über Zeit" />
      <AppCard className="p-4">
        {earlier.length > 0 && (
          <div className="mb-4 flex">
            <AppSegmented
              label="Diagrammansicht"
              options={[
                { value: "status", label: "Projektstatus" },
                { value: "written", label: "Geschriebene Artikel Vergleich" },
              ]}
              value={view}
              onChange={setView}
            />
          </div>
        )}
        {view === "written" && (
          <p className="mb-3 text-sm text-black/60">
            Vergleich nach Tagen vor und nach dem Redaktionsschluss.
          </p>
        )}
        <ResponsiveContainer width="100%" height={300}>
          <ComposedChart data={data} style={{ margin: "0 -20px" }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="date"
              style={{ fontSize: "12px" }}
              tick={{ fill: "#666" }}
              interval={Math.floor(data.length / 10) || 0}
            />
            <YAxis style={{ fontSize: "12px" }} tick={{ fill: "#666" }} />
            <Tooltip
              contentStyle={{
                backgroundColor: "white",
                border: "1px solid #ccc",
                borderRadius: "4px",
              }}
            />
            {deadlineIndex >= 0 && (
              <ReferenceLine
                x={data[deadlineIndex].date}
                stroke="#000000"
                strokeWidth={1}
                strokeDasharray="5 5"
                zIndex={5}
                label={{
                  value: "Deadline",
                  position: "top",
                  fill: "#ef4444",
                  fontSize: 12,
                }}
              />
            )}
            {view === "status" ? (
              <>
                <Area
                  type="monotone"
                  dataKey="finished"
                  stroke="#c026d3"
                  fill="#c026d3"
                  fillOpacity={1}
                  zIndex={3}
                  strokeWidth={2}
                  name="Fertiggestellt"
                  connectNulls={false}
                  dot={false}
                />
                <Area
                  type="monotone"
                  dataKey="corrected"
                  stroke="#16a34a"
                  fill="#16a34a"
                  fillOpacity={1}
                  zIndex={2}
                  strokeWidth={2}
                  name="Lektoriert"
                  connectNulls={false}
                  dot={false}
                />
                <Area
                  type="monotone"
                  dataKey="written"
                  stroke="#84cc16"
                  fill="#84cc16"
                  fillOpacity={1}
                  zIndex={1}
                  strokeWidth={2}
                  name="Geschrieben"
                  connectNulls={false}
                  dot={false}
                />
              </>
            ) : (
              <Line
                type="monotone"
                dataKey="written"
                stroke="#65a30d"
                strokeWidth={2}
                dot={false}
                connectNulls={false}
                name={`Geschrieben · ${project.name}`}
                isAnimationActive={false}
              />
            )}
            {view === "written" &&
              earlier.map(({ key, name, color }) => (
                <Line
                  key={key}
                  type="monotone"
                  dataKey={key}
                  stroke={color}
                  strokeWidth={2}
                  strokeDasharray="5 3"
                  dot={false}
                  connectNulls={false}
                  name={name}
                  isAnimationActive={false}
                />
              ))}
          </ComposedChart>
        </ResponsiveContainer>
        {view === "written" && (
          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm">
            <span className="flex items-center gap-1.5">
              <span className="inline-block w-4 border-t-2 border-lime-600" />
              Geschrieben · {project.name}
            </span>
            {earlier.map(({ key, name, color }) => (
              <span key={key} className="flex items-center gap-1.5">
                <span
                  className="inline-block w-4 border-t-2 border-dashed"
                  style={{ borderColor: color }}
                />
                {name}
              </span>
            ))}
          </div>
        )}
      </AppCard>
    </section>
  );
}

const comparisonColors = [
  "#2563eb",
  "#ea580c",
  "#7c3aed",
  "#0891b2",
  "#be123c",
];
