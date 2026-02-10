import { NextRequest, NextResponse } from 'next/server';
import { loadReviews, saveReviews } from '@/lib/persistentData';
import { applyHelpfulVote } from '@/lib/firebaseUserHelpers';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: reviewId } = await params;

    const voterId = req.headers.get('x-user-id') || 'demo-voter';

    const reviewsByProduct = loadReviews();

    // Find the review across all products
    let foundReview = null;
    let foundProductId = null;

    for (const [productId, reviews] of Object.entries(reviewsByProduct)) {
      const review = reviews.find((r) => r.id === reviewId);
      if (review) {
        foundReview = review;
        foundProductId = productId;
        break;
      }
    }

    if (!foundReview) {
      return NextResponse.json({ error: 'Review not found' }, { status: 404 });
    }

    // Update helpful count and voters
    if (!foundReview.helpfulCount) foundReview.helpfulCount = 0;
    if (!foundReview.helpfulVoters) foundReview.helpfulVoters = [];

    // Toggle helpful vote
    const alreadyVoted = foundReview.helpfulVoters.includes(voterId);
    if (alreadyVoted) {
      // Remove vote (undo)
      foundReview.helpfulVoters = foundReview.helpfulVoters.filter(v => v !== voterId);
      foundReview.helpfulCount = Math.max(0, foundReview.helpfulCount - 1);
    } else {
      // Add vote
      foundReview.helpfulVoters.push(voterId);
      foundReview.helpfulCount += 1;
    }

    // Save back to disk
    saveReviews(reviewsByProduct);

    // Award/remove points to the review author (best-effort)
    // Don't fail if Firestore is offline
    if (foundReview.userId && !alreadyVoted) {
      // Only award points if they're voting, not unvoting
      try {
        await applyHelpfulVote(foundReview.userId);
      } catch (gamificationError) {
        console.warn(
          '[gamification] Warning: Failed to apply helpful vote to Firestore',
          gamificationError
        );
        // Don't throw - helpful flag was already saved
      }
    }

    return NextResponse.json(
      {
        success: true,
        helpfulCount: foundReview.helpfulCount,
        hasVoted: foundReview.helpfulVoters.includes(voterId),
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[mark-helpful] Error:', error);
    return NextResponse.json(
      { error: 'Failed to mark review as helpful' },
      { status: 500 }
    );
  }
}
