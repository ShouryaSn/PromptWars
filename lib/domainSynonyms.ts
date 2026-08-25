/**
 * Hand-curated keyword expansion for the local fallback matcher
 * (lib/fallbackMatch.ts). Real project descriptions are prose, not tech
 * stacks — someone writes "track crop health using phone-camera photos,"
 * not "Computer vision." These maps let the matcher credit a skill or
 * interest when the description mentions a *related, natural-language*
 * phrase, even if the literal skill name never appears.
 *
 * Not exhaustive by design — covers the vocabulary likely to show up in
 * short hackathon-style project pitches. Matches through these lists count
 * as "inferred" (lower weight than a literal/exact match) in fallbackMatch.ts.
 */

export const SKILL_SYNONYMS: Record<string, string[]> = {
  // AI / ML
  "Computer vision": ["photo", "photos", "image", "images", "camera", "cameras", "picture", "pictures", "visual recognition", "detect", "detection", "scan", "scanning"],
  TensorFlow: ["machine learning", "ml model", "ai model", "ai-driven", "ai-powered", "predict", "prediction"],
  PyTorch: ["machine learning", "deep learning", "neural network"],
  LLMs: ["chatbot", "chat bot", "ai assistant", "language model", "generative ai", "ai-driven", "ai-powered"],
  "RAG pipelines": ["knowledge base", "document search", "retrieval"],
  MLOps: ["model deployment", "machine learning pipeline"],
  "Edge deployment": ["on-device", "offline app", "runs on the phone"],

  // Mobile
  "Mobile performance": ["mobile app", "ios app", "android app", "smartphone app"],
  "React Native": ["mobile app", "cross-platform app", "ios and android"],
  Swift: ["ios app", "iphone app"],
  Kotlin: ["android app"],

  // Gaming
  Unity: ["game", "games", "video game", "video games", "multiplayer"],
  "3D graphics": ["3d game", "3d graphics", "graphics engine"],
  "Physics engines": ["game physics", "physics simulation"],

  // Security
  AppSec: ["security", "secure", "hacking", "vulnerability", "vulnerabilities"],
  "Penetration testing": ["security testing", "pen test", "pen testing"],
  "Auth systems": ["login", "log in", "authentication", "sign in", "sign up", "user accounts"],
  "Threat modeling": ["security risk", "attack surface"],

  // Infra / DevOps
  Terraform: ["infrastructure", "cloud infrastructure", "provisioning"],
  "CI/CD": ["deployment pipeline", "automated deploys", "devops"],
  Docker: ["containers", "containerized", "containerization"],
  Observability: ["monitoring", "logging", "alerting"],
  Kubernetes: ["container orchestration", "scalable infrastructure"],
  "Distributed systems": ["scalable backend", "high traffic", "large scale", "handles scale"],
  Kafka: ["event streaming", "message queue", "real-time data", "real-time events"],

  // Growth / marketing
  SEO: ["search engine", "organic traffic", "google ranking", "search ranking"],
  "Lifecycle marketing": ["email marketing", "retention emails", "onboarding emails"],
  "A/B testing": ["experimentation", "split testing", "split test"],
  Analytics: ["tracking", "metrics", "dashboards", "data insights", "usage data"],
  Copywriting: ["marketing copy", "ad copy"],

  // Design / research
  "User research": ["user interviews", "customer feedback", "usability"],
  "Usability testing": ["user testing", "ux testing"],
  "Survey design": ["surveys", "feedback forms"],
  "UX research": ["user experience research", "user needs"],
  "Design systems": ["consistent design", "component library"],
  Prototyping: ["wireframes", "wireframe", "mockups", "mockup"],
  Figma: ["ui design", "interface design", "app design", "polished ui", "polished, trustworthy ui"],
  Illustration: ["custom art", "custom artwork", "illustrations"],
  "Motion design": ["animations", "animated"],
  Branding: ["brand identity", "logo", "logos", "visual identity"],

  // Community / content
  "Community building": ["community", "user community", "discord", "forum"],
  "Support ops": ["customer support", "help desk"],
  Onboarding: ["user onboarding", "getting started flow"],
  Content: ["blog", "content creation", "articles"],

  // Product / backend
  Roadmapping: ["product roadmap", "prioritization"],
  Agile: ["scrum", "sprints"],
  "Stakeholder alignment": ["cross-functional", "stakeholders"],
  "Node.js": ["backend", "server-side", "server side"],
  GraphQL: ["api", "apis"],
  PostgreSQL: ["database", "sql database"],
  SQL: ["database", "queries"],
  Statistics: ["data analysis", "statistical analysis"],
  Experimentation: ["experiments", "testing hypotheses"],
  "Data warehousing": ["data pipeline", "data storage"],
  Airflow: ["data pipeline", "workflow orchestration"],
  Spark: ["big data", "large-scale data processing"],
};

export const INTEREST_SYNONYMS: Record<string, string[]> = {
  fintech: ["bank", "banks", "banking", "finance", "financial", "payment", "payments", "cash flow", "budgeting", "invest", "investing"],
  healthtech: ["health", "medical", "patient", "patients", "clinic", "wellness"],
  climate: ["climate", "sustainability", "carbon", "renewable energy"],
  agritech: ["farm", "farms", "farmer", "farmers", "farming", "crop", "crops", "agriculture"],
  robotics: ["robot", "robots", "robotics", "drone", "drones"],
  gaming: ["game", "games", "gamer", "gamers", "video game", "video games"],
  "AR/VR": ["augmented reality", "virtual reality", "ar/vr"],
  marketplaces: ["marketplace", "marketplaces", "buy and sell", "peer-to-peer"],
  "consumer apps": ["consumer app", "everyday users"],
  "B2B SaaS": ["b2b", "saas", "business software"],
  "creator economy": ["creators", "influencer", "influencers", "content creator", "content creators"],
  "developer tools": ["developer tool", "developer tools", "dev tool", "engineering productivity"],
  education: ["education", "students", "teachers", "learning app"],
  accessibility: ["accessible", "accessibility", "inclusive design"],
  privacy: ["privacy", "data protection"],
  logistics: ["logistics", "shipping", "delivery", "supply chain"],
  "inclusive design": ["inclusive", "inclusive design"],
};
