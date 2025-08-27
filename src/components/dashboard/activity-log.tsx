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
    title: "Completed 'Full Body Strength'",
    time: "2 hours ago",
  },
  {
    icon: BrainCircuit,
    title: "Meditated for 15 minutes",
    time: "Yesterday",
  },
  {
    icon: Apple,
    title: "Logged 'Clean Eating' meal",
    time: "Yesterday",
  },
  {
    icon: Dumbbell,
    title: "Completed 'HIIT Cardio Blast'",
    time: "2 days ago",
  },
];

export function ActivityLog() {
  return (
    <Card className="transition-all hover:shadow-lg">
      <CardHeader>
        <CardTitle>Activity Log</CardTitle>
        <CardDescription>
          Your recent activities on Vitalize.
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
