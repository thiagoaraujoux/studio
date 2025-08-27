'use server';

/**
 * @fileOverview This file defines a Genkit flow for suggesting meal plans based on available ingredients.
 *
 * The flow takes available ingredients as input and suggests a tailored meal plan.
 *
 * @exports {
 *   suggestMealPlan,
 *   SuggestMealPlanInput,
 *   SuggestMealPlanOutput,
 * }
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestMealPlanInputSchema = z.object({
  ingredients: z
    .string()
    .describe(
      'Uma lista separada por vírgulas de ingredientes disponíveis para o usuário.'
    ),
});

export type SuggestMealPlanInput = z.infer<typeof SuggestMealPlanInputSchema>;

const SuggestMealPlanOutputSchema = z.object({
  mealPlan: z
    .string()
    .describe(
      'Um plano de refeições ou receitas adaptado aos ingredientes disponíveis do usuário.'
    ),
});

export type SuggestMealPlanOutput = z.infer<typeof SuggestMealPlanOutputSchema>;

export async function suggestMealPlan(input: SuggestMealPlanInput): Promise<SuggestMealPlanOutput> {
  return suggestMealPlanFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestMealPlanPrompt',
  input: {schema: SuggestMealPlanInputSchema},
  output: {schema: SuggestMealPlanOutputSchema},
  prompt: `Você é um nutricionista e chef de cozinha. Um usuário tem os seguintes ingredientes disponíveis: {{{ingredients}}}. Sugira uma ou mais refeições saudáveis que usem principalmente esses ingredientes. Para cada refeição, liste os ingredientes necessários e forneça um modo de preparo simples. Coloque a sugestão em formato markdown.`,
});

const suggestMealPlanFlow = ai.defineFlow(
  {
    name: 'suggestMealPlanFlow',
    inputSchema: SuggestMealPlanInputSchema,
    outputSchema: SuggestMealPlanOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
