import { z } from "zod";

const envSchema = z.object({
  // Database
  DATABASE_URL: z.string().url(),
  
  // Authentication
  AUTH_SECRET: z.string().min(32),
  
  // Public URLs
  NEXT_PUBLIC_APP_URL: z.string().url().default("http://localhost:3000"),
  
  // Node environment
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
});

const parseEnv = () => {
  const parsed = envSchema.safeParse(process.env);
  
  if (!parsed.success) {
    console.error("❌ Invalid environment variables:", parsed.error.flatten());
    throw new Error("Invalid environment variables");
  }
  
  return parsed.data;
};

export const env = process.env.NODE_ENV === "production" 
  ? parseEnv() 
  : process.env as z.infer<typeof envSchema>;

export type Env = z.infer<typeof envSchema>;