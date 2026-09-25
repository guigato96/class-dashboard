import React from "react";
import MetricChart from "./MetricChart";

export default function OverviewChart({ data }) {
  return (
    <MetricChart
      series={[
        { key: "receita", label: "Receita", values: data.map((d) => d.receita) },
        { key: "despesa", label: "Despesa", values: data.map((d) => d.despesa) },
      ]}
      labels={data.map((d) => d.mes)}
      tipo="bar"
      unidade="money"
    />
  );
}
