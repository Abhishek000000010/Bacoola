export interface SubCategoryItem {
  name: string
  isTitle?: boolean
}

export interface MegaMenuItem {
  name: string
  isHighlight?: boolean
  items: SubCategoryItem[]
}

export type CategoryKey = "women" | "men" | "teen" | "kids"

export interface CategoryData {
  key: CategoryKey
  label: string
  menuItems: MegaMenuItem[]
}

export const navigationData: Record<CategoryKey, CategoryData> = {
  women: {
    key: "women",
    label: "Women",
    menuItems: [
      {
        name: "SALE 40% OFF",
        isHighlight: true,
        items: [
          { name: "All Sale Clothing" },
          { name: "Sale Shoes" },
          { name: "Sale Accessories" },
          { name: "Dresses under $50" },
        ],
      },
      {
        name: "NEW NOW",
        items: [
          { name: "New In Clothing" },
          { name: "New In Shoes" },
          { name: "New In Accessories" },
          { name: "Editorial Campaigns" },
        ],
      },
      {
        name: "PARTY AND EVENTS",
        items: [
          { name: "Cocktail Dresses" },
          { name: "Evening Wear" },
          { name: "Suits & Sets" },
          { name: "Party Shoes" },
        ],
      },
      {
        name: "FOR YOU",
        items: [
          { name: "Best Sellers" },
          { name: "Trending Now" },
          { name: "Minimalist Essentials" },
          { name: "Matching Sets" },
        ],
      },
      {
        name: "CLOTHING",
        items: [
          { name: "Dresses & Jumpsuits" },
          { name: "Shirts & Blouses" },
          { name: "T-Shirts & Tops" },
          { name: "Trousers & Jeans" },
          { name: "Skirts" },
          { name: "Knitwear" },
          { name: "Jackets & Coats" },
          { name: "View All" },
        ],
      },
      {
        name: "SHOES AND ACCESSORIES",
        items: [
          { name: "Sandals & Mules" },
          { name: "Heels" },
          { name: "Sneakers" },
          { name: "Bags" },
          { name: "Jewelry" },
          { name: "Belts & Sunglasses" },
          { name: "View All" },
        ],
      },
      {
        name: "PLUS SIZES",
        items: [
          { name: "Plus Dresses" },
          { name: "Plus Tops" },
          { name: "Plus Denim" },
          { name: "Plus Outerwear" },
        ],
      },
      {
        name: "COLLECTIONS",
        items: [
          { name: "The Linen Collection" },
          { name: "Minimalist Summer" },
          { name: "Premium Tailoring" },
          { name: "Capsule Wardrobe" },
        ],
      },
      {
        name: "FEATURED",
        items: [
          { name: "Lookbook Summer" },
          { name: "Massimo Dutti Edit" },
          { name: "Timeless Essentials" },
        ],
      },
    ],
  },
  men: {
    key: "men",
    label: "Men",
    menuItems: [
      {
        name: "SALE 40% OFF",
        isHighlight: true,
        items: [
          { name: "All Sale Men" },
          { name: "Sale Shirts" },
          { name: "Sale Pants" },
          { name: "Sale Jackets" },
        ],
      },
      {
        name: "NEW NOW",
        items: [
          { name: "New In Men" },
          { name: "New Arrivals" },
          { name: "New Accessories" },
        ],
      },
      {
        name: "VACATIONS",
        items: [
          { name: "Resort Shirts" },
          { name: "Swimwear" },
          { name: "Linen Shirts" },
          { name: "Chino Shorts" },
        ],
      },
      {
        name: "CLOTHING",
        items: [
          { name: "Trousers" },
          { name: "Linen" },
          { name: "Shirts" },
          { name: "Blazers" },
          { name: "Polos" },
          { name: "T-Shirts" },
          { name: "Shorts" },
          { name: "Swimwear" },
          { name: "Short-Sleeved Knitwear" },
          { name: "Jeans" },
        ],
      },
      {
        name: "SUITS",
        items: [
          { name: "Suit Guide" },
          { name: "Blazers" },
          { name: "Trousers" },
          { name: "Waistcoats" },
          { name: "Shirts" },
          { name: "Accessories" },
        ],
      },
      {
        name: "SHOES AND ACCESSORIES",
        items: [
          { name: "Sneakers" },
          { name: "Formal Shoes" },
          { name: "Boots" },
          { name: "Sandals" },
          { name: "Loafers" },
          { name: "View All" },
        ],
      },
      {
        name: "COLLECTIONS",
        items: [
          { name: "Linen" },
          { name: "Knitwear" },
          { name: "T-Shirt Guide" },
          { name: "Best Sellers" },
          { name: "Online Exclusive" },
          { name: "Accessories Edition" },
          { name: "Performance" },
          { name: "Essentials" },
          { name: "Shirt Guide" },
        ],
      },
      {
        name: "OCCASIONS",
        items: [
          { name: "Summer 2026" },
          { name: "Office Looks" },
          { name: "Casual" },
          { name: "Events" },
        ],
      },
    ],
  },
  teen: {
    key: "teen",
    label: "Teen",
    menuItems: [
      {
        name: "SALE 40% OFF",
        isHighlight: true,
        items: [
          { name: "Teen Girls Sale" },
          { name: "Teen Boys Sale" },
          { name: "Denim Sale" },
        ],
      },
      {
        name: "NEW NOW",
        items: [
          { name: "New Teen Arrivals" },
          { name: "New Season Clothing" },
        ],
      },
      {
        name: "UPCOMING EVENTS",
        items: [
          { name: "Graduation Outfits" },
          { name: "Party Wear" },
          { name: "School Outfits" },
        ],
      },
      {
        name: "CLOTHING",
        items: [
          { name: "Teen T-Shirts & Tops" },
          { name: "Teen Hoodies & Sweaters" },
          { name: "Teen Jeans & Pants" },
          { name: "Teen Skirts & Dresses" },
          { name: "Teen Outerwear" },
          { name: "View All" },
        ],
      },
      {
        name: "SHOES AND ACCESSORIES",
        items: [
          { name: "Teen Sneakers" },
          { name: "Teen Backpacks & Bags" },
          { name: "Teen Socks & Hats" },
        ],
      },
      {
        name: "FEATURED",
        items: [
          { name: "Back to School" },
          { name: "Summer Essentials" },
        ],
      },
    ],
  },
  kids: {
    key: "kids",
    label: "Kids",
    menuItems: [
      {
        name: "SALE 40% OFF",
        isHighlight: true,
        items: [
          { name: "Girls Sale" },
          { name: "Boys Sale" },
          { name: "Baby Sale" },
        ],
      },
      {
        name: "NEW NOW",
        items: [
          { name: "New Kids In" },
          { name: "New Collection" },
        ],
      },
      {
        name: "SUMMER CLUB",
        items: [
          { name: "Swim & Beachwear" },
          { name: "Lightweight Cotton" },
          { name: "Play Suits" },
        ],
      },
      {
        name: "CLOTHING",
        items: [
          { name: "Kids T-Shirts" },
          { name: "Kids Shorts & Pants" },
          { name: "Kids Sweaters" },
          { name: "Kids Dresses" },
          { name: "Baby Rompers" },
          { name: "View All" },
        ],
      },
      {
        name: "SHOES AND ACCESSORIES",
        items: [
          { name: "Kids Sandals" },
          { name: "Kids Sneakers" },
          { name: "Kids Caps & Bags" },
        ],
      },
      {
        name: "COLLECTIONS",
        items: [
          { name: "Organic Cotton" },
          { name: "Mini Me Suits" },
        ],
      },
      {
        name: "FEATURED",
        items: [
          { name: "Birthday Outfits" },
          { name: "Summer Playtime" },
        ],
      },
    ],
  },
}
