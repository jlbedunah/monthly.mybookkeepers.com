"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ChevronDown, Menu, X } from "lucide-react";

const NAV_ITEMS = [
  { label: "Home", href: "https://mybookkeepers.com/" },
  { label: "About Us", href: "https://mybookkeepers.com/about-us/" },
  { label: "Pricing", href: "https://mybookkeepers.com/bookkeeping-pricing/" },
  {
    label: "Services",
    children: [
      {
        label: "Monthly Bookkeeping",
        href: "https://mybookkeepers.com/monthly-bookkeeping-service/",
      },
      {
        label: "Tax Preparation",
        href: "https://mybookkeepers.com/tax-preparation-mybookkeepers/",
      },
      {
        label: "Catch-Up Bookkeeping",
        href: "https://mybookkeepers.com/catch-up-bookkeeping/",
      },
      {
        label: "Clean-Up Bookkeeping",
        href: "https://mybookkeepers.com/clean-up-bookkeeping/",
      },
      {
        label: "QuickBooks Accountant",
        href: "https://mybookkeepers.com/quickbooks-accountant/",
      },
    ],
  },
  {
    label: "Partnership",
    href: "https://mybookkeepers.com/software-for-accountants-tax-and-bookkeeping-firms/",
  },
  { label: "Contact", href: "https://mybookkeepers.com/contact/" },
];

export function SiteHeader() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [servicesOpen, setServicesOpen] = useState(false);

  return (
    <header className="border-b border-gray-200 bg-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        {/* Logo */}
        <a href="https://mybookkeepers.com/">
          <Image
            src="/My-Bookkeeper-Logo-New (1).png"
            alt="MyBookkeepers.com"
            width={200}
            height={50}
            className="h-10 w-auto"
            priority
          />
        </a>

        {/* Desktop Nav */}
        <nav className="hidden items-center gap-6 md:flex">
          {NAV_ITEMS.map((item) =>
            item.children ? (
              <div
                key={item.label}
                className="relative"
                onMouseEnter={() => setServicesOpen(true)}
                onMouseLeave={() => setServicesOpen(false)}
              >
                <button className="flex items-center gap-1 text-sm text-gray-700 hover:text-red-600">
                  {item.label}
                  <ChevronDown className="h-3.5 w-3.5" />
                </button>
                {servicesOpen && (
                  <div className="absolute left-0 top-full z-50 mt-1 w-56 rounded-lg border border-gray-200 bg-white py-2 shadow-lg">
                    {item.children.map((child) => (
                      <a
                        key={child.label}
                        href={child.href}
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-red-50 hover:text-red-600"
                      >
                        {child.label}
                      </a>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <a
                key={item.label}
                href={item.href}
                className="text-sm text-gray-700 hover:text-red-600"
              >
                {item.label}
              </a>
            )
          )}
          <Link
            href="/api/auth/signin"
            className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
          >
            Sign In
          </Link>
        </nav>

        {/* Mobile Menu Button */}
        <button
          className="md:hidden"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle menu"
        >
          {mobileOpen ? (
            <X className="h-6 w-6 text-gray-700" />
          ) : (
            <Menu className="h-6 w-6 text-gray-700" />
          )}
        </button>
      </div>

      {/* Mobile Nav */}
      {mobileOpen && (
        <nav className="border-t border-gray-200 bg-white px-4 pb-4 md:hidden">
          {NAV_ITEMS.map((item) =>
            item.children ? (
              <div key={item.label}>
                <button
                  onClick={() => setServicesOpen(!servicesOpen)}
                  className="flex w-full items-center justify-between py-3 text-sm text-gray-700"
                >
                  {item.label}
                  <ChevronDown
                    className={`h-4 w-4 transition ${servicesOpen ? "rotate-180" : ""}`}
                  />
                </button>
                {servicesOpen && (
                  <div className="pb-2 pl-4">
                    {item.children.map((child) => (
                      <a
                        key={child.label}
                        href={child.href}
                        className="block py-2 text-sm text-gray-600 hover:text-red-600"
                      >
                        {child.label}
                      </a>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <a
                key={item.label}
                href={item.href}
                className="block py-3 text-sm text-gray-700 hover:text-red-600"
              >
                {item.label}
              </a>
            )
          )}
          <Link
            href="/api/auth/signin"
            className="mt-2 block rounded-lg bg-red-600 px-4 py-2 text-center text-sm font-medium text-white hover:bg-red-700"
          >
            Sign In
          </Link>
        </nav>
      )}
    </header>
  );
}
