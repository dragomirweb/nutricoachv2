import { NextResponse } from "next/server";

export async function GET() {
  const providers = {
    github: {
      enabled: !!(
        process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET
      ),
      clientId: process.env.GITHUB_CLIENT_ID ? "Configured" : "Not configured",
    },
    google: {
      enabled: !!(
        process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
      ),
      clientId: process.env.GOOGLE_CLIENT_ID ? "Configured" : "Not configured",
    },
  };

  return NextResponse.json(providers);
}
