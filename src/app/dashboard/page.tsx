import { Achievements } from "@/components/dashboard/achievements";
import { ActivityLog } from "@/components/dashboard/activity-log";
import { CommunityFeed } from "@/components/dashboard/community-feed";
import { ContentLibrary } from "@/components/dashboard/content-library";
import { Header } from "@/components/dashboard/header";
import { MealSuggester } from "@/components/dashboard/meal-suggester";
import { ProgressTracker } from "@/components/dashboard/progress-tracker";
import { UserProfile } from "@/components/dashboard/user-profile";
import { WorkoutSuggester } from "@/components/dashboard/workout-suggester";

export default function DashboardPage() {
  return (
    <div className="flex min-h-screen w-full flex-col bg-background">
      <Header />
      <main className="container flex-1 py-6">
        <div className="grid auto-rows-max items-start gap-6 md:grid-cols-2 lg:grid-cols-3">
          <div className="grid gap-6 lg:col-span-2">
            <WorkoutSuggester />
            <MealSuggester />
            <ContentLibrary />
            <CommunityFeed />
          </div>
          <div className="grid gap-6">
            <UserProfile />
            <ProgressTracker />
            <ActivityLog />
            <Achievements />
          </div>
        </div>
      </main>
    </div>
  );
}
