import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';

export const dynamic = 'force-dynamic';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params;

    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }

    // Fetch user profile from Firestore
    const userDocRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userDocRef);

    if (!userSnap.exists()) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const userData = userSnap.data();
    const badges = userData.badges || { firstReview: false, categoryExpert: {} };
    const categoryExpertList = Object.keys(badges.categoryExpert || {}).filter(
      (cat) => badges.categoryExpert[cat] === true
    );

    return NextResponse.json(
      {
        userId,
        points: userData.points || 0,
        badges: badges,
        categoryExpert: categoryExpertList, // Return as array of category names
        firstReview: badges.firstReview || false,
        reviewCount: userData.reviewCount || 0,
        helpfulReceived: userData.helpfulReceived || 0,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[user-profile] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user profile' },
      { status: 500 }
    );
  }
}
