import {
  Clock,
  BarChart3,
  Shield,
  CheckCircle,
  Star,
  BookOpen,
  FileText,
  TrendingUp,
  DollarSign,
  Mail,
  Phone,
  MapPin,
} from "lucide-react";
import { SubscriptionForm } from "@/components/subscription/SubscriptionForm";
import { SiteHeader } from "@/components/SiteHeader";

export const dynamic = "force-dynamic";

function getNextMonthLabel(): string {
  const now = new Date();
  const next = new Date(now.getFullYear(), now.getMonth() + 1, 2);
  return next.toLocaleDateString("en-US", { month: "long" });
}

export default function StartMonthlyPage() {
  const nextMonth = getNextMonthLabel();

  return (
    <div className="min-h-screen">
      <SiteHeader />

      {/* Hero Section */}
      <section className="bg-gray-800 px-4 py-20 text-white md:py-28">
        <div className="mx-auto max-w-3xl text-center">
          <h1 className="text-4xl font-bold tracking-tight md:text-6xl">
            Monthly Bookkeeping
          </h1>
          <p className="mt-3 text-3xl font-bold uppercase tracking-wide md:text-4xl">
            $1.99 to Start — $189/Month
          </p>
          <p className="mt-3 text-xl text-gray-300 md:text-2xl">
            Unlimited Transactions. Unlimited Bank Accounts.
          </p>
          <p className="mt-4 text-base leading-relaxed text-gray-300">
            MyBookkeepers.com offers premier monthly bookkeeping with unlimited
            transactions, making us the most cost-effective solution on the
            market. Our commitment to transparency means you won&apos;t face
            hidden fees or charges for additional transactions.
          </p>
          <a
            href="#signup"
            className="mt-8 inline-block rounded-lg bg-red-600 px-8 py-3 text-base font-semibold text-white shadow-lg transition hover:bg-red-700"
          >
            Get Started
          </a>
        </div>
      </section>

      {/* Social Proof Bar */}
      <section className="border-b border-gray-200 bg-white px-4 py-6">
        <div className="mx-auto flex max-w-3xl flex-col items-center justify-center gap-2 text-center md:flex-row md:gap-3">
          <div className="flex gap-1">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                className="h-5 w-5 fill-yellow-400 text-yellow-400"
              />
            ))}
          </div>
          <p className="text-sm font-medium text-gray-700">
            Trusted by 7,000+ businesses across the United States
          </p>
        </div>
      </section>

      {/* Value Propositions */}
      <section className="px-4 py-16 md:py-20">
        <div className="mx-auto max-w-5xl">
          <h2 className="mb-12 text-center text-2xl font-bold text-gray-900 md:text-3xl">
            Everything You Need to Keep Your Books in Order
          </h2>
          <div className="grid gap-8 md:grid-cols-3">
            {/* Timely Delivery */}
            <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-red-100">
                <Clock className="h-6 w-6 text-red-600" />
              </div>
              <h3 className="mb-3 text-lg font-semibold text-gray-900">
                Timely Delivery
              </h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex gap-2">
                  <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
                  Monthly balance sheets &amp; P&amp;L statements
                </li>
                <li className="flex gap-2">
                  <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
                  Unlimited bookkeeper communication
                </li>
                <li className="flex gap-2">
                  <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
                  Books completed every month on time
                </li>
              </ul>
            </div>

            {/* Financial Insights */}
            <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-red-100">
                <BarChart3 className="h-6 w-6 text-red-600" />
              </div>
              <h3 className="mb-3 text-lg font-semibold text-gray-900">
                Financial Insights
              </h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex gap-2">
                  <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
                  Business health assessment
                </li>
                <li className="flex gap-2">
                  <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
                  Accurate, up-to-date books
                </li>
                <li className="flex gap-2">
                  <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
                  Easy access to financial reports
                </li>
              </ul>
            </div>

            {/* Comprehensive Solutions */}
            <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-red-100">
                <Shield className="h-6 w-6 text-red-600" />
              </div>
              <h3 className="mb-3 text-lg font-semibold text-gray-900">
                Comprehensive Solutions
              </h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex gap-2">
                  <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
                  Tax compliance &amp; organized financials
                </li>
                <li className="flex gap-2">
                  <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
                  Tax-ready records year-round
                </li>
                <li className="flex gap-2">
                  <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
                  Tax consulting &amp; annual planning
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="border-t border-gray-200 bg-white px-4 py-16 md:py-20">
        <div className="mx-auto max-w-3xl space-y-14">
          <div className="flex gap-5">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-red-100">
              <FileText className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                Accurate Financial Records are Essential
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-gray-600">
                MyBookkeepers maintains organized, transparent financial records
                so you can make informed business decisions. Every transaction is
                categorized and reconciled with precision.
              </p>
            </div>
          </div>

          <div className="flex gap-5">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-red-100">
              <Shield className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                Stress-Free Compliance
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-gray-600">
                Never worry during tax season again. Your financial records are
                fully compliant, prepared, and organized — ready for your CPA or
                tax preparer at any time.
              </p>
            </div>
          </div>

          <div className="flex gap-5">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-red-100">
              <TrendingUp className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                Save Time, Focus on Growth
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-gray-600">
                Stop spending hours on bookkeeping. Delegate it to our expert
                team and free up your time for strategic planning and scaling
                your business.
              </p>
            </div>
          </div>

          <div className="flex gap-5">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-red-100">
              <DollarSign className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                Affordable and Transparent Pricing
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-gray-600">
                $189/month with no hidden fees. No additional charges as your
                transaction volume increases. Unlimited bank accounts and
                unlimited transactions included.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="px-4 py-16 md:py-20">
        <div className="mx-auto max-w-4xl">
          <h2 className="mb-12 text-center text-2xl font-bold text-gray-900 md:text-3xl">
            How It Works
          </h2>
          <div className="grid gap-8 md:grid-cols-4">
            {[
              {
                step: 1,
                title: "Sign Up",
                desc: "Complete the form below to start your subscription.",
              },
              {
                step: 2,
                title: "Connect QuickBooks",
                desc: "Grant QuickBooks access and create your portal login.",
              },
              {
                step: 3,
                title: "Upload Your Statements",
                desc: "Upload your bank and credit card statements through your portal.",
              },
              {
                step: 4,
                title: "Receive Reports",
                desc: "We begin bookkeeping and deliver your P&L and balance sheet monthly.",
              },
            ].map(({ step, title, desc }) => (
              <div key={step} className="text-center">
                <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-red-600 text-sm font-bold text-white">
                  {step}
                </div>
                <h3 className="text-sm font-semibold text-gray-900">
                  {title}
                </h3>
                <p className="mt-1 text-xs leading-relaxed text-gray-500">
                  {desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Payment Form Section */}
      <section
        id="signup"
        className="scroll-mt-8 border-t border-gray-200 bg-white px-4 py-16 md:py-20"
      >
        <div className="mx-auto max-w-md">
          <div className="mb-8 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-red-600">
              <BookOpen className="h-7 w-7 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">
              Get Started Today
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              $1.99 today, then $189/month starting {nextMonth} 2nd — Cancel anytime
            </p>
          </div>
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <SubscriptionForm />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-gray-50 px-4 py-10">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-sm font-semibold text-gray-900">
            MyBookkeepers.com
          </p>
          <div className="mt-3 flex flex-col items-center gap-2 text-xs text-gray-500 md:flex-row md:justify-center md:gap-4">
            <span className="flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5" />
              Southlake, Texas
            </span>
            <a
              href="mailto:support@mybookkeepers.com"
              className="flex items-center gap-1 hover:text-red-600"
            >
              <Mail className="h-3.5 w-3.5" />
              support@mybookkeepers.com
            </a>
            <a
              href="tel:1-866-500-7165"
              className="flex items-center gap-1 hover:text-red-600"
            >
              <Phone className="h-3.5 w-3.5" />
              1-866-500-7165
            </a>
          </div>
          <p className="mt-4 text-xs text-gray-400">
            &copy; {new Date().getFullYear()} MyBookkeepers.com. All rights
            reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
