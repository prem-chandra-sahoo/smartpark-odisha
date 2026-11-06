import type { ReactNode } from "react";

export function PageHero({ eyebrow, title, children }: { eyebrow: string; title: ReactNode; children?: ReactNode }) {
  return (
    <section className="bg-hero-gradient text-hero-foreground">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 md:py-20">
        <p className="text-sm font-semibold text-accent">{eyebrow}</p>
        <h1 className="mt-3 max-w-3xl text-4xl font-extrabold leading-tight sm:text-5xl">{title}</h1>
        {children && <div className="mt-5 max-w-2xl text-hero-foreground/80">{children}</div>}
      </div>
    </section>
  );
}
