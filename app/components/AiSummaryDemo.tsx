import styles from "./AiSummaryDemo.module.css";

export default function AiSummaryDemo() {
  return (
    <div className={styles.demoCard}>
      {/* Cursor dot - animated */}
      <div className={styles.cursor} />

      {/* Header - always visible */}
      <div className={styles.headerSection}>
        <div className={styles.productInfo}>
          <div className={styles.productName}>iPhone 15 Pro</div>
          <div className={styles.productMeta}>Space Black • 256GB</div>
        </div>
        <div className={styles.headerBadge}>
          <div className={styles.statusDot} />
          <span className={styles.title}>AI SUMMARY</span>
        </div>
      </div>

      {/* Content container - switches between skeleton and summary */}
      <div className={styles.contentWrapper}>
        {/* Skeleton Loading State */}
        <div className={styles.skeleton}>
          <div className={styles.ratingSkeleton} />
          <div className={styles.gridRow}>
            <div className={styles.pillSkeleton} />
            <div className={styles.pillSkeleton} />
          </div>
          <div className={styles.gridRow}>
            <div className={styles.pillSkeleton} />
            <div className={styles.pillSkeleton} />
          </div>
          <div className={styles.recommendSkeleton} />
        </div>

        {/* Summary State */}
        <div className={styles.summary}>
          {/* Rating Box */}
          <div className={styles.ratingBox}>
            <div className={styles.ratingLabel}>Overall Rating</div>
            <div className={styles.ratingValue}>
              <span className={styles.ratingNumber}>4.5</span>
              <span className={styles.ratingMax}>/5</span>
            </div>
            <div className={styles.ratingMeta}>from 243 reviews</div>
          </div>

          {/* Metrics Grid */}
          <div className={styles.metricsGrid}>
            <div className={styles.metric}>
              <span>Battery</span>
              <span className={styles.metricValue}>8/10</span>
            </div>
            <div className={styles.metric}>
              <span>Performance</span>
              <span className={styles.metricValue}>9/10</span>
            </div>
            <div className={styles.metric}>
              <span>Camera</span>
              <span className={styles.metricValue}>7/10</span>
            </div>
            <div className={styles.metric}>
              <span>Value</span>
              <span className={styles.metricValue}>8/10</span>
            </div>
          </div>

          {/* Recommendation Row */}
          <div className={styles.recommendBadge}>
            78% would recommend
          </div>
        </div>
      </div>

      {/* Fake Button */}
      <button className={styles.fakeButton} disabled>
        Generate AI summary →
      </button>

      {/* Summary Section */}
      <div className={styles.summarySection}>
        <div className={styles.summaryGrid}>
          <div className={styles.summaryCol}>
            <div className={styles.summaryTitle}>Pros</div>
            <ul className={styles.summaryList}>
              <li>Outstanding display quality</li>
              <li>Excellent camera system</li>
              <li>Fast performance</li>
              <li>Premium build quality</li>
            </ul>
          </div>
          <div className={styles.summaryCol}>
            <div className={styles.summaryTitle}>Cons</div>
            <ul className={styles.summaryList}>
              <li>Premium pricing</li>
              <li>No charger in box</li>
              <li>Gets warm under load</li>
              <li>Limited storage base model</li>
            </ul>
          </div>
        </div>
        <div className={styles.summaryBottom}>
          <div className={styles.summaryKeyTakeaway}>
            <strong>Key Takeaway:</strong> The iPhone 15 Pro delivers flagship performance with an exceptional camera system. Best for photography enthusiasts and power users who value premium build quality.
          </div>
        </div>
      </div>
    </div>
  );
}
