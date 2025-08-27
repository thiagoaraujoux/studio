
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm, SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { getAuth, updateProfile, updatePassword, EmailAuthProvider, reauthenticateWithCredential } from "firebase/auth";
import type { User } from "firebase/auth";
import { doc, setDoc, getDoc, collection, query, orderBy, onSnapshot, Timestamp } from "firebase/firestore";
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
import { Loader2, KeyRound, User as UserIcon, HeartPulse, AreaChart, ArrowLeft, Weight, BarChart, Percent } from "lucide-react";
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartConfig } from "@/components/ui/chart";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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

type ProfileFormValues = z.infer<typeof profileFormSchema>;
type PasswordFormValues = z.infer<typeof passwordFormSchema>;
type HealthFormValues = z.infer<typeof healthFormSchema>;

type ProgressEntry = {
    date: Date;
    weight: number;
    bodyFat?: number | null;
};

const chartConfig = {
  weight: {
    label: "Peso (kg)",
    color: "hsl(var(--chart-1))",
  },
  imc: {
    label: "IMC",
    color: "hsl(var(--primary))",
  },
  leanMass: {
    label: "Massa Magra (kg)",
    color: "hsl(var(--chart-2))",
  },
  bodyFat: {
    label: "Gordura Corporal (%)",
    color: "hsl(var(--chart-4))",
  },
} satisfies ChartConfig;

const getBmiCategoryColor = (imc: number | null) => {
    if (imc === null) return 'hsl(var(--muted-foreground))';
    if (imc < 18.5) return 'hsl(210 90% 70%)';
    if (imc < 25) return 'hsl(120 60% 47%)';
    if (imc < 30) return 'hsl(48 95% 50%)';
    return 'hsl(var(--destructive))';
};

export default function ProfilePage() {
  const [user, setUser] = useState<User | null>(null);
  const [isProfileLoading, setIsProfileLoading] = useState(false);
  const [isPasswordLoading, setIsPasswordLoading] = useState(false);
  const [isHealthLoading, setIsHealthLoading] = useState(false);
  const [progressHistory, setProgressHistory] = useState<ProgressEntry[]>([]);
  const [height, setHeight] = useState<number | null>(null);
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
            const data = snapshot.docs.map(doc => ({
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
  }, [auth, router, profileForm, healthForm]);

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

  const lastWeight = progressHistory.length > 0 ? progressHistory[progressHistory.length - 1].weight : null;
  const currentBmi = height && lastWeight ? (lastWeight / (height * height)).toFixed(2) : null;

  const weightChartData = progressHistory.map(entry => ({
      date: format(entry.date, "PPP", { locale: ptBR }),
      label: format(entry.date, "dd/MM"),
      weight: entry.weight,
  }));
  
  const bmiChartData = height ? progressHistory.map(entry => ({
    date: format(entry.date, "PPP", { locale: ptBR }),
    label: format(entry.date, "dd/MM"),
    imc: parseFloat((entry.weight / (height * height)).toFixed(2)),
  })) : [];

  const leanMassChartData = progressHistory
    .filter(entry => entry.bodyFat && entry.bodyFat > 0)
    .map(entry => ({
        date: format(entry.date, "PPP", { locale: ptBR }),
        label: format(entry.date, "dd/MM"),
        leanMass: parseFloat((entry.weight * (1 - entry.bodyFat! / 100)).toFixed(1)),
    }));
  
  const bodyFatChartData = progressHistory
    .filter(entry => entry.bodyFat && entry.bodyFat > 0)
    .map(entry => ({
        date: format(entry.date, "PPP", { locale: ptBR }),
        label: format(entry.date, "dd/MM"),
        bodyFat: entry.bodyFat,
    }));
  
  const getChartDomain = (data: number[]) => {
      if (data.length === 0) return [0, 100];
      if (data.length === 1) return [data[0] - 5, data[0] + 5];

      const min = Math.min(...data);
      const max = Math.max(...data);
      const range = max - min;
      if (range === 0) return [min - 5, max + 5];
      
      const padding = range * 0.15;
      return [Math.max(0, min - padding), max + padding];
  };

  const yDomainWeight = getChartDomain(weightChartData.map(d => d.weight));
  const yDomainBmi = getChartDomain(bmiChartData.map(d => d.imc));
  const yDomainLeanMass = getChartDomain(leanMassChartData.map(d => d.leanMass));
  const yDomainBodyFat = getChartDomain(bodyFatChartData.map(d => d.bodyFat!));

  const ColoredDot = (props: any) => {
    const { cx, cy, payload } = props;
    if (!payload?.imc) return null;
    const color = getBmiCategoryColor(payload.imc);
    return <Dot cx={cx} cy={cy} r={4} fill={color} stroke="#fff" strokeWidth={1} />;
  };

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
        
        <Tabs defaultValue="profile" className="w-full">
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

            <TabsContent value="health">
                <Card>
                    <CardHeader>
                        <CardTitle>Informações de Saúde</CardTitle>
                        <CardDescription>Gerencie suas informações de saúde para um melhor acompanhamento.</CardDescription>
                    </CardHeader>
                    <form onSubmit={healthForm.handleSubmit(handleHealthUpdate)}>
                        <CardContent className="space-y-8">
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
                            <div className="mt-4">
                                <Button type="submit" disabled={isHealthLoading}>
                                    {isHealthLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Salvar Altura
                                </Button>
                            </div>
                            
                            <div className="space-y-8 mt-6">
                                <div>
                                <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
                                    <Weight className="h-5 w-5" />
                                    Gráfico de Evolução do Peso
                                </h3>
                                {weightChartData.length > 0 ? (
                                        <ChartContainer config={chartConfig} className="h-[200px] w-full">
                                            <LineChart data={weightChartData} margin={{ top: 5, right: 30, left: 0, bottom: 0 }}>
                                                <CartesianGrid vertical={false} />
                                                <XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={8} fontSize={12} />
                                                <YAxis type="number" domain={yDomainWeight} tickLine={false} axisLine={false} tickMargin={8} width={40} fontSize={12} unit="kg" />
                                                <Tooltip cursor={true} content={<ChartTooltipContent indicator="dot" labelKey="date" />} />
                                                <Line dataKey="weight" type="natural" stroke="var(--color-weight)" strokeWidth={2} dot={{fill: "var(--color-weight)"}} activeDot={{r: 6}} />
                                            </LineChart>
                                        </ChartContainer>
                                    ) : (
                                        <div className="flex items-center justify-center h-[200px] bg-muted/50 rounded-lg">
                                            <p className="text-muted-foreground text-center">Registre seu peso para ver a evolução.</p>
                                        </div>
                                    )}
                                </div>

                                <div>
                                <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
                                    <AreaChart className="h-5 w-5" />
                                    Gráfico de Evolução do IMC
                                </h3>
                                {bmiChartData.length > 0 ? (
                                    <>
                                    <ChartContainer config={chartConfig} className="h-[250px] w-full">
                                    <LineChart data={bmiChartData} margin={{ top: 20, right: 40, left: 0, bottom: 20 }}>
                                        <CartesianGrid vertical={false} />
                                        <XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={8} fontSize={12} />
                                        <YAxis type="number" domain={yDomainBmi} tickLine={false} axisLine={false} tickMargin={8} width={30} fontSize={12}/>
                                        <Tooltip cursor={true} content={<ChartTooltipContent indicator="dot" labelKey="date" />} />
                                        
                                        <ReferenceArea y1={yDomainBmi[0]} y2={18.5} fill="hsl(210 90% 70% / 0.1)" stroke="hsl(210 90% 70% / 0.2)" strokeDasharray="3 3" />
                                        <ReferenceArea y1={18.5} y2={24.9} fill="hsl(120 60% 47% / 0.1)" stroke="hsl(120 60% 47% / 0.2)" strokeDasharray="3 3" />
                                        <ReferenceArea y1={25} y2={29.9} fill="hsl(48 95% 50% / 0.1)" stroke="hsl(48 95% 50% / 0.2)" strokeDasharray="3 3" />
                                        <ReferenceArea y1={30} y2={yDomainBmi[1]} fill="hsl(var(--destructive) / 0.1)" stroke="hsl(var(--destructive) / 0.2)" strokeDasharray="3 3" />

                                        <Line dataKey="imc" type="natural" stroke="hsl(var(--muted-foreground))" strokeWidth={1.5} dot={<ColoredDot />} activeDot={{ r: 6 }} />
                                    </LineChart>
                                    </ChartContainer>
                                    <div className="mt-4 flex flex-wrap justify-center gap-x-4 gap-y-2 text-xs text-muted-foreground">
                                        <div className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-[hsl(210,90%,70%)]"></span>Abaixo do Peso (&lt;18.5)</div>
                                        <div className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-[hsl(120,60%,47%)]"></span>Peso Ideal (18.5-24.9)</div>
                                        <div className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-[hsl(48,95%,50%)]"></span>Sobrepeso (25-29.9)</div>
                                        <div className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-[hsl(var(--destructive))]"></span>Obesidade (&ge;30)</div>
                                    </div>
                                    </>
                                ) : (
                                    <div className="flex items-center justify-center h-[250px] bg-muted/50 rounded-lg">
                                    <p className="text-muted-foreground text-center">Informe sua altura e registre seu peso para ver a evolução do IMC.</p>
                                    </div>
                                )}
                                </div>
                                
                                <div>
                                <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
                                    <BarChart className="h-5 w-5" />
                                    Gráfico de Evolução da Massa Magra
                                </h3>
                                {leanMassChartData.length > 0 ? (
                                        <ChartContainer config={chartConfig} className="h-[200px] w-full">
                                            <LineChart data={leanMassChartData} margin={{ top: 5, right: 30, left: 0, bottom: 0 }}>
                                                <CartesianGrid vertical={false} />
                                                <XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={8} fontSize={12} />
                                                <YAxis type="number" domain={yDomainLeanMass} tickLine={false} axisLine={false} tickMargin={8} width={40} fontSize={12} unit="kg" />
                                                <Tooltip cursor={true} content={<ChartTooltipContent indicator="dot" labelKey="date" />} />
                                                <Line dataKey="leanMass" type="natural" stroke="var(--color-leanMass)" strokeWidth={2} dot={{fill: "var(--color-leanMass)"}} activeDot={{r: 6}} />
                                            </LineChart>
                                        </ChartContainer>
                                    ) : (
                                        <div className="flex items-center justify-center h-[200px] bg-muted/50 rounded-lg text-center p-4">
                                            <p className="text-muted-foreground">Registre seu peso e sua gordura corporal para ver a evolução da sua massa magra.</p>
                                        </div>
                                    )}
                                </div>

                                <div>
                                <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
                                    <Percent className="h-5 w-5" />
                                    Gráfico de Evolução da Gordura Corporal
                                </h3>
                                {bodyFatChartData.length > 0 ? (
                                        <ChartContainer config={chartConfig} className="h-[200px] w-full">
                                            <LineChart data={bodyFatChartData} margin={{ top: 5, right: 30, left: 0, bottom: 0 }}>
                                                <CartesianGrid vertical={false} />
                                                <XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={8} fontSize={12} />
                                                <YAxis type="number" domain={yDomainBodyFat} tickLine={false} axisLine={false} tickMargin={8} width={40} fontSize={12} unit="%" />
                                                <Tooltip cursor={true} content={<ChartTooltipContent indicator="dot" labelKey="date" />} />
                                                <Line dataKey="bodyFat" type="natural" stroke="var(--color-bodyFat)" strokeWidth={2} dot={{fill: "var(--color-bodyFat)"}} activeDot={{r: 6}} />
                                            </LineChart>
                                        </ChartContainer>
                                    ) : (
                                        <div className="flex items-center justify-center h-[200px] bg-muted/50 rounded-lg text-center p-4">
                                            <p className="text-muted-foreground">Registre sua gordura corporal para ver a evolução.</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </CardContent>
                    </form>
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

    