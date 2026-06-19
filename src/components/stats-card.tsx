"use client";

import { type ReactNode } from "react";
import { TrendingUp, TrendingDown } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface StatsCardProps {
  icon: ReactNode;
  label: string;
  value: string | number;
  trend?: number;
}

export function StatsCard({ icon, label, value, trend }: StatsCardProps) {
  const isPositiveTrend = trend !== undefined && trend >= 0;
  const isNegativeTrend = trend !== undefined && trend < 0;

  return (
    <Card className="py-0">
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">
              {label}
            </p>
            <p className="text-2xl font-bold tracking-tight">{value}</p>
            {trend !== undefined && (
              <div className="flex items-center gap-1">
                {isPositiveTrend ? (
                  <TrendingUp className="h-3.5 w-3.5 text-green-600" />
                ) : (
                  <TrendingDown className="h-3.5 w-3.5 text-red-600" />
                )}
                <span
                  className={`text-xs font-medium ${
                    isPositiveTrend ? "text-green-600" : "text-red-600"
                  }`}
                >
                  {isPositiveTrend ? "+" : ""}
                  {trend}%
                </span>
              </div>
            )}
          </div>
          <div
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg"
            style={{ backgroundColor: "#2E8B5715", color: "#2E8B57" }}
          >
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
