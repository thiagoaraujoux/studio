import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { FileText, Mail, User } from "lucide-react";

export function UserProfile() {
  return (
    <Card className="overflow-hidden transition-all hover:shadow-lg">
      <CardHeader className="flex flex-row items-start bg-muted/50">
        <div className="flex items-center gap-4">
          <Avatar className="h-16 w-16 border">
            <AvatarImage src="https://picsum.photos/100" alt="Avatar do usuário" data-ai-hint="person" />
            <AvatarFallback>AD</AvatarFallback>
          </Avatar>
          <div className="grid gap-0.5">
            <CardTitle className="group flex items-center gap-2 text-lg">
              Alex Doe
            </CardTitle>
            <CardDescription>Membro Vitalize Premium</CardDescription>
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
            <span>@alex_doe</span>
          </li>
          <li className="flex items-center justify-between">
            <span className="text-muted-foreground flex items-center gap-2">
              <Mail className="h-4 w-4" />
              Email
            </span>
            <span className="truncate">alex.doe@example.com</span>
          </li>
          <li className="flex items-center justify-between">
            <span className="text-muted-foreground flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Plano
            </span>
            <Button variant="link" className="p-0 h-auto text-accent-foreground">
              Ver Detalhes
            </Button>
          </li>
        </ul>
      </CardContent>
    </Card>
  );
}
