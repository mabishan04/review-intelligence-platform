export default function AboutPage() {
  return (
    <main style={{ maxWidth: "1280px", margin: "0 auto", padding: "48px 32px" }}>
      <h1 style={{ fontSize: 32, fontWeight: 700, marginBottom: 24 }}>About Review Intelligence</h1>

      <div style={{ maxWidth: "800px", lineHeight: 1.8, fontSize: 16 }}>
        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 24, fontWeight: 600, marginBottom: 12, color: "#1f2937" }}>Our Mission</h2>
          <p style={{ color: "#4b5563", marginBottom: 12 }}>
            Review Intelligence Platform is an AI-powered shopping assistant designed to help you find the perfect product. We analyze thousands of real user reviews and use intelligent AI to match products with your specific needs.
          </p>
          <p style={{ color: "#4b5563" }}>
            Instead of wading through endless product listings and conflicting reviews, our AI understands what you're looking for and recommends products that genuinely fit your requirements.
          </p>
        </section>

        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 24, fontWeight: 600, marginBottom: 12, color: "#1f2937" }}>How It Works</h2>
          <div style={{ backgroundColor: "#f9fafb", borderRadius: 12, padding: 24, marginBottom: 16 }}>
            <h3 style={{ fontWeight: 600, marginBottom: 12 }}>1. Natural Language Questions</h3>
            <p style={{ color: "#4b5563", marginBottom: 16 }}>
              Ask questions in plain English like "Best laptop for coding" or "Gaming laptop under $1500"
            </p>

            <h3 style={{ fontWeight: 600, marginBottom: 12 }}>2. AI Intent Parsing</h3>
            <p style={{ color: "#4b5563", marginBottom: 16 }}>
              Our AI understands your requirements: product category, budget, priorities (performance, battery life, etc.)
            </p>

            <h3 style={{ fontWeight: 600, marginBottom: 12 }}>3. Smart Product Search</h3>
            <p style={{ color: "#4b5563", marginBottom: 16 }}>
              We search our database using intelligent algorithms to find the best matches for your needs
            </p>

            <h3 style={{ fontWeight: 600, marginBottom: 12 }}>4. Review Analysis</h3>
            <p style={{ color: "#4b5563" }}>
              AI analyzes real user reviews to explain WHY each product is great for your specific use case
            </p>
          </div>
        </section>

        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 24, fontWeight: 600, marginBottom: 12, color: "#1f2937" }}>Why Choose Us</h2>
          <ul style={{ color: "#4b5563", marginLeft: 20 }}>
            <li style={{ marginBottom: 12 }}>
              <strong>Real Reviews:</strong> We analyze actual customer feedback, not marketing claims
            </li>
            <li style={{ marginBottom: 12 }}>
              <strong>AI-Powered:</strong> Advanced machine learning understands what you really need
            </li>
            <li style={{ marginBottom: 12 }}>
              <strong>Context Matters:</strong> We match your specific use case, not just specifications
            </li>
            <li style={{ marginBottom: 12 }}>
              <strong>Transparent:</strong> See exactly why we recommended each product
            </li>
            <li>
              <strong>Fast:</strong> Get instant answers instead of spending hours researching
            </li>
          </ul>
        </section>

        <section>
          <h2 style={{ fontSize: 24, fontWeight: 600, marginBottom: 12, color: "#1f2937" }}>Technology</h2>
          <p style={{ color: "#4b5563" }}>
            Built with Next.js and powered by advanced AI models (Ollama/llama3.2) for intelligent product recommendations. Our platform analyzes product reviews in real-time to provide contextual, accurate shopping guidance.
          </p>
        </section>
      </div>
    </main>
  );
}
