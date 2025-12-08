"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import FarcasterIcon from "@/public/farcaster.svg";
// import { SearchBar } from "./SearchBar";
// import { SortMenu } from "./SortMenu";
import { Token } from "../app/types/token";
import { calculateRewards, REWARDS_PER_SECOND } from "@/src/lib/rewards";
import { useRewardCounter } from "@/src/hooks/useStreamingNumber";
import { CROWDFUND_TOKEN_ADDRESSES } from "@/src/lib/crowdfundTokens";
import { VERIFIED_TOKENS } from "@/src/lib/constants";
import { memo } from "react";
import SafeImage from "@/src/components/SafeImage";

interface TokenGridProps {
  tokens: Token[];
  searchQuery: string;
  sortBy: SortOption;
  isMiniApp?: boolean;
  isSearchMode?: boolean;
}

export type SortOption =
  | "marketCap"
  | "newest"
  | "oldest"
  | "trending"
  | "crowdfunds";

// Interface for the streme.fun API response
interface StremeTokenResponse {
  id: number;
  created_at: string;
  tx_hash: string;
  contract_address: string;
  requestor_fid: number;
  deployer: string;
  name: string;
  symbol: string;
  img_url: string;
  pool_address: string;
  cast_hash: string;
  type: string;
  pair: string;
  chain_id: number;
  metadata: Record<string, unknown>;
  tokenFactory: string;
  postDeployHook: string;
  liquidityFactory: string;
  postLpHook: string;
  poolConfig: {
    tick: number;
    pairedToken: string;
    devBuyFee: number;
  };
  timestamp: { _seconds: number; _nanoseconds: number };
  staking_pool: string;
  staking_address: string;
  pfp_url: string;
  username: string;
  channel?: string;
  marketData?: {
    marketCap: number;
    price: number;
    priceChange1h: number;
    priceChange24h: number;
    priceChange5m: number;
    volume24h: number;
    lastUpdated: { _seconds: number; _nanoseconds: number };
  };
  lastTraded?: { _seconds: number; _nanoseconds: number };
}

const isValidImageUrl = (url: string | null | undefined): boolean => {
  if (!url) return false;
  if (url.startsWith("/")) return true;
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

// Function to fetch trending tokens from the streme.fun API (exported for carousel)
export const fetchTrendingTokens = async (): Promise<Token[]> => {
  try {
    const response = await fetch("/api/tokens/trending?type=all");
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const trendingData: StremeTokenResponse[] = await response.json();

    // Transform API response to match Token interface
    return trendingData.map((apiToken) => ({
      id: apiToken.id,
      created_at: apiToken.created_at,
      tx_hash: apiToken.tx_hash,
      contract_address: apiToken.contract_address,
      requestor_fid: apiToken.requestor_fid,
      name: apiToken.name,
      symbol: apiToken.symbol,
      img_url: apiToken.img_url,
      pool_address: apiToken.pool_address,
      cast_hash: apiToken.cast_hash,
      type: apiToken.type,
      pair: apiToken.pair,
      chain_id: apiToken.chain_id,
      metadata: apiToken.metadata,
      profileImage: null, // Not in API response
      pool_id: apiToken.pool_address, // Use pool_address as pool_id
      staking_pool: apiToken.staking_pool,
      staking_address: apiToken.staking_address,
      pfp_url: apiToken.pfp_url,
      username: apiToken.username,
      timestamp: apiToken.timestamp,
      // Use market data directly from streme.fun API
      marketData: apiToken.marketData,
      price: apiToken.marketData?.price,
      marketCap: apiToken.marketData?.marketCap,
      volume24h: apiToken.marketData?.volume24h,
      change1h: apiToken.marketData?.priceChange1h,
      change24h: apiToken.marketData?.priceChange24h,
      creator: {
        name: apiToken.username,
        score: 0, // Not available in API
        recasts: 0, // Not available in API
        likes: 0, // Not available in API
        profileImage: apiToken.pfp_url,
      },
    }));
  } catch (error) {
    console.error("Error fetching trending tokens:", error);
    return [];
  }
};

// Interface for pagination metadata
export interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  totalResults: number;
  hasMore: boolean;
}

// Function to fetch sorted tokens from Typesense (exported for TokenGrid)
export const fetchSortedTokens = async (
  sortBy: "newest" | "oldest" | "marketCap",
  page: number = 1,
  limit: number = 36,
  filter?: "crowdfunds"
): Promise<{ tokens: Token[]; pagination: PaginationInfo }> => {
  try {
    const params = new URLSearchParams({
      sortBy,
      page: page.toString(),
      limit: limit.toString(),
    });

    if (filter) {
      params.set("filter", filter);
    }

    const response = await fetch(`/api/tokens/sorted?${params.toString()}`);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    return {
      tokens: data.data || [],
      pagination: data.pagination || {
        currentPage: page,
        totalPages: 0,
        totalResults: 0,
        hasMore: false,
      },
    };
  } catch (error) {
    console.error("Error fetching sorted tokens:", error);
    return {
      tokens: [],
      pagination: {
        currentPage: page,
        totalPages: 0,
        totalResults: 0,
        hasMore: false,
      },
    };
  }
};

// Trending Token Carousel Card Component (exported for carousel)
export const TrendingTokenCard = ({
  token,
}: {
  token: Token & { rewards?: number; totalStakers?: number };
}) => {
  const router = useRouter();

  const formatMarketCap = (marketCap: number | undefined) => {
    if (!marketCap) return "-";
    if (marketCap >= 1000000) return `${(marketCap / 1000000).toFixed(1)}M`;
    if (marketCap >= 1000) return `${(marketCap / 1000).toFixed(1)}K`;
    return marketCap.toFixed(0);
  };

  const formatVolume = (volume: number | undefined) => {
    if (!volume) return "-";
    if (volume >= 1000) return `${(volume / 1000).toFixed(1)}k`;
    return volume.toFixed(0);
  };

  return (
    <Link href={`/token/${token.contract_address}`}>
      <div className="relative bg-base-100 rounded-xl border border-base-300 overflow-hidden ease-out transition-all duration-300 cursor-pointer group">
        {/* Token Image */}
        <div className="relative aspect-square bg-gradient-to-br from-primary/10 to-secondary/10">
          {isValidImageUrl(token.img_url) ? (
            <SafeImage
              src={token.img_url}
              alt={token.name}
              fill
              className="object-cover"
              unoptimized={
                token.img_url?.includes(".gif") ||
                token.img_url?.includes("imagedelivery.net")
              }
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-3xl font-bold text-primary">
              ${token.symbol}
            </div>
          )}

          {/* Semi-transparent gradient overlay - darker at bottom - only for images */}

          <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-black/5 to-transparent" />

          {/* Verified badge and version label */}
          <div className="absolute top-2 left-2 flex items-center gap-2 z-10">
            {VERIFIED_TOKENS.includes(token.contract_address.toLowerCase()) && (
              <div
                className="bg-blue-500/90 backdrop-blur-sm rounded-full p-1 flex items-center justify-center"
                title="Verified Token"
              >
                <svg
                  className="w-4 h-4 text-white"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
            )}
          </div>

          {/* Creator avatar overlay */}
          {token.creator &&
            token.creator.name &&
            token.creator.name.trim() &&
            token.creator.name.toLowerCase() !== "anon" && (
              <div className="absolute bottom-2 left-2 flex items-center gap-2 z-10">
                <div className="avatar">
                  <div className="w-6 h-6 rounded-full">
                    <SafeImage
                      src={
                        token.creator.profileImage?.trim()
                          ? token.creator.profileImage
                          : isValidImageUrl(token.img_url)
                          ? token.img_url
                          : `/avatars/${token.creator.name.trim()}.png`
                      }
                      alt={token.creator.name}
                      width={24}
                      height={24}
                      fallbackSrc={`/avatars/${token.creator.name.trim()}.png`}
                    />
                  </div>
                </div>
                <span className="text-xs font-medium text-white drop-shadow-lg">
                  @{token.creator.name}
                </span>
              </div>
            )}
        </div>

        {/* Token Info */}
        <div className="p-3 space-y-2">
          {/* Token Name and Symbol on same line */}
          <div className="flex items-baseline gap-2">
            <h3 className="font-bold text-base truncate">{token.name}</h3>
            <p className="text-xs opacity-60 uppercase flex-shrink-0">
              {token.symbol}
            </p>
          </div>

          {/* Stats in one row */}
          <div className="flex items-center justify-between gap-3">
            {/* Market Cap */}
            <div className="flex flex-col">
              <p className="text-[10px] opacity-60 uppercase">MCAP</p>
              <p className="font-mono font-bold text-sm">
                ${formatMarketCap(token.marketCap)}
              </p>
            </div>

            {/* 24h Volume */}
            <div className="flex flex-col">
              <p className="text-[10px] opacity-60 uppercase">Volume</p>
              <p className="font-mono text-sm">
                ${formatVolume(token.volume24h)}
              </p>
            </div>

            {/* 24h Change */}
            <div className="flex flex-col">
              <p className="text-[10px] opacity-60 uppercase">24H Δ</p>
              <p
                className={`font-mono font-bold text-sm ${
                  token.change24h && token.change24h >= 0
                    ? "text-green-500"
                    : "text-red-500"
                }`}
              >
                {token.change24h
                  ? `${
                      token.change24h >= 0 ? "+" : ""
                    }${token.change24h.toFixed(1)}%`
                  : "-"}
              </p>
            </div>
          </div>

          {/* Trade Button and Crowdfund link */}
          <div className="flex gap-2 pt-2">
            {/* Show Crowdfund button for STREME and BUTTHOLE tokens */}
            {token.contract_address.toLowerCase() ===
              "0x3b3cd21242ba44e9865b066e5ef5d1cc1030cc58" ||
            token.contract_address.toLowerCase() ===
              "0x1c4f69f14cf754333c302246d25a48a13224118a" ? (
              <>
                <button className="btn btn-sm btn-outline btn-primary flex-1">
                  Trade
                </button>
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    const crowdfundUrl =
                      token.contract_address.toLowerCase() ===
                      "0x3b3cd21242ba44e9865b066e5ef5d1cc1030cc58"
                        ? "/crowdfund/0x3b3cd21242ba44e9865b066e5ef5d1cc1030cc58"
                        : "/crowdfund/0x1c4f69f14cf754333c302246d25a48a13224118a";
                    router.push(crowdfundUrl);
                  }}
                  className="btn btn-sm btn-outline btn-accent flex-1"
                >
                  Crowdfund
                </button>
              </>
            ) : (
              <button className="btn btn-primary btn-outline btn-sm w-full">
                Trade
              </button>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
};

// Trending Tokens Carousel Component (exported for use in app.tsx)
export const TrendingTokensCarousel = ({
  tokens,
  isMiniApp = false,
}: {
  tokens: Array<Token & { rewards?: number; totalStakers?: number }>;
  isMiniApp?: boolean;
}) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const checkScrollButtons = () => {
    if (scrollContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } =
        scrollContainerRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
    }
  };

  useEffect(() => {
    checkScrollButtons();
    const container = scrollContainerRef.current;
    if (container) {
      container.addEventListener("scroll", checkScrollButtons);
      window.addEventListener("resize", checkScrollButtons);

      return () => {
        container.removeEventListener("scroll", checkScrollButtons);
        window.removeEventListener("resize", checkScrollButtons);
      };
    }
  }, [tokens]);

  const scroll = (direction: "left" | "right") => {
    if (scrollContainerRef.current) {
      const scrollAmount = isMiniApp ? 270 : 400;
      const currentScroll = scrollContainerRef.current.scrollLeft;
      const targetScroll =
        direction === "left"
          ? currentScroll - scrollAmount
          : currentScroll + scrollAmount;

      scrollContainerRef.current.scrollTo({
        left: targetScroll,
        behavior: "smooth",
      });
    }
  };

  if (!tokens || tokens.length === 0) return null;

  return (
    <div className="mb-2 sm:mb-6">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-xl font-bold">Trending</h2>
        <div className="flex gap-2 z-10 relative">
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              console.log("Left scroll clicked");
              scroll("left");
            }}
            disabled={!canScrollLeft}
            className={`btn btn-circle btn-sm hover:btn-primary ${
              !canScrollLeft ? "btn-disabled opacity-50" : "btn-ghost"
            }`}
            aria-label="Scroll left"
            type="button"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              console.log("Right scroll clicked");
              scroll("right");
            }}
            disabled={!canScrollRight}
            className={`btn btn-circle btn-sm hover:btn-primary ${
              !canScrollRight ? "btn-disabled opacity-50" : "btn-ghost"
            }`}
            aria-label="Scroll right"
            type="button"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </button>
        </div>
      </div>

      <div className="relative">
        <div
          ref={scrollContainerRef}
          className="flex gap-1 overflow-x-auto scrollbar-hide pb-2 [&::-webkit-scrollbar]:hidden"
          style={{
            scrollbarWidth: "none",
            msOverflowStyle: "none",
          }}
        >
          {tokens.slice(0, 10).map((token) => (
            <div
              key={token.contract_address}
              className={`flex-none ${isMiniApp ? "w-64" : "w-56"}`}
            >
              <TrendingTokenCard token={token} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const TokenCardComponent = memo(
  ({
    token,
    isMiniApp = false,
  }: {
    token: Token & { rewards: number; totalStakers: number };
    isMiniApp?: boolean;
  }) => {
    useEffect(() => {
      if (!token.creator) {
        console.log("Missing creator for token:", {
          name: token.name,
          symbol: token.symbol,
          address: token.contract_address,
        });
      }
    }, [token]);

    // Helper function to shorten hash
    const shortenHash = (hash: string | undefined) => {
      if (!hash) return "";
      return hash.slice(0, 10);
    };

    const handleFarcasterClick = (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      window.open(
        `https://farcaster.xyz/${token.creator?.name}/${shortenHash(
          token.cast_hash
        )}`,
        "_blank",
        "noopener,noreferrer"
      );
    };

    const handleCopyAddress = (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (navigator?.clipboard?.writeText) {
        navigator.clipboard.writeText(token.contract_address).catch(() => {
          /* no-op */
        });
      }
    };

    const formatCompactNumber = (value: number | undefined) => {
      if (value === null || value === undefined || Number.isNaN(value)) {
        return "-";
      }
      const abs = Math.abs(value);
      if (abs >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
      if (abs >= 1_000) return `$${(value / 1_000).toFixed(1)}K`;
      return `$${value.toFixed(0)}`;
    };

    const formatRelativeTime = (dateStr: string | undefined) => {
      if (!dateStr) return "-";
      const diffSeconds = Math.max(
        1,
        Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000)
      );
      if (diffSeconds < 60) return `${diffSeconds}s`;
      const diffMinutes = Math.floor(diffSeconds / 60);
      if (diffMinutes < 60) return `${diffMinutes}m`;
      const diffHours = Math.floor(diffMinutes / 60);
      if (diffHours < 24) return `${diffHours}h`;
      const diffDays = Math.floor(diffHours / 24);
      return `${diffDays}d`;
    };

    const changeValue =
      token.change24h ??
      token.marketData?.priceChange24h ??
      token.marketData?.priceChange1h ??
      token.marketData?.priceChange5m ??
      null;
    const changeColor =
      changeValue === null
        ? ""
        : changeValue >= 0
        ? "text-success"
        : "text-error";
    const changeDisplay =
      changeValue === null
        ? "-"
        : `${changeValue >= 0 ? "+" : ""}${changeValue.toFixed(1)}%`;
    const relativeCreated = formatRelativeTime(token.created_at);
    const marketCapDisplay = formatCompactNumber(token.marketCap);
    const volumeDisplay = formatCompactNumber(token.volume24h);

    return (
      <Link href={`/token/${token.contract_address}`} className="block group">
        <div className="flex items-center gap-2.5 rounded-lg border border-base-300/80 bg-base-100/90 p-2.5 transition-all duration-200 hover:-translate-y-[1px] hover:border-[var(--lime-primary)] hover:bg-[rgba(215,255,69,0.12)] hover:shadow-lg">
          <div className="relative h-[58px] w-[58px] shrink-0 rounded-2xl bg-gradient-to-br from-primary/15 via-base-200/40 to-secondary/20 p-[3px]">
            <div className="relative h-full w-full overflow-hidden rounded-xl bg-base-200/80">
              {isValidImageUrl(token.img_url) ? (
                <SafeImage
                  src={token.img_url}
                  alt={token.name}
                  fill
                  sizes="58px"
                  className="object-cover transition-transform duration-300 group-hover:scale-110"
                  unoptimized={
                    token.img_url?.includes(".gif") ||
                    token.img_url?.includes("imagedelivery.net")
                  }
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-primary text-sm font-mono font-bold text-primary-content">
                  ${token.symbol.slice(0, 6)}
                  {token.symbol.length > 6 && "..."}
                </div>
              )}
            </div>
            <div className="pointer-events-none absolute inset-0 rounded-2xl ring-1 ring-white/10 shadow-inner" />
            {VERIFIED_TOKENS.includes(token.contract_address.toLowerCase()) && (
              <div
                className="absolute -bottom-1 -right-1 rounded-full bg-success p-[3px] text-white shadow-sm"
                title="Verified Token"
              >
                <svg className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                  <path
                    fillRule="evenodd"
                    d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
            )}
          </div>

          <div className="flex min-w-0 flex-1 flex-col gap-1.5">
            <div className="flex items-start gap-1.5 min-w-0">
              <div className="min-w-0">
                <h2
                  className="truncate text-[15px] font-semibold leading-tight group-hover:text-primary"
                  title={token.name}
                >
                  {token.name}
                </h2>
                <p className="truncate text-[12px] text-base-content/60">
                  {token.symbol} · {relativeCreated}
                </p>
              </div>
              <div className="ml-auto flex items-start gap-1.5">
                <div className="flex items-center gap-1 rounded-lg bg-base-200/80 px-2 py-0.5 text-[11px] font-mono">
                  <span className="text-[10px] uppercase text-base-content/60">
                    MC
                  </span>
                  <span className="font-semibold group-hover:text-primary">
                    {marketCapDisplay}
                  </span>
                </div>
                <button
                  onClick={handleCopyAddress}
                  className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-base-300/70 bg-base-200/70 text-xs text-base-content/70 transition hover:border-primary/50 hover:text-primary"
                  title="Copy contract address"
                  aria-label="Copy contract address"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-3.5 w-3.5"
                  >
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="flex items-center gap-1.5 text-[12px] text-base-content/70">
              <div className="flex items-center gap-1.5 min-w-0">
                <div className="avatar h-6 w-6">
                  <div className="h-6 w-6 rounded-full ring ring-base-200 ring-offset-1 ring-offset-base-100 transition-transform duration-300 group-hover:scale-105">
                    <SafeImage
                      src={
                        token.creator?.profileImage &&
                        token.creator.profileImage.trim() !== ""
                          ? token.creator.profileImage
                          : isValidImageUrl(token.img_url)
                          ? token.img_url
                          : `/avatars/${
                              token.creator?.name?.trim() || "streme"
                            }.png`
                      }
                      alt={
                        token.creator?.name ||
                        `${token.contract_address.slice(
                          0,
                          6
                        )}...${token.contract_address.slice(-4)}`
                      }
                      width={24}
                      height={24}
                      sizes="24px"
                      fallbackSrc={`/avatars/${
                        token.creator?.name?.trim() || "streme"
                      }.png`}
                      unoptimized={
                        token.creator?.profileImage?.includes(".gif") ||
                        token.creator?.profileImage?.includes(
                          "imagedelivery.net"
                        ) ||
                        token.img_url?.includes(".gif") ||
                        token.img_url?.includes("imagedelivery.net")
                      }
                    />
                  </div>
                </div>
                <span className="flex items-center gap-1 truncate font-medium">
                  <span
                    className="truncate"
                    title={
                      token.creator?.name?.trim() ||
                      `${token.contract_address.slice(
                        0,
                        6
                      )}...${token.contract_address.slice(-4)}`
                    }
                  >
                    {token.creator?.name?.trim() ||
                      `${token.contract_address.slice(
                        0,
                        6
                      )}...${token.contract_address.slice(-4)}`}
                  </span>
                  {token.cast_hash && token.creator?.name?.trim() && (
                    <button
                      onClick={handleFarcasterClick}
                      className="inline-flex items-center justify-center rounded-full bg-base-200/80 p-1 text-[10px] transition hover:bg-primary/10 hover:text-primary"
                      title="View on Farcaster"
                    >
                      <Image
                        src={FarcasterIcon}
                        alt={`View on Farcaster`}
                        width={12}
                        height={12}
                        className="opacity-80 group-hover:opacity-100"
                      />
                    </button>
                  )}
                </span>
              </div>
              <span
                className={`ml-auto inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                  changeColor || "bg-base-200/60 text-base-content/70"
                } ${changeColor ? "bg-base-200/50" : ""}`}
              >
                <span className="h-1.5 w-1.5 rounded-full bg-current" />
                {changeDisplay} 24h
              </span>
            </div>

            <div className="flex items-center gap-1.5 text-[12px] font-mono">
              <div className="flex items-center gap-1 rounded-lg bg-base-200/80 px-2 py-0.5">
                <span className="text-[10px] uppercase text-base-content/60">
                  VOL
                </span>
                <span className="font-semibold">{volumeDisplay}</span>
              </div>
              <div className="ml-auto">
                <RewardsDisplay
                  rewards={token.rewards}
                  symbol={token.symbol}
                  totalStakers={token.totalStakers}
                  isMiniApp={isMiniApp}
                />
              </div>
            </div>
          </div>
        </div>
      </Link>
    );
  }
);

TokenCardComponent.displayName = "TokenCardComponent";

// Memoized rewards display to prevent re-renders of the entire card during animation
const RewardsDisplay = memo(
  ({
    rewards,
    symbol,
    totalStakers,
    isMiniApp,
  }: {
    rewards: number;
    symbol: string;
    totalStakers: number;
    isMiniApp?: boolean;
  }) => {
    const { currentRewards, elementRef } = useRewardCounter(
      rewards,
      REWARDS_PER_SECOND,
      isMiniApp ? 200 : 150
    );

    const fullRewardsDisplay = currentRewards.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

    return (
      <div
        ref={elementRef}
        className="flex items-center gap-1.5 rounded-lg bg-base-200/70 px-2 py-0.5 text-[11px] font-mono whitespace-nowrap"
      >
        <span className="text-[10px] uppercase tracking-wide text-base-content/60">
          Earn
        </span>
        <span className="font-semibold leading-none group-hover:text-primary transition-colors duration-300 max-w-[110px] overflow-hidden text-ellipsis">
          <span title={fullRewardsDisplay} aria-label={fullRewardsDisplay} className="inline-block max-w-full overflow-hidden text-ellipsis align-middle">
            {fullRewardsDisplay}
          </span>
        </span>
        <span className="text-[11px] text-base-content/70">${symbol}</span>
        <span className="text-[10px] text-base-content/50">
          ({totalStakers} {totalStakers === 1 ? "stk" : "stk"})
        </span>
      </div>
    );
  }
);

RewardsDisplay.displayName = "RewardsDisplay";

export function TokenGrid({
  tokens,
  searchQuery,
  sortBy,
  isMiniApp = false,
  isSearchMode = false,
}: TokenGridProps) {
  const [displayedTokens, setDisplayedTokens] = useState<
    Array<Token & { rewards: number; totalStakers: number }>
  >([]);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItemsCount, setTotalItemsCount] = useState(0);
  const [isFetchingTrending, setIsFetchingTrending] = useState(false);
  const [isEnrichingTrending, setIsEnrichingTrending] = useState(false);
  const trendingTokensRef = useRef<Token[]>([]);
  const trendingCacheRef = useRef<
    Array<Token & { rewards: number; totalStakers: number }>
  >([]);

  const TOKENS_PER_PAGE = 36;

  // Fetch trending tokens when sortBy is "trending"
  useEffect(() => {
    if (sortBy === "trending") {
      setIsFetchingTrending(true);
      const fetchTrending = async () => {
        try {
          const trending = await fetchTrendingTokens();
          trendingTokensRef.current = trending;

          // Show tokens immediately with placeholder data for fast initial render
          if (trending.length > 0) {
            const placeholderTokens = trending
              .slice(0, TOKENS_PER_PAGE)
              .map((token) => ({
                ...token,
                rewards: 0, // Placeholder
                totalStakers: 0, // Placeholder
              }));
            setDisplayedTokens(placeholderTokens);
            setTotalItemsCount(trending.length);

            // Start enriching the first page in the background
            setIsEnrichingTrending(true);
            enrichFirstPageTrending(trending.slice(0, TOKENS_PER_PAGE));
          }
        } finally {
          setIsFetchingTrending(false);
        }
      };
      fetchTrending();
    } else {
      // Clear trending tokens when not in trending mode
      trendingTokensRef.current = [];
      trendingCacheRef.current = [];
      setIsFetchingTrending(false);
      setIsEnrichingTrending(false);
    }
  }, [sortBy]);

  // Helper function to enrich first page of trending tokens progressively
  const enrichFirstPageTrending = async (firstPageTokens: Token[]) => {
    try {
      // Check if we have cached data for these tokens
      const cachedTokens = trendingCacheRef.current;
      const cachedAddresses = new Set(
        cachedTokens.map((t) => t.contract_address)
      );

      // Separate tokens that need enrichment vs those that are cached
      const tokensToEnrich = firstPageTokens.filter(
        (token) => !cachedAddresses.has(token.contract_address)
      );
      const alreadyEnriched = firstPageTokens.map((token) => {
        const cached = cachedTokens.find(
          (c) => c.contract_address === token.contract_address
        );
        return cached || { ...token, rewards: 0, totalStakers: 0 };
      });

      // If we have some cached data, show it immediately
      if (alreadyEnriched.some((t) => t.rewards > 0 || t.totalStakers > 0)) {
        setDisplayedTokens(alreadyEnriched);
      }

      // Enrich tokens progressively in smaller batches for better UX
      const BATCH_SIZE = 6; // Smaller batches for progressive loading
      const enrichedResults: Array<
        Token & { rewards: number; totalStakers: number }
      > = [...alreadyEnriched];

      for (let i = 0; i < tokensToEnrich.length; i += BATCH_SIZE) {
        const batch = tokensToEnrich.slice(i, i + BATCH_SIZE);

        // Enrich this batch using individual API calls (more reliable)
        const enrichedBatch = await Promise.all(
          batch.map(async (token) => {
            try {
              const { totalStreamed, totalStakers } = await calculateRewards(
                token.created_at,
                token.contract_address,
                token.staking_pool
              );
              return {
                ...token,
                rewards: totalStreamed,
                totalStakers,
              };
            } catch (error) {
              console.warn(
                `Failed to enrich token ${token.contract_address}:`,
                error
              );
              return {
                ...token,
                rewards: 0,
                totalStakers: 0,
              };
            }
          })
        );

        // Update the results array with enriched data
        enrichedBatch.forEach((enrichedToken) => {
          const index = enrichedResults.findIndex(
            (t) => t.contract_address === enrichedToken.contract_address
          );
          if (index !== -1) {
            enrichedResults[index] = enrichedToken;
          }
        });

        // Update the display immediately with this batch
        setDisplayedTokens([...enrichedResults]);

        // Update cache
        const newCacheEntries = enrichedBatch.filter(
          (token) => !cachedAddresses.has(token.contract_address)
        );
        trendingCacheRef.current = [
          ...trendingCacheRef.current,
          ...newCacheEntries,
        ];
      }
    } catch (error) {
      console.error("Error enriching trending tokens:", error);
    } finally {
      setIsEnrichingTrending(false);
    }
  };

  useEffect(() => {
    setCurrentPage(1);
    // Only clear displayed tokens if we're actually changing the data source or search
    // Don't clear when just switching between trending and other sorts if we have data
    const shouldClearTokens =
      searchQuery.trim() !== "" || // Always clear for search
      (sortBy !== "trending" && displayedTokens.length > 0) || // Clear when switching away from trending
      (sortBy === "trending" && trendingTokensRef.current.length === 0); // Clear trending if no trending data

    if (shouldClearTokens) {
      setDisplayedTokens([]);
    }
    setTotalItemsCount(0);
  }, [tokens, sortBy, searchQuery]); // Added searchQuery to reset pagination when search changes

  // Helper to enrich a batch of tokens with rewards and stakers data
  const enrichTokenBatch = async (batch: Token[]) => {
    return Promise.all(
      batch.map(async (token) => {
        // If token already has rewards/stakers, use them
        if ("rewards" in token && "totalStakers" in token) {
          return token as Token & { rewards: number; totalStakers: number };
        }

        // Check trending cache first
        if (sortBy === "trending") {
          const cached = trendingCacheRef.current.find(
            (c) => c.contract_address === token.contract_address
          );
          if (cached) {
            return cached;
          }
        }

        const { totalStreamed, totalStakers } = await calculateRewards(
          token.created_at,
          token.contract_address,
          token.staking_pool
        );
        return {
          ...token,
          rewards: totalStreamed,
          totalStakers,
        };
      })
    );
  };

  // Helper to sort tokens by date
  const sortTokensByDate = (
    tokensToSort: Array<Token & { rewards?: number; totalStakers?: number }>, // Allow optional for initial sort
    sortOrder: "newest" | "oldest"
  ) => {
    return [...tokensToSort].sort((a, b) => {
      if (sortOrder === "newest") {
        return (
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
      } else {
        // oldest
        return (
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        );
      }
    });
  };

  // Main data processing effect: handles filtering, searching, sorting, and pagination
  useEffect(() => {
    // Don't process if we're still fetching trending tokens
    if (sortBy === "trending" && isFetchingTrending) {
      return;
    }

    // For trending, if we already have displayed tokens from the fast path, don't override them
    if (
      sortBy === "trending" &&
      displayedTokens.length > 0 &&
      currentPage === 1 &&
      !searchQuery.trim()
    ) {
      return;
    }

    const fetchDataAndProcess = async () => {
      setIsLoadingMore(true);

      try {
        // Determine data source based on sortBy
        let sourceTokens: Token[];
        let paginationInfo: PaginationInfo | undefined;

        if (sortBy === "trending") {
          // Use existing trending logic
          sourceTokens = trendingTokensRef.current;

          if (!sourceTokens || sourceTokens.length === 0) {
            if (!isFetchingTrending && !isLoadingMore) {
              if (displayedTokens.length > 0) setDisplayedTokens([]);
              if (totalItemsCount > 0) setTotalItemsCount(0);
            }
            setIsLoadingMore(false);
            return;
          }

          // Apply search filter if needed
          if (searchQuery.trim() && !isSearchMode) {
            const searchLower = searchQuery.toLowerCase().trim();
            sourceTokens = sourceTokens.filter((token) => {
              const nameMatch =
                token.name &&
                typeof token.name === "string" &&
                token.name.toLowerCase().includes(searchLower);
              const symbolMatch =
                token.symbol &&
                typeof token.symbol === "string" &&
                token.symbol.toLowerCase().includes(searchLower);
              const creatorNameMatch =
                token.creator &&
                token.creator.name &&
                typeof token.creator.name === "string" &&
                token.creator.name.toLowerCase().includes(searchLower);
              return nameMatch || symbolMatch || creatorNameMatch;
            });
          }

          // Client-side pagination for trending
          setTotalItemsCount(sourceTokens.length);
          const startIndex = (currentPage - 1) * TOKENS_PER_PAGE;
          const endIndex = currentPage * TOKENS_PER_PAGE;
          sourceTokens = sourceTokens.slice(startIndex, endIndex);
        } else if (sortBy === "crowdfunds") {
          // Use Typesense with crowdfund filter
          const response = await fetchSortedTokens(
            "newest",
            currentPage,
            TOKENS_PER_PAGE,
            "crowdfunds"
          );
          sourceTokens = response.tokens;
          paginationInfo = response.pagination;
        } else if (["newest", "oldest", "marketCap"].includes(sortBy)) {
          // Use Typesense server-side sorting
          const response = await fetchSortedTokens(
            sortBy as "newest" | "oldest" | "marketCap",
            currentPage,
            TOKENS_PER_PAGE
          );
          sourceTokens = response.tokens;
          paginationInfo = response.pagination;
        } else {
          // Fallback to tokens prop (shouldn't happen with current SortOption types)
          sourceTokens = tokens;

          // Apply search filter if needed
          if (searchQuery.trim() && !isSearchMode) {
            const searchLower = searchQuery.toLowerCase().trim();
            sourceTokens = sourceTokens.filter((token) => {
              const nameMatch =
                token.name &&
                typeof token.name === "string" &&
                token.name.toLowerCase().includes(searchLower);
              const symbolMatch =
                token.symbol &&
                typeof token.symbol === "string" &&
                token.symbol.toLowerCase().includes(searchLower);
              const creatorNameMatch =
                token.creator &&
                token.creator.name &&
                typeof token.creator.name === "string" &&
                token.creator.name.toLowerCase().includes(searchLower);
              return nameMatch || symbolMatch || creatorNameMatch;
            });
          }

          // Client-side pagination for fallback
          setTotalItemsCount(sourceTokens.length);
          const startIndex = (currentPage - 1) * TOKENS_PER_PAGE;
          const endIndex = currentPage * TOKENS_PER_PAGE;
          sourceTokens = sourceTokens.slice(startIndex, endIndex);
        }

        // Update total items count from pagination if available
        if (paginationInfo) {
          setTotalItemsCount(paginationInfo.totalResults);
        }

        // Enrich tokens with rewards and stakers data
        const finalPageBatch = await enrichTokenBatch(sourceTokens);

        if (currentPage === 1) {
          setDisplayedTokens(finalPageBatch);
        } else {
          if (finalPageBatch.length > 0) {
            // Deduplicate before appending, ensuring keys are unique for React
            setDisplayedTokens((prev) => {
              const existingKeys = new Set(prev.map((t) => t.contract_address));
              const newUniqueTokens = finalPageBatch.filter(
                (t) => !existingKeys.has(t.contract_address)
              );
              return [...prev, ...newUniqueTokens];
            });
          }
        }
        setIsLoadingMore(false);
      } catch (error) {
        console.error("Error fetching/processing tokens:", error);
        setIsLoadingMore(false);
      }
    };

    fetchDataAndProcess();
  }, [tokens, currentPage, sortBy, searchQuery]); // Removed isFetchingTrending to prevent refresh loops

  // Handle loading more tokens
  const handleLoadMore = () => {
    if (!isLoadingMore && displayedTokens.length < totalItemsCount) {
      setCurrentPage((prev) => prev + 1);
    }
  };

  // Calculate if there are more tokens to load
  const hasMoreTokens =
    displayedTokens.length < totalItemsCount && displayedTokens.length > 0;

  return (
    <div className="mt-2 pb-8 md:pb-24">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-1">
        {displayedTokens.map((token) => (
          <TokenCardComponent
            key={token.contract_address}
            token={token}
            isMiniApp={isMiniApp}
          />
        ))}
      </div>
      {displayedTokens.length === 0 &&
        totalItemsCount === 0 &&
        searchQuery.trim() !== "" && (
          <div className="text-center py-12 opacity-60">
            No tokens found matching &quot;{searchQuery.trim()}&quot;
          </div>
        )}
      {displayedTokens.length === 0 &&
        totalItemsCount === 0 &&
        searchQuery.trim() === "" &&
        !isLoadingMore &&
        !isFetchingTrending &&
        (sortBy !== "trending" || trendingTokensRef.current.length === 0) && (
          <div className="text-center py-12 opacity-60">Loading tokens...</div>
        )}
      {(isLoadingMore || isFetchingTrending) &&
        displayedTokens.length === 0 && (
          <div className="text-center py-12 opacity-60">Loading tokens...</div>
        )}
      {isEnrichingTrending && displayedTokens.length > 0 && (
        <div className="text-center mt-4 opacity-60 text-sm">
          Loading staking data...
        </div>
      )}
      {hasMoreTokens && (
        <div className="text-center mt-8">
          <button
            onClick={handleLoadMore}
            disabled={isLoadingMore}
            className="btn btn-primary"
          >
            {isLoadingMore ? "Loading..." : "Load More"}
          </button>
        </div>
      )}
    </div>
  );
}
