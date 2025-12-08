"use client";

import { CreateForm } from "./CreateForm";
import { useAppFrameLogic } from "@/src/hooks/useAppFrameLogic";
import sdk from "@farcaster/miniapp-sdk";
import Image from "next/image";
import { useEffect } from "react";

export default function LaunchPage() {
  const { isMiniAppView, isSDKLoaded } = useAppFrameLogic();

  // Call ready when the component is fully loaded in mini app view
  useEffect(() => {
    if (isMiniAppView && isSDKLoaded) {
      console.log("🟢 Launch page ready, calling sdk.actions.ready()");
      sdk.actions.ready();
    }
  }, [isMiniAppView, isSDKLoaded]);

  const handleCreateWithCast = async () => {
    const castText = `@streme Launch a token for me

Name: [your token name]
Symbol: $[your ticker]

[Don't forget to attach an image!] 🎨`;

    if (isMiniAppView && isSDKLoaded && sdk) {
      // Mini-app: use SDK to compose cast
      try {
        await sdk.actions.composeCast({
          text: castText,
          embeds: [],
        });
      } catch (error) {
        console.error("Error composing cast:", error);
        // Fallback to web URL
        const farcasterUrl = `https://warpcast.com/~/compose?text=${encodeURIComponent(castText)}`;
        window.open(farcasterUrl, '_blank');
      }
    } else {
      // Desktop/mobile: open Farcaster web with pre-filled text
      const farcasterUrl = `https://warpcast.com/~/compose?text=${encodeURIComponent(castText)}`;
      window.open(farcasterUrl, '_blank');
    }
  };

  return (
    <div className="max-w-lg mx-auto px-3 sm:px-4 pt-14 pb-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-full bg-base-200 border border-base-300 flex items-center justify-center text-xs font-semibold text-base-content/80">
            ⇪
          </div>
          <h1 className="text-lg sm:text-xl font-semibold leading-tight">
            Launch token
          </h1>
        </div>
        <button
          onClick={handleCreateWithCast}
          className="btn btn-outline btn-primary btn-xs sm:btn-sm gap-1 w-full sm:w-auto justify-center rounded-full"
        >
          <Image
            src="/farcaster.svg"
            alt="Farcaster"
            width={16}
            height={16}
            className="opacity-80"
          />
          Cast
        </button>
      </div>

      <div className="border border-base-300/80 rounded-xl bg-base-100 p-3 sm:p-3 shadow-sm space-y-3">
        <CreateForm />
      </div>
    </div>
  );
}
