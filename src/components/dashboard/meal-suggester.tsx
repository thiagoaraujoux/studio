
"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Apple, Loader2, Download, Copy } from "lucide-react";

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
import { suggestMealPlan, SuggestMealPlanOutput } from "@/ai/flows/suggest-meal-plan";

const formSchema = z.object({
  ingredients: z.string().min(3, "Por favor, liste pelo menos um ingrediente."),
});

type FormValues = z.infer<typeof formSchema>;

export function MealSuggester() {
  const [mealPlan, setMealPlan] = useState<SuggestMealPlanOutput | null>(null);
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
      setMealPlan(result);
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

  const handleDownload = (content: string, fileName: string) => {
    if (!content) return;
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleCopy = (content: string) => {
    if (!content) return;
    navigator.clipboard.writeText(content).then(() => {
      toast({
        title: "Texto Copiado!",
        description: "A receita foi copiada para sua área de transferência.",
      });
    });
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
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Opção Menos Calórica */}
            <Card>
              <CardHeader>
                <div className="flex flex-row items-start justify-between">
                    <div>
                        <CardTitle className="text-lg">Opção Leve</CardTitle>
                        <CardDescription>{mealPlan.lessCaloricOption.details}</CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button variant="outline" size="icon" onClick={() => handleCopy(mealPlan.lessCaloricOption.recipe)}>
                            <Copy className="h-4 w-4"/>
                            <span className="sr-only">Copiar</span>
                        </Button>
                        <Button variant="outline" size="icon" onClick={() => handleDownload(mealPlan.lessCaloricOption.recipe, 'refeicao-leve.txt')}>
                            <Download className="h-4 w-4"/>
                            <span className="sr-only">Baixar</span>
                        </Button>
                    </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="rounded-lg border bg-muted/30 p-4 whitespace-pre-wrap text-sm">
                    {mealPlan.lessCaloricOption.recipe}
                </div>
              </CardContent>
            </Card>

            {/* Opção Mais Calórica */}
             <Card>
              <CardHeader>
                <div className="flex flex-row items-start justify-between">
                    <div>
                        <CardTitle className="text-lg">Opção Power</CardTitle>
                        <CardDescription>{mealPlan.moreCaloricOption.details}</CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button variant="outline" size="icon" onClick={() => handleCopy(mealPlan.moreCaloricOption.recipe)}>
                            <Copy className="h-4 w-4"/>
                            <span className="sr-only">Copiar</span>
                        </Button>
                        <Button variant="outline" size="icon" onClick={() => handleDownload(mealPlan.moreCaloricOption.recipe, 'refeicao-power.txt')}>
                            <Download className="h-4 w-4"/>
                            <span className="sr-only">Baixar</span>
                        </Button>
                    </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="rounded-lg border bg-muted/30 p-4 whitespace-pre-wrap text-sm">
                    {mealPlan.moreCaloricOption.recipe}
                </div>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      )}
    </Card>
  );
}
