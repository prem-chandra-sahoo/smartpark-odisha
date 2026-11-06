import { useEffect, useState } from "react";
import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { Loader2, MailCheck } from "lucide-react";
import { toast } from "sonner";
import "@lovable.dev/cloud-auth-js/styles.css";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Logo } from "@/components/brand/Logo";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { useAuth } from "@/hooks/use-auth";
import { INDIAN_MOBILE } from "@/lib/validation";

type AuthSearch = { redirect?: string | undefined; mode?: "signin" | "signup" | undefined };

function safePath(p?: string) {
  return p && p.startsWith("/") && !p.startsWith("//") ? p : "/dashboard";
}

export const Route = createFileRoute("/auth")({
  validateSearch: (s: Record<string, unknown>): AuthSearch => ({
    redirect: typeof s["redirect"] === "string" ? (s["redirect"] as string) : undefined,
    mode: s["mode"] === "signup" ? "signup" : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Login or Sign Up – SmartPark Odisha" },
      { name: "description", content: "Sign in to reserve parking, manage bookings or register your parking facility." },
      { property: "og:title", content: "Login or Sign Up – SmartPark Odisha" },
      { property: "og:description", content: "Access your SmartPark Odisha account." },
    ],
  }),
  component: AuthPage,
});

const REDIRECT_KEY = "smartpark:post-auth";

function AuthPage() {
  const search = Route.useSearch();
  const router = useRouter();
  const { user, loading } = useAuth();
  const target = safePath(search.redirect);
  const [busy, setBusy] = useState(false);
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [forgot, setForgot] = useState(false);

  useEffect(() => {
    if (!loading && user) {
      const stored = sessionStorage.getItem(REDIRECT_KEY);
      sessionStorage.removeItem(REDIRECT_KEY);
      router.history.push(safePath(stored ?? target));
    }
  }, [user, loading, target, router]);

  async function signIn(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: String(fd.get("email")).trim(),
      password: String(fd.get("password")),
    });
    setBusy(false);
    if (error) toast.error(error.message);
  }

  async function signUp(e: React.FormEvent<HTMLFormElement>): Promise<void> {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const full_name = String(fd.get("full_name")).trim();
    const phone = String(fd.get("phone")).trim();
    const email = String(fd.get("email")).trim();
    const password = String(fd.get("password"));
    if (full_name.length < 2) return void toast.error("Enter your full name");
    if (phone && !INDIAN_MOBILE.test(phone)) return void toast.error("Enter a valid 10-digit mobile number");
    if (password.length < 8) return void toast.error("Password must be at least 8 characters");
    setBusy(true);
    sessionStorage.setItem(REDIRECT_KEY, target);
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: `${window.location.origin}/auth`, data: { full_name, phone } },
    });
    setBusy(false);
    if (error) return void toast.error(error.message);
    if (!data.session) setSentTo(email);
  }

  async function sendReset(e: React.FormEvent<HTMLFormElement>): Promise<void> {
    e.preventDefault();
    const email = String(new FormData(e.currentTarget).get("email")).trim();
    setBusy(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/reset-password` });
    setBusy(false);
    if (error) return void toast.error(error.message);
    toast.success("Check your email for a reset link");
    setForgot(false);
  }

  async function oauth(provider: "google" | "lovable") {
    sessionStorage.setItem(REDIRECT_KEY, target);
    const result = await lovable.auth.signInWithOAuth(provider, { redirect_uri: window.location.origin + "/auth" });
    if (result.error) toast.error(result.error.message);
  }

  return (
    <div className="mx-auto grid min-h-[80vh] max-w-6xl items-center gap-10 px-4 py-12 sm:px-6 lg:grid-cols-2">
      <div className="hidden rounded-3xl bg-hero-gradient p-10 text-hero-foreground lg:block">
        <Logo inverted />
        <h1 className="mt-10 text-4xl font-bold leading-tight">Find your parking before you reach your destination.</h1>
        <p className="mt-4 text-hero-foreground/75">
          One account to reserve slots, keep your QR passes, save favourite facilities and — if you operate a car park —
          register it for verification.
        </p>
      </div>

      <div className="mx-auto w-full max-w-md rounded-3xl border bg-card p-6 shadow-card sm:p-8">
        {sentTo ? (
          <div className="py-8 text-center">
            <MailCheck className="mx-auto h-10 w-10 text-primary" />
            <h2 className="mt-4 text-xl font-bold">Check your email</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              We sent a confirmation link to <strong>{sentTo}</strong>. Open it to activate your account.
            </p>
          </div>
        ) : forgot ? (
          <form onSubmit={sendReset} className="space-y-4">
            <h2 className="text-xl font-bold">Reset your password</h2>
            <div className="space-y-1.5">
              <Label htmlFor="reset-email">Email</Label>
              <Input id="reset-email" name="email" type="email" required autoComplete="email" />
            </div>
            <Button className="w-full" disabled={busy}>
              {busy && <Loader2 className="h-4 w-4 animate-spin" />} Send reset link
            </Button>
            <button type="button" onClick={() => setForgot(false)} className="w-full text-sm text-muted-foreground hover:text-foreground">
              Back to sign in
            </button>
          </form>
        ) : (
          <Tabs defaultValue={search.mode === "signup" ? "signup" : "signin"}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="signin">Sign in</TabsTrigger>
              <TabsTrigger value="signup">Create account</TabsTrigger>
            </TabsList>

            <div className="mt-6 space-y-2">
              <GoogleButton onClick={() => oauth("google")} />
              <button type="button" className="lovable-auth-button w-full" onClick={() => oauth("lovable")}>
                Continue with Lovable
              </button>
            </div>
            <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground">
              <span className="h-px flex-1 bg-border" /> or use email <span className="h-px flex-1 bg-border" />
            </div>

            <TabsContent value="signin">
              <form onSubmit={signIn} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="si-email">Email</Label>
                  <Input id="si-email" name="email" type="email" required autoComplete="email" />
                </div>
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="si-password">Password</Label>
                    <button type="button" onClick={() => setForgot(true)} className="text-xs text-primary hover:underline">
                      Forgot password?
                    </button>
                  </div>
                  <Input id="si-password" name="password" type="password" required autoComplete="current-password" />
                </div>
                <Button className="w-full" disabled={busy}>
                  {busy && <Loader2 className="h-4 w-4 animate-spin" />} Sign in
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="signup">
              <form onSubmit={signUp} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="su-name">Full name</Label>
                  <Input id="su-name" name="full_name" required maxLength={100} autoComplete="name" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="su-phone">Mobile number (optional)</Label>
                  <Input id="su-phone" name="phone" inputMode="numeric" maxLength={10} autoComplete="tel-national" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="su-email">Email</Label>
                  <Input id="su-email" name="email" type="email" required autoComplete="email" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="su-password">Password</Label>
                  <Input id="su-password" name="password" type="password" required minLength={8} autoComplete="new-password" />
                </div>
                <Button className="w-full" disabled={busy}>
                  {busy && <Loader2 className="h-4 w-4 animate-spin" />} Create account
                </Button>
                <p className="text-center text-xs text-muted-foreground">
                  By continuing you agree to our{" "}
                  <Link to="/policies" hash="terms" className="text-primary hover:underline">
                    terms
                  </Link>
                  .
                </p>
              </form>
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  );
}

/* Google's branding guidelines require these exact colours. */
function GoogleButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex h-10 w-full items-center justify-center gap-[10px] rounded-md border px-3 text-sm font-medium"
      style={{ backgroundColor: "#FFFFFF", borderColor: "#747775", color: "#1F1F1F" }}
    >
      <svg aria-hidden="true" width="18" height="18" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
        <path fill="#4285F4" d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.58v3h3.86c2.26-2.09 3.56-5.17 3.56-8.82z" />
        <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96H1.29v3.09C3.26 21.3 7.31 24 12 24z" />
        <path fill="#FBBC05" d="M5.27 14.29c-.25-.72-.38-1.49-.38-2.29s.14-1.57.38-2.29V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.98-3.09z" />
        <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.98 3.09c.95-2.85 3.6-4.96 6.73-4.96z" />
      </svg>
      Continue with Google
    </button>
  );
}
