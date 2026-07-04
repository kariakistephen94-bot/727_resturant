'use server';
/**
 * @fileOverview An AI-powered tool that acts as a flavor sommelier for 724 Restaurant And Bar.
 *
 * - personalizedBBQRecommendations - A function that recommends personalized meal pairings and spice levels.
 * - PersonalizedBBQRecommendationsInput - The input type for the personalizedBBQRecommendations function.
 * - PersonalizedBBQRecommendationsOutput - The return type for the personalizedBBQRecommendations function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const PersonalizedBBQRecommendationsInputSchema = z.object({
  orderHistory: z
    .array(z.string())
    .optional()
    .describe('A list of the user\'s past ordered items.'),
  currentCravings: z
    .string()
    .optional()
    .describe('A description of the user\'s current food preferences or cravings.'),
});
export type PersonalizedBBQRecommendationsInput = z.infer<
  typeof PersonalizedBBQRecommendationsInputSchema
>;

const PersonalizedBBQRecommendationsOutputSchema = z.object({
  recommendedMeal: z
    .string()
    .describe('The name of the recommended dish from 724 Restaurant And Bar.'),
  recommendedSpiceLevel: z
    .enum(['Mild', 'Medium', 'Hot', '724 Fire'])
    .describe('The recommended spice level for the dish.'),
  pairingSuggestion: z
    .string()
    .describe('A suggestion for a drink or side dish that pairs well with the recommended meal.'),
  reasoning: z
    .string()
    .describe('An explanation for why this particular recommendation was made.'),
});
export type PersonalizedBBQRecommendationsOutput = z.infer<
  typeof PersonalizedBBQRecommendationsOutputSchema
>;

export async function personalizedBBQRecommendations(
  input: PersonalizedBBQRecommendationsInput
): Promise<PersonalizedBBQRecommendationsOutput> {
  return personalizedBBQRecommendationsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'personalizedBBQRecommendationsPrompt',
  input: {schema: PersonalizedBBQRecommendationsInputSchema},
  output: {schema: PersonalizedBBQRecommendationsOutputSchema},
  prompt:
    `You are the 724 Taste Guide, a flavor sommelier for 724 Restaurant And Bar, a 24/7 restaurant and bar on NERDC Road, Agidingbi, Ikeja, Lagos. ` +
    `Your task is to recommend a personalized meal pairing, including a main dish, a spice level, and a drink or side pairing, based on the user's provided information.

` +
    `Consider the following specialties from 724 Restaurant And Bar:
` +
    `- Grilled Fish with Fries & Jollof Rice
` +
    `- Pounded Yam & Egusi Soup
` +
    `- Isi Ewu (spicy goat-head delicacy)
` +
    `- Asun (spicy grilled goat meat)
` +
    `- Peppered Grilled Chicken
` +
    `- Grilled Turkey Wings
` +
    `- Catfish Pepper Soup
` +
    `- Chilled drinks, Chapman and cocktails from the bar

` +
    `Based on the user's order history and current cravings, provide a tailored recommendation.
` +
    `If no specific information is provided, make a general recommendation that embodies the 724 vibe: good food, cold drinks and good music, open 24/7.

` +
    `Order History: {{#each orderHistory}}{{{this}}}, {{/each}}
` +
    `Current Cravings: {{{currentCravings}}}`,
});

const personalizedBBQRecommendationsFlow = ai.defineFlow(
  {
    name: 'personalizedBBQRecommendationsFlow',
    inputSchema: PersonalizedBBQRecommendationsInputSchema,
    outputSchema: PersonalizedBBQRecommendationsOutputSchema,
  },
  async (input) => {
    const {output} = await prompt(input);
    return output!;
  }
);
