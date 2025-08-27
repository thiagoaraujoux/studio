import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Apple, BrainCircuit, Dumbbell } from "lucide-react";

const activities = [
  {
    icon: Dumbbell,
    title: "Concluiu 'Força Total do Corpo'",
    time: "2 horas atrás",
  },
  {
    icon: BrainCircuit,
    title: "Meditou por 15 minutos",
    time: "Ontem",
  },
  {
    icon: Apple,
    title: "Registrou refeição 'Alimentação Limpa'",
    time: "Ontem",
  },
  {
    icon: Dumbbell,
    title: "Concluiu 'Explosão de Cardio HIIT'",
    time: "2 dias atrás",
  },
];

export function ActivityLog() {
  return (
    <Card className="transition-all hover:shadow-lg">
      <CardHeader>
        <CardTitle>Registro de Atividades</CardTitle>
        <CardDescription>
          Suas atividades recentes no Vitalize.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activities.map((activity) => (
            <div key={activity.title} className="flex items-start gap-4">
              <div className="bg-muted rounded-full p-2">
                <activity.icon className="h-5 w-5 text-muted-foreground" />
              </div>
              <div className="flex-1">
                <p className="font-medium">{activity.title}</p>
                <p className="text-sm text-muted-foreground">{activity.time}</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
