// This file is machine-generated - edit at your own risk!

'use server';

/**
 * @fileOverview This file defines a Genkit flow for suggesting workout plans based on available equipment.
 *
 * The flow takes available equipment as input and suggests a tailored workout plan.
 *
 * @exports {
 *   suggestWorkoutPlan,
 *   SuggestWorkoutPlanInput,
 *   SuggestWorkoutPlanOutput,
 * }
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestWorkoutPlanInputSchema = z.object({
  equipment: z
    .string()
    .describe(
      'Uma lista separada por vírgulas de equipamentos de treino disponíveis para o usuário.'
    ),
});

export type SuggestWorkoutPlanInput = z.infer<typeof SuggestWorkoutPlanInputSchema>;

const SuggestWorkoutPlanOutputSchema = z.object({
  workoutPlan: z
    .string()
    .describe(
      'Um plano de treino adaptado ao equipamento disponível do usuário, com exercícios, séries e repetições.'
    ),
});

export type SuggestWorkoutPlanOutput = z.infer<typeof SuggestWorkoutPlanOutputSchema>;

export async function suggestWorkoutPlan(input: SuggestWorkoutPlanInput): Promise<SuggestWorkoutPlanOutput> {
  return suggestWorkoutPlanFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestWorkoutPlanPrompt',
  input: {schema: SuggestWorkoutPlanInputSchema},
  output: {schema: SuggestWorkoutPlanOutputSchema},
  prompt: `Você é um personal trainer. Um usuário tem o seguinte equipamento disponível: {{{equipment}}}. Sugira um plano de treino que use apenas este equipamento. Certifique-se de incluir exercícios específicos, e o número de séries e repetições para cada exercício. Coloque o plano de treino em formato markdown.`,
});

const suggestWorkoutPlanFlow = ai.defineFlow(
  {
    name: 'suggestWorkoutPlanFlow',
    inputSchema: SuggestWorkoutPlanInputSchema,
    outputSchema: SuggestWorkoutPlanOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
