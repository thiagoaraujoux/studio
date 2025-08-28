
"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Calendar as CalendarIcon, Loader2, History, Trash2, PlusCircle, BarChart, Weight, AreaChart, Percent } from "lucide-react";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import {
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
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceArea, Dot } from "recharts";


import { cn } from "@/lib/utils";
import { app, db } from "@/lib/firebase";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
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
import { ChartContainer } from "@/components/ui/chart";

type ProgressEntry = {
    id: string; // Document ID (e.g., "2024-07-29")
    date: Date;
    weight: number;
    bodyFat?: number | null;
};

const progressFormSchema = z.object({
  weight: z.preprocess(
    (a) => parseFloat(z.string().parse(a)),
    z.number().positive("O peso deve ser um número positivo.")
  ),
  bodyFat: z.preprocess(
    (val) => (String(val).trim() === "" ? undefined : parseFloat(String(val))),
    z.number().positive("A gordura corporal deve ser um número positivo.").optional()
  ),
  date: z.date({
    required_error: "A data é obrigatória.",
  }),
});

type ProgressFormValues = z.infer<typeof progressFormSchema>;

const getBmiCategoryColor = (imc: number | null) => {
    if (imc === null) return 'hsl(var(--muted-foreground))';
    if (imc < 18.5) return 'hsl(210 90% 60%)';
    if (imc < 25) return 'hsl(120 60% 47%)';
    if (imc < 30) return 'hsl(48 95% 50%)';
    return 'hsl(var(--destructive))';
};

const CustomTooltipContent = ({ active, payload, label, chartType }: { active?: boolean; payload?: any[]; label?: string, chartType: string }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    const value = data.value?.toFixed(1);
    let unit = "kg";
    if (chartType === 'imc') unit = '';
    if (chartType === 'bodyFat') unit = '%';

    return (
      <div className="rounded-lg border bg-background p-2 shadow-sm">
        <div className="grid grid-cols-1 gap-1.5">
          <p className="text-muted-foreground text-sm">{label}</p>
          <p className="font-bold text-base" style={{ color: payload[0].stroke }}>
            {value} {unit}
          </p>
        </div>
      </div>
    );
  }
  return null;
};

export function ProgressTracker() {
  const [isLoading, setIsLoading] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isAddEntryOpen, setIsAddEntryOpen] = useState(false);
  const [progressHistory, setProgressHistory] = useState<ProgressEntry[]>([]);
  const [height, setHeight] = useState<number | null>(null);
  const { toast } = useToast();
  const auth = getAuth(app);

  const form = useForm<ProgressFormValues>({
    resolver: zodResolver(progressFormSchema),
    defaultValues: {
      date: new Date(),
      weight: undefined,
      bodyFat: undefined
    },
  });

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (user: FirebaseUser | null) => {
      if (user) {
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
      }
    });

    return () => unsubscribeAuth();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auth]);
  
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
      form.reset({ date: new Date(), weight: data.weight, bodyFat: data.bodyFat || undefined });
      setIsAddEntryOpen(false); // Close the dialog on success
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

  const chartDataWeight = progressHistory.map(entry => ({ date: format(entry.date, "PPP", { locale: ptBR }), label: format(entry.date, "dd/MM"), value: entry.weight }));
  const chartDataBmi = height ? progressHistory.map(entry => ({ date: format(entry.date, "PPP", { locale: ptBR }), label: format(entry.date, "dd/MM"), value: parseFloat((entry.weight / (height * height)).toFixed(2)) })) : [];
  const chartDataLeanMass = progressHistory.filter(entry => entry.bodyFat && entry.bodyFat > 0).map(entry => ({ date: format(entry.date, "PPP", { locale: ptBR }), label: format(entry.date, "dd/MM"), value: parseFloat((entry.weight * (1 - entry.bodyFat! / 100)).toFixed(1)) }));
  const chartDataBodyFat = progressHistory.filter(entry => entry.bodyFat && entry.bodyFat > 0).map(entry => ({ date: format(entry.date, "PPP", { locale: ptBR }), label: format(entry.date, "dd/MM"), value: entry.bodyFat }));

  const getChartDomain = (data: { value?: number | null }[]) => {
    const values = data.map(d => d.value).filter((v): v is number => v !== null && v !== undefined);
    if (values.length === 0) return [0, 100];
    const min = Math.min(...values);
    const max = Math.max(...values);
    if (min === max) return [min > 5 ? min - 5 : 0, max + 5];
    const padding = (max - min) * 0.15;
    return [Math.max(0, min - padding), max + padding];
  };

  const yDomainWeight = getChartDomain(chartDataWeight);
  const yDomainBmi = getChartDomain(chartDataBmi);
  const yDomainLeanMass = getChartDomain(chartDataLeanMass);
  const yDomainBodyFat = getChartDomain(chartDataBodyFat);

  const BmiDot = (props: any) => {
    const { cx, cy, payload } = props;
    if (!payload?.value) return <Dot cx={cx} cy={cy} r={3} fill="hsl(var(--chart-1))" stroke="var(--background)" strokeWidth={1} />;
    const color = getBmiCategoryColor(payload.value);
    return <Dot cx={cx} cy={cy} r={4} fill={color} stroke="#fff" strokeWidth={1} />;
  };

  const renderChart = (data: any[], yDomain: number[], color: string, chartType: string, customDot?: React.ReactElement) => {
      const chartConfig = {[chartType]: {label: chartType, color}};
      if (chartType === 'imc' && !height) return <div className="flex items-center justify-center h-[200px] bg-muted/50 rounded-lg text-center p-4"><p className="text-sm text-muted-foreground">Informe sua altura no <Link href="/dashboard/profile" className="underline text-primary">perfil</Link> para ver o IMC.</p></div>;
      if ((chartType === 'leanMass' || chartType === 'bodyFat') && data.length === 0) return <div className="flex items-center justify-center h-[200px] bg-muted/50 rounded-lg text-center p-4"><p className="text-sm text-muted-foreground">Registre % de gordura corporal para ver esta evolução.</p></div>;
      if (data.length === 0) return <div className="flex items-center justify-center h-[200px] bg-muted/50 rounded-lg text-center p-4"><p className="text-sm text-muted-foreground">Registre seu progresso para ver a evolução.</p></div>;

      return (
          <ChartContainer config={chartConfig} className="h-[200px] w-full">
              <LineChart data={data} margin={{ top: 20, right: 20, left: -20, bottom: 20 }}>
                  <CartesianGrid vertical={false} />
                  <XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={8} fontSize={12} />
                  <YAxis type="number" domain={yDomain} hide={true} />
                  <Tooltip cursor={true} content={<CustomTooltipContent chartType={chartType} />} />
                  
                  {chartType === 'imc' && (
                      <>
                          <ReferenceArea y1={yDomain[0]} y2={18.5} fill="hsl(210 90% 60% / 0.1)" stroke="hsl(210 90% 60% / 0.2)" strokeDasharray="3 3" />
                          <ReferenceArea y1={18.5} y2={24.9} fill="hsl(120 60% 47% / 0.1)" stroke="hsl(120 60% 47% / 0.2)" strokeDasharray="3 3" />
                          <ReferenceArea y1={25} y2={29.9} fill="hsl(48 95% 50% / 0.1)" stroke="hsl(48 95% 50% / 0.2)" strokeDasharray="3 3" />
                          <ReferenceArea y1={30} y2={yDomain[1]} fill="hsl(var(--destructive) / 0.1)" stroke="hsl(var(--destructive) / 0.2)" strokeDasharray="3 3" />
                      </>
                  )}
                  <Line dataKey="value" type="natural" stroke={color} strokeWidth={2} dot={customDot || <Dot r={3} />} activeDot={{ r: 6 }} name={chartType} />
              </LineChart>
          </ChartContainer>
      );
  };
  
  return (
    <Card className="transition-all hover:shadow-lg">
      <CardHeader className="flex flex-row items-start justify-between">
          <div className="grid gap-0.5">
              <CardTitle>Acompanhamento de Progresso</CardTitle>
              <CardDescription>Visualize sua evolução e registre seu progresso.</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Dialog open={isAddEntryOpen} onOpenChange={setIsAddEntryOpen}>
                <DialogTrigger asChild>
                    <Button variant="outline" size="icon">
                        <PlusCircle className="h-4 w-4" />
                        <span className="sr-only">Adicionar Novo Registro</span>
                    </Button>
                </DialogTrigger>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Adicionar Novo Registro</DialogTitle>
                        <DialogDescription>
                            Preencha os campos abaixo para registrar seu progresso hoje.
                        </DialogDescription>
                    </DialogHeader>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4 py-4">
                            <FormField
                                control={form.control}
                                name="date"
                                render={({ field }) => (
                                    <FormItem>
                                    <FormLabel>Data</FormLabel>
                                    <Popover>
                                        <PopoverTrigger asChild>
                                        <FormControl>
                                            <Button variant={"outline"} className={cn("w-full pl-3 text-left font-normal", !field.value && "text-muted-foreground")}>
                                                {field.value ? format(field.value, "PPP", { locale: ptBR }) : <span>Escolha uma data</span>}
                                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                            </Button>
                                        </FormControl>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto p-0" align="start">
                                        <Calendar mode="single" selected={field.value} onSelect={field.onChange} disabled={(date) => date > new Date() || date < new Date("1900-01-01")} initialFocus />
                                        </PopoverContent>
                                    </Popover>
                                    <FormMessage />
                                    </FormItem>
                                )}
                            />
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
                            <DialogFooter>
                                <DialogClose asChild><Button variant="outline">Cancelar</Button></DialogClose>
                                <Button type="submit" disabled={isLoading}>
                                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Salvar Registro
                                </Button>
                            </DialogFooter>
                        </form>
                    </Form>
                </DialogContent>
            </Dialog>

            <Dialog open={isHistoryOpen} onOpenChange={setIsHistoryOpen}>
                <DialogTrigger asChild>
                    <Button variant="outline" size="icon" disabled={progressHistory.length === 0}>
                        <History className="h-4 w-4" />
                        <span className="sr-only">Ver Histórico</span>
                    </Button>
                </DialogTrigger>
                <DialogContent className="max-w-xl">
                    <DialogHeader>
                        <DialogTitle>Histórico de Progresso</DialogTitle>
                        <DialogDescription>
                            Aqui estão todos os seus registros. Você pode excluir qualquer entrada.
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
                            {progressHistory.length > 0 ? progressHistory.slice().reverse().map((entry) => (
                                <TableRow key={entry.id}>
                                    <TableCell>{format(entry.date, "dd/MM/yyyy")}</TableCell>
                                    <TableCell className="text-right">{entry.weight.toFixed(1)}</TableCell>
                                    <TableCell className="text-right">{entry.bodyFat ? entry.bodyFat.toFixed(1) : "N/A"}</TableCell>
                                    <TableCell className="text-right">
                                        <Dialog>
                                            <DialogTrigger asChild>
                                                <Button variant="ghost" size="icon">
                                                    <Trash2 className="h-4 w-4 text-destructive" />
                                                    <span className="sr-only">Excluir</span>
                                                </Button>
                                            </DialogTrigger>
                                            <DialogContent>
                                                <DialogHeader>
                                                    <DialogTitle>Confirmar Exclusão</DialogTitle>
                                                    <DialogDescription>
                                                        Tem certeza que deseja excluir o registro de {format(entry.date, "PPP", { locale: ptBR })}? Esta ação não pode ser desfeita.
                                                    </DialogDescription>
                                                </DialogHeader>
                                                <DialogFooter>
                                                    <DialogClose asChild><Button variant="outline">Cancelar</Button></DialogClose>
                                                    <Button variant="destructive" onClick={() => handleDelete(entry.id)}>Excluir</Button>
                                                </DialogFooter>
                                            </DialogContent>
                                        </Dialog>
                                    </TableCell>
                                </TableRow>
                            )): (
                                <TableRow>
                                    <TableCell colSpan={4} className="h-24 text-center">
                                        Nenhum registro encontrado.
                                    </TableCell>
                                </TableRow>
                            )}
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
          </div>
      </CardHeader>
      <CardContent className="pt-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
                <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2"><Weight className="h-5 w-5 text-primary" /> Peso (kg)</CardTitle>
                </CardHeader>
                <CardContent className="p-2">
                    {renderChart(chartDataWeight, yDomainWeight, "hsl(var(--chart-1))", "weight")}
                </CardContent>
            </Card>
            <Card>
                <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2"><AreaChart className="h-5 w-5 text-primary" /> IMC</CardTitle>
                </CardHeader>
                <CardContent className="p-2">
                    {renderChart(chartDataBmi, yDomainBmi, "hsl(var(--chart-2))", "imc", <BmiDot />)}
                     <div className="mt-2 flex flex-wrap justify-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-[hsl(210,90%,60%)]"></span>Abaixo</div>
                        <div className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-[hsl(120,60%,47%)]"></span>Ideal</div>
                        <div className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-[hsl(48,95%,50%)]"></span>Sobrepeso</div>
                        <div className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-[hsl(var(--destructive))]"></span>Obesidade</div>
                    </div>
                </CardContent>
            </Card>
            <Card>
                <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2"><BarChart className="h-5 w-5 text-primary" /> Massa Magra (kg)</CardTitle>
                </CardHeader>
                <CardContent className="p-2">
                    {renderChart(chartDataLeanMass, yDomainLeanMass, "hsl(var(--chart-4))", "leanMass")}
                </CardContent>
            </Card>
            <Card>
                <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2"><Percent className="h-5 w-5 text-primary" /> Gordura Corporal (%)</CardTitle>
                </CardHeader>
                <CardContent className="p-2">
                    {renderChart(chartDataBodyFat, yDomainBodyFat, "hsl(var(--chart-5))", "bodyFat")}
                </CardContent>
            </Card>
        </div>
      </CardContent>
    </Card>
  );
}

    