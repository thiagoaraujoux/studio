"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartConfig,
} from "@/components/ui/chart";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";

const chartData = [
  { month: "Janeiro", weight: 80 },
  { month: "Fevereiro", weight: 79 },
  { month: "Março", weight: 79.5 },
  { month: "Abril", weight: 78 },
  { month: "Maio", weight: 77 },
  { month: "Junho", weight: 76 },
];

const chartConfig = {
  weight: {
    label: "Peso (kg)",
    color: "hsl(var(--primary))",
  },
} satisfies ChartConfig;

export function ProgressTracker() {
  return (
    <Card className="transition-all hover:shadow-lg">
      <CardHeader>
        <CardTitle>Acompanhamento de Progresso</CardTitle>
        <CardDescription>Registre seu peso e medidas diárias.</CardDescription>
      </CardHeader>
      <CardContent>
        <form className="grid gap-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <label htmlFor="weight">Peso (kg)</label>
              <Input id="weight" type="number" defaultValue="76" />
            </div>
            <div className="grid gap-2">
              <label htmlFor="body-fat">Gordura Corporal (%)</label>
              <Input id="body-fat" type="number" defaultValue="18.5" />
            </div>
          </div>
          <Button type="submit" className="w-full">Registrar Progresso</Button>
        </form>
        <div className="mt-6">
          <ChartContainer config={chartConfig} className="h-[200px] w-full">
            <LineChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="month"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                tickFormatter={(value) => value.slice(0, 3)}
              />
               <YAxis
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                domain={['dataMin - 2', 'dataMax + 2']}
              />
              <Tooltip
                cursor={false}
                content={<ChartTooltipContent indicator="dot" />}
              />
              <Line
                dataKey="weight"
                type="natural"
                stroke="var(--color-weight)"
                strokeWidth={2}
                dot={{
                  fill: "var(--color-weight)",
                }}
                activeDot={{
                  r: 6,
                }}
              />
            </LineChart>
          </ChartContainer>
        </div>
      </CardContent>
    </Card>
  );
}
