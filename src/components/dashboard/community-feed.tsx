
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
import { app } from "@/lib/firebase";
import { getAuth } from "firebase/auth";
import { useEffect, useState } from "react";
import type { User as FirebaseUser } from "firebase/auth";

const posts = [
  {
    avatar: "https://picsum.photos/100?random=13",
    fallback: "JD",
    name: "Jane Doe",
    time: "5m atrás",
    content: "Acabei de terminar o treino 'Força Total do Corpo' e estou me sentindo incrível! 🔥 Que bom que me juntei a esta comunidade.",
  },
  {
    avatar: "https://picsum.photos/100?random=14",
    fallback: "MS",
    name: "Mark Smith",
    time: "1h atrás",
    content: "Alguma dica para se manter motivado durante um desafio de 30 dias? O dia 5 está me pegando! 😅",
  },
  {
    avatar: "https://picsum.photos/100?random=15",
    fallback: "LR",
    name: "Linda Ray",
    time: "3h atrás",
    content: "As receitas de smoothie saudável são uma virada de jogo na minha rotina de café da manhã. Recomendo muito a de frutas vermelhas! 🍓",
  },
];

export function CommunityFeed() {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [visiblePosts, setVisiblePosts] = useState(2);
  const auth = getAuth(app);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setUser(user);
    });
    return () => unsubscribe();
  }, [auth]);

  const handleLoadMore = () => {
    setVisiblePosts((prev) => prev + 2);
  };

  const displayName = user?.displayName || user?.email?.split('@')[0] || "Usuário";

  return (
    <Card className="transition-all hover:shadow-lg">
      <CardHeader>
        <CardTitle>Feed da Comunidade</CardTitle>
        <CardDescription>
          Compartilhe seu progresso e conecte-se com outros.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <Textarea placeholder={`O que você está pensando, ${displayName}?`} className="mb-2" />
          <Button>Publicar no Feed</Button>
        </div>
        <div className="space-y-4">
          {posts.slice(0, visiblePosts).map((post) => (
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
      {visiblePosts < posts.length && (
        <CardFooter>
            <Button variant="outline" className="w-full" onClick={handleLoadMore}>
            Carregar Mais
            </Button>
        </CardFooter>
      )}
    </Card>
  );
}
