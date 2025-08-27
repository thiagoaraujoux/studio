
"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { app } from "@/lib/firebase";
import { getAuth } from "firebase/auth";
import { FileText, Mail, User } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import type { User as FirebaseUser } from "firebase/auth";

export function UserProfile() {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const auth = getAuth(app);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setUser(user);
    });
    return () => unsubscribe();
  }, [auth]);

  const displayName = user?.displayName || user?.email?.split('@')[0] || "Usuário";
  const userName = user?.email?.split('@')[0] || "usuario";

  return (
    <Card className="overflow-hidden transition-all hover:shadow-lg">
      <CardHeader className="flex flex-row items-start bg-muted/50">
        <div className="flex items-center gap-4">
          <Avatar className="h-16 w-16 border">
            <AvatarImage src={user?.photoURL || "https://picsum.photos/100"} alt="Avatar do usuário" data-ai-hint="person" />
            <AvatarFallback>{displayName.charAt(0).toUpperCase()}</AvatarFallback>
          </Avatar>
          <div className="grid gap-0.5">
            <CardTitle className="group flex items-center gap-2 text-lg">
              {displayName}
            </CardTitle>
            <CardDescription>Membro Vitalize</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-6 text-sm">
        <ul className="grid gap-3">
          <li className="flex items-center justify-between">
            <span className="text-muted-foreground flex items-center gap-2">
              <User className="h-4 w-4" />
              Nome de usuário
            </span>
            <span>@{userName}</span>
          </li>
          <li className="flex items-center justify-between">
            <span className="text-muted-foreground flex items-center gap-2">
              <Mail className="h-4 w-4" />
              Email
            </span>
            <span className="truncate">{user?.email}</span>
          </li>
          <li className="flex items-center justify-between">
            <span className="text-muted-foreground flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Plano
            </span>
            <Button variant="link" asChild className="p-0 h-auto text-primary">
              <Link href="/dashboard/profile">Editar Perfil</Link>
            </Button>
          </li>
        </ul>
      </CardContent>
    </Card>
  );
}
