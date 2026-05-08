import React from "react";
import { PieChart, Pie, ResponsiveContainer, Cell } from "recharts";

const COLORS = {
  compliant: "#10b981",
  nonCompliant: "#ef4444",
};

const CompliancePie = ({ compliant = 0, nonCompliant = 0, size = 160 }) => {
  const total = compliant + nonCompliant;

  const score = total > 0 ? Math.round((compliant / total) * 100) : 0;

  const pieData = [
    { name: "Compliant", value: compliant, color: COLORS.compliant },
    { name: "Non-Compliant", value: nonCompliant, color: COLORS.nonCompliant },
  ].filter((d) => d.value > 0);


  return (
    <div
      className="relative flex items-center justify-center"
      style={{ width: size, height: size }}
    >
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={pieData}
            dataKey="value"
            innerRadius="65%"
            outerRadius="85%"
            startAngle={90}
            endAngle={-270}
          >
            {pieData.map((entry, i) => (
              <Cell key={i} fill={entry.color} />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>

      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-base font-bold text-slate-900">{score}%</span>
      </div>
    </div>
  );
};

export default CompliancePie;
