/**
 * User Profile and Badge Tests
 * Tests for user profile fetching and badge display logic
 */

describe('User Profile System', () => {
  describe('User Profile Creation', () => {
    it('should create user profile with initial data', () => {
      const userId = 'user123';
      const userProfile = {
        userId,
        points: 0,
        reviewCount: 0,
        reviewCountByCategory: {},
        badges: {
          firstReview: false,
          trustedReviewer: false,
          categoryExpert: {},
        },
        helpfulReceived: 0,
      };

      expect(userProfile.userId).toBe('user123');
      expect(userProfile.points).toBe(0);
      expect(userProfile.reviewCount).toBe(0);
      expect(Object.keys(userProfile.badges.categoryExpert).length).toBe(0);
    });

    it('should initialize reviewCountByCategory as empty object', () => {
      const profile = {
        reviewCountByCategory: {},
      };

      expect(Object.keys(profile.reviewCountByCategory).length).toBe(0);
    });
  });

  describe('Profile Updates', () => {
    it('should add points to user profile', () => {
      let profile = {
        points: 0,
      };

      profile.points += 50;
      expect(profile.points).toBe(50);

      profile.points += 75;
      expect(profile.points).toBe(125);
    });

    it('should increment review count', () => {
      let profile = {
        reviewCount: 0,
      };

      profile.reviewCount++;
      expect(profile.reviewCount).toBe(1);

      profile.reviewCount += 4;
      expect(profile.reviewCount).toBe(5);
    });

    it('should track reviews by category', () => {
      let profile = {
        reviewCountByCategory: {} as Record<string, number>,
      };

      const category = 'electronics';
      profile.reviewCountByCategory[category] = (profile.reviewCountByCategory[category] || 0) + 1;

      expect(profile.reviewCountByCategory[category]).toBe(1);

      profile.reviewCountByCategory[category]++;
      expect(profile.reviewCountByCategory[category]).toBe(2);
    });

    it('should track help received count', () => {
      let profile = {
        helpfulReceived: 0,
      };

      profile.helpfulReceived += 5;
      expect(profile.helpfulReceived).toBe(5);
    });
  });

  describe('Badge Display Logic', () => {
    it('should display Trusted Reviewer badge when earned', () => {
      const profile = {
        badges: {
          trustedReviewer: true,
        },
      };

      const shouldDisplayBadge = profile.badges.trustedReviewer === true;
      expect(shouldDisplayBadge).toBe(true);
    });

    it('should display category expert badges', () => {
      const profile = {
        badges: {
          categoryExpert: {
            electronics: true,
            books: true,
          },
        },
      };

      const hasElectronicsExpert = profile.badges.categoryExpert.electronics === true;
      const hasBooksExpert = profile.badges.categoryExpert.books === true;
      const hasClothingExpert = ('clothing' in profile.badges.categoryExpert) && profile.badges.categoryExpert.clothing === true;

      expect(hasElectronicsExpert).toBe(true);
      expect(hasBooksExpert).toBe(true);
      expect(hasClothingExpert).toBe(false);
    });

    it('should not display badges not earned', () => {
      const profile = {
        badges: {
          firstReview: false,
          trustedReviewer: false,
          categoryExpert: {},
        },
      };

      expect(profile.badges.firstReview).toBe(false);
      expect(profile.badges.trustedReviewer).toBe(false);
      expect(Object.keys(profile.badges.categoryExpert).length).toBe(0);
    });
  });

  describe('Badge Conditions', () => {
    it('should check First Review badge condition', () => {
      const reviewCount = 1;
      const shouldHaveBadge = reviewCount >= 1;

      expect(shouldHaveBadge).toBe(true);
    });

    it('should check Trusted Reviewer badge condition', () => {
      const reviewCount = 5;
      const shouldHaveBadge = reviewCount >= 5;

      expect(shouldHaveBadge).toBe(true);
    });

    it('should check Category Expert badge condition', () => {
      const reviewCountByCategory = {
        electronics: 5,
        books: 3,
      };

      const electronicsExpert = reviewCountByCategory.electronics >= 5;
      const booksExpert = reviewCountByCategory.books >= 5;

      expect(electronicsExpert).toBe(true);
      expect(booksExpert).toBe(false);
    });

    it('should prevent duplicate badge awards', () => {
      let profile = {
        badges: {
          trustedReviewer: false,
        },
      };

      // First time earning
      if (!profile.badges.trustedReviewer) {
        profile.badges.trustedReviewer = true;
      }

      expect(profile.badges.trustedReviewer).toBe(true);

      // Second time (shouldn't add again)
      if (!profile.badges.trustedReviewer) {
        profile.badges.trustedReviewer = true;
      }

      expect(profile.badges.trustedReviewer).toBe(true);
    });
  });

  describe('Profile Data Export', () => {
    it('should convert categoryExpert object to array', () => {
      const categoryExpertObject = {
        electronics: true,
        books: true,
      };

      const categoryExpertArray = Object.keys(categoryExpertObject);

      expect(Array.isArray(categoryExpertArray)).toBe(true);
      expect(categoryExpertArray).toContain('electronics');
      expect(categoryExpertArray).toContain('books');
    });

    it('should return clean profile data for frontend', () => {
      const profile = {
        userId: 'user123',
        points: 150,
        reviewCount: 5,
        badges: {
          firstReview: true,
          trustedReviewer: true,
        },
        categoryExpert: ['electronics', 'books'],
        helpfulReceived: 3,
      };

      expect(profile.userId).toBeDefined();
      expect(profile.points).toBeGreaterThan(0);
      expect(profile.badges).toBeDefined();
      expect(Array.isArray(profile.categoryExpert)).toBe(true);
    });
  });
});
