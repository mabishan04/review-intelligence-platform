# Review Intelligence Platform

> **AI-Powered Product Review & Discovery Platform**  
> A modern web application that leverages artificial intelligence to analyze product reviews, detect duplicates, and help users make informed purchasing decisions.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Next.js](https://img.shields.io/badge/Next.js-16.1.1-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue)](https://www.typescriptlang.org/)
[![Firebase](https://img.shields.io/badge/Firebase-12.8.0-orange)](https://firebase.google.com/)

---

## 🎯 Overview

Review Intelligence Platform is a sophisticated web application designed to streamline product discovery and review analysis. It combines user-friendly interfaces with powerful backend AI capabilities to provide intelligent product recommendations, duplicate detection, and comprehensive review analytics.

**Perfect for:**
- E-commerce marketplaces
- Product research platforms
- Business decision-making
- Consumer intelligence analysis

---

## ✨ Key Features

### 🔐 Authentication & Authorization
- **Google OAuth Integration** - Seamless sign-in with Google accounts
- **Email/Password Authentication** - Traditional account creation
- **Optional Authentication** - Browse freely, authenticate only for actions
- **Post-Login Redirects** - Intelligent navigation back to original page
- **Secure Sign-Out** - Confirmation dialog for account logout

### 🛍️ Product Management
- **Add Products** - Intuitive form for submitting new products
- **Intelligent Duplicate Detection** - Levenshtein distance algorithm with model number sensitivity
- **Product Catalog** - Browse and search across all available products
- **Product Details** - View complete information, specifications, and reviews

### ⭐ Review System
- **Write Reviews** - Authenticated users can share detailed product feedback
- **Review Analytics** - Aggregate insights from multiple reviews
- **Rating System** - Visual rating indicators for quick assessment
- **Authentic Reviews** - User-verified contributions

### 🤖 AI-Powered Features
- **Smart Search** - AI-powered product discovery using natural language
- **Review Summarization** - Automatic summary generation with quality-aware pros/cons counts
- **Quality-Aware Insights** - Balances strengths and weaknesses based on product rating
  - Good products (≥4.2★): Show 3 strengths, 1 consideration
  - Mid products (2.5-4.2★): Show 2 strengths, 2 considerations (balanced)
  - Bad products (<2.5★): Show 1 strength, 3 considerations
- **Best For Recommendations** - Personalized suggestions with honest trade-off warnings for lower-rated products
- **Natural Language Summaries** - AI insights without confusing numbers or percentages
- **Shopping Assistant Chat** - Conversational AI for product recommendations

### 🎨 Modern User Interface
- **Light Theme Design** - Clean, professional aesthetic
- **Responsive Layout** - Optimized for desktop, tablet, and mobile
- **Intuitive Navigation** - Seamless user experience
- **Accessible Components** - WCAG-compliant interface

---

## 🛠️ Tech Stack

### Frontend
- **Next.js 16.1.1** with Turbopack - Fast React framework
- **React 19** - Modern UI library
- **TypeScript** - Type-safe development
- **CSS Modules** - Scoped styling

### Backend & Database
- **Firebase Authentication** - Secure user management
- **Firestore** - Real-time document database with fallback support
- **Next.js API Routes** - Serverless backend functions

### AI & External Services
- **OpenAI SDK** - LLM integration for AI features
- **GPT Models** - Advanced language understanding

### Development Tools
- **ESLint** - Code quality & style
- **PostCSS** - CSS processing
- **tsconfig** - TypeScript configuration

---

## 🚀 Quick Start

### Prerequisites
- **Node.js** 18.x or higher
- **npm** or **yarn**
- **Firebase Project** (with Firestore enabled)
- **OpenAI API Key**

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/mabishan04/review-intelligence-platform.git
cd review-intelligence-platform
```

2. **Install dependencies**
```bash
npm install
# or with legacy peer deps (if needed)
npm install --legacy-peer-deps
```

3. **Configure environment variables**
Create `.env.local` in the root directory:
```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
NEXT_PUBLIC_FIREBASE_CLIENT_ID=your_google_oauth_client_id

OPENAI_API_KEY=your_openai_api_key
```

4. **Start the development server**
```bash
npm run dev
```

5. **Open in browser**
Visit `http://localhost:3000`

---

## 📁 Project Structure

```
review-intelligence-platform/
├── app/
│   ├── api/                    # Backend API routes
│   │   ├── products/           # Product CRUD operations
│   │   ├── reviews/            # Review management
│   │   ├── ai-search/          # AI search functionality
│   │   └── shopping-assistant/ # Chat bot endpoint
│   ├── components/             # React components
│   │   ├── AuthProvider.tsx    # Auth context provider
│   │   ├── Header.tsx          # Navigation header
│   │   ├── ProductCard.tsx     # Product display
│   │   ├── ReviewForm.tsx      # Review submission
│   │   └── ...
│   ├── auth/                   # Authentication pages
│   ├── products/               # Product listing & details
│   ├── ai-search/              # AI search page
│   └── layout.tsx              # Root layout
├── lib/
│   ├── firebase.ts             # Firebase config
│   ├── firestoreHelper.ts      # Firestore operations
│   ├── duplicateChecker.ts     # Product deduplication
│   ├── authClient.ts           # Auth utilities
│   └── ...
├── data/
│   ├── fakestore.json          # Sample data
│   └── reviews.jsonl           # Sample reviews
├── public/                     # Static assets
└── scripts/
    └── seedFirestore.ts        # Database seeding
```

---

## 🔑 Authentication Flow

### User Journey
```
┌─────────────────┐
│  Visit App      │
└────────┬────────┘
         │
    ┌────▼─────┐
    │  Browse?  │
    └─┬─────┬──┘
      │     │
  Yes │     │ No
      │     │
      │    ┌▼──────────────────┐
      │    │ Sign In / Sign Up │
      │    ├────────┬──────────┤
      │    │ Google │ Email    │
      │    └────────┴──────────┘
      │             │
      │    ┌────────▼────────┐
      │    │ Authenticated   │
      │    └────────┬────────┘
      │             │
    ┌─▼─────────────▼───┐
    │  Add Products/     │
    │  Write Reviews     │
    └───────────────────┘
```

### Permissions
- **Anonymous Users**: Browse products, view reviews, search
- **Authenticated Users**: Add products, write reviews, personalized features

---

## 🔌 API Endpoints

### Products
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/products` | No | Get all products |
| GET | `/api/products/[id]` | No | Get product details |
| POST | `/api/products/create` | Yes | Create new product |
| GET | `/api/products/check-duplicate` | No | Check for duplicates |

### Reviews
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/reviews` | No | Get all reviews |
| POST | `/api/reviews` | Yes | Create new review |
| DELETE | `/api/reviews/[id]` | Yes | Delete review |

### AI Features
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/ai-search` | No | AI-powered search |
| POST | `/api/summarize` | No | Summarize reviews |
| POST | `/api/shopping-assistant` | No | Chat with AI |

---

## 💡 Usage Examples

### Adding a Product
1. Click the **"➕ Add a Product"** button (black button)
2. Sign in with Google or email if prompted
3. Fill in product details (title, brand, category, price)
4. System checks for duplicates automatically
5. Submit to add to catalog

### Writing a Review
1. Navigate to any product
2. Click **"Write a Review"**
3. Sign in if not already authenticated
4. Fill rating and review text
5. Submit review

### AI Search
1. Go to **AI Search** page
2. Enter natural language query
3. AI finds relevant products
4. View results with relevance scores

---

## 🛡️ Security Features

- **Firebase Authentication** - Industry-standard auth
- **Environment Variables** - Sensitive data protection
- **API Route Protection** - Auth-gated endpoints
- **HTTPS Ready** - Secure communication
- **Input Validation** - Prevent injection attacks
- **Firestore Security Rules** - Database access control

---

## 📊 Data Validation

### Duplicate Detection Algorithm
- **Levenshtein Distance** - String similarity matching
- **Model Number Sensitivity** - Distinguish product variants (e.g., iPhone 15 vs 16)
- **Brand Matching** - Cross-reference brand names
- **Category Validation** - Ensure product category consistency

**Threshold**: 90% similarity required for duplicate match

---

## 🚢 Deployment

### Deploy to Vercel (Recommended)
```bash
# Push to GitHub (already done)
git push origin main

# Connect repository to Vercel
# Visit https://vercel.com/new
# Select your GitHub repository
# Configure environment variables
# Deploy!
```

### Deploy to Other Platforms
- **Netlify** - Next.js adapter required
- **AWS Amplify** - Native Next.js support
- **Docker** - Containerized deployment

---

## 🔄 Development Workflow

### Running Tests
```bash
npm run build    # Build for production
npm run dev      # Start development server
npm run lint     # Run ESLint
```

### Code Quality
- TypeScript strict mode enabled
- ESLint configuration active
- Type-safe database operations
- API route validation

---

## 📈 Performance Optimizations

- **Turbopack** - Fast bundling (Next.js 16.1.1)
- **Code Splitting** - Automatic chunk optimization
- **Image Optimization** - Next.js Image component
- **Caching** - Firestore query caching with fallback
- **Lazy Loading** - Component code splitting

---

## 🐛 Known Issues & Workarounds

### Firestore Permissions
- **Issue**: NOT_FOUND errors when Firestore not properly configured
- **Workaround**: Fallback to mockData for duplicate detection
- **Solution**: Configure Firestore security rules and enable API

### Development Server
- **Issue**: Port 3000 already in use
- **Solution**: Change port: `npm run dev -- -p 3001`

---

## 🔮 Roadmap

### Upcoming Features
- [ ] User profile pages with activity history
- [ ] Email verification system
- [ ] Password reset functionality
- [ ] Product ratings aggregation
- [ ] Export review data as PDF
- [ ] Bulk product import
- [ ] Advanced analytics dashboard
- [ ] Mobile app (React Native)
- [ ] Multi-language support

### Planned Improvements
- [ ] Real-time notifications
- [ ] Product comparison tool
- [ ] Review moderation system
- [ ] Machine learning recommendations
- [ ] Webhook integrations

---

## 🤝 Contributing

We welcome contributions! To get started:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Contribution Guidelines
- Follow TypeScript strict mode
- Add tests for new features
- Update documentation
- Keep commits atomic and meaningful

---

## 📝 License

This project is licensed under the **MIT License** - see [LICENSE](LICENSE) file for details.

---

## 📧 Support & Contact

### Getting Help
- **GitHub Issues** - Report bugs and request features
- **GitHub Discussions** - Ask questions and share ideas
- **Documentation** - Check [FIRESTORE_SETUP.md](FIRESTORE_SETUP.md) for advanced config

### Project Links
- **Repository**: https://github.com/mabishan04/review-intelligence-platform
- **Issues**: https://github.com/mabishan04/review-intelligence-platform/issues
- **Live Demo**: [Coming Soon]

---

## 🙏 Acknowledgments

- **Next.js Team** - Excellent React framework
- **Firebase** - Reliable authentication and database
- **OpenAI** - Powerful LLM APIs
- **Open Source Community** - All dependencies and tools

---

## 📊 Project Stats

- **Language**: TypeScript (primary)
- **Framework**: Next.js 16.1.1
- **Components**: 15+
- **API Endpoints**: 10+
- **Database**: Firestore + Mock Data Fallback
- **Lines of Code**: 11,640+ (initial commit)
- **Development Time**: Ongoing

---

**Made with ❤️ by Mabishan**

*Last Updated: February 6, 2026*

### Recent Updates (Feb 6, 2026)
- ✨ Enhanced AI summaries with natural language (no confusing numbers/percentages)
- 🎨 Added "Best For" personalized recommendation section with honest product positioning
- 📊 Implemented quality-aware UI that visually communicates product ratings through strength/weakness proportions
- 🔧 Fixed review persistence bugs (edit/delete operations, page caching)
- 🛠️ Resolved compilation errors and verified clean codebase
