"use client"

import { useEffect, useMemo, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { Flame, Music, ArrowRight, Star, Plus, Search, Loader2, ShoppingCart, ChevronLeft, ChevronRight, Utensils, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { PlaceHolderImages } from '@/lib/placeholder-images'
import { defaultSiteSettings, type SiteSettings } from '@/lib/site-settings'
import { TableBanner } from '@/components/table/TableBanner'
import { useCart } from '@/context/cart-context'
import { useToast } from '@/hooks/use-toast'
import { formatNaira } from '@/lib/format'

interface Addon {
  name: string;
  price: number;
}

interface MenuItem {
  id: number;
  name: string;
  price: number;
  rating: number;
  desc: string;
  image: string;
  badge: string | null;
  addons: Addon[] | null;
}

const stats = [
  { label: 'Google Rating', value: '4.1★' },
  { label: 'Customer Reviews', value: '260+' },
  { label: 'Always Open', value: '24/7' },
  { label: 'Per Person', value: '₦1–10k' },
]

const PAGE_SIZE = 10;

// Categories are derived from the menu item names (no backend column needed).
// Each rule maps a set of keywords to a category label; the first match wins.
// Anything that doesn't match a rule falls back to "Kitchen".
const DEFAULT_CATEGORY = 'Kitchen'

const CATEGORY_RULES: { name: string; match: RegExp }[] = [
  { name: 'Soups & Specials', match: /pounded|egusi|swallow|amala|semo|eba|fufu|soup|isi ewu|isiewu|nkwobi|pepper ?soup/i },
  { name: 'Grills', match: /grill|fish|croaker|catfish|tilapia|asun|suya|bbq|barbecue|chicken|turkey/i },
  { name: 'Bar & Drinks', match: /cocktail|mocktail|milkshake|shake|drink|juice|water|soda|wine|beer|stout|smoothie|zobo|chapman|malt|palm ?wine/i },
]

// Display order for the toggle pills (only those with dishes are shown).
const CATEGORY_ORDER = ['Grills', 'Soups & Specials', 'Bar & Drinks', DEFAULT_CATEGORY]

function getCategory(name: string): string {
  const rule = CATEGORY_RULES.find((r) => r.match.test(name))
  return rule ? rule.name : DEFAULT_CATEGORY
}

export default function Home() {
  const heroImage = PlaceHolderImages.find(img => img.id === 'hero-bg')
  const [menuItems, setMenuItems] = useState<MenuItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [page, setPage] = useState(1)
  const [expandedDescId, setExpandedDescId] = useState<number | null>(null)
  const [siteSettings, setSiteSettings] = useState<SiteSettings>(defaultSiteSettings)
  const [addonItem, setAddonItem] = useState<MenuItem | null>(null)
  const [selectedAddons, setSelectedAddons] = useState<Record<number, boolean>>({})
  const { addItem, itemCount, subtotal } = useCart()
  const { toast } = useToast()

  const addToCart = (item: MenuItem, addons: Addon[] = []) => {
    const extrasTotal = addons.reduce((sum, a) => sum + a.price, 0);
    addItem({
      id: item.id,
      name: item.name,
      price: item.price + extrasTotal,
      basePrice: item.price,
      image: item.image,
      addons,
    });
    const extrasNote = addons.length ? ` (+${addons.length} extra${addons.length > 1 ? 's' : ''})` : '';
    toast({
      title: 'Added to cart',
      description: `${item.name}${extrasNote} — ${formatNaira(item.price + extrasTotal)}`,
    });
  };

  const handleAddToCart = (item: MenuItem) => {
    // If the dish has optional extras, let the customer choose them first.
    if (Array.isArray(item.addons) && item.addons.length > 0) {
      setAddonItem(item);
      setSelectedAddons({});
      return;
    }
    addToCart(item);
  };

  const chosenAddons = addonItem?.addons
    ? addonItem.addons.filter((_, i) => selectedAddons[i])
    : [];
  const addonDialogTotal = addonItem
    ? addonItem.price + chosenAddons.reduce((sum, a) => sum + a.price, 0)
    : 0;

  const confirmAddons = () => {
    if (!addonItem) return;
    addToCart(addonItem, chosenAddons);
    setAddonItem(null);
    setSelectedAddons({});
  };

  useEffect(() => {
    const fetchItems = async () => {
      setIsLoading(true)
      try {
        const response = await fetch('/api/menu-items')
        const data = await response.json()
        setMenuItems(data)
      } catch {
        setMenuItems([])
      }
      setIsLoading(false)
    }
    fetchItems()
  }, [])

  useEffect(() => {
    const loadSiteSettings = async () => {
      try {
        const response = await fetch('/api/site-settings')
        const data = await response.json()
        setSiteSettings(data ?? defaultSiteSettings)
      } catch {
        setSiteSettings(defaultSiteSettings)
      }
    }

    loadSiteSettings()
  }, [])

  // Build the list of category pills from the dishes we actually have,
  // keeping a sensible order and always leading with "All".
  const categories = useMemo(() => {
    const present = new Set(menuItems.map((item) => getCategory(item.name)))
    const ordered = CATEGORY_ORDER.filter((name) => present.has(name))
    return ['All', ...ordered]
  }, [menuItems])

  const filteredItems = useMemo(
    () =>
      menuItems.filter((item) => {
        const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase())
        const matchesCategory = selectedCategory === 'All' || getCategory(item.name) === selectedCategory
        return matchesSearch && matchesCategory
      }),
    [menuItems, searchQuery, selectedCategory]
  )

  const totalPages = Math.max(1, Math.ceil(filteredItems.length / PAGE_SIZE))
  const showPagination = filteredItems.length > PAGE_SIZE

  // Keep the current page valid when the filter/result set changes.
  useEffect(() => {
    setPage(1)
  }, [searchQuery, selectedCategory])

  // If the active category disappears (e.g. data reloads), fall back to "All".
  useEffect(() => {
    if (!categories.includes(selectedCategory)) {
      setSelectedCategory('All')
    }
  }, [categories, selectedCategory])

  const currentPage = Math.min(page, totalPages)
  const pagedItems = filteredItems.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)

  const goToPage = (next: number) => {
    setPage(Math.min(Math.max(1, next), totalPages))
    document.getElementById('menu')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <div className="overflow-hidden">
  {/* Hero Section */}
  <section className="relative h-screen min-h-[520px] md:min-h-[700px] flex items-center justify-center">
    <div className="absolute inset-0">
      <Image
        src={heroImage?.imageUrl || ''}
        alt="724 Restaurant And Bar"
        fill
        className="object-cover brightness-[0.6]"
        priority
        data-ai-hint="grilled fish restaurant bar"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/30 to-black/75" />
    </div>

    <div className="relative z-10 text-center max-w-4xl px-4 pt-24 md:pt-32">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="max-w-5xl mx-auto"
      >
        <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-[5.5rem] font-headline font-bold mb-6 tracking-apple text-white leading-[1.02]">
          {siteSettings.siteTitle}
        </h1>
        <p className="text-lg md:text-xl lg:text-2xl text-white/75 mb-11 max-w-2xl mx-auto leading-relaxed font-light tracking-tight">
          {siteSettings.siteDescription}
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 mb-14">
          <Button asChild size="lg" className="rounded-full bg-primary hover:bg-primary/90 text-white h-[3.25rem] px-9 text-[1.05rem] font-semibold w-full sm:w-auto transition-all ease-apple hover:scale-[1.02] active:scale-100">
            <Link href="/#menu">Order Now</Link>
          </Button>
          <Button asChild variant="ghost" size="lg" className="rounded-full bg-white/10 text-white hover:bg-white/20 hover:text-white h-[3.25rem] px-9 text-[1.05rem] font-semibold w-full sm:w-auto backdrop-blur-md transition-all ease-apple">
            <Link href="/#menu">Explore Menu</Link>
          </Button>
        </div>

        <p className="text-[11px] sm:text-xs md:text-sm tracking-[0.28em] font-medium text-white/55 uppercase">
          Dine-In <span className="mx-2 sm:mx-3 text-accent">•</span> Takeaway <span className="mx-2 sm:mx-3 text-accent">•</span> Delivery
        </p>
      </motion.div>
    </div>
  </section>

  {/* Full Menu */}
  <section id="menu" className="py-16 md:py-24 px-4 bg-background scroll-mt-24">
    <div className="max-w-7xl mx-auto">
      <TableBanner />
      <div className="text-center mb-10 md:mb-16">
        <p className="text-primary font-semibold text-xs md:text-sm tracking-[0.2em] uppercase mb-3">Our Specialties</p>
        <h2 className="text-4xl md:text-6xl font-headline font-bold tracking-apple">The 724 Menu</h2>
        <p className="text-base md:text-lg text-muted-foreground max-w-xl mx-auto mt-4 leading-relaxed">
          Grilled fish, Naija classics and chilled drinks prepared fresh on NERDC Road, Agidingbi, Ikeja.
        </p>
      </div>

      {/* Search */}
      <div className="mb-6 md:mb-10">
        <div className="max-w-2xl mx-auto relative group">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
          <input
            placeholder="Search for Grilled Fish, Egusi, Isi Ewu..."
            className="h-12 md:h-14 w-full pl-12 pr-4 rounded-full bg-card border border-border text-base md:text-lg shadow-soft outline-none transition-all ease-apple focus:border-primary/40 focus:shadow-card"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        {!isLoading && (
          <p className="text-center text-xs md:text-sm text-muted-foreground mt-4">
            {filteredItems.length} {filteredItems.length === 1 ? 'dish' : 'dishes'}
            {searchQuery ? ` matching “${searchQuery}”` : ' on the menu'}
            {selectedCategory !== 'All' ? ` in ${selectedCategory}` : ''}
          </p>
        )}
      </div>

      {/* Category toggle — derived from the menu names, no backend needed */}
      {!isLoading && categories.length > 1 && (
        <div className="mb-8 md:mb-10 -mx-4 px-4 sm:mx-0 sm:px-0">
          <div className="flex gap-2 md:gap-3 overflow-x-auto no-scrollbar pb-1 sm:flex-wrap sm:justify-center">
            {categories.map((category) => {
              const isActive = category === selectedCategory
              return (
                <button
                  key={category}
                  type="button"
                  onClick={() => setSelectedCategory(category)}
                  aria-pressed={isActive}
                  className={`shrink-0 rounded-full px-5 h-10 text-sm md:text-base font-semibold border transition-all ease-apple ${
                    isActive
                      ? 'bg-foreground text-background border-foreground'
                      : 'bg-card border-border text-muted-foreground hover:text-foreground hover:border-foreground/30'
                  }`}
                >
                  {category}
                </button>
              )
            })}
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-12 h-12 animate-spin text-primary" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5 md:gap-8">
            <AnimatePresence mode="popLayout">
              {pagedItems.map((item, idx) => {
                const imageValue = item.image || '';
                const imageSrc = imageValue.startsWith('http') || imageValue.startsWith('data:')
                  ? imageValue
                  : PlaceHolderImages.find(i => i.id === imageValue)?.imageUrl || PlaceHolderImages[0]?.imageUrl || '';
                const isExpanded = expandedDescId === item.id;
                const desc = item.desc || '';
                const shouldTruncate = desc.length > 35;
                const displayDesc = (isExpanded || !shouldTruncate) ? desc : desc.slice(0, 35) + '...';
                return (
                  <motion.div
                    key={item.id}
                    layout
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ delay: Math.min(idx, 8) * 0.05 }}
                  >
                    <div className="group rounded-3xl overflow-hidden flex flex-col h-full bg-card border border-border shadow-soft hover:shadow-card hover:-translate-y-1 transition-all duration-300 ease-apple">
                      <div className="relative aspect-[4/5] overflow-hidden bg-muted">
                        <Image
                          src={imageSrc}
                          alt={item.name}
                          fill
                          sizes="(max-width: 1024px) 50vw, 25vw"
                          className="object-cover group-hover:scale-[1.04] transition-transform duration-700 ease-apple"
                        />
                        {item.badge && (
                          <div className="absolute top-2.5 left-2.5 md:top-4 md:left-4">
                            <Badge className="bg-primary text-white border-none px-2.5 py-0.5 text-[10px] md:text-xs font-bold shadow-md">
                              {item.badge}
                            </Badge>
                          </div>
                        )}
                        {item.rating ? (
                          <div className="absolute top-2.5 right-2.5 md:top-4 md:right-4 flex items-center gap-1 rounded-full bg-white/90 backdrop-blur px-2 py-0.5 shadow-sm">
                            <Star className="w-3 h-3 text-amber-500 fill-current" />
                            <span className="text-[10px] md:text-xs font-bold text-slate-800">{item.rating}</span>
                          </div>
                        ) : null}
                      </div>
                      <div className="p-3.5 md:p-6 flex-1 flex flex-col">
                        <h3 className="text-base md:text-xl font-bold mb-1.5 leading-tight line-clamp-1">{item.name}</h3>
                        <p
                          className={`text-xs md:text-sm text-muted-foreground ${
                            isExpanded ? '' : 'line-clamp-1'
                          }`}
                        >
                          {displayDesc}
                        </p>

                        {shouldTruncate && (
                          <button
                            onClick={() => setExpandedDescId(isExpanded ? null : item.id)}
                            className="block mb-1 mt-0 text-primary font-semibold text-xs hover:underline text-left"
                          >
                            {isExpanded ? 'See less' : 'See more'}
                          </button>
                        )}
                        <div className="mt-auto flex items-center justify-between gap-2">
                          <div className="min-w-0">
                            {/* <span className="text-[10px] md:text-xs text-muted-foreground block font-bold uppercase tracking-wide">Price</span> */}
                            <span className="text-base md:text-xl font-bold">{formatNaira(item.price)}</span>
                            {Array.isArray(item.addons) && item.addons.length > 0 && (
                              <span className="block text-[10px] md:text-xs text-primary font-semibold">+ extras available</span>
                            )}
                          </div>
                          <Button
                            type="button"
                            onClick={() => handleAddToCart(item)}
                            className="w-11 h-11 md:w-12 md:h-12 rounded-full bg-primary hover:bg-primary/90 text-white p-0 shrink-0 transition-all ease-apple hover:scale-105 active:scale-95"
                            aria-label={`Add ${item.name} to cart`}
                          >
                            <Plus className="w-5 h-5 md:w-6 md:h-6" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>

          {filteredItems.length === 0 && (
            <div className="text-center py-16">
              <Utensils className="w-16 h-16 text-muted-foreground/20 mx-auto mb-4" />
              <h3 className="text-2xl font-bold">No dishes found!</h3>
              <p className="text-muted-foreground">Try a different search.</p>
            </div>
          )}

          {/* Pagination — only when there are more than 10 dishes */}
          {showPagination && (
            <div className="mt-10 flex items-center justify-center gap-1.5 sm:gap-2">
              <Button
                variant="outline"
                size="icon"
                className="rounded-full h-10 w-10 shrink-0"
                onClick={() => goToPage(currentPage - 1)}
                disabled={currentPage === 1}
                aria-label="Previous page"
              >
                <ChevronLeft className="w-5 h-5" />
              </Button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  onClick={() => goToPage(p)}
                  className={`h-10 w-10 rounded-full text-sm font-bold transition-colors ${
                    p === currentPage
                      ? 'bg-primary text-white shadow-lg shadow-primary/20'
                      : 'bg-muted text-muted-foreground hover:bg-muted/70'
                  }`}
                  aria-label={`Page ${p}`}
                  aria-current={p === currentPage ? 'page' : undefined}
                >
                  {p}
                </button>
              ))}
              <Button
                variant="outline"
                size="icon"
                className="rounded-full h-10 w-10 shrink-0"
                onClick={() => goToPage(currentPage + 1)}
                disabled={currentPage === totalPages}
                aria-label="Next page"
              >
                <ChevronRight className="w-5 h-5" />
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  </section>

  {/* Why 724 Section */}
  <section className="py-24 md:py-32 px-4 bg-muted/40">
    <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-14 md:gap-20 items-center">
      <div className="relative aspect-square rounded-[2rem] overflow-hidden shadow-card">
        <Image
          src={PlaceHolderImages.find(i => i.id === 'vibe-1')?.imageUrl || ''}
          alt="Inside 724 Restaurant And Bar"
          fill
          className="object-cover"
        />
      </div>

      <div>
        <h2 className="text-4xl md:text-6xl font-headline font-bold mb-10 tracking-apple leading-[1.05]">Why Lagos Loves <br /><span className="text-primary font-body not-italic">724 Restaurant &amp; Bar</span></h2>

        <div className="space-y-7">
          {[
            { icon: Clock, title: "Open 24 Hours, Every Day", desc: "Day parties, late nights or 6am cravings the kitchen and bar at 724 never close." },
            { icon: Flame, title: "Grilled Fish Worth the Trip", desc: "Our char-grilled fish with fries or jollof is the plate regulars swear by alongside pounded yam & egusi and spicy isi ewu." },
            { icon: Music, title: "Good Music, Better Vibes", desc: "A proper chilling spot in Agidingbi cold drinks, nice music, friendly staff and space to breathe, with greenery inside." }
          ].map((item, i) => (
            <div key={i} className="flex gap-5">
              <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
                <item.icon className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h4 className="text-lg md:text-xl font-bold mb-1.5 tracking-tight">{item.title}</h4>
                <p className="text-muted-foreground leading-relaxed">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  </section>

  {/* Stats Counter */}
  <section className="py-20 md:py-24 px-4 bg-background">
    <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-10 text-center">
      {stats.map((stat, i) => (
        <div key={i}>
          <div className="text-4xl md:text-6xl font-bold text-foreground mb-2 font-headline tracking-apple">{stat.value}</div>
          <div className="text-xs md:text-sm uppercase tracking-[0.15em] text-muted-foreground font-medium">{stat.label}</div>
        </div>
      ))}
    </div>
  </section>

  {/* Testimonials */}
  <section className="py-24 md:py-32 px-4">
    <div className="max-w-7xl mx-auto">
      <div className="text-center mb-14 md:mb-20">
         <p className="text-primary font-semibold text-xs md:text-sm tracking-[0.2em] uppercase mb-3">4.1★ · 263 Google Reviews</p>
         <h2 className="text-4xl md:text-6xl font-headline font-bold tracking-apple">What customers say</h2>
      </div>

      <div className="flex md:grid md:grid-cols-3 gap-5 overflow-x-auto no-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0 snap-x snap-mandatory">
         {[
           { name: "Stephen Mendoza", role: "Google Review", comment: "Top-notch bar and restaurant! The grilled fish is a must-try. Nice music, friendly staff, and affordable prices." },
           { name: "Edu Edward", role: "Google Review", comment: "I liked how easy everything was — from ordering to getting served. No stress, just good food and a comfortable space." },
           { name: "Ofuma Agali", role: "Local Guide", comment: "With Afrika Shrine nearby, this place is always busy. Inside is cool with space and greenery. Range of drinks and chops available." }
         ].map((review, i) => (
           <div key={i} className="bg-card border border-border shadow-soft p-7 md:p-8 rounded-3xl min-w-[280px] md:min-w-0 flex-shrink-0 snap-start flex flex-col">
             <div className="flex text-accent mb-5 gap-0.5">
               {[...Array(5)].map((_, j) => <Star key={j} className="w-4 h-4 fill-current" />)}
             </div>
             <p className="text-lg leading-relaxed mb-6 flex-1 tracking-tight">"{review.comment}"</p>
             <div>
               <p className="font-bold tracking-tight">{review.name}</p>
               <p className="text-sm text-muted-foreground">{review.role}</p>
             </div>
           </div>
         ))}
      </div>
    </div>
  </section>

  {/* Call to Action */}
  <section className="py-20 md:py-28 px-4">
    <div className="max-w-4xl mx-auto">
      <div className="rounded-[2rem] md:rounded-[2.5rem] p-10 md:p-20 text-center bg-foreground text-background">
        <div className="space-y-7">
          <h2 className="text-4xl md:text-6xl lg:text-7xl font-headline font-bold leading-[1.04] tracking-apple">
            Hungry? <br />
            <span className="text-primary font-body not-italic">Order now.</span>
          </h2>

          <p className="text-base md:text-lg text-background/70 max-w-md mx-auto">
            Grilled fish, Naija classics and chilled drinks any hour, any day.
          </p>

          <Button
            asChild
            size="lg"
            className="rounded-full bg-primary hover:bg-primary/90 text-white h-12 md:h-14 px-8 md:px-10 text-base md:text-lg font-semibold transition-all ease-apple hover:scale-[1.03] active:scale-100"
          >
            <Link href="/#menu">Place Order</Link>
          </Button>
        </div>
      </div>
    </div>
  </section>

  {/* Extras / add-ons picker */}
  <Dialog open={!!addonItem} onOpenChange={(open) => { if (!open) { setAddonItem(null); setSelectedAddons({}); } }}>
    <DialogContent className="max-w-md">
      <DialogHeader>
        <DialogTitle>{addonItem?.name}</DialogTitle>
        <DialogDescription>
          Add any extras you&apos;d like. Base price {addonItem ? formatNaira(addonItem.price) : ''}.
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-2 max-h-[50vh] overflow-y-auto">
        {addonItem?.addons?.map((addon, index) => (
          <label
            key={index}
            htmlFor={`addon-${index}`}
            className="flex items-center justify-between gap-3 rounded-xl border border-border p-3 cursor-pointer hover:border-primary/40 transition-colors"
          >
            <div className="flex items-center gap-3">
              <Checkbox
                id={`addon-${index}`}
                checked={!!selectedAddons[index]}
                onCheckedChange={(checked) =>
                  setSelectedAddons((prev) => ({ ...prev, [index]: checked === true }))
                }
              />
              <span className="font-medium text-sm">{addon.name}</span>
            </div>
            <span className="text-sm font-bold text-primary">+{formatNaira(addon.price)}</span>
          </label>
        ))}
      </div>

      <DialogFooter className="sm:justify-between sm:items-center gap-3">
        <div className="text-sm">
          <span className="text-muted-foreground">Total: </span>
          <span className="font-bold text-lg">{formatNaira(addonDialogTotal)}</span>
        </div>
        <Button onClick={confirmAddons} className="rounded-full bg-primary hover:bg-primary/90 text-white font-bold">
          <Plus className="w-4 h-4 mr-1.5" />
          Add to cart
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>

  {/* Floating cart bar (mobile) */}
  {itemCount > 0 && (
    <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 md:hidden w-[90%] pointer-events-none">
      <Link href="/cart" className="pointer-events-auto">
        <motion.div
          initial={{ y: 100 }}
          animate={{ y: 0 }}
          transition={{ type: 'spring', stiffness: 260, damping: 26 }}
          className="h-16 rounded-full flex items-center justify-between pl-3 pr-6 shadow-lift bg-foreground text-background"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center text-white">
              <ShoppingCart className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] font-semibold opacity-60 uppercase tracking-wide">
                {itemCount} {itemCount === 1 ? 'item' : 'items'}
              </p>
              <p className="font-bold leading-tight">{formatNaira(subtotal)}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-semibold">View Cart</span>
            <ArrowRight className="w-5 h-5" />
          </div>
        </motion.div>
      </Link>
    </div>
  )}
</div>
  )
}
