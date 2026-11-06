import { useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { Building2, LayoutDashboard, LogOut, Menu, ShieldCheck, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Logo } from "@/components/brand/Logo";
import { useAuth } from "@/hooks/use-auth";

const NAV = [
  { to: "/", label: "Home" },
  { to: "/find-parking", label: "Find Parking" },
  { to: "/how-it-works", label: "How It Works" },
  { to: "/list-your-parking", label: "List Your Parking" },
  { to: "/about", label: "About Us" },
] as const;

export function SiteHeader() {
  const { user, isAdmin, signOut } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  async function handleSignOut() {
    await signOut();
    navigate({ to: "/" });
  }

  return (
    <header className="sticky top-0 z-40 border-b bg-background/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link to="/" aria-label="SmartPark Odisha home">
          <Logo />
        </Link>

        <nav className="hidden items-center gap-1 lg:flex" aria-label="Main">
          {NAV.map((n) => (
            <Link
              key={n.to}
              to={n.to}
              activeOptions={{ exact: n.to === "/" }}
              className="rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition hover:bg-secondary hover:text-foreground"
              activeProps={{ className: "text-foreground bg-secondary" }}
            >
              {n.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="rounded-full">
                  <UserRound className="h-4 w-4" />
                  <span className="hidden max-w-[10rem] truncate sm:inline">{user.email}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="truncate text-xs font-normal text-muted-foreground">{user.email}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to="/dashboard">
                    <LayoutDashboard className="h-4 w-4" /> My bookings
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/owner">
                    <Building2 className="h-4 w-4" /> Owner portal
                  </Link>
                </DropdownMenuItem>
                {isAdmin && (
                  <DropdownMenuItem asChild>
                    <Link to="/admin">
                      <ShieldCheck className="h-4 w-4" /> Admin dashboard
                    </Link>
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut}>
                  <LogOut className="h-4 w-4" /> Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button asChild className="hidden rounded-full sm:inline-flex">
              <Link to="/auth">Login / Sign Up</Link>
            </Button>
          )}

          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Open menu">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-72">
              <SheetHeader>
                <SheetTitle>
                  <Logo />
                </SheetTitle>
              </SheetHeader>
              <nav className="mt-6 flex flex-col gap-1 px-4" aria-label="Mobile">
                {NAV.map((n) => (
                  <Link
                    key={n.to}
                    to={n.to}
                    onClick={() => setOpen(false)}
                    className="rounded-lg px-3 py-2.5 text-sm font-medium text-foreground hover:bg-secondary"
                  >
                    {n.label}
                  </Link>
                ))}
                {!user && (
                  <Button asChild className="mt-4 rounded-full">
                    <Link to="/auth" onClick={() => setOpen(false)}>
                      Login / Sign Up
                    </Link>
                  </Button>
                )}
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
