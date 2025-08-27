
"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Calendar as CalendarIcon, Loader2, History, Trash2, Pencil, AreaChart, User } from "lucide-react";
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
  deleteDoc,
  getDoc,
} from "firebase/firestore";
import Link from 'next/link';

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
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceArea } from "recharts";
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
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
    DialogClose,
  } from "@/components/ui/dialog"
import { Calendar } from "@/components/ui/calendar";
import { useToast } from "@/hooks/use-toast";
import type { User as FirebaseUser } from "firebase/auth";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";

type ProgressEntry = {
    id: string; // Document ID (e.g., "2024-07-29")
    date: Date;
    weight: number;
    bodyFat?: number | null;
};

const chartConfig = {
  imc: {
    label: "IMC",
    color: "hsl(var(--primary))",
  },
} satisfies ChartConfig;

const progressFormSchema = z.object({
  weight: z.preprocess(
    (a) => parseFloat(z.string().parse(a)),
    z.number().positive("O peso deve ser um número positivo.")
  ),
  bodyFat: z.preprocess(
    (val) => (String(val).trim() === "" ? null : parseFloat(String(val))),
    z.number().positive("A gordura corporal deve ser um número positivo.").nullable().optional()
  ),
  date: z.date({
    required_error: "A data é obrigatória.",
  }),
});

type ProgressFormValues = z.infer<typeof progressFormSchema>;

export function ProgressTracker() {
  const [isLoading, setIsLoading] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [progressHistory, setProgressHistory] = useState<ProgressEntry[]>([]);
  const [height, setHeight] = useState<number | null>(null);
  const { toast } = useToast();
  const auth = getAuth(app);
  const db = getFirestore(app);

  const form = useForm<ProgressFormValues>({
    resolver: zodResolver(progressFormSchema),
    defaultValues: {
      date: new Date(),
      weight: 0,
      bodyFat: undefined
    },
  });

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (user: FirebaseUser | null) => {
      if (user) {
        // Fetch user height
        const userRef = doc(db, "usuarios", user.uid);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists() && userSnap.data().height) {
            setHeight(userSnap.data().height);
        }

        const userProgressRef = collection(db, "usuarios", user.uid, "progresso");
        const q = query(userProgressRef, orderBy("date", "asc"));

        const unsubscribeSnapshot = onSnapshot(q, (snapshot) => {
          const data = snapshot.docs.map((doc) => {
            const docData = doc.data();
            return {
                id: doc.id,
                date: (docData.date as Timestamp).toDate(),
                weight: docData.weight,
                bodyFat: docData.bodyFat,
            };
          });
          setProgressHistory(data);
          
          if (data.length > 0 && !form.formState.isDirty) {
            const lastEntry = data[data.length - 1];
            form.reset({
                date: new Date(),
                weight: lastEntry.weight,
                bodyFat: lastEntry.bodyFat || undefined
            });
          } else if (data.length === 0) {
            form.reset({
                date: new Date(),
                weight: 0,
                bodyFat: undefined
            });
          }
        }, (error) => {
          console.error("Erro ao buscar histórico de progresso:", error);
          toast({
            title: "Erro de Carregamento",
            description: "Não foi possível carregar o histórico de progresso.",
            variant: "destructive"
          });
        });

        return () => unsubscribeSnapshot();
      } else {
        setProgressHistory([]);
        setHeight(null);
      }
    });

    return () => unsubscribeAuth();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auth, db]);

  const bmiChartData = height ? progressHistory.map(entry => ({
    date: format(entry.date, "PPP", { locale: ptBR }),
    label: format(entry.date, "dd/MM"),
    imc: parseFloat((entry.weight / (height * height)).toFixed(2)),
  })) : [];
  
  const yDomain = bmiChartData.length > 0
    ? [Math.min(...bmiChartData.map(d => d.imc), 15) - 2, Math.max(...bmiChartData.map(d => d.imc), 32) + 2]
    : [15, 35];


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
      }, { merge: true });

      toast({
        title: "Sucesso!",
        description: "Seu progresso foi registrado.",
      });
      // Reset form to a new entry state
      form.reset({ date: new Date(), weight: data.weight, bodyFat: data.bodyFat || undefined });
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

  const handleEdit = (entry: ProgressEntry) => {
    form.reset({
        date: entry.date,
        weight: entry.weight,
        bodyFat: entry.bodyFat || undefined,
    });
    setIsHistoryOpen(false);
  }

  const handleDelete = async (entryId: string) => {
    const user = auth.currentUser;
    if (!user) {
        toast({ title: "Erro", description: "Usuário não encontrado.", variant: "destructive" });
        return;
    };
    
    try {
        const progressDocRef = doc(db, "usuarios", user.uid, "progresso", entryId);
        await deleteDoc(progressDocRef);
        toast({
            title: "Sucesso!",
            description: "Registro excluído."
        });
    } catch (error) {
        console.error("Erro ao excluir registro: ", error);
        toast({
            title: "Erro",
            description: "Não foi possível excluir o registro.",
            variant: "destructive"
        });
    }
  }

  return (
    <Card className="transition-all hover:shadow-lg">
        <Dialog open={isHistoryOpen} onOpenChange={setIsHistoryOpen}>
            <CardHeader className="flex flex-row items-center justify-between">
                <div className="grid gap-0.5">
                    <CardTitle>Acompanhamento de Progresso</CardTitle>
                    <CardDescription>Registre seu peso e veja a evolução do seu IMC.</CardDescription>
                </div>
                <DialogTrigger asChild>
                    <Button variant="outline" size="icon">
                        <History className="h-4 w-4" />
                        <span className="sr-only">Ver Histórico</span>
                    </Button>
                </DialogTrigger>
            </CardHeader>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Histórico de Progresso</DialogTitle>
                    <DialogDescription>
                        Aqui estão todos os seus registros. Você pode editar ou excluir qualquer entrada.
                    </DialogDescription>
                </DialogHeader>
                <ScrollArea className="h-[300px] pr-4">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Data</TableHead>
                                <TableHead className="text-right">Peso (kg)</TableHead>
                                <TableHead className="text-right">Gordura Corporal (%)</TableHead>
                                <TableHead className="text-right">Ações</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                        {progressHistory.slice().reverse().map((entry) => (
                            <TableRow key={entry.id}>
                                <TableCell>{format(entry.date, "dd/MM/yyyy")}</TableCell>
                                <TableCell className="text-right">{entry.weight.toFixed(1)}</TableCell>
                                <TableCell className="text-right">{entry.bodyFat ? entry.bodyFat.toFixed(1) : "N/A"}</TableCell>
                                <TableCell className="text-right">
                                    <Button variant="ghost" size="icon" onClick={() => handleEdit(entry)}>
                                        <Pencil className="h-4 w-4" />
                                        <span className="sr-only">Editar</span>
                                    </Button>
                                    <Button variant="ghost" size="icon" onClick={() => handleDelete(entry.id)}>
                                        <Trash2 className="h-4 w-4 text-destructive" />
                                        <span className="sr-only">Excluir</span>
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                        </TableBody>
                    </Table>
                </ScrollArea>
                <DialogFooter>
                    <DialogClose asChild>
                        <Button variant="outline">Fechar</Button>
                    </DialogClose>
                </DialogFooter>
            </DialogContent>
        </Dialog>
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
                      <Input type="number" step="0.1" {...field} value={field.value ?? ""} onChange={e => field.onChange(e.target.value)} />
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
                      <Input type="number" step="0.1" placeholder="Opcional" {...field} value={field.value ?? ""} onChange={e => field.onChange(e.target.value)} />
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
              Salvar Registro
            </Button>
          </form>
        </Form>
        <div className="mt-6">
          <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
            <AreaChart className="h-5 w-5" />
            Gráfico de Evolução do IMC
          </h3>
          {!height ? (
             <div className="flex flex-col items-center justify-center h-[200px] bg-muted/50 rounded-lg text-center p-4">
                <p className="text-muted-foreground">Informe sua altura no perfil para ver o gráfico de IMC.</p>
                <Button variant="link" asChild className="mt-2">
                    <Link href="/dashboard/profile">
                        <User className="mr-2 h-4 w-4"/>
                        Ir para o Perfil
                    </Link>
                </Button>
             </div>
          ) : bmiChartData.length > 0 ? (
            <>
            <ChartContainer config={chartConfig} className="h-[200px] w-full">
              <LineChart data={bmiChartData} margin={{ top: 5, right: 20, left: -10, bottom: 0 }}>
                <CartesianGrid vertical={false} />
                <XAxis
                  dataKey="label"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  fontSize={12}
                />
                 <YAxis
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  domain={yDomain}
                  width={30}
                  fontSize={12}
                />
                <Tooltip
                  cursor={true}
                  content={<ChartTooltipContent indicator="dot" labelKey="date" />}
                />
                <ReferenceArea y1={0} y2={18.5} fill="hsl(210 90% 70% / 0.1)" stroke="hsl(210 90% 70% / 0.2)" strokeDasharray="3 3" />
                <ReferenceArea y1={18.5} y2={24.9} fill="hsl(120 60% 47% / 0.1)" stroke="hsl(120 60% 47% / 0.2)" strokeDasharray="3 3" />
                <ReferenceArea y1={25} y2={29.9} fill="hsl(48 95% 50% / 0.1)" stroke="hsl(48 95% 50% / 0.2)" strokeDasharray="3 3" />
                <ReferenceArea y1={30} y2={yDomain[1]} fill="hsl(var(--destructive) / 0.1)" stroke="hsl(var(--destructive) / 0.2)" strokeDasharray="3 3" />

                <Line
                  dataKey="imc"
                  type="natural"
                  stroke="var(--color-imc)"
                  strokeWidth={2}
                  dot={{
                    fill: "var(--color-imc)",
                  }}
                  activeDot={{
                    r: 6,
                  }}
                />
              </LineChart>
            </ChartContainer>
            <div className="mt-4 flex flex-wrap justify-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                <div className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-[hsl(210,90%,70%)]"></span>Abaixo do Peso</div>
                <div className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-[hsl(120,60%,47%)]"></span>Peso Ideal</div>
                <div className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-[hsl(48,95%,50%)]"></span>Sobrepeso</div>
                <div className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-[hsl(var(--destructive))]"></span>Obesidade</div>
            </div>
            </>
          ) : (
             <div className="flex items-center justify-center h-[200px] bg-muted/50 rounded-lg">
                <p className="text-muted-foreground">Sem dados para exibir. Registre seu primeiro progresso!</p>
             </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
