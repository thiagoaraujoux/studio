
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { HeartPulse, UserCheck } from "lucide-react";

const quizQuestions = [
  {
    id: "q1",
    question: "Qual é o seu principal objetivo agora?",
    options: [
      { value: "A", label: "Emagrecimento e definição muscular." },
      { value: "B", label: "Ganho de massa e força." },
      { value: "C", label: "Melhorar a saúde geral, com mais energia e bem-estar." },
    ],
  },
  {
    id: "q2",
    question: "Como você se sente em relação a treinos físicos?",
    options: [
      { value: "A", label: "Estou começando do zero. Preciso de orientações simples e consistentes." },
      { value: "B", label: "Já tenho alguma experiência, mas preciso de uma rotina organizada e novos desafios." },
      { value: "C", label: "Sou avançado e busco treinos intensos e específicos para alta performance." },
    ],
  },
  {
    id: "q3",
    question: "Onde você planeja se exercitar?",
    options: [
      { value: "A", label: "Principalmente em casa, com pouco ou nenhum equipamento." },
      { value: "B", label: "Tenho acesso a uma academia." },
      { value: "C", label: "Quero flexibilidade para treinar em casa ou na academia." },
    ],
  },
  {
    id: "q4",
    question: "Em relação à alimentação, qual é o seu principal desafio?",
    options: [
      { value: "A", label: "Ter ideias de refeições saudáveis e fáceis de preparar." },
      { value: "B", label: "Organizar meu cardápio e fazer compras de forma mais eficiente." },
      { value: "C", label: "Aprender sobre nutrição para alinhar com meu objetivo." },
    ],
  },
  {
    id: "q5",
    question: "O que você acha mais importante para manter a motivação?",
    options: [
      { value: "A", label: "Ter uma rotina de exercícios e refeições já prontas." },
      { value: "B", label: "Sentir que estou parte de uma comunidade de apoio e que posso trocar experiências." },
      { value: "C", label: "Poder ver meu progresso e receber reconhecimentos por isso (conquistas, pontos)." },
    ],
  },
];

const results = {
  A: {
    title: "Plano Semanal (Starter)",
    message: "Com base nas suas respostas, sugerimos começar com o nosso Plano Semanal. Ele oferece treinos simples para iniciantes, cardápios práticos e o acompanhamento necessário para criar novos hábitos.",
  },
  B: {
    title: "Plano Mensal (Padrão)",
    message: "Sua jornada já está em andamento! O Plano Mensal é ideal para você. Tenha acesso completo à nossa biblioteca de treinos e receitas, e receba novos conteúdos toda semana para manter o progresso constante.",
  },
  C: {
    title: "Plano Premium",
    message: "Você busca o melhor! O Plano Premium foi feito para quem quer ir além. Desbloqueie todo o nosso conteúdo, entre na comunidade exclusiva e tenha acesso a bônus que te levarão ao próximo nível.",
  },
};

export default function QuizPage() {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [result, setResult] = useState<{ title: string; message: string } | null>(null);
  const router = useRouter();

  const handleAnswerChange = (questionId: string, value: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  };

  const calculateResult = () => {
    const counts: Record<string, number> = { A: 0, B: 0, C: 0 };
    Object.values(answers).forEach((answer) => {
      counts[answer]++;
    });

    let majority = "A";
    if (counts.B > counts[majority]) {
      majority = "B";
    }
    if (counts.C > counts[majority]) {
      majority = "C";
    }

    setResult(results[majority as keyof typeof results]);
  };
  
  const allQuestionsAnswered = Object.keys(answers).length === quizQuestions.length;

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4 sm:p-6 lg:p-8">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
           <div className="flex items-center justify-center gap-2 mb-2">
            <HeartPulse className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold tracking-tight text-foreground">
              Companheiro Vitalize
            </h1>
          </div>
          <CardTitle className="text-2xl flex items-center justify-center gap-2">
            <UserCheck className="h-6 w-6 text-primary" />
            Quiz de Primeiro Atendimento
            </CardTitle>
          <CardDescription>
            Responda para podermos te conhecer melhor e sugerir a jornada ideal para você.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-8">
          {quizQuestions.map((q, index) => (
            <div key={q.id}>
              <p className="font-semibold mb-4">{index + 1}. {q.question}</p>
              <RadioGroup
                value={answers[q.id]}
                onValueChange={(value) => handleAnswerChange(q.id, value)}
                className="space-y-2"
              >
                {q.options.map((opt) => (
                  <div key={opt.value} className="flex items-center space-x-2">
                    <RadioGroupItem value={opt.value} id={`${q.id}-${opt.value}`} />
                    <Label htmlFor={`${q.id}-${opt.value}`} className="font-normal">{opt.label}</Label>
                  </div>
                ))}
              </RadioGroup>
            </div>
          ))}
        </CardContent>
        <CardFooter>
          <Button
            className="w-full"
            onClick={calculateResult}
            disabled={!allQuestionsAnswered}
          >
            Ver meu plano ideal
          </Button>
        </CardFooter>
      </Card>

      <AlertDialog open={!!result} onOpenChange={() => setResult(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{result?.title}</AlertDialogTitle>
            <AlertDialogDescription>
              {result?.message}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => router.push('/login')}>
              Começar Agora!
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
