import { 
  FaUtensils, FaShoppingBag, FaPlane, FaFilm, 
  FaShoppingBasket, FaChartLine, FaFileInvoiceDollar, 
  FaSpa, FaCar, FaGraduationCap, FaGamepad, FaGift,
  FaHome, FaPaw, FaHeart, FaBook
} from 'react-icons/fa';

// Create an icon map
export const iconMap = {
  FaUtensils,
  FaShoppingBag,
  FaPlane,
  FaFilm,
  FaShoppingBasket,
  FaChartLine,
  FaFileInvoiceDollar,
  FaSpa,
  FaCar,
  FaGraduationCap,
  FaGamepad,
  FaGift,
  FaHome,
  FaPaw,
  FaHeart,
  FaBook
};

export const defaultCategories = [
  {
    name: "Food & Dining",
    icon: FaUtensils,
    merchants: ["Swiggy", "Zomato", "Eatclub", "Dining"]
  },
  {
    name: "Shopping",
    icon: FaShoppingBag,
    merchants: [
      "Amazon", "Flipkart", "Myntra", "Reliance Trends",
      "Big Bazaar", "Shoppers Stop", "Croma", "Tata Cliq",
      "Pepperfry", "Lifestyle"
    ]
  },
  {
    name: "Travel",
    icon: FaPlane,
    merchants: [
      "MakeMyTrip", "Yatra", "Goibibo", "Cleartrip",
      "IndiGo", "SpiceJet", "Air India", "Ola Cabs",
      "Uber", "RedBus"
    ]
  },
  {
    name: "Entertainment",
    icon: FaFilm,
    merchants: [
      "Netflix", "Amazon Prime Video", "Hotstar", "Zee5",
      "SonyLIV", "JioCinema", "Voot", "Eros Now",
      "ALTBalaji", "BookMyShow"
    ]
  },
  {
    name: "Groceries",
    icon: FaShoppingBasket,
    merchants: [
      "BigBasket", "Grofers", "Reliance Fresh", "DMart",
      "Spencer's", "More Supermarket", "Nature's Basket",
      "Star Bazaar", "Foodhall", "Easyday", "Blinkit",
      "Zepto", "Swiggy Instamart", "Flipkart Minutes"
    ]
  },
  {
    name: "Investment",
    icon: FaChartLine,
    merchants: [
      "SIP (Systematic Investment Plan)", "Lump Sum Mutual Funds",
      "Stocks", "Gold", "Real Estate", "Fixed Deposits",
      "Bonds", "ETFs", "PPF", "NPS"
    ]
  },
  {
    name: "Bills & Utilities",
    icon: FaFileInvoiceDollar,
    merchants: [
      "Tata Power", "Reliance Energy", "BSES", "Adani Electricity",
      "Mahanagar Gas", "Jio", "Airtel", "BSNL",
      "Vodafone Idea", "MTNL"
    ]
  },
  {
    name: "Wellness",
    icon: FaSpa,
    merchants: [
      "Nykaa", "Purplle", "The Body Shop", "Forest Essentials",
      "Biotique", "Mamaearth", "WOW Skin Science", "VLCC Beauty",
      "Sugar Cosmetics", "L'Occitane"
    ]
  }
];

export const getCategoryIcon = (categoryName) => {
  // First check default categories
  const defaultCategory = defaultCategories.find(c => c.name === categoryName);
  if (defaultCategory) return defaultCategory.icon;

  // If not found in default categories, check if it's a custom category icon name
  if (typeof categoryName === 'string') {
    // Try to get icon from iconMap
    return iconMap[categoryName] || FaUtensils;
  }

  // Fallback to a default icon
  return FaUtensils;
};

export const getMerchantSuggestions = (categoryName) => {
  const category = defaultCategories.find(c => c.name === categoryName);
  return category?.merchants || [];
};