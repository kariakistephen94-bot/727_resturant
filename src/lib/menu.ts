export interface MenuItem {
  id: number;
  name: string;
  category: string;
  price: number;
  rating: number;
  desc: string;
  image: string;
  badge: string | null;
}

export const menuItems: MenuItem[] = [
  { id: 1, name: 'Grilled Fish with Fries & Jollof', category: 'Grills', price: 7500, rating: 4.8, desc: 'Char-grilled whole croaker served with golden fries and smoky party jollof rice.', image: 'catfish-bbq', badge: 'Best Seller' },
  { id: 2, name: 'Pounded Yam & Egusi', category: 'Soups & Specials', price: 4500, rating: 4.7, desc: 'Soft pounded yam with rich egusi soup and assorted meat.', image: 'beef-bbq', badge: 'Popular' },
  { id: 3, name: 'Isi Ewu', category: 'Soups & Specials', price: 6000, rating: 4.8, desc: 'Spicy goat-head delicacy in rich palm-oil pepper sauce — a 724 classic.', image: 'asun-special', badge: 'House Special' },
  { id: 4, name: 'Asun (Spicy Grilled Goat)', category: 'Grills', price: 4000, rating: 4.7, desc: 'Smoky goat meat tossed with fiery scotch bonnet peppers and onions.', image: 'asun-special', badge: null },
  { id: 5, name: 'Peppered Grilled Chicken', category: 'Grills', price: 5000, rating: 4.6, desc: 'Flame-grilled chicken quarters doused in our signature pepper sauce.', image: 'bbq-chicken', badge: null },
  { id: 6, name: 'Grilled Turkey Wings', category: 'Grills', price: 5500, rating: 4.6, desc: 'Massive turkey wings grilled till golden and served spicy.', image: 'turkey-bbq', badge: null },
  { id: 7, name: 'Catfish Pepper Soup', category: 'Soups & Specials', price: 4500, rating: 4.5, desc: 'Fresh catfish simmered in a hot native spice broth.', image: 'catfish-bbq', badge: null },
  { id: 8, name: 'Chapman (Big Jug)', category: 'Bar & Drinks', price: 3500, rating: 4.9, desc: 'House-mixed Chapman served ice-cold — perfect with any grill.', image: 'vibe-2', badge: null },
];

export const menuCategories = ['All', 'Grills', 'Soups & Specials', 'Bar & Drinks'] as const;

export type MenuCategory = (typeof menuCategories)[number];

export const featuredCategories = [
  { name: 'Grilled Fish', menuCategory: 'Grills' as const, image: 'catfish-bbq' },
  { name: 'Pounded Yam & Egusi', menuCategory: 'Soups & Specials' as const, image: 'beef-bbq' },
  { name: 'Isi Ewu', menuCategory: 'Soups & Specials' as const, image: 'asun-special' },
  { name: 'Bar & Drinks', menuCategory: 'Bar & Drinks' as const, image: 'vibe-2' },
];

export function getCategoryItemCount(category: string): number {
  return menuItems.filter((item) => item.category === category).length;
}

export function isMenuCategory(value: string | null): value is MenuCategory {
  return menuCategories.includes(value as MenuCategory);
}
