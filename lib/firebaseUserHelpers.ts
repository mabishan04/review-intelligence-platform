// TODO (Copilot):
// Create Firestore helper functions for user gamification.
// We have a `users` collection. Each user document should look like:
// {
//   displayName?: string | null,
//   points: number,
//   reviewCount: number,
//   helpfulReceived: number,
//   badges: {
//     firstReview?: boolean,
//     categoryExpert?: { [category: string]: boolean }
//   },
//   createdAt: Timestamp,
//   updatedAt: Timestamp
// }
//
// Implement:
// - getOrCreateUser(userId: string): Promise<void>
//   Returns or creates a user document in the users collection.
//   If user does not exist, initialize with points=0, reviewCount=0, helpfulReceived=0, badges={}, createdAt=now
//
// - applyReviewContribution(userId: string, category: string, options?: { hasNotes: boolean; hasAttributes: boolean; recommend?: boolean; })
//   Called when a user submits a review.
//   Points breakdown:
//     - Base review: +50 pts
//     - Has written notes: +6 pts
//     - Has attribute ratings: +8 pts
//     - Recommend=true: +4 pts
//   Also increment reviewCount.
//   Check for badges: firstReview (reviewCount === 1) and categoryExpert (if user now has 3+ reviews in that category).
//   Use Firestore transaction to ensure atomicity.
//
// - applyHelpfulVote(reviewAuthorId: string): Promise<void>
//   Called when someone marks a review as helpful.
//   Increment reviewAuthorId's helpfulReceived by 1.
//   Increment reviewAuthorId's points by +5.
//   Update timestamps.
//
// Use Firestore transactions where needed (especially applyReviewContribution and applyHelpfulVote).
// Import `db` from our existing Firebase config (lib/firebase.ts).
// Use Timestamp.now() for timestamps.

import { db } from '@/lib/firebase';
import {
  doc,
  runTransaction,
  collection,
  query,
  where,
  getDocs,
  Timestamp,
} from 'firebase/firestore';

export async function getOrCreateUser(userId: string): Promise<void> {
  const userRef = doc(db, 'users', userId);

  await runTransaction(db, async (tx) => {
    const userSnap = await tx.get(userRef);

    if (!userSnap.exists()) {
      tx.set(userRef, {
        displayName: null,
        points: 0,
        reviewCount: 0,
        reviewCountByCategory: {}, // Track reviews per category
        helpfulReceived: 0,
        badges: {
          firstReview: false,
          trustedReviewer: false,
          categoryExpert: {},
        },
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });
    }
  });
}

export async function applyReviewContribution(
  userId: string,
  category: string,
  options?: {
    hasNotes?: boolean;
    hasAttributes?: boolean;
    recommend?: boolean;
  }
): Promise<void> {
  // Ensure user exists first
  await getOrCreateUser(userId);

  const userRef = doc(db, 'users', userId);

  await runTransaction(db, async (tx) => {
    const userSnap = await tx.get(userRef);
    const userData = userSnap.data() || {
      points: 0,
      reviewCount: 0,
      helpfulReceived: 0,
      badges: { firstReview: false, categoryExpert: {} },
    };

    // Calculate points for this review
    let points = (userData.points || 0) + 50; // base points

    if (options?.hasNotes) points += 6;
    if (options?.hasAttributes) points += 8;
    if (options?.recommend) points += 4;

    const newReviewCount = (userData.reviewCount || 0) + 1;
    const reviewCountByCategory = userData.reviewCountByCategory || {};
    const categoryCount = (reviewCountByCategory[category] || 0) + 1;
    reviewCountByCategory[category] = categoryCount;

    const badges = userData.badges || { firstReview: false, trustedReviewer: false, categoryExpert: {} };

    // Check for first review badge
    if (!badges.firstReview && newReviewCount === 1) {
      badges.firstReview = true;
      points += 25; // bonus for first review
    }

    // Check for trusted reviewer badge (5+ total reviews)
    if (!badges.trustedReviewer && newReviewCount >= 5) {
      badges.trustedReviewer = true;
      points += 75; // bonus for becoming trusted reviewer
    }

    // Check for category expert badge - 5+ reviews in THIS specific category
    const categoryExpert = badges.categoryExpert || {};
    if (!categoryExpert[category] && categoryCount >= 5) {
      categoryExpert[category] = true;
      badges.categoryExpert = categoryExpert;
      points += 100; // bonus for becoming expert in category
    }

    tx.set(
      userRef,
      {
        ...userData,
        reviewCount: newReviewCount,
        reviewCountByCategory,
        points,
        badges,
        updatedAt: Timestamp.now(),
      },
      { merge: true }
    );
  });
}

export async function applyHelpfulVote(reviewAuthorId: string): Promise<void> {
  // Ensure user exists first
  await getOrCreateUser(reviewAuthorId);

  const userRef = doc(db, 'users', reviewAuthorId);

  await runTransaction(db, async (tx) => {
    const userSnap = await tx.get(userRef);
    const userData = userSnap.data() || {
      points: 0,
      helpfulReceived: 0,
    };

    tx.set(
      userRef,
      {
        helpfulReceived: (userData.helpfulReceived || 0) + 1,
        points: (userData.points || 0) + 5,
        updatedAt: Timestamp.now(),
      },
      { merge: true }
    );
  });
}
