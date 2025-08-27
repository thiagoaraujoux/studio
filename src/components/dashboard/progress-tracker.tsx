
"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Calendar as CalendarIcon, Loader2 } from "lucide-react";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import {
  getFirestore,
  doc,
  setDoc,
  collection,
  query,
  onSnapshot,
  orderBy,
  Timestamp,
} from "firebase/firestore";

import { cn } from "@/lib/utils";
import { app } from "@/lib/firebase";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartConfig,
} from "@/components/ui/chart";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { useToast } from "@/hooks/use-toast";
import type { User } from "firebase/auth";

type ProgressData = {
  date: string;
  weight: number;
};

const chartConfig = {
  weight: {
    label: "Peso (kg)",
    color: "hsl(var(--primary))",
  },
} satisfies ChartConfig;

const progressFormSchema = z.object({
  weight: z.preprocess(
    (a) => parseFloat(z.string().parse(a)),
    z.number().positive("O peso deve ser um número positivo.")
  ),
  bodyFat: z.preprocess(
    (a) => parseFloat(z.string().optional().parse(a)),
    z.number().positive("A gordura corporal deve ser um número positivo.").optional()
  ),
  date: z.date({
    required_error: "A data é obrigatória.",
  }),
});

type ProgressFormValues = z.infer<typeof progressFormSchema>;

export function ProgressTracker() {
  const [isLoading, setIsLoading] = useState(false);
  const [chartData, setChartData] = useState<ProgressData[]>([]);
  const { toast } = useToast();
  const auth = getAuth(app);
  const db = getFirestore(app);

  const form = useForm<ProgressFormValues>({
    resolver: zodResolver(progressFormSchema),
    defaultValues: {
      date: new Date(),
    },
  });

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (user: User | null) => {
      if (user) {
        const userProgressRef = collection(db, "usuarios", user.uid, "progresso");
        const q = query(userProgressRef, orderBy("date", "asc"));

        const unsubscribeSnapshot = onSnapshot(q, (snapshot) => {
          const data = snapshot.docs.map((doc) => {
            const docData = doc.data();
            const date = (docData.date as Timestamp).toDate();
            return {
              // Format date for the chart tooltip
              date: format(date, "PPP", { locale: ptBR }),
              // Format date for the X-axis label
              label: format(date, "dd/MM"),
              weight: docData.weight,
            };
          });
          setChartData(data);
          
          if (data.length > 0) {
            const lastEntry = data[data.length - 1];
            form.reset({
                date: new Date(),
                weight: lastEntry.weight,
                bodyFat: doc.data().bodyFat || undefined
            });
          }
        });

        return () => unsubscribeSnapshot();
      } else {
        setChartData([]);
      }
    });

    return () => unsubscribeAuth();
  }, [auth, db, form]);

  async function onSubmit(data: ProgressFormValues) {
    const user = auth.currentUser;
    if (!user) {
      toast({
        title: "Erro",
        description: "Você precisa estar logado para registrar o progresso.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const dateString = format(data.date, "yyyy-MM-dd");
      const userProgressRef = collection(db, "usuarios", user.uid, "progresso");
      const progressDocRef = doc(userProgressRef, dateString);

      await setDoc(progressDocRef, {
        weight: data.weight,
        bodyFat: data.bodyFat || null,
        date: Timestamp.fromDate(data.date),
        createdAt: Timestamp.now(),
      }, { merge: true });

      toast({
        title: "Sucesso!",
        description: "Seu progresso foi registrado.",
      });
    } catch (error) {
      console.error("Erro ao registrar progresso: ", error);
      toast({
        title: "Erro",
        description: "Não foi possível salvar seu progresso. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Card className="transition-all hover:shadow-lg">
      <CardHeader>
        <CardTitle>Acompanhamento de Progresso</CardTitle>
        <CardDescription>Registre seu peso e medidas diárias.</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="weight"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Peso (kg)</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.1" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="bodyFat"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Gordura Corporal (%)</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.1" placeholder="Opcional" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
             <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Data</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "w-full pl-3 text-left font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value ? (
                            format(field.value, "PPP", { locale: ptBR })
                          ) : (
                            <span>Escolha uma data</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        disabled={(date) =>
                          date > new Date() || date < new Date("1900-01-01")
                        }
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Registrar Progresso
            </Button>
          </form>
        </Form>
        <div className="mt-6">
          <ChartContainer config={chartConfig} className="h-[200px] w-full">
            <LineChart data={chartData} margin={{ top: 5, right: 20, left: -10, bottom: 0 }}>
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="label"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
              />
               <YAxis
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                domain={['dataMin - 2', 'dataMax + 2']}
                width={30}
              />
              <Tooltip
                cursor={true}
                content={<ChartTooltipContent indicator="dot" labelKey="date" />}
              />
              <Line
                dataKey="weight"
                type="natural"
                stroke="var(--color-weight)"
                strokeWidth={2}
                dot={{
                  fill: "var(--color-weight)",
                }}
                activeDot={{
                  r: 6,
                }}
              />
            </LineChart>
          </ChartContainer>
        </div>
      </CardContent>
    </Card>
  );
}

