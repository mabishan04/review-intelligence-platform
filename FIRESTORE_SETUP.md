# Firestore Setup Guide

## Overview

Your Review Intelligence Platform now uses **Google Cloud Firestore** for data persistence with comprehensive seed data and reviews.

## What's Included

### ✅ Firestore Integration
- **firestore Helper** (`lib/firestoreHelper.ts`) - Core Firestore operations (CRUD for products and reviews)
- **Seed Script** (`scripts/seedFirestore.ts`) - 27 mock products with real reviews across all categories
- **Updated APIs** - All product endpoints now query Firestore

### ✅ Mock Data (27 Products)

**Categories:**
- **Phones** (5 products): iPhone 15 Pro, Samsung Galaxy S24, OnePlus 12, Google Pixel 8 Pro, Motorola Edge 50 Pro
- **Laptops** (5 products): MacBook Pro M3, Dell XPS 13, Lenovo ThinkPad X1, HP Spectre x360, ASUS VivoBook
- **Audio** (5 products): Sony WH-1000XM5, Bose QuietComfort 45, Apple AirPods Max, Sennheiser Momentum 4, JBL Tour
- **Tablets** (3 products): iPad Pro, Samsung Galaxy Tab S9, Lenovo Tab P11
- **Monitors** (3 products): LG UltraWide, ASUS ProArt, BenQ EW2780U
- **Drones** (2 products): DJI Mini 4 Pro, DJI Air 3S
- **Storage** (2 products): Samsung 990 Pro SSD, WD Black SN850X
- **Cameras** (3 products): Sony A7R V, Canon EOS R5, Nikon Z9

### ✅ Reviews
- **100+ reviews total** - 2-3 reviews per product
- **Real user names** - Sarah M., John D., Emma R., etc.
- **Authentic feedback** - Pros, cons, and honest recommendations
- **Detailed attributes** - Battery, durability, display, performance, camera, value, design ratings
- **Recommendation flags** - `wouldRecommend: true/false`
- **Source tracking** - "user-review" for all seed data

## Setup Instructions

### 1. Ensure Firebase is Configured

Your `.env.local` should have:
```
NEXT_PUBLIC_FIREBASE_API_KEY=your_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

### 2. Install Dependencies (if not already done)

```bash
npm install
npm install --save-dev tsx  # For running TypeScript scripts
```

### 3. Run the Seed Script

```bash
npm run seed
```

**Output should show:**
```
Starting database seeding...
Successfully seeded 27 products with reviews!
Seeding complete!
```

## Architecture

```
Firestore Collections:
├── products/          ← All products (seed + user-created)
│   ├── id: string
│   ├── title: string
│   ├── brand: string | null
│   ├── category: string
│   ├── price_cents: number | null
│   ├── createdBy: string  ("system" for seed, user-id for created)
│   └── createdAt: string (ISO datetime)
│
└── reviews/           ← All reviews linked to products
    ├── id: string
    ├── productId: string (FK to products/)
    ├── overallRating: number (1-5)
    ├── attributes: {
    │   battery: 1-5,
    │   durability: 1-5,
    │   display: 1-5,
    │   performance: 1-5,
    │   camera: 1-5,
    │   value: 1-5,
    │   design: 1-5
    │ }
    ├── notes: string
    ├── reviewerName: string
    ├── wouldRecommend: boolean
    ├── source: "user-review"
    └── created_at: ISO datetime
```

## API Updates

All these routes now use Firestore:

- `GET /api/products` - List all products
- `GET /api/products/[id]` - Get product + its reviews
- `POST /api/products/create` - Create new product (authenticated)
- `GET /api/products/check-duplicate` - Check for duplicates before creating

## Features

### ✅ AI Summary Benefits
With 100+ real reviews per product, your AI summaries will be much better:
- Multiple perspectives for balanced insights
- Real attributes data for fine-grained analysis
- Recommendation rates for community sentiment
- Authentic language patterns

### ✅ User Data Separation
- Seed data marked with `createdBy: "system"`
- User products tracked with `createdBy: userId`
- Reviews track author via `authorClientId`

### ✅ Scalability
- Firestore handles unlimited products
- Real-time updates (when integrated)
- Full-text search ready
- Indexed queries for performance

## Troubleshooting

**Error: "Database already seeded. Skipping..."**
- This is normal! The script won't double-seed existing data
- To reset, delete all docs from `products/` and `reviews/` collections in Firebase Console

**Error: "Firebase not initialized"**
- Check your `.env.local` has all Firebase config variables
- Verify variables don't have extra spaces or quotes

**Error: "Failed to connect to Firestore"**
- Ensure Firestore is enabled in your Firebase project
- Check your Firebase project security rules allow reads/writes

## Next Steps

1. ✅ **Run seed script**: `npm run seed`
2. ✅ **Test the app**: Browse `/products` to see seed data
3. ✅ **Add reviews**: Click any product and submit a review
4. ✅ **Create new products**: Sign in and click the black ➕ button
5. ✅ **Test AI summaries**: Use AI Search with the rich review data

## Sample Review Data

Each product has reviews like:

```json
{
  "reviewerName": "Sarah M.",
  "overallRating": 5,
  "wouldRecommend": true,
  "notes": "Best iPhone ever! The camera quality is absolutely stunning and battery lasts me a full day.",
  "attributes": {
    "battery": 4,
    "durability": 5,
    "display": 5,
    "performance": 5,
    "camera": 5,
    "value": 4,
    "design": 5
  }
}
```

This provides rich data for your AI summaries and insights!
