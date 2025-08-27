
"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Wand2, Loader2, Download, Copy } from "lucide-react";

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

  const handleDownload = () => {
    if (!workoutPlan) return;
    const blob = new Blob([workoutPlan], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'plano-de-treino.txt';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleCopy = () => {
    if (!workoutPlan) return;
    navigator.clipboard.writeText(workoutPlan).then(() => {
      toast({
        title: "Texto Copiado!",
        description: "O plano de treino foi copiado para sua área de transferência.",
      });
    });
  };

  return (
    <Card className="w-full transition-all hover:shadow-lg flex flex-col">
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
        <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col flex-1">
          <CardContent>
            <FormField
              control={form.control}
              name="equipment"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Equipamento Disponível</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="ex: halteres, tapete de ioga, faixas"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
          <CardFooter className="mt-auto">
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
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Seu Treino Sugerido</CardTitle>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={handleCopy}>
                <Copy className="mr-2 h-4 w-4" />
                Copiar
              </Button>
              <Button variant="outline" size="sm" onClick={handleDownload}>
                <Download className="mr-2 h-4 w-4" />
                Baixar
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg border bg-muted/30 p-4 whitespace-pre-wrap text-sm">
              {workoutPlan}
            </div>
          </CardContent>
        </>
      )}
    </Card>
  );
}
