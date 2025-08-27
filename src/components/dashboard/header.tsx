
"use client";

import { HeartPulse, LogOut, User } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { getAuth, signOut } from "firebase/auth";
import { app } from "@/lib/firebase";

export function Header() {
  const router = useRouter();
  const auth = getAuth(app);

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      const response = await fetch('/api/auth/session', {
          method: 'DELETE',
      });

      if (response.ok) {
          router.push('/login');
      } else {
          console.error('Failed to logout session');
      }
    } catch (error) {
      console.error("Error signing out: ", error);
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-card">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-2">
          <HeartPulse className="h-6 w-6 text-primary" />
          <h1 className="text-xl font-bold tracking-tight text-foreground">
            Companheiro Vitalize
          </h1>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-8 w-8 rounded-full">
              <Avatar className="h-9 w-9">
                <AvatarImage src={auth.currentUser?.photoURL || "https://picsum.photos/100"} alt="Avatar do usuário" data-ai-hint="person" />
                <AvatarFallback>{auth.currentUser?.email?.charAt(0).toUpperCase() || 'U'}</AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end" forceMount>
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">{auth.currentUser?.displayName || 'Usuário'}</p>
                <p className="text-xs leading-none text-muted-foreground">
                  {auth.currentUser?.email}
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <User className="mr-2 h-4 w-4" />
              <span>Perfil</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleSignOut}>
              <LogOut className="mr-2 h-4 w-4" />
              <span>Sair</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
