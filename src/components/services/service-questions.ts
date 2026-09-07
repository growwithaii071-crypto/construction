export type MCQQuestion = {
  id: string;
  question: string;
  options: string[];
  emoji: string;
};

export type ServiceMCQ = {
  category: string;
  questions: MCQQuestion[];
};

// Default questions used when category not found
const DEFAULT_QUESTIONS: MCQQuestion[] = [
  {
    id: "scope",
    emoji: "📋",
    question: "What is the scope of work?",
    options: ["Small repair / minor work", "Medium project", "Large project", "Full new installation"],
  },
  {
    id: "timeline",
    emoji: "📅",
    question: "When do you need it done?",
    options: ["ASAP (urgent)", "Within 1 week", "Within 1 month", "Flexible / no rush"],
  },
  {
    id: "budget",
    emoji: "💰",
    question: "What is your budget range?",
    options: ["Under ₹10,000", "₹10,000 – ₹50,000", "₹50,000 – ₹2 Lakh", "Above ₹2 Lakh"],
  },
  {
    id: "location",
    emoji: "📍",
    question: "Where is the work location?",
    options: ["Residential (home)", "Commercial (office/shop)", "Industrial site", "Outdoor / open area"],
  },
];

export const SERVICE_MCQ: Record<string, MCQQuestion[]> = {
  "Residential Construction": [
    {
      id: "propertyType",
      emoji: "🏠",
      question: "What type of property are you building?",
      options: ["Villa / Bungalow", "Apartment / Flat", "Row House / Duplex", "Farm House"],
    },
    {
      id: "area",
      emoji: "📐",
      question: "What is the approximate built-up area?",
      options: ["Under 500 sq ft", "500 – 1,000 sq ft", "1,000 – 2,000 sq ft", "Above 2,000 sq ft"],
    },
    {
      id: "timeline",
      emoji: "📅",
      question: "What is your expected timeline?",
      options: ["Start immediately", "Within 1 month", "1 – 3 months", "3+ months / planning phase"],
    },
    {
      id: "budget",
      emoji: "💰",
      question: "What is your approximate budget?",
      options: ["Under ₹10 Lakh", "₹10 – ₹25 Lakh", "₹25 – ₹50 Lakh", "Above ₹50 Lakh"],
    },
  ],

  "Commercial Construction": [
    {
      id: "buildingType",
      emoji: "🏢",
      question: "What type of commercial building?",
      options: ["Office building", "Retail / Showroom", "Warehouse / Factory", "Restaurant / Hotel"],
    },
    {
      id: "area",
      emoji: "📐",
      question: "What is the floor area?",
      options: ["Under 1,000 sq ft", "1,000 – 5,000 sq ft", "5,000 – 20,000 sq ft", "Above 20,000 sq ft"],
    },
    {
      id: "timeline",
      emoji: "📅",
      question: "Expected construction timeline?",
      options: ["Under 3 months", "3 – 6 months", "6 – 12 months", "Over 1 year"],
    },
    {
      id: "budget",
      emoji: "💰",
      question: "Approximate budget?",
      options: ["Under ₹25 Lakh", "₹25 – ₹1 Crore", "₹1 – ₹5 Crore", "Above ₹5 Crore"],
    },
  ],

  "Electrical Works": [
    {
      id: "workType",
      emoji: "⚡",
      question: "What type of electrical work is needed?",
      options: ["New wiring / full installation", "Repair / fault fixing", "Panel / DB upgrade", "Solar / EV charging setup"],
    },
    {
      id: "propertyType",
      emoji: "🏠",
      question: "Property type?",
      options: ["Residential home", "Apartment / flat", "Office / commercial", "Industrial / factory"],
    },
    {
      id: "urgency",
      emoji: "🚨",
      question: "How urgent is this?",
      options: ["Emergency — power outage", "Urgent — within 48 hours", "This week", "Flexible timing"],
    },
    {
      id: "budget",
      emoji: "💰",
      question: "Expected budget?",
      options: ["Under ₹5,000", "₹5,000 – ₹25,000", "₹25,000 – ₹1 Lakh", "Above ₹1 Lakh"],
    },
  ],

  "Plumbing & Sanitation": [
    {
      id: "workType",
      emoji: "🚿",
      question: "What type of plumbing work?",
      options: ["Leakage / repair", "New pipe installation", "Bathroom fitting", "Drainage / sewage work"],
    },
    {
      id: "floors",
      emoji: "🏗️",
      question: "How many floors / bathrooms involved?",
      options: ["1 bathroom", "2 – 3 bathrooms", "Full house (4+)", "Entire building"],
    },
    {
      id: "urgency",
      emoji: "🚨",
      question: "Urgency level?",
      options: ["Emergency — active leak", "Urgent — within 24 hrs", "This week", "Flexible"],
    },
    {
      id: "budget",
      emoji: "💰",
      question: "Approximate budget?",
      options: ["Under ₹2,000", "₹2,000 – ₹15,000", "₹15,000 – ₹50,000", "Above ₹50,000"],
    },
  ],

  "Renovation & Remodeling": [
    {
      id: "renovationType",
      emoji: "🔨",
      question: "What kind of renovation?",
      options: ["Full home renovation", "Kitchen remodel", "Bathroom renovation", "Single room / partial"],
    },
    {
      id: "area",
      emoji: "📐",
      question: "Area to be renovated?",
      options: ["Under 200 sq ft", "200 – 500 sq ft", "500 – 1,500 sq ft", "Above 1,500 sq ft"],
    },
    {
      id: "timeline",
      emoji: "📅",
      question: "Preferred timeline?",
      options: ["Within 2 weeks", "Within 1 month", "1 – 3 months", "Flexible"],
    },
    {
      id: "budget",
      emoji: "💰",
      question: "Budget range?",
      options: ["Under ₹50,000", "₹50,000 – ₹2 Lakh", "₹2 – ₹10 Lakh", "Above ₹10 Lakh"],
    },
  ],

  "Interior Finishing": [
    {
      id: "finishType",
      emoji: "🪟",
      question: "What interior finishing work?",
      options: ["False ceiling / POP", "Flooring / tiles", "Wall panelling / wallpaper", "Complete interior design"],
    },
    {
      id: "rooms",
      emoji: "🛏️",
      question: "Number of rooms?",
      options: ["1 room", "2 – 3 rooms", "Full apartment (4+)", "Commercial space"],
    },
    {
      id: "style",
      emoji: "🎨",
      question: "Preferred design style?",
      options: ["Modern / contemporary", "Traditional / classic", "Minimalist", "Luxury / premium"],
    },
    {
      id: "budget",
      emoji: "💰",
      question: "Budget range?",
      options: ["Under ₹1 Lakh", "₹1 – ₹5 Lakh", "₹5 – ₹15 Lakh", "Above ₹15 Lakh"],
    },
  ],

  "Painting & Finishing": [
    {
      id: "paintType",
      emoji: "🎨",
      question: "What painting work is needed?",
      options: ["Interior walls", "Exterior / facade", "Both interior & exterior", "Waterproofing + paint"],
    },
    {
      id: "area",
      emoji: "📐",
      question: "Approximate area to be painted?",
      options: ["Under 500 sq ft", "500 – 1,500 sq ft", "1,500 – 3,000 sq ft", "Above 3,000 sq ft"],
    },
    {
      id: "paintQuality",
      emoji: "✨",
      question: "Preferred paint quality?",
      options: ["Economy / budget", "Standard", "Premium / luxury", "Not sure — need recommendation"],
    },
    {
      id: "budget",
      emoji: "💰",
      question: "Budget range?",
      options: ["Under ₹10,000", "₹10,000 – ₹50,000", "₹50,000 – ₹2 Lakh", "Above ₹2 Lakh"],
    },
  ],

  "Roofing & Waterproofing": [
    {
      id: "roofType",
      emoji: "🏚️",
      question: "Type of roofing work?",
      options: ["Waterproofing treatment", "New roof construction", "Roof repair / leak fix", "Terrace garden / insulation"],
    },
    {
      id: "area",
      emoji: "📐",
      question: "Roof area?",
      options: ["Under 500 sq ft", "500 – 1,500 sq ft", "1,500 – 3,000 sq ft", "Above 3,000 sq ft"],
    },
    {
      id: "urgency",
      emoji: "🚨",
      question: "Urgency?",
      options: ["Emergency — active leak", "Before monsoon", "Planned maintenance", "New construction"],
    },
    {
      id: "budget",
      emoji: "💰",
      question: "Budget?",
      options: ["Under ₹15,000", "₹15,000 – ₹75,000", "₹75,000 – ₹3 Lakh", "Above ₹3 Lakh"],
    },
  ],

  "Structural Engineering": [
    {
      id: "workType",
      emoji: "🏗️",
      question: "What structural work is needed?",
      options: ["Structural audit / inspection", "Strengthening / retrofitting", "Foundation work", "RCC design & execution"],
    },
    {
      id: "buildingAge",
      emoji: "🏛️",
      question: "Building age?",
      options: ["Under 5 years (new)", "5 – 15 years", "15 – 30 years", "Above 30 years"],
    },
    {
      id: "floors",
      emoji: "🏢",
      question: "Number of floors?",
      options: ["Ground + 1 floor", "2 – 4 floors", "5 – 10 floors", "Above 10 floors"],
    },
    {
      id: "budget",
      emoji: "💰",
      question: "Budget range?",
      options: ["Under ₹50,000", "₹50,000 – ₹5 Lakh", "₹5 – ₹20 Lakh", "Above ₹20 Lakh"],
    },
  ],

  "Landscaping": [
    {
      id: "landscapeType",
      emoji: "🌿",
      question: "What landscaping work?",
      options: ["Garden design & planting", "Lawn / grass installation", "Paving / pathway", "Water feature / fountain"],
    },
    {
      id: "area",
      emoji: "📐",
      question: "Outdoor area size?",
      options: ["Small (under 200 sq ft)", "Medium (200 – 1,000 sq ft)", "Large (1,000+ sq ft)", "Full compound / estate"],
    },
    {
      id: "maintenance",
      emoji: "🔧",
      question: "Do you need ongoing maintenance?",
      options: ["One-time work only", "Monthly maintenance", "Weekly maintenance", "Full AMC contract"],
    },
    {
      id: "budget",
      emoji: "💰",
      question: "Budget?",
      options: ["Under ₹20,000", "₹20,000 – ₹1 Lakh", "₹1 – ₹5 Lakh", "Above ₹5 Lakh"],
    },
  ],
};

export function getQuestionsForCategory(category: string): MCQQuestion[] {
  return SERVICE_MCQ[category] ?? DEFAULT_QUESTIONS;
}
