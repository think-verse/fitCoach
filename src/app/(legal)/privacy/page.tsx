import Link from "next/link";

export const metadata = { title: "Privacy Policy" };

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <Link href="/" className="text-sm text-muted-foreground hover:text-foreground">
        ← Back to home
      </Link>
      <h1 className="mt-6 text-3xl font-bold tracking-tight">Privacy Policy</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Last updated: replace with launch date
      </p>

      <div className="prose prose-invert mt-8 max-w-none space-y-4 text-sm leading-relaxed text-muted-foreground">
        <p>
          FitCoach stores the data you give us (profile, photos, plans, check-ins)
          to provide you with personalized fitness guidance.
        </p>
        <h2 className="mt-6 text-base font-semibold text-foreground">What we store</h2>
        <ul className="list-disc space-y-1 pl-5">
          <li>Account: email, name, avatar (from Google).</li>
          <li>Profile: age, gender, height, weight, goal, training preferences.</li>
          <li>Photos: physique photos in a private storage bucket scoped to your user ID.</li>
          <li>Plans, logs, chat messages.</li>
        </ul>
        <h2 className="mt-6 text-base font-semibold text-foreground">Who can see your data</h2>
        <p>
          Only you. Row-level security in our database means each user can only read
          their own rows. Photos live in a private bucket — no public URLs.
        </p>
        <h2 className="mt-6 text-base font-semibold text-foreground">AI processing</h2>
        <p>
          Photos and profile data are sent to Anthropic's Claude API to generate
          analyses, plans, and chat replies. We do not use your data to train models.
        </p>
        <h2 className="mt-6 text-base font-semibold text-foreground">Deleting your data</h2>
        <p>
          Settings → "Delete my account" removes every row, photo, and chat we hold
          for you. This cannot be undone.
        </p>
        <h2 className="mt-6 text-base font-semibold text-foreground">Health disclaimer</h2>
        <p>
          FitCoach output is an AI visual estimate. It is NOT a medical diagnosis.
          For medical conditions, consult a qualified professional.
        </p>
      </div>
    </div>
  );
}
