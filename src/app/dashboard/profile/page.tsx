
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm, SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { getAuth, updateProfile, updatePassword, EmailAuthProvider, reauthenticateWithCredential } from "firebase/auth";
import type { User } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";

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
import { Loader2, KeyRound, User as UserIcon, Image as ImageIcon } from "lucide-react";
import { Separator } from "@/components/ui/separator";

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


type ProfileFormValues = z.infer<typeof profileFormSchema>;
type PasswordFormValues = z.infer<typeof passwordFormSchema>;

export default function ProfilePage() {
  const [user, setUser] = useState<User | null>(null);
  const [isProfileLoading, setIsProfileLoading] = useState(false);
  const [isPasswordLoading, setIsPasswordLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();
  const auth = getAuth(app);

  const profileForm = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
  });

  const passwordForm = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordFormSchema),
  });

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        profileForm.reset({
          displayName: currentUser.displayName || "",
          photoURL: currentUser.photoURL || "",
        });
      } else {
        router.push("/login");
      }
    });
    return () => unsubscribe();
  }, [auth, router, profileForm]);

  const handleProfileUpdate: SubmitHandler<ProfileFormValues> = async (data) => {
    if (!user) return;

    setIsProfileLoading(true);
    try {
      await updateProfile(user, {
        displayName: data.displayName,
        photoURL: data.photoURL,
      });

      // Also update in firestore
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
  
  if (!user) {
    return (
        <div className="flex h-screen items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <div className="w-full max-w-2xl space-y-8">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <UserIcon className="h-6 w-6 text-primary" />
              <div>
                <CardTitle>Informações do Perfil</CardTitle>
                <CardDescription>Atualize seu nome e foto de perfil.</CardDescription>
              </div>
            </div>
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

        <Card>
          <CardHeader>
             <div className="flex items-center gap-3">
                <KeyRound className="h-6 w-6 text-primary" />
                <div>
                    <CardTitle>Alterar Senha</CardTitle>
                    <CardDescription>Para sua segurança, você precisa informar sua senha atual.</CardDescription>
                </div>
            </div>
          </CardHeader>
          <form onSubmit={passwordForm.handleSubmit(handlePasswordUpdate)}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="currentPassword">Senha Atual</Label>
                <Input id="currentPassword" type="password" {...passwordForm.register("currentPassword")} />
                 {passwordForm.formState.errors.currentPassword && <p className="text-sm font-medium text-destructive">{passwordForm.formState.errors.currentPassword.message}</p>}
              </div>
              <Separator />
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
         <div className="text-center">
            <Button variant="link" onClick={() => router.push('/dashboard')}>Voltar para o Dashboard</Button>
        </div>
      </div>
    </div>
  );
}
