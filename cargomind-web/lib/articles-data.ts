export interface Article {
    slug: string
    title: string
    summary: string
    content: string
    imageUrl: string
    source: string
    timeAgo: string
    tags: string[]
    metaDescription: string
    keywords: string[]
}

export const ARTICLES: Article[] = [
    {
        slug: "global-shipping-rates-forecast-2025",
        title: "Global Shipping Rates Forecast 2025: What to Expect",
        summary: "As the maritime industry navigates through geopolitical tensions and environmental regulations, experts predict a volatile yet transformative year for global shipping rates. We analyze the key drivers impacting container costs.",
        content: `
      <p>The global shipping industry is bracing for a pivotal year in 2025. With ongoing geopolitical tensions affecting key trade routes and new environmental regulations coming into force, shipping rates are expected to experience significant volatility.</p>
      
      <h2>Key Drivers of Shipping Rates</h2>
      <ul>
        <li><strong>Geopolitical Instability:</strong> Conflicts in the Red Sea and other strategic waterways continue to force vessels to take longer routes, increasing fuel consumption and transit times.</li>
        <li><strong>Environmental Regulations:</strong> The IMO's Carbon Intensity Indicator (CII) and other green initiatives are pushing carriers to slow steam or invest in cleaner fuels, driving up operational costs.</li>
        <li><strong>Capacity Management:</strong> Carriers are actively managing capacity through blank sailings and scrapping older vessels to maintain rate levels amidst fluctuating demand.</li>
      </ul>

      <h2>Regional Outlook</h2>
      <p><strong>Asia-Europe:</strong> Rates are expected to remain elevated due to the continued avoidance of the Suez Canal. Capacity constraints during peak seasons could lead to further spikes.</p>
      <p><strong>Trans-Pacific:</strong> Demand from US retailers remains robust, but potential labor disputes at West Coast ports could disrupt supply chains and impact rates.</p>

      <h2>Strategic Recommendations for Shippers</h2>
      <p>Shippers are advised to diversify their carrier mix, consider long-term contracts to secure capacity, and leverage digital tools for real-time visibility into their supply chains.</p>
    `,
        imageUrl: "https://images.unsplash.com/photo-1494412651409-8963ce7935a7?q=80&w=2670&auto=format&fit=crop",
        source: "Logistics Weekly",
        timeAgo: "2 hours ago",
        tags: ["Shipping", "Rates", "Forecast"],
        metaDescription: "Expert analysis of global shipping rates for 2025. Learn about the key drivers, regional outlooks, and strategic recommendations for shippers.",
        keywords: ["shipping rates", "logistics forecast", "container shipping", "supply chain 2025"]
    },
    {
        slug: "port-of-los-angeles-record-volume",
        title: "Port of Los Angeles Sees Record Container Volume in Q3",
        summary: "The Port of Los Angeles has reported unprecedented container volumes in the third quarter, driven by early holiday imports and a resilient US economy.",
        content: `
      <p>The Port of Los Angeles, the busiest container port in the Western Hemisphere, has shattered previous records for container volume in the third quarter of 2024. This surge is attributed to retailers stocking up early for the holiday season and a surprisingly resilient US economy.</p>
      
      <h2>Volume Statistics</h2>
      <p>Total TEUs (Twenty-Foot Equivalent Units) handled in Q3 reached 2.8 million, a 15% increase compared to the same period last year. Imports led the growth, while exports showed a modest recovery.</p>

      <h2>Operational Efficiency</h2>
      <p>Despite the record volumes, the port has maintained fluid operations. "Our terminal operators and dockworkers have done an incredible job processing this cargo efficiently," said Gene Seroka, Executive Director of the Port of Los Angeles.</p>
    `,
        imageUrl: "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?q=80&w=2670&auto=format&fit=crop",
        source: "Port News",
        timeAgo: "45 minutes ago",
        tags: ["Ports", "Los Angeles", "Logistics"],
        metaDescription: "Port of Los Angeles breaks container volume records in Q3 2024. Read about the factors driving this surge and the port's operational performance.",
        keywords: ["Port of Los Angeles", "container volume", "logistics news", "supply chain"]
    },
    {
        slug: "imo-sustainability-regulations",
        title: "New IMO Sustainability Regulations to Impact Fuel Costs",
        summary: "The International Maritime Organization (IMO) is set to implement stricter sustainability regulations, which are expected to significantly impact fuel costs for shipping lines.",
        content: `
      <p>The maritime industry is facing a new wave of environmental regulations from the International Maritime Organization (IMO). These measures are designed to reduce greenhouse gas emissions but will come at a cost.</p>
      
      <h2>Impact on Fuel Costs</h2>
      <p>Shipping lines will need to transition to cleaner, more expensive fuels or invest in abatement technologies. This is expected to increase fuel costs by up to 20% in the coming years.</p>
    `,
        imageUrl: "https://images.unsplash.com/photo-1565793298595-6a879b1d9492?q=80&w=2672&auto=format&fit=crop",
        source: "Maritime Journal",
        timeAgo: "1 hour ago",
        tags: ["Sustainability", "IMO", "Fuel"],
        metaDescription: "New IMO sustainability regulations set to increase shipping fuel costs. Understand the impact on the maritime industry.",
        keywords: ["IMO regulations", "shipping fuel", "sustainability", "maritime industry"]
    },
    {
        slug: "air-freight-demand-surges",
        title: "Air Freight Demand Surges Ahead of Holiday Season",
        summary: "Global air freight demand is seeing a sharp increase as shippers rush to move high-value goods ahead of the peak holiday shopping season.",
        content: `
      <p>Air cargo carriers are reporting a significant uptick in demand as the holiday season approaches. With ocean freight facing delays, many shippers are turning to air freight to ensure their products reach shelves on time.</p>
      
      <h2>E-commerce Boom</h2>
      <p>The continued growth of e-commerce is a major driver of air freight demand. Consumers expect fast delivery, and air cargo is the only mode that can meet these expectations for cross-border shipments.</p>
    `,
        imageUrl: "https://images.unsplash.com/photo-1559297434-fae8a1916a79?q=80&w=2670&auto=format&fit=crop",
        source: "Air Cargo World",
        timeAgo: "3 hours ago",
        tags: ["Air Freight", "Logistics", "Holidays"],
        metaDescription: "Air freight demand surges ahead of the holiday season. Learn why shippers are shifting to air cargo.",
        keywords: ["air freight", "air cargo", "holiday shipping", "logistics"]
    },
    {
        slug: "ai-supply-chain-management",
        title: "The Rise of AI in Supply Chain Management",
        summary: "Artificial Intelligence is revolutionizing how logistics companies predict demand, optimize routes, and manage inventory. Discover the top 5 AI trends shaping the future of supply chain.",
        content: `
      <p>Artificial Intelligence (AI) is no longer a futuristic concept in supply chain management; it is a reality that is driving efficiency and innovation.</p>
      
      <h2>Top 5 AI Trends</h2>
      <ol>
        <li><strong>Predictive Analytics:</strong> AI algorithms can analyze vast amounts of data to predict demand with high accuracy, reducing stockouts and overstocking.</li>
        <li><strong>Route Optimization:</strong> AI-powered routing software can optimize delivery routes in real-time, saving fuel and time.</li>
        <li><strong>Autonomous Vehicles:</strong> From drones to self-driving trucks, AI is enabling autonomous transportation in logistics.</li>
        <li><strong>Warehouse Automation:</strong> AI-driven robots are automating picking and packing processes in warehouses.</li>
        <li><strong>Chatbots and Virtual Assistants:</strong> AI chatbots are improving customer service by providing instant responses to inquiries.</li>
      </ol>
    `,
        imageUrl: "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?q=80&w=2670&auto=format&fit=crop",
        source: "TechCrunch Logistics",
        timeAgo: "4 hours ago",
        tags: ["AI", "Tech", "Supply Chain"],
        metaDescription: "Discover how AI is transforming supply chain management. Explore the top 5 AI trends in logistics.",
        keywords: ["AI in supply chain", "logistics technology", "predictive analytics", "route optimization"]
    },
    {
        slug: "trucking-driver-shortage",
        title: "Trucking Industry Faces Driver Shortage Crisis",
        summary: "With an aging workforce and increasing demand, the trucking industry is facing a severe shortage of qualified drivers. What solutions are companies implementing to attract new talent?",
        content: `
      <p>The trucking industry is grappling with a critical shortage of drivers. The American Trucking Associations (ATA) estimates a shortage of over 80,000 drivers, a number that could double by 2030.</p>
      
      <h2>Causes of the Shortage</h2>
      <p>An aging workforce, difficult working conditions, and lifestyle challenges are key factors contributing to the shortage.</p>
      
      <h2>Solutions</h2>
      <p>Companies are increasing pay, offering better benefits, and investing in training programs to attract younger drivers and women to the profession.</p>
    `,
        imageUrl: "https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?q=80&w=2670&auto=format&fit=crop",
        source: "Transport Topics",
        timeAgo: "5 hours ago",
        tags: ["Trucking", "Labor", "Industry"],
        metaDescription: "Trucking industry faces severe driver shortage. Analyze the causes and potential solutions.",
        keywords: ["truck driver shortage", "trucking industry", "logistics labor", "transportation"]
    },
    {
        slug: "digital-freight-forwarding",
        title: "Digital Transformation in Freight Forwarding",
        summary: "Traditional freight forwarding is being disrupted by digital-first platforms. We explore how digitization is improving transparency, efficiency, and customer experience in the sector.",
        content: `
      <p>The freight forwarding industry is undergoing a digital transformation. Digital freight forwarders are leveraging technology to offer instant quotes, real-time tracking, and paperless documentation.</p>
      
      <h2>Benefits of Digitization</h2>
      <ul>
        <li><strong>Transparency:</strong> Shippers have real-time visibility into their shipments.</li>
        <li><strong>Efficiency:</strong> Automated processes reduce manual errors and save time.</li>
        <li><strong>Customer Experience:</strong> User-friendly platforms make it easier to book and manage shipments.</li>
      </ul>
    `,
        imageUrl: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=2670&auto=format&fit=crop",
        source: "FreightWaves",
        timeAgo: "6 hours ago",
        tags: ["Digital", "Freight Forwarding", "Innovation"],
        metaDescription: "Digital transformation in freight forwarding. Learn how technology is improving efficiency and transparency.",
        keywords: ["digital freight forwarding", "logistics technology", "supply chain digitization"]
    }
]

export function getArticleBySlug(slug: string): Article | undefined {
    return ARTICLES.find((article) => article.slug === slug)
}

export function getRelatedArticles(currentSlug: string, limit: number = 3): Article[] {
    return ARTICLES.filter((article) => article.slug !== currentSlug).slice(0, limit)
}
