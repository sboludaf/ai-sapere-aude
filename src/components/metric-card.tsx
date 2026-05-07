import type { ReactNode } from "react";

type MetricCardProps = {
  label: string;
  value: string;
  detail?: string;
  icon: ReactNode;
};

export function MetricCard({ label, value, detail, icon }: MetricCardProps) {
  return (
    <article className="metric-card">
      <span className="metric-icon">{icon}</span>
      <div>
        <p>{label}</p>
        <strong>{value}</strong>
        {detail ? <small>{detail}</small> : null}
      </div>
    </article>
  );
}
