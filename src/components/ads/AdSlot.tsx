import { useEffect, useRef } from "react";
import { useSystemSettings } from "@/hooks/useArticles";

declare global {
  interface Window {
    googletag: any;
  }
}

export interface AdSlotProps {
  position: "leaderboard_top" | "content_1" | "content_2" | "sidebar" | "below_article";
  className?: string;
}

const DEFAULT_SLOTS: Record<string, { path: string; size: [number, number] }> = {
  leaderboard_top: { path: "/6355419/Travel/Europe", size: [728, 90] },
  content_1: { path: "/6355419/Travel/Europe/France", size: [336, 280] },
  content_2: { path: "/6355419/Travel/Europe/France/Paris", size: [336, 280] },
  sidebar: { path: "/6355419/Travel", size: [300, 250] },
  below_article: { path: "/6355419/Travel/Europe", size: [728, 90] },
};

let gptLoaded = false;

function ensureGptLoaded() {
  if (gptLoaded) return;
  gptLoaded = true;
  window.googletag = window.googletag || { cmd: [] };
  const script = document.createElement("script");
  script.src = "https://securepubads.g.doubleclick.net/tag/js/gpt.js";
  script.async = true;
  script.crossOrigin = "anonymous";
  document.head.appendChild(script);
}

const AdSlot = ({ position, className = "" }: AdSlotProps) => {
  const divId = `gpt-ad-${position}`;
  const slotRef = useRef<any>(null);
  const { data: settings } = useSystemSettings();

  const adSlots = (settings?.ad_slots as any) || {};
  const slotConfig = adSlots[position] || DEFAULT_SLOTS[position];
  const isDisabled = adSlots[position]?.enabled === false;
  const adPath = slotConfig?.path || DEFAULT_SLOTS[position]?.path;
  const adSize: [number, number] | undefined = slotConfig?.size || DEFAULT_SLOTS[position]?.size;

  useEffect(() => {
    if (isDisabled || !adPath || !adSize) return;

    ensureGptLoaded();
    window.googletag = window.googletag || { cmd: [] };

    window.googletag.cmd.push(() => {
      if (slotRef.current) {
        window.googletag.destroySlots([slotRef.current]);
        slotRef.current = null;
      }

      const slot = window.googletag
        .defineSlot(adPath, adSize, divId)
        ?.addService(window.googletag.pubads());

      if (slot) {
        slotRef.current = slot;
        window.googletag.enableServices();
        window.googletag.display(divId);
      }
    });

    return () => {
      if (slotRef.current) {
        window.googletag.cmd.push(() => {
          window.googletag.destroySlots([slotRef.current]);
          slotRef.current = null;
        });
      }
    };
  }, [isDisabled, adPath, adSize?.[0], adSize?.[1], divId]);

  if (isDisabled || !adPath || !adSize) return null;

  return (
    <div className={`flex justify-center not-prose ${className}`}>
      <div
        id={divId}
        style={{ width: adSize[0], height: adSize[1], minWidth: adSize[0], minHeight: adSize[1] }}
      />
    </div>
  );
};

export default AdSlot;
