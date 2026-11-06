import { Link } from "@tanstack/react-router";
import { Mail, MapPin } from "lucide-react";
import { Logo } from "@/components/brand/Logo";

export function SiteFooter() {
  return (
    <footer className="mt-24 bg-hero text-hero-foreground">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-4">
        <div className="md:col-span-2">
          <Logo inverted />
          <p className="mt-4 max-w-sm text-sm text-hero-foreground/70">
            Find your parking before you reach your destination. SmartPark Odisha lists parking facilities whose
            authorisation documents have been reviewed by our administrators.
          </p>
          <p className="mt-4 max-w-sm text-xs text-hero-foreground/50">
            SmartPark Odisha is an independent platform and is not affiliated with, or endorsed by, any government body.
          </p>
        </div>
        <div>
          <h3 className="text-sm font-semibold text-accent">Explore</h3>
          <ul className="mt-4 space-y-2 text-sm text-hero-foreground/80">
            <li><Link to="/find-parking" className="hover:text-accent">Find Parking</Link></li>
            <li><Link to="/how-it-works" className="hover:text-accent">How It Works</Link></li>
            <li><Link to="/list-your-parking" className="hover:text-accent">List Your Parking</Link></li>
            <li><Link to="/about" className="hover:text-accent">About Us</Link></li>
          </ul>
        </div>
        <div>
          <h3 className="text-sm font-semibold text-accent">Contact & policies</h3>
          <ul className="mt-4 space-y-2 text-sm text-hero-foreground/80">
            <li className="flex items-center gap-2"><Mail className="h-4 w-4" /> support@smartparkodisha.in</li>
            <li className="flex items-center gap-2"><MapPin className="h-4 w-4" /> Bhubaneswar, Odisha</li>
            <li><Link to="/policies" hash="privacy" className="hover:text-accent">Privacy policy</Link></li>
            <li><Link to="/policies" hash="terms" className="hover:text-accent">Terms of use</Link></li>
            <li><Link to="/policies" hash="cancellation" className="hover:text-accent">Cancellation policy</Link></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-hero-foreground/10">
        <p className="mx-auto max-w-7xl px-4 py-5 text-xs text-hero-foreground/50 sm:px-6">
          © {new Date().getFullYear()} SmartPark Odisha. Sample listings on this site are demo data and not live.
        </p>
      </div>
    </footer>
  );
}
