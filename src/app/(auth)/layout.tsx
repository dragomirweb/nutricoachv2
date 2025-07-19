export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-full max-w-md space-y-8 px-4">
        <div className="text-center">
          <h1 className="text-4xl font-bold tracking-tight">NutriCoach</h1>
          <p className="text-muted-foreground mt-2">
            Your personal nutrition companion
          </p>
        </div>
        {children}
      </div>
    </div>
  );
}
