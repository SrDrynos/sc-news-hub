import { useEffect, useRef } from "react";
import { useSystemSettings } from "@/hooks/useArticles";

declare global {
  interface Window {
    adsbygoogle: any[];
  }
}

export interface AdSlotProps {
  position: "leaderboard_top" | "content_1" | "content_2" | "sidebar" | "below_article";
  className?: string;
}

const DEFAULT_SIZES: Record<string, { width: number; height: number; format?: string }> = {
  leaderboard_top: { width: 728, height: 90 },
  content_1: { width: 336, height: 280 },
  content_2: { width: 336, height: 280 },
  sidebar: { width: 300, height: 250 },
  below_article: { width: 728, height: 90 },
};

const AdSlot = ({ position, className = "" }: AdSlotProps) => {
  const pushed = useRef(false);
  const { data: settings } = useSystemSettings();

  const adSlots = (settings?.ad_slots as any) || {};
  const slotConfig = adSlots[position];
  const isDisabled = slotConfig?.enabled === false;

  const monetization = (settings?.monetization as any) || {};
  const publisherId = monetization.adsense_publisher_id || "ca-pub-1026797533966602";

  const sizeConfig = DEFAULT_SIZES[position];
  const width = slotConfig?.size?.[0] || sizeConfig?.width;
  const height = slotConfig?.size?.[1] || sizeConfig?.height;

  // Use the ad slot ID if configured in admin, otherwise use "auto"
  const adSlotId = slotConfig?.ad_slot_id || "";

  useEffect(() => {
    if (isDisabled || pushed.current) return;

    try {
      window.adsbygoogle = window.adsbygoogle || [];
      window.adsbygoogle.push({});
      pushed.current = true;
    } catch (e) {
      console.warn("AdSense push error:", e);
    }
  }, [isDisabled]);

  if (isDisabled) return null;

  return (
    <div className={`flex justify-center not-prose ${className}`}>
      <ins
        className="adsbygoogle"
        style={{
          display: "inline-block",
          width: `${width}px`,
          height: `${height}px`,
        }}
        data-ad-client={publisherId}
        data-ad-slot={adSlotId || undefined}
        data-ad-format={adSlotId ? undefined : "auto"}
        data-full-width-responsive={adSlotId ? undefined : "true"}
      />
    </div>
  );
};

export default AdSlot;
