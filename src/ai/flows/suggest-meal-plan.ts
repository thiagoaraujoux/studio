
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

const MealOptionSchema = z.object({
    recipe: z.string().describe("A receita detalhada da refeição em formato markdown, incluindo modo de preparo."),
    details: z.string().describe("Uma string descrevendo o peso total e as calorias. Ex: 'Peso: 400g, Calorias: 550kcal'"),
});

const SuggestMealPlanOutputSchema = z.object({
  lessCaloricOption: MealOptionSchema.describe("A opção de refeição com menos calorias."),
  moreCaloricOption: MealOptionSchema.describe("A opção de refeição com mais calorias."),
});

export type SuggestMealPlanOutput = z.infer<typeof SuggestMealPlanOutputSchema>;

export async function suggestMealPlan(input: SuggestMealPlanInput): Promise<SuggestMealPlanOutput> {
  return suggestMealPlanFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestMealPlanPrompt',
  input: {schema: SuggestMealPlanInputSchema},
  output: {schema: SuggestMealPlanOutputSchema},
  prompt: `Você é um nutricionista e chef de cozinha. Um usuário tem os seguintes ingredientes disponíveis: {{{ingredients}}}.
  
  Sua tarefa é criar duas versões de uma refeição saudável usando principalmente esses ingredientes:
  1. Uma opção com MENOS calorias, ideal para quem busca emagrecimento.
  2. Uma opção com MAIS calorias, ideal para quem busca hipertrofia, ajustando as quantidades ou adicionando/removendo ingredientes.

  Para cada uma das duas opções, você deve:
  - Fornecer a receita completa em formato markdown, com ingredientes e modo de preparo.
  - Estimar o peso total do prato e o total de calorias.

  Retorne a resposta no formato JSON especificado.`,
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
