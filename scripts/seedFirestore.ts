import {
  getFirestore,
  collection,
  writeBatch,
  getDocs,
  initializeFirestore,
  doc,
} from 'firebase/firestore';
import { initializeApp } from 'firebase/app';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

type Product = {
  title: string;
  brand: string | null;
  category: string;
  price_cents: number | null;
  createdBy: string;
  createdAt: string;
};

type Review = {
  productId: string;
  overallRating: number;
  attributes: {
    battery: number;
    durability: number;
    display: number;
    performance: number;
    camera: number;
    value: number;
    design: number;
  };
  notes: string;
  source: string;
  reviewerName: string;
  reviewerEmail?: string;
  wouldRecommend: boolean;
  created_at: string;
};

const mockProducts: Product[] = [
  // PHONES
  {
    title: 'iPhone 15 Pro',
    brand: 'Apple',
    category: 'Phones',
    price_cents: 99999,
    createdBy: 'system',
    createdAt: '2025-01-15T10:00:00Z',
  },
  {
    title: 'Samsung Galaxy S24',
    brand: 'Samsung',
    category: 'Phones',
    price_cents: 89999,
    createdBy: 'system',
    createdAt: '2025-01-15T10:00:00Z',
  },
  {
    title: 'OnePlus 12',
    brand: 'OnePlus',
    category: 'Phones',
    price_cents: 74999,
    createdBy: 'system',
    createdAt: '2025-01-15T10:00:00Z',
  },
  {
    title: 'Google Pixel 8 Pro',
    brand: 'Google',
    category: 'Phones',
    price_cents: 79999,
    createdBy: 'system',
    createdAt: '2025-01-15T10:00:00Z',
  },
  {
    title: 'Motorola Edge 50 Pro',
    brand: 'Motorola',
    category: 'Phones',
    price_cents: 64999,
    createdBy: 'system',
    createdAt: '2025-01-15T10:00:00Z',
  },

  // LAPTOPS
  {
    title: 'MacBook Pro 14-inch M3',
    brand: 'Apple',
    category: 'Laptops',
    price_cents: 199999,
    createdBy: 'system',
    createdAt: '2025-01-15T10:00:00Z',
  },
  {
    title: 'Dell XPS 13',
    brand: 'Dell',
    category: 'Laptops',
    price_cents: 129999,
    createdBy: 'system',
    createdAt: '2025-01-15T10:00:00Z',
  },
  {
    title: 'Lenovo ThinkPad X1 Carbon',
    brand: 'Lenovo',
    category: 'Laptops',
    price_cents: 139999,
    createdBy: 'system',
    createdAt: '2025-01-15T10:00:00Z',
  },
  {
    title: 'HP Spectre x360 15',
    brand: 'HP',
    category: 'Laptops',
    price_cents: 119999,
    createdBy: 'system',
    createdAt: '2025-01-15T10:00:00Z',
  },
  {
    title: 'ASUS VivoBook Pro 14',
    brand: 'ASUS',
    category: 'Laptops',
    price_cents: 99999,
    createdBy: 'system',
    createdAt: '2025-01-15T10:00:00Z',
  },

  // HEADPHONES
  {
    title: 'Sony WH-1000XM5',
    brand: 'Sony',
    category: 'Audio',
    price_cents: 37999,
    createdBy: 'system',
    createdAt: '2025-01-15T10:00:00Z',
  },
  {
    title: 'Bose QuietComfort 45',
    brand: 'Bose',
    category: 'Audio',
    price_cents: 37999,
    createdBy: 'system',
    createdAt: '2025-01-15T10:00:00Z',
  },
  {
    title: 'Apple AirPods Max',
    brand: 'Apple',
    category: 'Audio',
    price_cents: 54999,
    createdBy: 'system',
    createdAt: '2025-01-15T10:00:00Z',
  },
  {
    title: 'Sennheiser Momentum 4',
    brand: 'Sennheiser',
    category: 'Audio',
    price_cents: 39999,
    createdBy: 'system',
    createdAt: '2025-01-15T10:00:00Z',
  },
  {
    title: 'JBL Tour One M2',
    brand: 'JBL',
    category: 'Audio',
    price_cents: 29999,
    createdBy: 'system',
    createdAt: '2025-01-15T10:00:00Z',
  },

  // TABLETS
  {
    title: 'iPad Pro 12.9-inch',
    brand: 'Apple',
    category: 'Tablets',
    price_cents: 119999,
    createdBy: 'system',
    createdAt: '2025-01-15T10:00:00Z',
  },
  {
    title: 'Samsung Galaxy Tab S9 Ultra',
    brand: 'Samsung',
    category: 'Tablets',
    price_cents: 99999,
    createdBy: 'system',
    createdAt: '2025-01-15T10:00:00Z',
  },
  {
    title: 'Lenovo Tab P11 Pro',
    brand: 'Lenovo',
    category: 'Tablets',
    price_cents: 54999,
    createdBy: 'system',
    createdAt: '2025-01-15T10:00:00Z',
  },

  // MONITORS
  {
    title: 'LG 38-inch UltraWide Gaming',
    brand: 'LG',
    category: 'Monitors',
    price_cents: 89999,
    createdBy: 'system',
    createdAt: '2025-01-15T10:00:00Z',
  },
  {
    title: 'ASUS ProArt PA248QV',
    brand: 'ASUS',
    category: 'Monitors',
    price_cents: 24999,
    createdBy: 'system',
    createdAt: '2025-01-15T10:00:00Z',
  },
  {
    title: 'BenQ EW2780U',
    brand: 'BenQ',
    category: 'Monitors',
    price_cents: 34999,
    createdBy: 'system',
    createdAt: '2025-01-15T10:00:00Z',
  },

  // DRONES
  {
    title: 'DJI Mini 4 Pro',
    brand: 'DJI',
    category: 'Drones',
    price_cents: 45999,
    createdBy: 'system',
    createdAt: '2025-01-15T10:00:00Z',
  },
  {
    title: 'DJI Air 3S',
    brand: 'DJI',
    category: 'Drones',
    price_cents: 79999,
    createdBy: 'system',
    createdAt: '2025-01-15T10:00:00Z',
  },

  // STORAGE
  {
    title: 'Samsung 990 Pro SSD 4TB',
    brand: 'Samsung',
    category: 'Storage',
    price_cents: 39999,
    createdBy: 'system',
    createdAt: '2025-01-15T10:00:00Z',
  },
  {
    title: 'WD Black SN850X 2TB',
    brand: 'Western Digital',
    category: 'Storage',
    price_cents: 19999,
    createdBy: 'system',
    createdAt: '2025-01-15T10:00:00Z',
  },

  // CAMERAS
  {
    title: 'Sony A7R V',
    brand: 'Sony',
    category: 'Cameras',
    price_cents: 398000,
    createdBy: 'system',
    createdAt: '2025-01-15T10:00:00Z',
  },
  {
    title: 'Canon EOS R5',
    brand: 'Canon',
    category: 'Cameras',
    price_cents: 329900,
    createdBy: 'system',
    createdAt: '2025-01-15T10:00:00Z',
  },
  {
    title: 'Nikon Z9',
    brand: 'Nikon',
    category: 'Cameras',
    price_cents: 549900,
    createdBy: 'system',
    createdAt: '2025-01-15T10:00:00Z',
  },
];

const mockReviewsByProductIndex: Review[][] = [
  // iPhone 15 Pro reviews
  [
    {
      productId: '',
      overallRating: 5,
      attributes: { battery: 4, durability: 5, display: 5, performance: 5, camera: 5, value: 4, design: 5 },
      notes: 'Best iPhone ever! The camera quality is absolutely stunning and battery lasts me a full day.',
      source: 'user-review',
      reviewerName: 'Sarah M.',
      wouldRecommend: true,
      created_at: '2025-01-20T14:30:00Z',
    },
    {
      productId: '',
      overallRating: 4,
      attributes: { battery: 4, durability: 4, display: 5, performance: 5, camera: 5, value: 3, design: 4 },
      notes: 'Great phone but very pricey. Worth it if you want premium features.',
      source: 'user-review',
      reviewerName: 'John D.',
      wouldRecommend: true,
      created_at: '2025-01-22T09:15:00Z',
    },
    {
      productId: '',
      overallRating: 4,
      attributes: { battery: 3, durability: 5, display: 5, performance: 5, camera: 4, value: 3, design: 5 },
      notes: 'Love everything except the battery. Needs charging by evening for heavy use.',
      source: 'user-review',
      reviewerName: 'Emma R.',
      wouldRecommend: true,
      created_at: '2025-01-25T16:45:00Z',
    },
  ],
  // Samsung Galaxy S24 reviews
  [
    {
      productId: '',
      overallRating: 5,
      attributes: { battery: 5, durability: 5, display: 5, performance: 5, camera: 4, value: 5, design: 5 },
      notes: 'Excellent all-around phone. Better battery than iPhone and more customizable.',
      source: 'user-review',
      reviewerName: 'Alex T.',
      wouldRecommend: true,
      created_at: '2025-01-21T11:20:00Z',
    },
    {
      productId: '',
      overallRating: 4,
      attributes: { battery: 4, durability: 4, display: 5, performance: 5, camera: 4, value: 4, design: 4 },
      notes: 'Really good phone. Performance is blazing fast with the new chip.',
      source: 'user-review',
      reviewerName: 'Michael S.',
      wouldRecommend: true,
      created_at: '2025-01-26T13:10:00Z',
    },
  ],
  // OnePlus 12 reviews
  [
    {
      productId: '',
      overallRating: 4,
      attributes: { battery: 5, durability: 4, display: 5, performance: 5, camera: 3, value: 5, design: 4 },
      notes: 'Best value for money. Camera could be better but performance is exceptional.',
      source: 'user-review',
      reviewerName: 'Lisa P.',
      wouldRecommend: true,
      created_at: '2025-01-23T10:00:00Z',
    },
  ],
  // Google Pixel 8 Pro reviews
  [
    {
      productId: '',
      overallRating: 5,
      attributes: { battery: 4, durability: 5, display: 5, performance: 5, camera: 5, value: 4, design: 5 },
      notes: 'Camera is unbeatable. AI features are actually useful and make a difference.',
      source: 'user-review',
      reviewerName: 'Chris K.',
      wouldRecommend: true,
      created_at: '2025-01-24T08:30:00Z',
    },
    {
      productId: '',
      overallRating: 4,
      attributes: { battery: 3, durability: 4, display: 5, performance: 5, camera: 5, value: 4, design: 4 },
      notes: 'Fantastic camera but battery could be better. Still worth it for photography.',
      source: 'user-review',
      reviewerName: 'Nina H.',
      wouldRecommend: true,
      created_at: '2025-01-27T15:20:00Z',
    },
  ],
  // Motorola Edge 50 Pro reviews
  [
    {
      productId: '',
      overallRating: 4,
      attributes: { battery: 4, durability: 4, display: 4, performance: 4, camera: 4, value: 5, design: 4 },
      notes: 'Solid phone with great price. Not the best flagship but excellent value.',
      source: 'user-review',
      reviewerName: 'David W.',
      wouldRecommend: true,
      created_at: '2025-01-28T12:45:00Z',
    },
  ],
  // MacBook Pro 14-inch M3 reviews
  [
    {
      productId: '',
      overallRating: 5,
      attributes: { battery: 5, durability: 5, display: 5, performance: 5, camera: 3, value: 3, design: 5 },
      notes: 'Beast of a machine. M3 performs incredibly well for development and creative work.',
      source: 'user-review',
      reviewerName: 'Jessica R.',
      wouldRecommend: true,
      created_at: '2025-01-19T09:00:00Z',
    },
    {
      productId: '',
      overallRating: 4,
      attributes: { battery: 5, durability: 5, display: 5, performance: 5, camera: 3, value: 2, design: 5 },
      notes: 'Expensive but worth every penny if you can afford it. Productivity machine.',
      source: 'user-review',
      reviewerName: 'Robert B.',
      wouldRecommend: true,
      created_at: '2025-01-29T14:15:00Z',
    },
  ],
  // Dell XPS 13 reviews
  [
    {
      productId: '',
      overallRating: 4,
      attributes: { battery: 4, durability: 4, display: 5, performance: 4, camera: 2, value: 4, design: 5 },
      notes: 'Beautiful design and great for everyday work. Good alternative to MacBook.',
      source: 'user-review',
      reviewerName: 'Sophie C.',
      wouldRecommend: true,
      created_at: '2025-01-21T16:30:00Z',
    },
  ],
  // Lenovo ThinkPad X1 Carbon reviews
  [
    {
      productId: '',
      overallRating: 4,
      attributes: { battery: 4, durability: 5, display: 4, performance: 4, camera: 2, value: 4, design: 4 },
      notes: 'Business laptop perfection. Build quality is outstanding.',
      source: 'user-review',
      reviewerName: 'Mark T.',
      wouldRecommend: true,
      created_at: '2025-01-25T10:20:00Z',
    },
  ],
  // HP Spectre x360 15 reviews
  [
    {
      productId: '',
      overallRating: 4,
      attributes: { battery: 3, durability: 4, display: 5, performance: 4, camera: 3, value: 4, design: 5 },
      notes: '2-in-1 functionality is great. Touch screen is responsive and display is beautiful.',
      source: 'user-review',
      reviewerName: 'Karen L.',
      wouldRecommend: true,
      created_at: '2025-01-26T11:40:00Z',
    },
  ],
  // ASUS VivoBook Pro 14 reviews
  [
    {
      productId: '',
      overallRating: 4,
      attributes: { battery: 4, durability: 4, display: 5, performance: 4, camera: 2, value: 5, design: 4 },
      notes: 'Great value for creators. Performance is solid and price is unbeatable.',
      source: 'user-review',
      reviewerName: 'Tom H.',
      wouldRecommend: true,
      created_at: '2025-01-27T13:00:00Z',
    },
  ],
  // Sony WH-1000XM5 reviews
  [
    {
      productId: '',
      overallRating: 5,
      attributes: { battery: 4, durability: 5, display: 0, performance: 5, camera: 0, value: 4, design: 5 },
      notes: 'Best noise cancellation ever. Sound quality is pristine and comfort is excellent.',
      source: 'user-review',
      reviewerName: 'Chris P.',
      wouldRecommend: true,
      created_at: '2025-01-22T07:15:00Z',
    },
  ],
  // Bose QuietComfort 45 reviews
  [
    {
      productId: '',
      overallRating: 5,
      attributes: { battery: 5, durability: 5, display: 0, performance: 5, camera: 0, value: 4, design: 5 },
      notes: 'Exceptional comfort for long listening sessions. Battery lasts forever.',
      source: 'user-review',
      reviewerName: 'Maria G.',
      wouldRecommend: true,
      created_at: '2025-01-23T09:45:00Z',
    },
  ],
  // Apple AirPods Max reviews
  [
    {
      productId: '',
      overallRating: 4,
      attributes: { battery: 4, durability: 4, display: 0, performance: 5, camera: 0, value: 3, design: 5 },
      notes: 'Stunning design and great sound. Pricey but worth it for Apple ecosystem users.',
      source: 'user-review',
      reviewerName: 'Patricia N.',
      wouldRecommend: true,
      created_at: '2025-01-24T14:00:00Z',
    },
  ],
  // Sennheiser Momentum 4 reviews
  [
    {
      productId: '',
      overallRating: 4,
      attributes: { battery: 5, durability: 4, display: 0, performance: 4, camera: 0, value: 4, design: 4 },
      notes: 'Excellent build quality and fantastic battery life. Great alternative to Sony.',
      source: 'user-review',
      reviewerName: 'Kevin J.',
      wouldRecommend: true,
      created_at: '2025-01-25T11:30:00Z',
    },
  ],
  // JBL Tour One M2 reviews
  [
    {
      productId: '',
      overallRating: 4,
      attributes: { battery: 4, durability: 4, display: 0, performance: 4, camera: 0, value: 5, design: 4 },
      notes: 'Great sound quality and incredible price. Recommended for budget-conscious users.',
      source: 'user-review',
      reviewerName: 'Amanda V.',
      wouldRecommend: true,
      created_at: '2025-01-26T15:50:00Z',
    },
  ],
  // iPad Pro 12.9-inch reviews
  [
    {
      productId: '',
      overallRating: 5,
      attributes: { battery: 5, durability: 5, display: 5, performance: 5, camera: 4, value: 3, design: 5 },
      notes: 'Ultimate creative tool. M2 chip is overkill but performance is amazing.',
      source: 'user-review',
      reviewerName: 'Jennifer S.',
      wouldRecommend: true,
      created_at: '2025-01-20T10:00:00Z',
    },
  ],
  // Samsung Galaxy Tab S9 Ultra reviews
  [
    {
      productId: '',
      overallRating: 4,
      attributes: { battery: 4, durability: 5, display: 5, performance: 4, camera: 3, value: 4, design: 5 },
      notes: 'Excellent Android tablet. Great for media consumption and productivity.',
      source: 'user-review',
      reviewerName: 'David L.',
      wouldRecommend: true,
      created_at: '2025-01-21T12:20:00Z',
    },
  ],
  // Lenovo Tab P11 Pro reviews
  [
    {
      productId: '',
      overallRating: 4,
      attributes: { battery: 4, durability: 4, display: 5, performance: 4, camera: 3, value: 5, design: 4 },
      notes: 'Best Android tablet for the price. Display is gorgeous.',
      source: 'user-review',
      reviewerName: 'Rachel K.',
      wouldRecommend: true,
      created_at: '2025-01-22T13:40:00Z',
    },
  ],
  // LG 38-inch UltraWide Gaming reviews
  [
    {
      productId: '',
      overallRating: 5,
      attributes: { battery: 0, durability: 5, display: 5, performance: 5, camera: 0, value: 4, design: 5 },
      notes: 'Immersive gaming experience. 1ms response time is incredibly fast.',
      source: 'user-review',
      reviewerName: 'Kyle E.',
      wouldRecommend: true,
      created_at: '2025-01-23T14:30:00Z',
    },
  ],
  // ASUS ProArt PA248QV reviews
  [
    {
      productId: '',
      overallRating: 4,
      attributes: { battery: 0, durability: 5, display: 5, performance: 4, camera: 0, value: 4, design: 4 },
      notes: 'Perfect for designers and photographers. Color accuracy is exceptional.',
      source: 'user-review',
      reviewerName: 'Laura Q.',
      wouldRecommend: true,
      created_at: '2025-01-24T15:15:00Z',
    },
  ],
  // BenQ EW2780U reviews
  [
    {
      productId: '',
      overallRating: 4,
      attributes: { battery: 0, durability: 4, display: 5, performance: 4, camera: 0, value: 4, design: 4 },
      notes: 'Great 4K monitor for productivity. Brightness and clarity are top-notch.',
      source: 'user-review',
      reviewerName: 'Nathan F.',
      wouldRecommend: true,
      created_at: '2025-01-25T16:40:00Z',
    },
  ],
  // DJI Mini 4 Pro reviews
  [
    {
      productId: '',
      overallRating: 5,
      attributes: { battery: 4, durability: 5, display: 0, performance: 5, camera: 5, value: 5, design: 5 },
      notes: 'Amazing portable drone. Great for travel and casual flying. Camera is excellent.',
      source: 'user-review',
      reviewerName: 'Oliver M.',
      wouldRecommend: true,
      created_at: '2025-01-20T08:20:00Z',
    },
  ],
  // DJI Air 3S reviews
  [
    {
      productId: '',
      overallRating: 5,
      attributes: { battery: 5, durability: 5, display: 0, performance: 5, camera: 5, value: 4, design: 5 },
      notes: 'Professional-grade drone for serious enthusiasts. Flight time is outstanding.',
      source: 'user-review',
      reviewerName: 'Sophia U.',
      wouldRecommend: true,
      created_at: '2025-01-21T09:50:00Z',
    },
  ],
  // Samsung 990 Pro SSD 4TB reviews
  [
    {
      productId: '',
      overallRating: 5,
      attributes: { battery: 0, durability: 5, display: 0, performance: 5, camera: 0, value: 4, design: 0 },
      notes: 'Blazing fast read/write speeds. Perfect for content creators and gaming.',
      source: 'user-review',
      reviewerName: 'Brandon Z.',
      wouldRecommend: true,
      created_at: '2025-01-22T10:30:00Z',
    },
  ],
  // WD Black SN850X 2TB reviews
  [
    {
      productId: '',
      overallRating: 4,
      attributes: { battery: 0, durability: 5, display: 0, performance: 5, camera: 0, value: 5, design: 0 },
      notes: 'Great performance at a reasonable price. Excellent for gaming.',
      source: 'user-review',
      reviewerName: 'Melissa A.',
      wouldRecommend: true,
      created_at: '2025-01-23T11:45:00Z',
    },
  ],
  // Sony A7R V reviews
  [
    {
      productId: '',
      overallRating: 5,
      attributes: { battery: 4, durability: 5, display: 5, performance: 5, camera: 5, value: 3, design: 5 },
      notes: 'Professional powerhouse. 61MP sensor is incredible for detailed work.',
      source: 'user-review',
      reviewerName: 'Gregory Y.',
      wouldRecommend: true,
      created_at: '2025-01-19T07:10:00Z',
    },
  ],
  // Canon EOS R5 reviews
  [
    {
      productId: '',
      overallRating: 5,
      attributes: { battery: 4, durability: 5, display: 5, performance: 5, camera: 5, value: 4, design: 5 },
      notes: 'Fantastic for both stills and video. 8K video is a game-changer.',
      source: 'user-review',
      reviewerName: 'Diana X.',
      wouldRecommend: true,
      created_at: '2025-01-20T08:00:00Z',
    },
  ],
  // Nikon Z9 reviews
  [
    {
      productId: '',
      overallRating: 5,
      attributes: { battery: 4, durability: 5, display: 5, performance: 5, camera: 5, value: 3, design: 5 },
      notes: 'Professional flagship. Autofocus and buffer are unmatched.',
      source: 'user-review',
      reviewerName: 'Henry W.',
      wouldRecommend: true,
      created_at: '2025-01-21T09:15:00Z',
    },
  ],
];

async function seedDatabase() {
  try {
    console.log('Starting database seeding...');

    // Check if products already exist
    const existingProducts = await getDocs(collection(db, 'products'));
    if (existingProducts.size > 0) {
      console.log('Database already seeded. Skipping...');
      return;
    }

    const batch = writeBatch(db);
    let productIndex = 0;

    // Add products
    for (const product of mockProducts) {
      const productsCollection = collection(db, 'products');
      const newDocRef = doc(productsCollection);
      batch.set(newDocRef, product);

      // Add reviews for this product
      const reviews = mockReviewsByProductIndex[productIndex] || [];
      for (const review of reviews) {
        const reviewsCollection = collection(db, 'reviews');
        const reviewDocRef = doc(reviewsCollection);
        batch.set(reviewDocRef, {
          ...review,
          productId: newDocRef.id,
        });
      }

      productIndex++;
    }

    await batch.commit();
    console.log(`Successfully seeded ${mockProducts.length} products with reviews!`);
  } catch (error) {
    console.error('Error seeding database:', error);
    throw error;
  }
}

// Run seeding
seedDatabase()
  .then(() => {
    console.log('Seeding complete!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Seeding failed:', error);
    process.exit(1);
  });
