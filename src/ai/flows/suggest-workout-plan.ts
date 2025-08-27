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
      'A comma separated list of workout equipment available to the user.'
    ),
});

export type SuggestWorkoutPlanInput = z.infer<typeof SuggestWorkoutPlanInputSchema>;

const SuggestWorkoutPlanOutputSchema = z.object({
  workoutPlan: z
    .string()
    .describe(
      'A workout plan tailored to the users available equipment, with exercises, sets, and reps.'
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
  prompt: `You are a personal trainer. A user has the following equipment available: {{{equipment}}}. Suggest a workout plan that uses only this equipment. Be sure to include specific exercises, and the number of sets and reps for each exercise. Put the workout plan in markdown format.`,
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
