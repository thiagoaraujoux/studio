"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";

const posts = [
  {
    avatar: "https://picsum.photos/100?random=13",
    fallback: "JD",
    name: "Jane Doe",
    time: "5m ago",
    content: "Just finished the 'Full Body Strength' workout and feeling amazing! 🔥 So glad I joined this community.",
  },
  {
    avatar: "https://picsum.photos/100?random=14",
    fallback: "MS",
    name: "Mark Smith",
    time: "1h ago",
    content: "Any tips for staying motivated during a 30-day challenge? Day 5 is hitting me hard! 😅",
  },
  {
    avatar: "https://picsum.photos/100?random=15",
    fallback: "LR",
    name: "Linda Ray",
    time: "3h ago",
    content: "The healthy smoothie recipes are a game changer for my breakfast routine. Highly recommend the berry blast one! 🍓",
  },
];

export function CommunityFeed() {
  return (
    <Card className="transition-all hover:shadow-lg">
      <CardHeader>
        <CardTitle>Community Feed</CardTitle>
        <CardDescription>
          Share your progress and connect with others.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <Textarea placeholder="What's on your mind, Alex?" className="mb-2" />
          <Button>Post to Feed</Button>
        </div>
        <div className="space-y-4">
          {posts.map((post) => (
            <div key={post.name} className="flex items-start gap-4">
              <Avatar>
                <AvatarImage src={post.avatar} alt={post.name} data-ai-hint="person portrait"/>
                <AvatarFallback>{post.fallback}</AvatarFallback>
              </Avatar>
              <div className="w-full rounded-lg border bg-muted/30 p-3">
                <div className="flex items-center justify-between">
                  <p className="font-semibold">{post.name}</p>
                  <p className="text-xs text-muted-foreground">{post.time}</p>
                </div>
                <p className="mt-2 text-sm text-foreground/90">
                  {post.content}
                </p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
      <CardFooter>
        <Button variant="outline" className="w-full">
          Load More
        </Button>
      </CardFooter>
    </Card>
  );
}
