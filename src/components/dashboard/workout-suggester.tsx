"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Wand2, Loader2 } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { suggestWorkoutPlan } from "@/ai/flows/suggest-workout-plan";

const formSchema = z.object({
  equipment: z.string().min(2, "Por favor, liste pelo menos um equipamento."),
});

type FormValues = z.infer<typeof formSchema>;

export function WorkoutSuggester() {
  const [workoutPlan, setWorkoutPlan] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      equipment: "",
    },
  });

  async function onSubmit(values: FormValues) {
    setIsLoading(true);
    setWorkoutPlan(null);
    try {
      const result = await suggestWorkoutPlan({ equipment: values.equipment });
      setWorkoutPlan(result.workoutPlan);
    } catch (error) {
      console.error("Erro ao sugerir plano de treino:", error);
      toast({
        title: "Erro",
        description: "Falha ao gerar o plano de treino. Por favor, tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Card className="w-full transition-all hover:shadow-lg">
      <CardHeader>
        <div className="flex items-center gap-3">
          <Wand2 className="h-6 w-6 text-primary" />
          <div className="flex flex-col">
            <CardTitle>Sugestão de Treino com IA</CardTitle>
            <CardDescription>
              Receba um plano de treino com base no equipamento que você tem.
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent>
            <FormField
              control={form.control}
              name="equipment"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Equipamento Disponível</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="ex: halteres, tapete de ioga, faixas de resistência"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
          <CardFooter>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Gerando...
                </>
              ) : (
                "Obter Sugestões"
              )}
            </Button>
          </CardFooter>
        </form>
      </Form>
      {workoutPlan && (
        <>
          <CardHeader>
            <CardTitle>Seu Treino Sugerido</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="prose prose-sm max-w-none rounded-lg border bg-muted/30 p-4">
              <pre className="whitespace-pre-wrap bg-transparent p-0 font-body text-sm text-foreground">
                {workoutPlan}
              </pre>
            </div>
          </CardContent>
        </>
      )}
    </Card>
  );
}
