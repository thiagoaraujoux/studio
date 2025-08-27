import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Award, Star, Trophy, Zap } from "lucide-react";

const achievements = [
  { icon: Trophy, title: "Fitness Pro", unlocked: true },
  { icon: Award, title: "Early Bird", unlocked: true },
  { icon: Star, title: "Perfect Week", unlocked: true },
  { icon: Zap, title: "Streak Master", unlocked: false },
  { icon: Trophy, title: "Challenge Champ", unlocked: false },
  { icon: Award, title: "Mindful Master", unlocked: true },
];

export function Achievements() {
  return (
    <Card className="transition-all hover:shadow-lg">
      <CardHeader>
        <CardTitle>Achievements</CardTitle>
        <CardDescription>Badges you've earned.</CardDescription>
      </CardHeader>
      <CardContent className="grid grid-cols-3 gap-4">
        {achievements.map((achievement) => (
          <div
            key={achievement.title}
            className="flex flex-col items-center justify-center gap-2 rounded-lg border p-4 text-center"
          >
            <achievement.icon
              className={`h-8 w-8 ${
                achievement.unlocked
                  ? "text-primary"
                  : "text-muted-foreground/50"
              }`}
            />
            <p
              className={`text-sm font-medium ${
                achievement.unlocked
                  ? "text-foreground"
                  : "text-muted-foreground"
              }`}
            >
              {achievement.title}
            </p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
