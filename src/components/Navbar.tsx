"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { MiniAppTutorialModal } from "./MiniAppTutorialModal";
import { ThemeSwitcher } from "./ThemeSwitcher";
import { HowItWorksModal } from "./HowItWorksModal";
import { useWallet } from "../hooks/useWallet";
import { SearchBar } from "./SearchBar";

export function Navbar() {
  // Use new simplified wallet hook
  const { isConnected, address, connect, disconnect, isMiniApp, isLoading } =
    useWallet();
  const router = useRouter();

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isAddressDropdownOpen, setIsAddressDropdownOpen] = useState(false);
  const [isTutorialOpen, setIsTutorialOpen] = useState(false);
  const [isHowItWorksOpen, setIsHowItWorksOpen] = useState(false);
  const [isDark, setIsDark] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const truncateAddress = (address: string) => {
    if (!address) return "";
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  // Easter egg function for logo clicking (desktop only - mini-app handling moved to app.tsx)
  const handleLogoClick = () => {
    if (!isMiniApp) {
      router.push("/crowdfund/0x3b3cd21242ba44e9865b066e5ef5d1cc1030cc58");
    }
  };

  useEffect(() => {
    const checkDarkMode = () => {
      const htmlElement = document.documentElement;
      const dataTheme = htmlElement.getAttribute("data-theme");
      const hasClassDark = htmlElement.classList.contains("dark");
      const isDarkMode = dataTheme === "dark" || hasClassDark;

      setIsDark((prevIsDark) =>
        prevIsDark !== isDarkMode ? isDarkMode : prevIsDark
      );
    };

    checkDarkMode();

    const observer = new MutationObserver((mutations) => {
      const relevantChange = mutations.some(
        (mutation) =>
          mutation.type === "attributes" &&
          (mutation.attributeName === "data-theme" ||
            mutation.attributeName === "class")
      );

      if (relevantChange) {
        checkDarkMode();
      }
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class", "data-theme"],
    });

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    mediaQuery.addEventListener("change", checkDarkMode);

    return () => {
      observer.disconnect();
      mediaQuery.removeEventListener("change", checkDarkMode);
    };
  }, []);

  // const handleMiniAppConnect = () => {
  //   const fcConnector = wagmiConnectors.find((c) => c.id === "farcaster");
  //   if (fcConnector) {
  //     wagmiConnect({ connector: fcConnector });
  //   } else {
  //     console.warn(
  //       "Farcaster connector not found. Ensure it's configured in WagmiProvider.tsx and active in the Farcaster client."
  //     );
  //     if (wagmiConnectors.length > 0) {
  //       // wagmiConnect({ connector: wagmiConnectors[0] });
  //     }
  //   }
  // };

  // Mini-app navigation is now handled in app.tsx
  if (isMiniApp) {
    return null;
  }

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#0f1624]/95 backdrop-blur border-b border-[#1f2633]">
        <div className="px-3 sm:px-6 lg:px-12 h-14 flex items-center gap-3">
          <div className="flex items-center flex-none">
            <Link href="/" className="flex items-center">
              <Image
                src="/icon-transparent.png"
                width={36}
                height={36}
                alt="Logo"
                onClick={handleLogoClick}
                className="cursor-pointer"
                priority
              />
            </Link>
          </div>

          {/* Desktop search + stats */}
          <div className="hidden md:flex flex-1 items-center gap-3">
            <div className="flex-1 max-w-md">
              <SearchBar
                value={searchQuery}
                onChange={(value) => setSearchQuery(value)}
                showSuggestions
              />
            </div>
            <div className="flex flex-col text-right leading-tight">
              <span className="text-xs font-semibold text-[var(--lime-primary)]">
                1,242,013,630,860
              </span>
              <span className="text-[10px] uppercase tracking-wide text-[#9aa6bf]">
                rewards earned
              </span>
            </div>
          </div>

          <div className="md:hidden flex items-center gap-2">
            <button
              onClick={() => setIsTutorialOpen(true)}
              className="btn btn-ghost btn-sm btn-circle"
              title="Tutorial"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </button>
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="btn btn-ghost btn-sm"
              aria-label="Toggle menu"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="w-6 h-6"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d={
                    isMenuOpen
                      ? "M6 18L18 6M6 6l12 12"
                      : "M3.75 6.75h16.5M3.75 12h16.5M3.75 17.25h16.5"
                  }
                />
              </svg>
            </button>
          </div>

          <div className="hidden md:flex items-center gap-2">
            <Link
              href="/tokens"
              aria-label="Tokens"
              className="w-9 h-9 rounded-md bg-[#1a2335] border border-[#1f2633] hover:border-[var(--lime-primary)] flex items-center justify-center text-[#e8ecf4] hover:text-[var(--lime-primary)] transition"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="w-4 h-4"
              >
                <rect x="4" y="5" width="16" height="3" rx="1" />
                <rect x="4" y="10.5" width="16" height="3" rx="1" />
                <rect x="4" y="16" width="16" height="3" rx="1" />
              </svg>
            </Link>
            <Link
              href="/tracker"
              aria-label="Tracker"
              className="w-9 h-9 rounded-md bg-[#1a2335] border border-[#1f2633] hover:border-[var(--lime-primary)] flex items-center justify-center text-[#e8ecf4] hover:text-[var(--lime-primary)] transition"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="w-4 h-4"
              >
                <path d="M3 3h18v18H3z" />
                <path d="M9 9h6v6H9z" />
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="12" y1="3" x2="12" y2="21" />
              </svg>
            </Link>
            <Link
              href="/launch"
              aria-label="Launch"
              className="w-9 h-9 rounded-md bg-[var(--lime-primary)] text-[var(--lime-primary-content)] flex items-center justify-center shadow-sm hover:brightness-105 transition"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="2"
                className="w-4 h-4"
              >
                <path d="M5 19l4-1 9-9a2.828 2.828 0 10-4-4l-9 9-1 4z" />
                <path d="M14.5 5.5l4 4" />
              </svg>
            </Link>
            <button
              aria-label="Deposit"
              className="w-9 h-9 rounded-md bg-[#1a2335] border border-[#1f2633] text-[#e8ecf4] hover:border-[var(--lime-primary)] hover:text-[var(--lime-primary)] flex items-center justify-center transition"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="2"
                className="w-4 h-4"
              >
                <path d="M4 7h16M4 11h16M4 15h10" />
                <path d="M17 19l3-3-3-3" />
              </svg>
            </button>
            <button
              onClick={() => setIsTutorialOpen(true)}
              aria-label="Tutorial"
              className="w-9 h-9 rounded-md bg-[#1a2335] border border-[#1f2633] text-[#e8ecf4] hover:border-[var(--lime-primary)] hover:text-[var(--lime-primary)] flex items-center justify-center transition"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </button>

            <ThemeSwitcher />

            {isConnected ? (
              <div className="flex items-center gap-2">
                <div className="relative">
                  <button
                    onClick={() =>
                      setIsAddressDropdownOpen(!isAddressDropdownOpen)
                    }
                    className="btn btn-ghost gap-2"
                    disabled={!address || isLoading}
                  >
                    {address
                      ? truncateAddress(address)
                      : isLoading
                      ? "Connecting..."
                      : "No Address"}
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      className="w-5 h-5"
                    >
                      <path
                        fillRule="evenodd"
                        d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </button>
                  {isAddressDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-base-100 rounded-lg shadow-lg border border-base-300">
                      <Link
                        href="/tokens"
                        onClick={() => setIsAddressDropdownOpen(false)}
                        className="block w-full px-4 py-2 text-left hover:bg-base-200 cursor-pointer"
                      >
                        My Tokens
                      </Link>

                      <Link
                        href="/launched-tokens"
                        onClick={() => setIsAddressDropdownOpen(false)}
                        className="block w-full px-4 py-2 text-left hover:bg-base-200 cursor-pointer"
                      >
                        Launched Tokens
                      </Link>
                      <button
                        onClick={() => {
                          disconnect();
                          setIsAddressDropdownOpen(false);
                        }}
                        className="w-full px-4 py-2 text-left hover:bg-base-200 rounded-lg cursor-pointer"
                      >
                        Logout
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <button
                onClick={connect}
                className="btn btn-ghost"
                disabled={isLoading}
              >
                {isLoading ? "Connecting..." : "Login"}
              </button>
            )}
          </div>
        </div>

        <div
          className={`md:hidden ${
            isMenuOpen ? "block" : "hidden"
          } border-t border-black/[.1] dark:border-white/[.1] bg-background/95 backdrop-blur-sm`}
        >
          <div className="px-4 py-4 space-y-3">
            <SearchBar
              value={searchQuery}
              onChange={(value) => setSearchQuery(value)}
              showSuggestions
            />
            <div className="flex items-center justify-between px-2">
              <div className="text-sm font-semibold">
                1,242,013,630,860
              </div>
              <div className="text-[11px] uppercase tracking-wide opacity-70 text-right">
                rewards earned
              </div>
            </div>
            <Link
              href="/launch"
              className="btn btn-primary w-full justify-start"
            >
              Launch a Token
            </Link>

            <Link
              href="/tracker"
              className="btn btn-primary w-full justify-start"
              onClick={() => setIsMenuOpen(false)}
            >
              📊 Tracker
            </Link>

            {isConnected && (
              <Link
                href="/tokens"
                className="btn btn-accent w-full justify-start"
                onClick={() => setIsMenuOpen(false)}
              >
                My Tokens
              </Link>
            )}

            <div className="flex items-center justify-between w-full px-4 py-2">
              <ThemeSwitcher className="w-full justify-start" />
            </div>

            {isConnected && (
              <Link
                href="/launched-tokens"
                className="btn btn-ghost w-full justify-start"
                onClick={() => setIsMenuOpen(false)}
              >
                Launched Tokens
              </Link>
            )}

            {isConnected ? (
              <button
                onClick={() => {
                  disconnect();
                  setIsMenuOpen(false);
                }}
                className="btn btn-ghost w-full justify-start"
              >
                Logout
              </button>
            ) : (
              <button
                onClick={() => {
                  connect();
                  setIsMenuOpen(false);
                }}
                className="btn btn-ghost w-full justify-start"
                disabled={isLoading}
              >
                {isLoading ? "Connecting..." : "Login"}
              </button>
            )}
          </div>
        </div>
      </nav>

      <HowItWorksModal
        isOpen={isHowItWorksOpen}
        onClose={() => setIsHowItWorksOpen(false)}
      />
      <MiniAppTutorialModal
        isOpen={isTutorialOpen}
        onClose={() => setIsTutorialOpen(false)}
        onSkip={() => setIsTutorialOpen(false)}
      />
    </>
  );
}
