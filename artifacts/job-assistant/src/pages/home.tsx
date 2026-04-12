import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function Home() {
  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative overflow-hidden border-b bg-background px-6 py-24 md:py-32">
        <div className="mx-auto max-w-4xl">
          <Badge variant="secondary" className="mb-6 text-xs font-medium tracking-widest uppercase">
            AI-Powered Career Tools
          </Badge>
          <h1 className="mb-6 text-4xl font-extrabold leading-tight tracking-tight text-foreground md:text-6xl">
            Land the job you want with{" "}
            <span className="text-primary">AI-powered</span>{" "}
            application analysis
          </h1>
          <p className="mb-8 max-w-2xl text-lg text-muted-foreground leading-relaxed">
            Upload your CV, paste a job description, and get an instant match score, missing skills analysis, tailored cover letter, and likely interview questions — all in seconds.
          </p>
          <div className="flex flex-wrap gap-4">
            <Button size="lg" asChild>
              <Link href="/sign-up" data-testid="button-get-started">Get started free</Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/sign-in" data-testid="button-sign-in">Sign in</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="border-b px-6 py-20 bg-muted/30">
        <div className="mx-auto max-w-4xl">
          <h2 className="mb-3 text-sm font-semibold tracking-widest uppercase text-muted-foreground">What you get</h2>
          <h3 className="mb-12 text-3xl font-bold tracking-tight">Everything you need to stand out</h3>
          <div className="grid gap-8 md:grid-cols-2">
            {[
              {
                title: "CV Match Score",
                description: "Get an instant 0–100% match score showing how well your CV aligns with any job description.",
                icon: "01"
              },
              {
                title: "Missing Skills",
                description: "Instantly identify the skills and qualifications you're missing so you can address them in your application.",
                icon: "02"
              },
              {
                title: "CV Improvement Tips",
                description: "Receive specific, actionable suggestions to optimize your CV for the exact role you're applying for.",
                icon: "03"
              },
              {
                title: "Cover Letter Generator",
                description: "Generate a professional, tailored cover letter that highlights your most relevant experience.",
                icon: "04"
              },
              {
                title: "Interview Questions",
                description: "Prepare for likely interview questions based on the job description and your actual CV.",
                icon: "05"
              },
              {
                title: "Analysis History",
                description: "Track all your applications in one place. Review past analyses and see your improvement over time.",
                icon: "06"
              },
            ].map((feature) => (
              <div key={feature.icon} className="flex gap-4">
                <div className="flex-shrink-0 h-10 w-10 rounded-md bg-primary/10 flex items-center justify-center text-primary font-mono text-xs font-bold">
                  {feature.icon}
                </div>
                <div>
                  <h4 className="mb-1 font-semibold text-foreground">{feature.title}</h4>
                  <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="px-6 py-20 bg-primary text-primary-foreground">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="mb-4 text-3xl font-bold tracking-tight">Ready to optimize your applications?</h2>
          <p className="mb-8 text-primary-foreground/80 text-lg">
            Join job seekers who are using AI to get more interviews.
          </p>
          <Button size="lg" variant="secondary" asChild>
            <Link href="/sign-up" data-testid="button-cta">Start for free</Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
