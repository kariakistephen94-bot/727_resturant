
"use client"

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles, Send, Loader2, Utensils, Flame, GlassWater } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Card } from '@/components/ui/card'
import { personalizedBBQRecommendations, type PersonalizedBBQRecommendationsOutput } from '@/ai/flows/personalized-bbq-recommendations'

export function TasteTool() {
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [recommendation, setRecommendation] = useState<PersonalizedBBQRecommendationsOutput | null>(null)

  const handleGetRecommendation = async () => {
    if (!input.trim()) return
    setLoading(true)
    try {
      const result = await personalizedBBQRecommendations({
        currentCravings: input,
        orderHistory: ['Grilled Fish with Fries & Jollof', 'Isi Ewu']
      })
      setRecommendation(result)
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-full max-w-4xl mx-auto">
      <Card className="glass-card p-6 md:p-10 rounded-[2.5rem] shadow-2xl">
        <div className="grid md:grid-cols-2 gap-10">
          <div className="space-y-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-primary" />
              </div>
              <h3 className="text-2xl font-bold">Talk to the Sommelier</h3>
            </div>
            <p className="text-muted-foreground">
              Describe your mood or what you're craving. For example: "I want something super spicy but light, maybe with fish."
            </p>
            <div className="relative">
              <Textarea
                placeholder="Type your cravings here..."
                className="min-h-[150px] bg-background border-input rounded-2xl p-4 text-lg focus:ring-primary"
                value={input}
                onChange={(e) => setInput(e.target.value)}
              />
            </div>
            <Button 
              className="w-full h-14 rounded-full bg-primary hover:bg-primary/90 text-white font-bold text-lg"
              onClick={handleGetRecommendation}
              disabled={loading || !input.trim()}
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  CONSULTING THE 724 KITCHEN...
                </>
              ) : (
                <>
                  <Send className="w-5 h-5 mr-2" />
                  GET MY PAIRING
                </>
              )}
            </Button>
          </div>

          <div className="relative min-h-[300px] flex items-center justify-center">
            <AnimatePresence mode="wait">
              {recommendation ? (
                <motion.div
                  key="result"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="w-full space-y-6"
                >
                  <div className="bg-primary/10 border border-primary/20 rounded-3xl p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-primary font-bold uppercase tracking-wider">The Sommelier Suggests</h4>
                      <div className="bg-primary text-white text-[10px] px-2 py-0.5 rounded-full font-bold">
                        {recommendation.recommendedSpiceLevel}
                      </div>
                    </div>
                    <p className="text-3xl font-headline font-bold mb-2">
                      {recommendation.recommendedMeal}
                    </p>
                    <p className="text-muted-foreground text-sm leading-relaxed mb-6">
                      {recommendation.reasoning}
                    </p>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-muted rounded-2xl p-4 border border-border">
                        <div className="flex items-center gap-2 mb-1">
                          <GlassWater className="w-4 h-4 text-secondary" />
                          <span className="text-[10px] font-bold text-muted-foreground uppercase">Perfect Pairing</span>
                        </div>
                        <p className="text-xs font-bold">{recommendation.pairingSuggestion}</p>
                      </div>
                      <div className="bg-muted rounded-2xl p-4 border border-border">
                        <div className="flex items-center gap-2 mb-1">
                          <Flame className="w-4 h-4 text-primary" />
                          <span className="text-[10px] font-bold text-muted-foreground uppercase">Heat Level</span>
                        </div>
                        <p className="text-xs font-bold">{recommendation.recommendedSpiceLevel}</p>
                      </div>
                    </div>
                  </div>
                  <Button variant="link" className="text-primary w-full" onClick={() => setRecommendation(null)}>
                    Try another craving
                  </Button>
                </motion.div>
              ) : (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center text-muted-foreground flex flex-col items-center"
                >
                  <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-4 border border-border">
                    <Utensils className="w-8 h-8 opacity-20" />
                  </div>
                  <p>Your perfect 724 plate <br />starts with a craving.</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </Card>
    </div>
  )
}
