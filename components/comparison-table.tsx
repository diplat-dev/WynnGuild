import { ArrowDownRight, ArrowUpRight, Info, Minus } from "lucide-react";
import {
  buildComparisonRows,
  formatMetricDelta,
  formatMetricValue,
  metricAdvantage,
  metricOutcome,
} from "@/lib/metrics";
import type { MetricCategory } from "@/lib/metrics";
import type { GuildStats } from "@/lib/types";

const CATEGORIES: MetricCategory[] = ["Growth", "Roster", "Activity", "Competition"];

interface ComparisonTableProps {
  left: GuildStats;
  right: GuildStats;
}

export function ComparisonTable({ left, right }: ComparisonTableProps) {
  const rows = buildComparisonRows(left, right);

  return (
    <section className="panel comparison-panel" aria-labelledby="comparison-title">
      <div className="section-heading table-heading">
        <div>
          <p className="eyebrow">Metric by metric</p>
          <h2 id="comparison-title">Detailed comparison</h2>
        </div>
        <p>Positive differences favor {left.name}; negative differences favor {right.name}.</p>
      </div>

      <div className="comparison-table-wrap">
        <table className="comparison-table">
          <thead>
            <tr>
              <th>Statistic</th>
              <th className="left-column"><span className="side-dot cyan" />{left.name}</th>
              <th className="delta-column">Difference</th>
              <th className="right-column">{right.name}<span className="side-dot amber" /></th>
            </tr>
          </thead>
          <tbody>
            {CATEGORIES.flatMap((category) => {
              const categoryRows = rows.filter((row) => row.category === category);
              return [
                <tr className="category-row" key={`${category}-heading`}>
                  <th colSpan={4}>{category}</th>
                </tr>,
                ...categoryRows.map((row) => {
                  const outcome = metricOutcome(row);
                  const advantage = metricAdvantage(row);
                  return (
                    <tr key={row.id}>
                      <th scope="row">
                        <span>{row.label}</span>
                        <span className="metric-help" title={row.description} aria-label={row.description}>
                          <Info size={13} />
                        </span>
                        <small>{row.description}</small>
                      </th>
                      <td className={`metric-value ${outcome === "left" ? "winner" : outcome === "right" ? "loser" : ""}`}>
                        {outcome === "left" && <ArrowUpRight size={15} aria-label="Higher performing value" />}
                        {outcome === "right" && <ArrowDownRight size={15} aria-label="Lower performing value" />}
                        {formatMetricValue(row, row.left)}
                      </td>
                      <td className={`metric-delta ${advantage === null || advantage === 0 ? "neutral" : advantage > 0 ? "positive" : "negative"}`}>
                        {advantage === null || advantage === 0
                          ? <Minus size={13} aria-hidden="true" />
                          : advantage > 0
                            ? <ArrowUpRight size={14} aria-hidden="true" />
                            : <ArrowDownRight size={14} aria-hidden="true" />}
                        <span>{formatMetricDelta(row)}</span>
                      </td>
                      <td className={`metric-value right-value ${outcome === "right" ? "winner" : outcome === "left" ? "loser" : ""}`}>
                        {formatMetricValue(row, row.right)}
                        {outcome === "right" && <ArrowUpRight size={15} aria-label="Higher performing value" />}
                        {outcome === "left" && <ArrowDownRight size={15} aria-label="Lower performing value" />}
                      </td>
                    </tr>
                  );
                }),
              ];
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
