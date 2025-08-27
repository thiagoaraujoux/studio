"use client";

import Image from "next/image";
import {
  Apple,
  BrainCircuit,
  Dumbbell,
  Trophy,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const libraryItems = {
  workouts: [
    { title: "Full Body Strength", duration: "45 min", image: "https://picsum.photos/600/400?random=1", hint: "workout fitness" },
    { title: "Morning Yoga Flow", duration: "30 min", image: "https://picsum.photos/600/400?random=2", hint: "yoga meditation" },
    { title: "HIIT Cardio Blast", duration: "20 min", image: "https://picsum.photos/600/400?random=3", hint: "running cardio" },
  ],
  diets: [
    { title: "Clean Eating Basics", category: "Nutrition Plan", image: "https://picsum.photos/600/400?random=4", hint: "healthy food" },
    { title: "Healthy Smoothie Recipes", category: "Recipe Guide", image: "https://picsum.photos/600/400?random=5", hint: "smoothie fruit" },
    { title: "Meal Prep for the Week", category: "Guide", image: "https://picsum.photos/600/400?random=6", hint: "meal prep" },
  ],
  meditations: [
    { title: "Mindfulness for Beginners", duration: "10 min", image: "https://picsum.photos/600/400?random=7", hint: "zen stones" },
    { title: "Stress Relief Session", duration: "15 min", image: "https://picsum.photos/600/400?random=8", hint: "calm beach" },
    { title: "Deep Sleep Meditation", duration: "20 min", image: "https://picsum.photos/600/400?random=9", hint: "night sky" },
  ],
  challenges: [
    { title: "30-Day Fitness Challenge", reward: "Exclusive Badge", image: "https://picsum.photos/600/400?random=10", hint: "trophy award" },
    { title: "Mindful Month", reward: "Profile Theme", image: "https://picsum.photos/600/400?random=11", hint: "brain illustration" },
    { title: "Hydration Hero", reward: "100 Points", image: "https://picsum.photos/600/400?random=12", hint: "water splash" },
  ],
};

export function ContentLibrary() {
  return (
    <Card className="transition-all hover:shadow-lg">
      <CardHeader>
        <CardTitle>Content Library</CardTitle>
        <CardDescription>
          Explore workouts, diets, meditations, and challenges.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="workouts">
          <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 h-auto">
            <TabsTrigger value="workouts"><Dumbbell className="mr-2" />Workouts</TabsTrigger>
            <TabsTrigger value="diets"><Apple className="mr-2" />Diets</TabsTrigger>
            <TabsTrigger value="meditations"><BrainCircuit className="mr-2" />Meditations</TabsTrigger>
            <TabsTrigger value="challenges"><Trophy className="mr-2" />Challenges</TabsTrigger>
          </TabsList>
          <TabsContent value="workouts" className="mt-4">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {libraryItems.workouts.map((item) => (
                <Card key={item.title} className="overflow-hidden transition-transform hover:scale-105 hover:shadow-md">
                  <Image
                    src={item.image}
                    alt={item.title}
                    width={600}
                    height={400}
                    data-ai-hint={item.hint}
                    className="aspect-video w-full object-cover"
                  />
                  <CardHeader>
                    <CardTitle>{item.title}</CardTitle>
                    <CardDescription>{item.duration}</CardDescription>
                  </CardHeader>
                </Card>
              ))}
            </div>
          </TabsContent>
          <TabsContent value="diets" className="mt-4">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {libraryItems.diets.map((item) => (
                <Card key={item.title} className="overflow-hidden transition-transform hover:scale-105 hover:shadow-md">
                  <Image
                    src={item.image}
                    alt={item.title}
                    width={600}
                    height={400}
                    data-ai-hint={item.hint}
                    className="aspect-video w-full object-cover"
                  />
                  <CardHeader>
                    <CardTitle>{item.title}</CardTitle>
                    <CardDescription>{item.category}</CardDescription>
                  </CardHeader>
                </Card>
              ))}
            </div>
          </TabsContent>
          <TabsContent value="meditations" className="mt-4">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {libraryItems.meditations.map((item) => (
                <Card key={item.title} className="overflow-hidden transition-transform hover:scale-105 hover:shadow-md">
                  <Image
                    src={item.image}
                    alt={item.title}
                    width={600}
                    height={400}
                    data-ai-hint={item.hint}
                    className="aspect-video w-full object-cover"
                  />
                  <CardHeader>
                    <CardTitle>{item.title}</CardTitle>
                    <CardDescription>{item.duration}</CardDescription>
                  </CardHeader>
                </Card>
              ))}
            </div>
          </TabsContent>
          <TabsContent value="challenges" className="mt-4">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {libraryItems.challenges.map((item) => (
                <Card key={item.title} className="overflow-hidden transition-transform hover:scale-105 hover:shadow-md">
                  <Image
                    src={item.image}
                    alt={item.title}
                    width={600}
                    height={400}
                    data-ai-hint={item.hint}
                    className="aspect-video w-full object-cover"
                  />
                  <CardHeader>
                    <CardTitle>{item.title}</CardTitle>
                    <CardDescription>Reward: {item.reward}</CardDescription>
                  </CardHeader>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
