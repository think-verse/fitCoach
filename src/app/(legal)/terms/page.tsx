import Link from "next/link";

export const metadata = { title: "Terms of Service" };

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <Link href="/" className="text-sm text-muted-foreground hover:text-foreground">
        ← Back to home
      </Link>
      <h1 className="mt-6 text-3xl font-bold tracking-tight">Terms of Service</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Last updated: replace with launch date
      </p>

      <div className="prose prose-invert mt-8 max-w-none space-y-4 text-sm leading-relaxed text-muted-foreground">
        <h2 className="text-base font-semibold text-foreground">Not medical advice</h2>
        <p>
          AesthetixAI is a fitness guidance app. AI analyses, plans, and chat replies
          are estimates intended to support your training and nutrition — not
          medical diagnoses or treatments. For any medical condition, injury, or
          pregnancy concern, consult a qualified professional before acting on
          the app's suggestions.
        </p>

        <h2 className="mt-6 text-base font-semibold text-foreground">Your account</h2>
        <p>
          You are responsible for the accuracy of the data you enter. Inaccurate
          information leads to inaccurate plans.
        </p>

        <h2 className="mt-6 text-base font-semibold text-foreground">Acceptable use</h2>
        <p>
          Don't upload photos of anyone other than yourself. Don't try to extract
          medical advice the app explicitly disclaims.
        </p>

        <h2 className="mt-6 text-base font-semibold text-foreground">Cancellation</h2>
        <p>
          You can cancel paid plans anytime from Settings. Refund terms follow
          your local consumer law.
        </p>
      </div>
    </div>
  );
}
