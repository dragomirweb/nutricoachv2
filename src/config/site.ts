export const siteConfig = {
  name: "NutriCoach",
  description: "AI-powered nutrition tracking and meal planning assistant",
  url: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
  links: {
    github: "https://github.com/yourusername/nutricoach",
  },
} as const;

export type SiteConfig = typeof siteConfig;