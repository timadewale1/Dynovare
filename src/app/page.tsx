// src/app/page.tsx
"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  Sparkles,
  ShieldCheck,
  LineChart,
  FileText,
  Scale,
  Search,
  Globe,
  CheckCircle2,
  ChevronRight,
  Menu,
  X,
} from "lucide-react";

import DynovareLogo from "@/components/branding/DynovareLogo";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

function Nav() {
  const [open, setOpen] = useState(false);

  // lock body scroll when menu open
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  const navItems = useMemo(
    () => [
      { label: "Features", href: "#features" },
      { label: "How it works", href: "#how" },
      { label: "Use cases", href: "#usecases" },
      { label: "FAQ", href: "#faq" },
    ],
    []
  );

  return (
    <header className="sticky top-0 z-50 border-b bg-white/70 backdrop-blur">
      <div className="mx-auto max-w-6xl px-4 py-3 flex items-center justify-between gap-3">
        <Link href="/" className="flex items-center gap-3">
            <DynovareLogo />
          {/* <div className="leading-tight">
            <p className="font-extrabold text-blue-deep tracking-tight">Dynovare</p>
            <p className="text-xs text-[var(--text-secondary)] -mt-0.5">
              Policy Intelligence
            </p>
          </div> */}
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-2">
          {navItems.map((it) => (
            <a
              key={it.href}
              href={it.href}
              className="px-3 py-2 rounded-xl text-sm font-semibold text-[var(--text-secondary)] hover:text-blue-deep hover:bg-blue-soft transition"
            >
              {it.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Button asChild variant="ghost" className="hidden sm:inline-flex">
            <Link href="/login">Log in</Link>
          </Button>
          <Button asChild className="gap-2 hidden sm:inline-flex">
            <Link href="/register">
              Create account <ArrowRight size={16} />
            </Link>
          </Button>

          {/* Mobile menu button */}
          <Button
            variant="outline"
            size="icon"
            className="sm:hidden"
            onClick={() => setOpen((v) => !v)}
            aria-label="Toggle menu"
          >
            {open ? <X size={18} /> : <Menu size={18} />}
          </Button>
        </div>
      </div>

      {/* Mobile drawer */}
      {open && (
        <div className="sm:hidden border-t bg-white">
          <div className="mx-auto max-w-6xl px-4 py-4">
            <div className="grid gap-2">
              {navItems.map((it) => (
                <a
                  key={it.href}
                  href={it.href}
                  onClick={() => setOpen(false)}
                  className="px-4 py-3 rounded-xl text-sm font-semibold text-blue-deep bg-blue-soft/60 hover:bg-blue-soft transition"
                >
                  {it.label}
                </a>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-2 mt-4">
              <Button asChild variant="outline" className="w-full">
                <Link href="/login" onClick={() => setOpen(false)}>
                  Log in
                </Link>
              </Button>
              <Button asChild className="w-full gap-2">
                <Link href="/register" onClick={() => setOpen(false)}>
                  Create account <ArrowRight size={16} />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}

function SectionHeading(props: {
  kicker: string;
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="text-center max-w-2xl mx-auto">
      <p className="text-sm text-[var(--text-secondary)]">{props.kicker}</p>
      <h2 className="mt-1 text-2xl md:text-3xl font-extrabold text-blue-deep">
        {props.title}
      </h2>
      {props.subtitle ? (
        <p className="mt-3 text-sm md:text-base text-[var(--text-secondary)]">
          {props.subtitle}
        </p>
      ) : null}
    </div>
  );
}

function Hero() {
  return (
    <section className="relative overflow-hidden bg-blue-soft">
      <div className="absolute -top-28 -right-24 h-80 w-80 rounded-full bg-blue-electric/10 blur-3xl" />
      <div className="absolute -bottom-28 -left-24 h-80 w-80 rounded-full bg-blue-electric/10 blur-3xl" />

      <div className="relative mx-auto max-w-6xl px-4 py-12 md:py-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-start">
          {/* Left */}
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-4">
              <Badge variant="outline" className="border-blue-electric/30 bg-white">
                Nigeria-first
              </Badge>
              <Badge variant="outline" className="border-blue-electric/30 bg-white">
                Policy repository
              </Badge>
              <Badge variant="outline" className="border-blue-electric/30 bg-white">
                Critique, simulate, generate
              </Badge>
            </div>

            <h1 className="text-4xl md:text-5xl font-extrabold text-blue-deep tracking-tight leading-[1.05]">
              AI-powered energy policy intelligence{" "}
              <span className="text-blue-electric">for better decisions</span>
            </h1>

            <p className="mt-4 text-base md:text-lg text-[var(--text-secondary)] max-w-xl">
              Dynovare helps you evaluate policy quality, test scenarios, and generate
              stronger drafts with clear scoring, trends, and structured outputs.
            </p>

            <div className="mt-7 flex flex-col sm:flex-row gap-3">
              <Button asChild className="gap-2 h-11">
                <Link href="/register">
                  Create account <ArrowRight size={16} />
                </Link>
              </Button>

              <Button asChild variant="outline" className="gap-2 h-11">
                <Link href="/login">
                  Log in <ChevronRight size={16} />
                </Link>
              </Button>

              <Button asChild variant="ghost" className="gap-2 h-11">
                <Link href="/policies">
                  Browse repository <Search size={16} />
                </Link>
              </Button>
            </div>

            <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-[var(--text-secondary)]">
              <div className="flex items-center gap-2">
                <ShieldCheck size={18} className="text-blue-electric" />
                Standardized scoring
              </div>
              <div className="flex items-center gap-2">
                <FileText size={18} className="text-blue-electric" />
                Clean policy outputs
              </div>
              <div className="flex items-center gap-2">
                <LineChart size={18} className="text-blue-electric" />
                Rankings and trends
              </div>
            </div>
          </div>

          {/* Right snapshot */}
          <Card className="p-6 md:p-7 rounded-2xl shadow-sm">
            <div className="flex items-center justify-between mb-5">
              <div>
                <p className="text-sm text-[var(--text-secondary)]">Snapshot</p>
                <p className="text-lg font-bold text-blue-deep">
                  What Dynovare delivers
                </p>
              </div>
              <Badge variant="outline">In platform</Badge>
            </div>

            <div className="space-y-4">
              <div className="border rounded-xl p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-bold text-blue-deep">AI Critique</p>
                    <p className="text-sm text-[var(--text-secondary)] mt-1">
                      Score policies against selected standards with strengths, risks, and fixes.
                    </p>
                  </div>
                  <Badge variant="outline" className="h-fit">
                    0–100
                  </Badge>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {["SDG alignment", "Inclusivity", "Feasibility", "Metrics"].map((t) => (
                    <Badge key={t} variant="outline" className="bg-white">
                      {t}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="border rounded-xl p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-bold text-blue-deep">Simulations</p>
                    <p className="text-sm text-[var(--text-secondary)] mt-1">
                      Explore plausible impacts across access, reliability, emissions, cost, and risk.
                    </p>
                  </div>
                  <Badge variant="outline" className="h-fit">
                    Scenario
                  </Badge>
                </div>
              </div>

              <div className="border rounded-xl p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-bold text-blue-deep">AI Generation</p>
                    <p className="text-sm text-[var(--text-secondary)] mt-1">
                      Generate a structured draft, save it to the repository, and auto-score it.
                    </p>
                  </div>
                  <Badge variant="outline" className="h-fit">
                    Draft
                  </Badge>
                </div>
              </div>
            </div>

            <div className="mt-6">
              <Button asChild className="gap-2 w-full h-11">
                <Link href="/register">
                  Create account <ArrowRight size={16} />
                </Link>
              </Button>
            </div>
          </Card>
        </div>

        {/* Screenshot mockup under both columns */}
        <div className="mt-10">
          <Card className="p-3 md:p-4 rounded-2xl shadow-sm">
            <div className="relative w-full overflow-hidden rounded-xl border bg-white">
              <Image
                src="/cover.png"
                alt="Dynovare product preview"
                width={1600}
                height={900}
                priority
                className="w-full h-auto"
              />
            </div>
          </Card>
        </div>
      </div>
    </section>
  );
}

function Features() {
  const items = [
    {
      icon: <Scale className="text-blue-electric" size={22} />,
      title: "Standards-based scoring",
      desc: "Score policies across chosen criteria with per-standard recommendations and an overall score.",
    },
    {
      icon: <LineChart className="text-blue-electric" size={22} />,
      title: "Rankings and trends",
      desc: "Track performance over time with averages, trend deltas, and quick comparisons.",
    },
    {
      icon: <FileText className="text-blue-electric" size={22} />,
      title: "Policy repository",
      desc: "Browse uploaded and AI-generated policies with clean metadata and readable structure.",
    },
    {
      icon: <Search className="text-blue-electric" size={22} />,
      title: "Useful filters",
      desc: "Slice by jurisdiction, state, sector, type, and year, then search within results.",
    },
    {
      icon: <Globe className="text-blue-electric" size={22} />,
      title: "Evidence-guided drafting",
      desc: "Optionally ground drafts and improvements using web insights for best-practice structure.",
    },
    {
      icon: <CheckCircle2 className="text-blue-electric" size={22} />,
      title: "Clean outputs",
      desc: "Structured critique, simulations, and drafts that are easy to review and share.",
    },
  ];

  return (
    <section id="features" className="bg-white">
      <div className="mx-auto max-w-6xl px-4 py-14">
        <SectionHeading
          kicker="Features"
          title="Everything you need to evaluate and improve policy quality"
          subtitle="A practical toolkit for drafting, scoring, comparing, and communicating policy performance."
        />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-10">
          {items.map((it) => (
            <Card key={it.title} className="p-6 rounded-2xl">
              <div className="h-11 w-11 rounded-xl bg-blue-soft grid place-items-center border mb-4">
                {it.icon}
              </div>
              <p className="font-bold text-blue-deep">{it.title}</p>
              <p className="text-sm text-[var(--text-secondary)] mt-2">{it.desc}</p>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

function HowItWorks() {
  const steps = [
    {
      title: "Select a policy",
      desc: "Choose a policy from the repository or upload your own document.",
    },
    {
      title: "Run critique and simulations",
      desc: "Score quality against standards, then test scenario assumptions to understand impacts and risks.",
    },
    {
      title: "Improve or generate drafts",
      desc: "Generate a stronger version or draft from scratch, then score and compare results.",
    },
  ];

  return (
    <section id="how" className="bg-blue-soft/60 border-y">
      <div className="mx-auto max-w-6xl px-4 py-14">
        <SectionHeading
          kicker="How it works"
          title="Simple workflow with strong outputs"
          subtitle="A streamlined process that keeps everything structured and easy to review."
        />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mt-10">
          {steps.map((s, idx) => (
            <Card key={s.title} className="p-6 rounded-2xl">
              <div className="flex items-center justify-between mb-3">
                <Badge variant="outline">Step {idx + 1}</Badge>
                <CheckCircle2 className="text-blue-electric" size={20} />
              </div>
              <p className="font-bold text-blue-deep">{s.title}</p>
              <p className="text-sm text-[var(--text-secondary)] mt-2">{s.desc}</p>
            </Card>
          ))}
        </div>

        <div className="mt-10 flex flex-col sm:flex-row justify-center gap-3">
          <Button asChild className="gap-2 h-11">
            <Link href="/register">
              Create account <ArrowRight size={16} />
            </Link>
          </Button>
          <Button asChild variant="outline" className="gap-2 h-11">
            <Link href="/policies">Browse repository</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}

function UseCases() {
  const cases = [
    {
      title: "Government teams and agencies",
      desc: "Standardize reviews, compare drafts, and support decisions with consistent scoring and structured outputs.",
    },
    {
      title: "Development partners and NGOs",
      desc: "Assess policy readiness, identify risks early, and generate stronger versions that are easier to implement.",
    },
    {
      title: "Researchers and academics",
      desc: "Compare policy performance across states or sectors and produce clear evidence-based insights.",
    },
  ];

  return (
    <section id="usecases" className="bg-white">
      <div className="mx-auto max-w-6xl px-4 py-14">
        <SectionHeading
          kicker="Use cases"
          title="Built for real policy work"
          subtitle="Designed to support policy evaluation, learning, and improvement in practical settings."
        />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mt-10">
          {cases.map((c) => (
            <Card key={c.title} className="p-6 rounded-2xl">
              <p className="font-bold text-blue-deep">{c.title}</p>
              <p className="text-sm text-[var(--text-secondary)] mt-2">{c.desc}</p>

              <div className="mt-4">
                <Button asChild variant="ghost" className="gap-2 px-0">
                  <Link href="/register">
                    Get started <ArrowRight size={16} />
                  </Link>
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

function FAQ() {
  const faqs = [
    {
      q: "What does Dynovare actually do?",
      a: "Dynovare helps you assess policy quality, test scenarios, and generate stronger drafts with structured outputs and clear scoring.",
    },
    {
      q: "Who is Dynovare for?",
      a: "It is designed for policy analysts, government teams, development partners, researchers, and organizations working on energy and climate policy.",
    },
    {
      q: "Can Dynovare compare policies across states or sectors?",
      a: "Yes. Rankings and comparisons help you evaluate performance across jurisdictions, sectors, and time periods.",
    },
    {
      q: "Does Dynovare replace expert judgement?",
      a: "No. It speeds up analysis and improves consistency, but expert review remains essential for validation and final decisions.",
    },
  ];

  return (
    <section id="faq" className="bg-blue-soft/60 border-y">
      <div className="mx-auto max-w-6xl px-4 py-14">
        <SectionHeading
          kicker="FAQ"
          title="Quick answers for first-time visitors"
          subtitle="A short overview of how Dynovare fits into real policy workflows."
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-10">
          {faqs.map((f) => (
            <Card key={f.q} className="p-6 rounded-2xl">
              <p className="font-bold text-blue-deep">{f.q}</p>
              <p className="text-sm text-[var(--text-secondary)] mt-2">{f.a}</p>
            </Card>
          ))}
        </div>

        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Button asChild variant="outline" className="h-11">
            <Link href="/login">Log in</Link>
          </Button>
          <Button asChild className="gap-2 h-11">
            <Link href="/register">
              Create account <ArrowRight size={16} />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="bg-blue-deep text-white">
      <div className="mx-auto max-w-6xl px-4 py-10">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-8">
          <div className="flex items-center gap-3">
            <DynovareLogo />
            {/* <div>
              <p className="font-extrabold tracking-tight">Dynovare</p>
              <p className="text-xs text-white/70">
                AI-powered energy policy intelligence
              </p>
            </div> */}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-10 gap-y-2 text-sm">
            <a href="#features" className="text-white/80 hover:text-white transition">
              Features
            </a>
            <a href="#how" className="text-white/80 hover:text-white transition">
              How it works
            </a>
            <a href="#usecases" className="text-white/80 hover:text-white transition">
              Use cases
            </a>
            <Link href="/policies" className="text-white/80 hover:text-white transition">
              Repository
            </Link>
            <Link href="/critique" className="text-white/80 hover:text-white transition">
              Critique
            </Link>
            <Link href="/simulations" className="text-white/80 hover:text-white transition">
              Simulations
            </Link>
          </div>

          <div className="flex flex-col gap-2">
            <Button asChild className="gap-2 bg-white text-blue-deep hover:bg-white/90">
              <Link href="/register">
                Create account <ArrowRight size={16} />
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              className="border-white/25 text-white hover:bg-white/10"
            >
              <Link href="/login">Log in</Link>
            </Button>

            <p className="text-xs text-white/60 mt-2">
              © {new Date().getFullYear()} Dynovare. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default function Home() {
  return (
    <main className="min-h-screen bg-white">
      <Nav />
      <Hero />
      <Features />
      <HowItWorks />
      <UseCases />
      <FAQ />
      <Footer />
    </main>
  );
}
