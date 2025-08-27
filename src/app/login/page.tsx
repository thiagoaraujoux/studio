
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
  User,
} from "firebase/auth";
import { getFirestore, doc, setDoc, getDoc } from "firebase/firestore";
import { FcGoogle } from "react-icons/fc";
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
import { app } from "@/lib/firebase";
import { HeartPulse, Loader2 } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();
  const auth = getAuth(app);
  const db = getFirestore(app);

  const saveUserToFirestore = async (user: User) => {
    const userRef = doc(db, "usuarios", user.uid);
    const docSnap = await getDoc(userRef);
    if (!docSnap.exists()) {
      await setDoc(userRef, {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
        createdAt: new Date(),
        role: "user",
      });
    }
  };

  const handleAuthSuccess = async (user: User) => {
    await saveUserToFirestore(user);
    const idToken = await user.getIdToken();

    const response = await fetch("/api/auth/session", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${idToken}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: "Falha ao criar a sessão do servidor." }));
      throw new Error(errorData.message || "Falha ao criar a sessão do servidor.");
    }
    
    toast({
      title: `Bem-vindo(a)!`,
      description: "Conta criada com sucesso. Login realizado.",
    });
    router.push("/dashboard");
  };
  
  const handleAuthError = (error: any) => {
    let description = "Ocorreu um erro desconhecido. Tente novamente.";
    // Erros do Firebase Auth
    if (error.code) {
      switch (error.code) {
        case 'auth/user-not-found':
        case 'auth/wrong-password':
        case 'auth/invalid-credential':
          description = "Email ou senha inválidos. Por favor, verifique e tente novamente.";
          break;
        case 'auth/email-already-in-use':
          description = "Este e-mail já está em uso por outra conta.";
          break;
        case 'auth/weak-password':
          description = "A senha é muito fraca. Por favor, escolha uma senha mais forte.";
          break;
        case 'auth/popup-closed-by-user':
          description = "A janela de login do Google foi fechada antes da conclusão.";
          return; // Não mostra toast para este caso
        default:
          description = `Erro do Firebase: ${error.message}`;
      }
    } else {
      // Erros da nossa API de sessão ou outros erros
      description = error.message;
    }

    toast({
      title: "Falha na Autenticação",
      description: description,
      variant: "destructive",
    });
  };

  const handleSignUp = async () => {
    setIsLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      await handleAuthSuccess(userCredential.user);
    } catch (error) {
      handleAuthError(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      await handleAuthSuccess(result.user);
    } catch (error) {
      handleAuthError(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background">
      <div className="flex items-center gap-2 mb-4">
        <HeartPulse className="h-8 w-8 text-primary" />
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Companheiro Vitalize
        </h1>
      </div>
      <Card className="w-[400px]">
        <CardHeader>
          <CardTitle>Crie uma conta</CardTitle>
          <CardDescription>
            Comece sua jornada de saúde e bem-estar hoje.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email-signup">Email</Label>
            <Input
              id="email-signup"
              type="email"
              placeholder="m@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password-signup">Senha</Label>
            <Input
              id="password-signup"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading}
            />
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-4">
          <Button onClick={handleSignUp} className="w-full" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Criar Conta
          </Button>
          <Button variant="outline" className="w-full" onClick={handleGoogleSignIn} disabled={isLoading}>
            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FcGoogle className="mr-2 h-4 w-4" />}
            Inscrever-se com o Google
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
