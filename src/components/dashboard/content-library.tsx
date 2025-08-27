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
    { title: "Força Total do Corpo", duration: "45 min", image: "https://picsum.photos/600/400?random=1", hint: "workout fitness" },
    { title: "Fluxo de Yoga Matinal", duration: "30 min", image: "https://picsum.photos/600/400?random=2", hint: "yoga meditation" },
    { title: "Explosão de Cardio HIIT", duration: "20 min", image: "https://picsum.photos/600/400?random=3", hint: "running cardio" },
  ],
  diets: [
    { title: "Princípios da Alimentação Limpa", category: "Plano de Nutrição", image: "https://picsum.photos/600/400?random=4", hint: "healthy food" },
    { title: "Receitas de Smoothie Saudável", category: "Guia de Receitas", image: "https://picsum.photos/600/400?random=5", hint: "smoothie fruit" },
    { title: "Preparo de Refeições da Semana", category: "Guia", image: "https://picsum.photos/600/400?random=6", hint: "meal prep" },
  ],
  meditations: [
    { title: "Atenção Plena para Iniciantes", duration: "10 min", image: "https://picsum.photos/600/400?random=7", hint: "zen stones" },
    { title: "Sessão de Alívio de Estresse", duration: "15 min", image: "https://picsum.photos/600/400?random=8", hint: "calm beach" },
    { title: "Meditação para Sono Profundo", duration: "20 min", image: "https://picsum.photos/600/400?random=9", hint: "night sky" },
  ],
  challenges: [
    { title: "Desafio Fitness de 30 Dias", reward: "Medalha Exclusiva", image: "https://picsum.photos/600/400?random=10", hint: "trophy award" },
    { title: "Mês da Atenção Plena", reward: "Tema de Perfil", image: "https://picsum.photos/600/400?random=11", hint: "brain illustration" },
    { title: "Herói da Hidratação", reward: "100 Pontos", image: "https://picsum.photos/600/400?random=12", hint: "water splash" },
  ],
};

export function ContentLibrary() {
  return (
    <Card className="transition-all hover:shadow-lg">
      <CardHeader>
        <CardTitle>Biblioteca de Conteúdo</CardTitle>
        <CardDescription>
          Explore treinos, dietas, meditações e desafios.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="workouts">
          <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 h-auto">
            <TabsTrigger value="workouts"><Dumbbell className="mr-2" />Treinos</TabsTrigger>
            <TabsTrigger value="diets"><Apple className="mr-2" />Dietas</TabsTrigger>
            <TabsTrigger value="meditations"><BrainCircuit className="mr-2" />Meditações</TabsTrigger>
            <TabsTrigger value="challenges"><Trophy className="mr-2" />Desafios</TabsTrigger>
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
                    <CardDescription>Recompensa: {item.reward}</CardDescription>
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
