"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import SafeImage from "@/src/components/SafeImage";
import { Token } from "@/src/app/types/token";
import BackButton from "@/src/components/BackButton";

interface Creator {
  name: string;
  score: number;
  recasts: number;
  likes: number;
  profileImage: string;
  tokenCount: number;
  tokens: Token[];
}

export default function CreatorsPage() {
  const [creators, setCreators] = useState<Creator[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCreators = async () => {
      try {
        setLoading(true);
        const response = await fetch("/api/tokens?limit=100");
        if (!response.ok) throw new Error("Failed to fetch tokens");

        const data = await response.json();
        const tokens: Token[] = data.data || [];

        // Group tokens by creator and deduplicate
        const creatorMap = new Map<
          string,
          { creator: Token["creator"]; tokens: Token[] }
        >();

        tokens.forEach((token) => {
          if (token.creator) {
            const key = token.creator.name;
            if (!creatorMap.has(key)) {
              creatorMap.set(key, { creator: token.creator, tokens: [] });
            }
            creatorMap.get(key)?.tokens.push(token);
          }
        });

        // Transform to Creator interface and sort by score
        const creatorsList = Array.from(creatorMap.values())
          .map((item) => ({
            name: item.creator?.name || "",
            score: item.creator?.score || 0,
            recasts: item.creator?.recasts || 0,
            likes: item.creator?.likes || 0,
            profileImage: item.creator?.profileImage || "",
            tokenCount: item.tokens.length,
            tokens: item.tokens,
          }))
          .filter((c) => c.name)
          .sort((a, b) => b.score - a.score);

        setCreators(creatorsList);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to load creators"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchCreators();
  }, []);

  return (
    <div className="min-h-screen bg-base-100 pb-20">
      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <BackButton />
          <div>
            <h1 className="text-3xl font-bold">Creators</h1>
            <p className="text-sm text-base-content/60 mt-1">
              {creators.length} creators building on YouBuidl
            </p>
          </div>
        </div>

        {loading && (
          <div className="flex justify-center items-center min-h-96">
            <span className="loading loading-spinner loading-lg"></span>
          </div>
        )}

        {error && (
          <div className="alert alert-error max-w-2xl">
            <span>{error}</span>
          </div>
        )}

        {!loading && creators.length === 0 && (
          <div className="text-center py-12">
            <p className="text-base-content/60">No creators found</p>
          </div>
        )}

        {!loading && creators.length > 0 && (
          <div className="space-y-3">
            {creators.map((creator) => (
              <div
                key={creator.name}
                className="flex items-center justify-between p-4 bg-base-200 rounded-lg hover:bg-base-300 transition-colors"
              >
                {/* Creator Info */}
                <div className="flex items-center gap-4 flex-1 min-w-0">
                  <div className="flex-shrink-0">
                    {creator.profileImage ? (
                      <SafeImage
                        src={creator.profileImage}
                        alt={creator.name}
                        width={48}
                        height={48}
                        className="rounded-full object-cover w-12 h-12"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center text-lg">
                        👤
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-base truncate">
                      {creator.name}
                    </h3>
                    <p className="text-xs text-base-content/60">
                      {creator.tokenCount} token{creator.tokenCount !== 1 ? "s" : ""}
                    </p>
                  </div>
                </div>

                {/* Stats */}
                <div className="flex items-center gap-6 text-center flex-shrink-0 ml-4">
                  <div>
                    <p className="font-bold text-sm">{creator.score}</p>
                    <p className="text-xs text-base-content/60">Score</p>
                  </div>
                  <div>
                    <p className="font-bold text-sm">{creator.likes}</p>
                    <p className="text-xs text-base-content/60">Likes</p>
                  </div>
                  <div>
                    <p className="font-bold text-sm">{creator.recasts}</p>
                    <p className="text-xs text-base-content/60">Recasts</p>
                  </div>
                </div>

                {/* Action */}
                <div className="ml-4 flex-shrink-0">
                  <Link
                    href={`/tokens?creator=${encodeURIComponent(creator.name)}`}
                    className="btn btn-sm btn-primary"
                  >
                    View
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
