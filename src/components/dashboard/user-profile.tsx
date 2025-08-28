
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
import { app, db } from "@/lib/firebase";
import { getAuth } from "firebase/auth";
import { FileText, User, Ruler, Weight } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import type { User as FirebaseUser } from "firebase/auth";
import { collection, query, orderBy, limit, onSnapshot, getDoc, doc, Timestamp } from "firebase/firestore";

type ProgressEntry = {
    date: Date;
    weight: number;
};

export function UserProfile() {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [lastProgress, setLastProgress] = useState<ProgressEntry | null>(null);
  const [height, setHeight] = useState<number | null>(null);
  const auth = getAuth(app);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        const userRef = doc(db, "usuarios", currentUser.uid);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists() && userSnap.data().height) {
            setHeight(userSnap.data().height);
        }

        const progressRef = collection(db, "usuarios", currentUser.uid, "progresso");
        const q = query(progressRef, orderBy("date", "desc"), limit(1));
        const unsubscribeProgress = onSnapshot(q, (snapshot) => {
            if (!snapshot.empty) {
                const docData = snapshot.docs[0].data();
                setLastProgress({
                    weight: docData.weight,
                    date: (docData.date as Timestamp).toDate(),
                });
            } else {
                setLastProgress(null);
            }
        });
        return () => unsubscribeProgress();
      }
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
        <ul className="grid gap-4">
          <li className="flex items-center justify-between">
            <span className="text-muted-foreground flex items-center gap-2">
              <User className="h-4 w-4" />
              Nome de usuário
            </span>
            <span>@{userName}</span>
          </li>
          <li className="flex items-center justify-between">
            <span className="text-muted-foreground flex items-center gap-2">
              <Ruler className="h-4 w-4" />
              Altura
            </span>
            <span>{height ? `${height.toFixed(2)} m` : 'N/A'}</span>
          </li>
           <li className="flex items-center justify-between">
            <span className="text-muted-foreground flex items-center gap-2">
              <Weight className="h-4 w-4" />
              Peso
            </span>
            <span>{lastProgress ? `${lastProgress.weight.toFixed(1)} kg` : 'N/A'}</span>
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
