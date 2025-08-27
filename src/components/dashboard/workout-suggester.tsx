
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
import { ScrollArea } from "@/components/ui/scroll-area";

const formSchema = z.object({
  equipment: z.string().min(2, "Por favor, liste pelo menos um equipamento."),
});

type FormValues = z.infer<typeof formSchema>;

const renderMarkdown = (text: string) => {
  const lines = text.split('\n');
  const elements = [];
  let listItems: string[] = [];

  const flushList = () => {
    if (listItems.length > 0) {
      elements.push(
        <ul key={elements.length} className="list-disc pl-5 space-y-1 my-2">
          {listItems.map((item, index) => (
            <li key={index}>{item.replace(/^\* \s*/, '')}</li>
          ))}
        </ul>
      );
      listItems = [];
    }
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (line.startsWith('### ')) {
      flushList();
      elements.push(<h3 key={i} className="text-lg font-semibold mt-4 mb-2">{line.substring(4)}</h3>);
      continue;
    }
    if (line.startsWith('## ')) {
      flushList();
      elements.push(<h2 key={i} className="text-xl font-bold mt-6 mb-3">{line.substring(3)}</h2>);
      continue;
    }
    if (line.startsWith('# ')) {
        flushList();
        elements.push(<h1 key={i} className="text-2xl font-bold mt-6 mb-4">{line.substring(2)}</h1>);
        continue;
    }
    if (line.startsWith('* ')) {
      listItems.push(line.replace(/\*\*(.*?)\*\*/g, '$1')); // Remove bold for list items for now
      continue;
    }

    flushList();
    if (line.trim() !== '') {
        const formattedLine = line.replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold">$1</strong>');
        elements.push(<p key={i} dangerouslySetInnerHTML={{ __html: formattedLine }} className="my-2" />);
    }
  }

  flushList(); // Add any remaining list items
  return elements;
};

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
            <ScrollArea className="h-[300px] w-full rounded-lg border bg-muted/30 p-4">
               <div className="text-sm prose prose-sm max-w-none">
                {renderMarkdown(workoutPlan)}
              </div>
            </ScrollArea>
          </CardContent>
        </>
      )}
    </Card>
  );
}
