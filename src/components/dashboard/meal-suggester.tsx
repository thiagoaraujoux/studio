
"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Apple, Loader2, Download } from "lucide-react";

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
import { suggestMealPlan } from "@/ai/flows/suggest-meal-plan";

const formSchema = z.object({
  ingredients: z.string().min(3, "Por favor, liste pelo menos um ingrediente."),
});

type FormValues = z.infer<typeof formSchema>;

export function MealSuggester() {
  const [mealPlan, setMealPlan] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      ingredients: "",
    },
  });

  async function onSubmit(values: FormValues) {
    setIsLoading(true);
    setMealPlan(null);
    try {
      const result = await suggestMealPlan({ ingredients: values.ingredients });
      setMealPlan(result.mealPlan);
    } catch (error) {
      console.error("Erro ao sugerir plano de refeição:", error);
      toast({
        title: "Erro",
        description: "Falha ao gerar o plano de refeição. Por favor, tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }

  const handleDownload = () => {
    if (!mealPlan) return;
    const blob = new Blob([mealPlan], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'plano-de-refeicao.txt';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <Card className="w-full transition-all hover:shadow-lg flex flex-col">
      <CardHeader>
        <div className="flex items-center gap-3">
          <Apple className="h-6 w-6 text-primary" />
          <div className="flex flex-col">
            <CardTitle>Sugestão de Refeição com IA</CardTitle>
            <CardDescription>
              Receba ideias de refeições com o que você tem na geladeira.
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col flex-1">
          <CardContent>
            <FormField
              control={form.control}
              name="ingredients"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Ingredientes Disponíveis</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="ex: frango, arroz, brócolis, tomate"
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
      {mealPlan && (
        <>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Sua Refeição Sugerida</CardTitle>
            <Button variant="outline" size="sm" onClick={handleDownload}>
                <Download className="mr-2 h-4 w-4"/>
                Baixar
            </Button>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg border bg-muted/30 p-4 whitespace-pre-wrap text-sm">
                {mealPlan}
            </div>
          </CardContent>
        </>
      )}
    </Card>
  );
}
