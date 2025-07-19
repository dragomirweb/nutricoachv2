"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Home, Calendar, Target, User, Plus } from "lucide-react";

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const navItems: NavItem[] = [
  { href: "/dashboard", label: "Home", icon: Home },
  { href: "/meals", label: "Meals", icon: Calendar },
  { href: "/goals", label: "Goals", icon: Target },
  { href: "/profile", label: "Profile", icon: User },
];

interface BottomNavigationProps extends React.HTMLAttributes<HTMLElement> {
  showFab?: boolean;
}

export function BottomNavigation({
  className,
  showFab = true,
  ...props
}: BottomNavigationProps) {
  const pathname = usePathname();

  return (
    <>
      {/* FAB for adding meals */}
      {showFab && (
        <Link
          href="/meals/new"
          aria-label="Add meal"
          className={cn(
            "fixed bottom-20 right-4 z-40",
            "h-14 w-14 rounded-full",
            "bg-primary text-primary-foreground",
            "shadow-lg hover:shadow-xl",
            "flex items-center justify-center",
            "transition-all duration-200",
            "hover:scale-105 active:scale-95",
            "touch-target"
          )}
        >
          <Plus className="h-6 w-6" aria-hidden="true" />
        </Link>
      )}

      {/* Bottom Navigation */}
      <nav
        className={cn(
          "fixed bottom-0 left-0 right-0 z-50",
          "bg-background border-t",
          "px-2 py-2",
          "md:hidden", // Hide on desktop
          className
        )}
        aria-label="Main navigation"
        {...props}
      >
        <ul className="flex justify-around" role="list">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    "flex flex-col items-center gap-1",
                    "px-3 py-2 rounded-lg",
                    "transition-colors duration-200",
                    "touch-target",
                    isActive
                      ? "text-primary"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                  aria-current={isActive ? "page" : undefined}
                >
                  <Icon
                    className={cn(
                      "h-5 w-5",
                      isActive && "animate-in zoom-in-50"
                    )}
                    aria-hidden="true"
                  />
                  <span className="text-xs font-medium">{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </>
  );
}
