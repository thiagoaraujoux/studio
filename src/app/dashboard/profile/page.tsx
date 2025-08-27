
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm, SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { getAuth, updateProfile, updatePassword, EmailAuthProvider, reauthenticateWithCredential } from "firebase/auth";
import type { User } from "firebase/auth";
import { doc, setDoc, getDoc, collection, query, orderBy, onSnapshot, Timestamp, deleteDoc, writeBatch } from "firebase/firestore";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceArea, Dot } from "recharts";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { app, db } from "@/lib/firebase";
import { Loader2, KeyRound, User as UserIcon, HeartPulse, AreaChart, ArrowLeft, Weight, BarChart, Percent, LineChartIcon, History, Calendar as CalendarIcon, Pencil, Trash2 } from "lucide-react";
import { ChartContainer } from "@/components/ui/chart";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
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


const profileFormSchema = z.object({
  displayName: z.string().min(2, "O nome deve ter pelo menos 2 caracteres.").optional(),
  photoURL: z.string().url("Por favor, insira uma URL válida.").or(z.literal("")).optional(),
});

const passwordFormSchema = z.object({
  currentPassword: z.string().min(1, "A senha atual é obrigatória."),
  newPassword: z.string().min(6, "A nova senha deve ter pelo menos 6 caracteres."),
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "As novas senhas não correspondem.",
  path: ["confirmPassword"],
});

const healthFormSchema = z.object({
    height: z.preprocess(
        (a) => parseFloat(z.string().parse(a)),
        z.number().positive("A altura deve ser um número positivo em metros (ex: 1.75).")
    ),
});

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
  
type ProfileFormValues = z.infer<typeof profileFormSchema>;
type PasswordFormValues = z.infer<typeof passwordFormSchema>;
type HealthFormValues = z.infer<typeof healthFormSchema>;
type ProgressFormValues = z.infer<typeof progressFormSchema>;

type ProgressEntry = {
    id: string; // Document ID
    date: Date;
    weight: number;
    bodyFat?: number | null;
};

type ChartType = "weight" | "imc" | "leanMass" | "bodyFat";

const chartConfig = {
  weight: {
    label: "Peso (kg)",
    color: "hsl(var(--chart-1))",
    icon: Weight,
  },
  imc: {
    label: "IMC",
    color: "hsl(var(--muted-foreground))",
    icon: AreaChart,
  },
  leanMass: {
    label: "Massa Magra (kg)",
    color: "hsl(var(--chart-2))",
    icon: BarChart,
  },
  bodyFat: {
    label: "Gordura Corporal (%)",
    color: "hsl(var(--chart-4))",
    icon: Percent,
  },
};

const getBmiCategoryColor = (imc: number | null) => {
    if (imc === null) return 'hsl(var(--muted-foreground))';
    if (imc < 18.5) return 'hsl(210 90% 60%)';
    if (imc < 25) return 'hsl(120 60% 47%)';
    if (imc < 30) return 'hsl(48 95% 50%)';
    return 'hsl(var(--destructive))';
};

const CustomTooltipContent = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      const value = data.value?.toFixed(1);
      const unit = data.name === 'Gordura Corporal (%)' ? '%' : 'kg';
      
      return (
        <div className="rounded-lg border bg-background p-2 shadow-sm">
          <div className="grid grid-cols-1 gap-1.5">
            <p className="text-muted-foreground text-sm">{label}</p>
            <p className="font-bold text-base" style={{ color: data.stroke }}>
              {value} {data.name.includes('IMC') ? '' : unit}
            </p>
          </div>
        </div>
      );
    }
  
    return null;
  };

export default function ProfilePage() {
  const [user, setUser] = useState<User | null>(null);
  const [isProfileLoading, setIsProfileLoading] = useState(false);
  const [isPasswordLoading, setIsPasswordLoading] = useState(false);
  const [isHealthLoading, setIsHealthLoading] = useState(false);
  const [isProgressLoading, setIsProgressLoading] = useState(false);
  const [progressHistory, setProgressHistory] = useState<ProgressEntry[]>([]);
  const [height, setHeight] = useState<number | null>(null);
  const [activeChart, setActiveChart] = useState<ChartType>("weight");
  const [editingEntryId, setEditingEntryId] = useState<string | null>(null);
  const router = useRouter();
  const { toast } = useToast();
  const auth = getAuth(app);

  const profileForm = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
  });

  const passwordForm = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordFormSchema),
  });

  const healthForm = useForm<HealthFormValues>({
    resolver: zodResolver(healthFormSchema),
  });
  
  const progressForm = useForm<ProgressFormValues>({
    resolver: zodResolver(progressFormSchema),
    defaultValues: { date: new Date(), weight: undefined, bodyFat: undefined },
  });


  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        profileForm.reset({
          displayName: currentUser.displayName || "",
          photoURL: currentUser.photoURL || "",
        });

        const userRef = doc(db, "usuarios", currentUser.uid);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists() && userSnap.data().height) {
            const userHeight = userSnap.data().height;
            setHeight(userHeight);
            healthForm.reset({ height: userHeight });
        }

        const userProgressRef = collection(db, "usuarios", currentUser.uid, "progresso");
        const q = query(userProgressRef, orderBy("date", "asc"));
        const unsubscribeSnapshot = onSnapshot(q, (snapshot) => {
            const data: ProgressEntry[] = snapshot.docs.map(doc => ({
                id: doc.id,
                date: (doc.data().date as Timestamp).toDate(),
                weight: doc.data().weight,
                bodyFat: doc.data().bodyFat,
            }));
            setProgressHistory(data);
        });
        return () => unsubscribeSnapshot();
      } else {
        router.push("/login");
      }
    });
    return () => unsubscribe();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auth, router]);

  const handleProfileUpdate: SubmitHandler<ProfileFormValues> = async (data) => {
    if (!user) return;

    setIsProfileLoading(true);
    try {
      await updateProfile(user, {
        displayName: data.displayName,
        photoURL: data.photoURL,
      });

      const userRef = doc(db, "usuarios", user.uid);
      await setDoc(userRef, { 
        displayName: data.displayName, 
        photoURL: data.photoURL 
      }, { merge: true });
      
      toast({
        title: "Sucesso!",
        description: "Seu perfil foi atualizado.",
      });
    } catch (error: any) {
      toast({
        title: "Erro ao Atualizar Perfil",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsProfileLoading(false);
    }
  };

  const handlePasswordUpdate: SubmitHandler<PasswordFormValues> = async (data) => {
    if (!user || !user.email) return;

    setIsPasswordLoading(true);
    try {
      const credential = EmailAuthProvider.credential(user.email, data.currentPassword);
      await reauthenticateWithCredential(user, credential);
      await updatePassword(user, data.newPassword);

      toast({
        title: "Sucesso!",
        description: "Sua senha foi alterada.",
      });
      passwordForm.reset({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch (error: any) {
      let description = "Ocorreu um erro. Tente novamente.";
      if (error.code === 'auth/wrong-password') {
        description = "A senha atual está incorreta.";
      }
       toast({
        title: "Erro ao Alterar Senha",
        description: description,
        variant: "destructive",
      });
    } finally {
      setIsPasswordLoading(false);
    }
  };

  const handleHealthUpdate: SubmitHandler<HealthFormValues> = async (data) => {
    if (!user) return;

    setIsHealthLoading(true);
    try {
        const userRef = doc(db, "usuarios", user.uid);
        await setDoc(userRef, { height: data.height }, { merge: true });
        setHeight(data.height);
        toast({
            title: "Sucesso!",
            description: "Sua altura foi atualizada.",
        });
    } catch (error: any) {
        toast({
            title: "Erro ao Salvar Altura",
            description: error.message,
            variant: "destructive",
        });
    } finally {
        setIsHealthLoading(false);
    }
  };
  
  const handleProgressSubmit: SubmitHandler<ProgressFormValues> = async (data) => {
    if (!user) return;

    setIsProgressLoading(true);
    try {
        const userProgressRef = collection(db, "usuarios", user.uid, "progresso");
        
        if (editingEntryId) {
            // Logic for editing an existing entry
            const batch = writeBatch(db);
            const oldDocRef = doc(userProgressRef, editingEntryId);
            const newDateString = format(data.date, "yyyy-MM-dd");
            const newProgressDocRef = doc(userProgressRef, newDateString);

            // Delete the old document first
            batch.delete(oldDocRef);

            // Set the new document with potentially new date as ID
            batch.set(newProgressDocRef, {
                weight: data.weight,
                bodyFat: data.bodyFat || null,
                date: Timestamp.fromDate(data.date),
            });

            await batch.commit();
            toast({
                title: "Sucesso!",
                description: "Seu progresso foi atualizado.",
            });

        } else {
            // Logic for adding a new entry
            const newDateString = format(data.date, "yyyy-MM-dd");
            const newProgressDocRef = doc(userProgressRef, newDateString);
            await setDoc(newProgressDocRef, {
                weight: data.weight,
                bodyFat: data.bodyFat || null,
                date: Timestamp.fromDate(data.date),
            }, { merge: true });
            toast({
                title: "Sucesso!",
                description: "Seu progresso foi salvo.",
            });
        }
        
        setEditingEntryId(null);
        progressForm.reset({ date: new Date(), weight: undefined, bodyFat: undefined });

    } catch (error: any) {
        console.error("Progress submit error:", error);
        toast({ title: "Erro", description: "Não foi possível salvar seu progresso. Verifique se já existe um registro para esta data.", variant: "destructive"});
    } finally {
        setIsProgressLoading(false);
    }
};


  const handleEditProgress = (entry: ProgressEntry) => {
    setEditingEntryId(entry.id);
    progressForm.reset({
        date: entry.date,
        weight: entry.weight,
        bodyFat: entry.bodyFat || undefined,
    });
  }
  
  const handleClearForm = () => {
    setEditingEntryId(null);
    progressForm.reset({ date: new Date(), weight: undefined, bodyFat: undefined });
  }

  const handleDeleteProgress = async (entryId: string) => {
    if (!user) return;
    try {
        const progressDocRef = doc(db, "usuarios", user.uid, "progresso", entryId);
        await deleteDoc(progressDocRef);
        toast({ title: "Sucesso!", description: "Registro excluído." });
    } catch (error) {
        toast({ title: "Erro", description: "Não foi possível excluir o registro.", variant: "destructive" });
    }
  }

  const lastWeight = progressHistory.length > 0 ? progressHistory[progressHistory.length - 1].weight : null;
  const currentBmi = height && lastWeight ? (lastWeight / (height * height)).toFixed(2) : null;

  const chartData = {
    weight: progressHistory.map(entry => ({
        date: format(entry.date, "PPP", { locale: ptBR }),
        label: format(entry.date, "dd/MM"),
        value: entry.weight,
    })),
    imc: height ? progressHistory.map(entry => ({
      date: format(entry.date, "PPP", { locale: ptBR }),
      label: format(entry.date, "dd/MM"),
      value: parseFloat((entry.weight / (height * height)).toFixed(2)),
    })) : [],
    leanMass: progressHistory
      .filter(entry => entry.bodyFat && entry.bodyFat > 0)
      .map(entry => ({
          date: format(entry.date, "PPP", { locale: ptBR }),
          label: format(entry.date, "dd/MM"),
          value: parseFloat((entry.weight * (1 - entry.bodyFat! / 100)).toFixed(1)),
      })),
    bodyFat: progressHistory
      .filter(entry => entry.bodyFat && entry.bodyFat > 0)
      .map(entry => ({
          date: format(entry.date, "PPP", { locale: ptBR }),
          label: format(entry.date, "dd/MM"),
          value: entry.bodyFat,
      })),
  };
  
  const getChartDomain = (data: number[]) => {
      if (data.length === 0) return [0, 100];
      const min = Math.min(...data);
      const max = Math.max(...data);
      if (min === max) return [min - 5, max + 5];
      const padding = (max - min) * 0.15;
      return [Math.max(0, min - padding), max + padding];
  };

  const activeChartData = chartData[activeChart];
  const yDomain = getChartDomain(activeChartData.map(d => d.value!));
  const ActiveIcon = chartConfig[activeChart].icon;

  const ColoredDot = (props: any) => {
    const { cx, cy, payload } = props;
    if (activeChart !== 'imc' || !payload?.value) return <Dot cx={cx} cy={cy} r={3} fill={`var(--color-${activeChart})`} stroke={'var(--color-background)'} strokeWidth={1} />;
    const color = getBmiCategoryColor(payload.value);
    return <Dot cx={cx} cy={cy} r={4} fill={color} stroke="#fff" strokeWidth={1} />;
  };

  const renderChart = () => {
    if (activeChart === 'imc' && !height) {
        return (
            <div className="flex items-center justify-center h-[400px] bg-muted/50 rounded-lg text-center p-4">
                <p className="text-muted-foreground">Informe sua altura para ver a evolução do IMC.</p>
            </div>
        );
    }
    if ((activeChart === 'leanMass' || activeChart === 'bodyFat') && chartData[activeChart].length === 0) {
         return (
            <div className="flex items-center justify-center h-[400px] bg-muted/50 rounded-lg text-center p-4">
                <p className="text-muted-foreground">Registre seu peso e sua gordura corporal para ver esta evolução.</p>
            </div>
        );
    }
    if (activeChartData.length === 0) {
        return (
            <div className="flex items-center justify-center h-[400px] bg-muted/50 rounded-lg text-center p-4">
                <p className="text-muted-foreground">Registre seu progresso para começar a ver sua evolução.</p>
            </div>
        );
    }

    return (
        <ChartContainer config={chartConfig} className="h-[400px] w-full">
            <LineChart data={activeChartData} margin={{ top: 20, right: 20, left: -20, bottom: 20 }}>
                <CartesianGrid vertical={false} />
                <XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={8} fontSize={12} />
                <YAxis type="number" domain={yDomain} tickLine={false} axisLine={false} tickMargin={8} width={0} fontSize={12} unit={activeChart === 'bodyFat' ? '%' : 'kg'} />
                <Tooltip cursor={true} content={<CustomTooltipContent />} />
                
                {activeChart === 'imc' && (
                    <>
                        <ReferenceArea y1={yDomain[0]} y2={18.5} fill="hsl(210 90% 60% / 0.1)" stroke="hsl(210 90% 60% / 0.2)" strokeDasharray="3 3" />
                        <ReferenceArea y1={18.5} y2={24.9} fill="hsl(120 60% 47% / 0.1)" stroke="hsl(120 60% 47% / 0.2)" strokeDasharray="3 3" />
                        <ReferenceArea y1={25} y2={29.9} fill="hsl(48 95% 50% / 0.1)" stroke="hsl(48 95% 50% / 0.2)" strokeDasharray="3 3" />
                        <ReferenceArea y1={30} y2={yDomain[1]} fill="hsl(var(--destructive) / 0.1)" stroke="hsl(var(--destructive) / 0.2)" strokeDasharray="3 3" />
                    </>
                )}

                <Line dataKey="value" type="natural" stroke={`var(--color-${activeChart})`} strokeWidth={2} dot={<ColoredDot/>} activeDot={{ r: 6 }} name={chartConfig[activeChart].label}/>
            </LineChart>
        </ChartContainer>
    )
  }

  if (!user) {
    return (
        <div className="flex h-screen items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-start bg-background p-4 sm:p-6 lg:p-8">
      <div className="w-full max-w-4xl space-y-8">
        <div className="flex justify-start">
            <Button variant="ghost" onClick={() => router.push('/dashboard')}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Voltar para o Dashboard
            </Button>
        </div>

        <div className="text-center">
          <h1 className="text-3xl font-bold">Configurações da Conta</h1>
          <p className="text-muted-foreground">Gerencie suas informações pessoais, de saúde e segurança.</p>
        </div>
        
        <Tabs defaultValue="health" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="profile"><UserIcon className="mr-2 h-4 w-4" /> Perfil</TabsTrigger>
                <TabsTrigger value="health"><HeartPulse className="mr-2 h-4 w-4" /> Saúde</TabsTrigger>
                <TabsTrigger value="security"><KeyRound className="mr-2 h-4 w-4" /> Segurança</TabsTrigger>
            </TabsList>

            <TabsContent value="profile">
                <Card>
                    <CardHeader>
                        <CardTitle>Informações do Perfil</CardTitle>
                        <CardDescription>Atualize seu nome e foto de perfil.</CardDescription>
                    </CardHeader>
                    <form onSubmit={profileForm.handleSubmit(handleProfileUpdate)}>
                        <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="displayName">Nome de Exibição</Label>
                            <Input id="displayName" {...profileForm.register("displayName")} />
                            {profileForm.formState.errors.displayName && <p className="text-sm font-medium text-destructive">{profileForm.formState.errors.displayName.message}</p>}
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="photoURL">URL da Foto</Label>
                            <Input id="photoURL" placeholder="https://example.com/photo.jpg" {...profileForm.register("photoURL")} />
                            {profileForm.formState.errors.photoURL && <p className="text-sm font-medium text-destructive">{profileForm.formState.errors.photoURL.message}</p>}
                        </div>
                        </CardContent>
                        <CardFooter>
                        <Button type="submit" disabled={isProfileLoading}>
                            {isProfileLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Salvar Alterações
                        </Button>
                        </CardFooter>
                    </form>
                </Card>
            </TabsContent>

            <TabsContent value="health" className="space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Informações de Saúde</CardTitle>
                        <CardDescription>Gerencie suas informações e acompanhe sua evolução.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-8">
                        <form onSubmit={healthForm.handleSubmit(handleHealthUpdate)} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                                <div className="space-y-2">
                                    <Label htmlFor="height">Altura (m)</Label>
                                    <Input id="height" type="number" step="0.01" placeholder="Ex: 1.75" {...healthForm.register("height")} />
                                    {healthForm.formState.errors.height && <p className="text-sm font-medium text-destructive">{healthForm.formState.errors.height.message}</p>}
                                </div>
                                <div className="space-y-2">
                                    <Label>Peso Atual</Label>
                                    <Input value={lastWeight ? `${lastWeight.toFixed(1)} kg` : "N/A"} disabled />
                                </div>
                                <div className="space-y-2">
                                    <Label>IMC Atual</Label>
                                    <Input value={currentBmi || "N/A"} disabled />
                                </div>
                            </div>
                            <div>
                                <Button type="submit" disabled={isHealthLoading}>
                                    {isHealthLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Salvar Altura
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
                
                <Card>
                    <CardHeader>
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                            <div className="flex items-center gap-2">
                                <LineChartIcon className="h-5 w-5" />
                                <CardTitle className="text-lg">Resumo da Evolução</CardTitle>
                            </div>
                            <Select value={activeChart} onValueChange={(value) => setActiveChart(value as ChartType)}>
                                <SelectTrigger className="w-full sm:w-[240px]">
                                    <div className="flex items-center gap-2">
                                        <ActiveIcon className="h-4 w-4" />
                                        <SelectValue placeholder="Selecione uma métrica" />
                                    </div>
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="weight"><Weight className="mr-2 h-4 w-4" /> Evolução do Peso</SelectItem>
                                    <SelectItem value="imc"><AreaChart className="mr-2 h-4 w-4" /> Evolução do IMC</SelectItem>
                                    <SelectItem value="leanMass"><BarChart className="mr-2 h-4 w-4" /> Evolução da Massa Magra</SelectItem>
                                    <SelectItem value="bodyFat"><Percent className="mr-2 h-4 w-4" /> Evolução da Gordura Corporal</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {renderChart()}
                        {activeChart === 'imc' && (
                            <div className="mt-4 flex flex-wrap justify-center gap-x-4 gap-y-2 text-xs text-muted-foreground">
                                <div className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-[hsl(210,90%,60%)]"></span>Abaixo do Peso (&lt;18.5)</div>
                                <div className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-[hsl(120,60%,47%)]"></span>Peso Ideal (18.5-24.9)</div>
                                <div className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-[hsl(48,95%,50%)]"></span>Sobrepeso (25-29.9)</div>
                                <div className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-[hsl(var(--destructive))]"></span>Obesidade (&ge;30)</div>
                            </div>
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Histórico de Registros</CardTitle>
                        <CardDescription>Adicione, edite ou exclua seus registros de progresso.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Form {...progressForm}>
                            <form onSubmit={progressForm.handleSubmit(handleProgressSubmit)} className="grid gap-4 md:grid-cols-4 items-end mb-6">
                                <FormField control={progressForm.control} name="date" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Data</FormLabel>
                                        <Popover>
                                            <PopoverTrigger asChild>
                                            <FormControl>
                                                <Button variant={"outline"} className={cn("w-full pl-3 text-left font-normal",!field.value && "text-muted-foreground")}>
                                                    {field.value ? format(field.value, "PPP", { locale: ptBR }) : <span>Escolha uma data</span>}
                                                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                                </Button>
                                            </FormControl>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-auto p-0" align="start">
                                                <Calendar mode="single" selected={field.value} onSelect={field.onChange} disabled={(date) => date > new Date() || date < new Date("1900-01-01")} initialFocus/>
                                            </PopoverContent>
                                        </Popover>
                                        <FormMessage />
                                    </FormItem>
                                )}/>
                                <FormField control={progressForm.control} name="weight" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Peso (kg)</FormLabel>
                                        <FormControl>
                                            <Input type="number" step="0.1" {...field} value={field.value ?? ""} onChange={e => field.onChange(e.target.value)} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}/>
                                <FormField control={progressForm.control} name="bodyFat" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Gordura Corporal (%)</FormLabel>
                                        <FormControl>
                                            <Input type="number" step="0.1" placeholder="Opcional" {...field} value={field.value ?? ""} onChange={e => field.onChange(e.target.value)} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}/>
                                <div className="flex gap-2">
                                     <Button type="submit" className="w-full" disabled={isProgressLoading}>
                                        {isProgressLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                        {editingEntryId ? 'Salvar Alterações' : 'Salvar'}
                                    </Button>
                                    {editingEntryId && (
                                    <Button type="button" variant="outline" onClick={handleClearForm}>
                                        Limpar
                                    </Button>
                                    )}
                                </div>
                            </form>
                        </Form>
                        <ScrollArea className="h-[300px] border rounded-md">
                             <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Data</TableHead>
                                        <TableHead className="text-right">Peso</TableHead>
                                        <TableHead className="text-right">Gordura Corporal</TableHead>
                                        <TableHead className="text-right">Ações</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                {progressHistory.length > 0 ? progressHistory.slice().reverse().map((entry) => (
                                    <TableRow key={entry.id}>
                                        <TableCell>{format(entry.date, "dd/MM/yyyy")}</TableCell>
                                        <TableCell className="text-right">{entry.weight.toFixed(1)} kg</TableCell>
                                        <TableCell className="text-right">{entry.bodyFat ? `${entry.bodyFat.toFixed(1)}%` : "N/A"}</TableCell>
                                        <TableCell className="text-right">
                                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEditProgress(entry)}>
                                                <Pencil className="h-4 w-4" />
                                                <span className="sr-only">Editar</span>
                                            </Button>
                                            <Dialog>
                                                <DialogTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8">
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
                                                        <Button variant="destructive" onClick={() => handleDeleteProgress(entry.id)}>Excluir</Button>
                                                    </DialogFooter>
                                                </DialogContent>
                                            </Dialog>
                                        </TableCell>
                                    </TableRow>
                                )) : (
                                    <TableRow>
                                        <TableCell colSpan={4} className="text-center h-24">Nenhum registro encontrado.</TableCell>
                                    </TableRow>
                                )}
                                </TableBody>
                            </Table>
                        </ScrollArea>
                    </CardContent>
                </Card>

            </TabsContent>

            <TabsContent value="security">
                <Card>
                    <CardHeader>
                        <CardTitle>Alterar Senha</CardTitle>
                        <CardDescription>Para sua segurança, você precisa informar sua senha atual.</CardDescription>
                    </CardHeader>
                    <form onSubmit={passwordForm.handleSubmit(handlePasswordUpdate)}>
                        <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="currentPassword">Senha Atual</Label>
                            <Input id="currentPassword" type="password" {...passwordForm.register("currentPassword")} />
                            {passwordForm.formState.errors.currentPassword && <p className="text-sm font-medium text-destructive">{passwordForm.formState.errors.currentPassword.message}</p>}
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="newPassword">Nova Senha</Label>
                            <Input id="newPassword" type="password" {...passwordForm.register("newPassword")} />
                            {passwordForm.formState.errors.newPassword && <p className="text-sm font-medium text-destructive">{passwordForm.formState.errors.newPassword.message}</p>}
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="confirmPassword">Confirmar Nova Senha</Label>
                            <Input id="confirmPassword" type="password" {...passwordForm.register("confirmPassword")} />
                            {passwordForm.formState.errors.confirmPassword && <p className="text-sm font-medium text-destructive">{passwordForm.formState.errors.confirmPassword.message}</p>}
                        </div>
                        </CardContent>
                        <CardFooter>
                        <Button type="submit" disabled={isPasswordLoading}>
                            {isPasswordLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Alterar Senha
                        </Button>
                        </CardFooter>
                    </form>
                </Card>
            </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

    