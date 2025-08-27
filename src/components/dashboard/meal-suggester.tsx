
"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Apple, Loader2 } from "lucide-react";

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

  // Basic markdown to HTML renderer
  const renderMarkdown = (text: string) => {
    let listOpen = false;
    const html = text
      .split('\n')
      .map(line => {
        // Headings
        if (line.startsWith('### ')) return `<h5>${line.substring(4)}</h5>`;
        if (line.startsWith('## ')) return `<h4>${line.substring(3)}</h4>`;
        if (line.startsWith('# ')) return `<h3>${line.substring(2)}</h3>`;
        
        // Bold
        line = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        
        // List items
        if (line.startsWith('* ') || line.startsWith('- ')) {
          let listItem = `<li>${line.substring(2)}</li>`;
          if (!listOpen) {
            listItem = '<ul>' + listItem;
            listOpen = true;
          }
          return listItem;
        }

        // Close list if line is not a list item
        let closingTag = '';
        if (listOpen && !line.startsWith('* ') && !line.startsWith('- ')) {
            closingTag = '</ul>';
            listOpen = false;
        }

        // Paragraphs
        const paragraph = line ? `<p>${line}</p>` : '';
        return closingTag + paragraph;
      })
      .join('');

    // Close any open list at the end
    const finalHtml = listOpen ? html + '</ul>' : html;
    
    return <div className="prose prose-sm max-w-none dark:prose-invert" dangerouslySetInnerHTML={{ __html: finalHtml }} />;
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
      {workoutPlan && (
        <>
          <CardHeader>
            <CardTitle>Sua Refeição Sugerida</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg border bg-muted/30 p-4">
              {renderMarkdown(workoutPlan)}
            </div>
          </CardContent>
        </>
      )}
    </Card>
  );
}
