/**
 * Streaming Analytics Library
 * Calculates and tracks streaming metrics
 */

export interface StreamData {
  tokenAddress: string;
  tokenSymbol: string;
  flowRate: string; // in wei per second
  startTime: number;
  endTime?: number;
  receiver: string;
  sender: string;
  isActive: boolean;
}

export interface StreamMetrics {
  tokenSymbol: string;
  flowRatePerSecond: number;
  flowRatePerMinute: number;
  flowRatePerHour: number;
  flowRatePerDay: number;
  totalFlowed: number;
  remainingTime?: number;
  streakDays: number;
}

export interface StreamingStats {
  totalActiveStreams: number;
  totalFlowRatePerSecond: number;
  totalDailyIncome: number;
  totalMonthlyProjection: number;
  topStream: StreamData | null;
  averageFlowRate: number;
  longestActiveStream: StreamData | null;
}

/**
 * Convert flow rate from wei/second to human readable formats
 */
export function calculateFlowRateMetrics(
  flowRateWeiPerSecond: string,
  decimals: number = 18,
  tokenPrice: number = 1
): StreamMetrics & { flowRatePerSecond: number } {
  const flowRateNum = parseFloat(flowRateWeiPerSecond);
  const perSecond = flowRateNum / Math.pow(10, decimals);
  const perMinute = perSecond * 60;
  const perHour = perMinute * 60;
  const perDay = perHour * 24;

  return {
    tokenSymbol: "TOKEN",
    flowRatePerSecond: perSecond,
    flowRatePerMinute: perMinute,
    flowRatePerHour: perHour,
    flowRatePerDay: perDay,
    totalFlowed: 0,
    streakDays: 0,
  };
}

/**
 * Calculate total amount flowed between two timestamps
 */
export function calculateTotalFlowed(
  flowRateWeiPerSecond: string,
  startTime: number,
  endTime: number,
  decimals: number = 18
): number {
  const flowRateNum = parseFloat(flowRateWeiPerSecond);
  const perSecond = flowRateNum / Math.pow(10, decimals);
  const seconds = (endTime - startTime) / 1000;
  return perSecond * seconds;
}

/**
 * Calculate streaming statistics from multiple streams
 */
export function calculateStreamingStats(streams: StreamData[]): StreamingStats {
  const activeStreams = streams.filter((s) => s.isActive);

  const totalFlowRatePerSecond = activeStreams.reduce((sum, s) => {
    return sum + parseFloat(s.flowRate) / Math.pow(10, 18);
  }, 0);

  const totalDailyIncome = totalFlowRatePerSecond * 86400; // 86400 seconds per day
  const totalMonthlyProjection = totalDailyIncome * 30;

  const topStream = activeStreams.length > 0
    ? activeStreams.reduce((max, s) => {
        return parseFloat(s.flowRate) > parseFloat(max.flowRate) ? s : max;
      })
    : null;

  const averageFlowRate = activeStreams.length > 0
    ? totalFlowRatePerSecond / activeStreams.length
    : 0;

  const longestActiveStream = activeStreams.length > 0
    ? activeStreams.reduce((oldest, s) => {
        return s.startTime < oldest.startTime ? s : oldest;
      })
    : null;

  return {
    totalActiveStreams: activeStreams.length,
    totalFlowRatePerSecond,
    totalDailyIncome,
    totalMonthlyProjection,
    topStream,
    averageFlowRate,
    longestActiveStream,
  };
}

/**
 * Format flow rate for display
 */
export function formatFlowRate(
  flowRateWeiPerSecond: string,
  decimals: number = 18,
  timeUnit: "second" | "minute" | "hour" | "day" = "day"
): string {
  const flowRateNum = parseFloat(flowRateWeiPerSecond);
  const perSecond = flowRateNum / Math.pow(10, decimals);

  let rate = perSecond;
  let unit = "/sec";

  if (timeUnit === "minute") {
    rate = perSecond * 60;
    unit = "/min";
  } else if (timeUnit === "hour") {
    rate = perSecond * 3600;
    unit = "/hr";
  } else if (timeUnit === "day") {
    rate = perSecond * 86400;
    unit = "/day";
  }

  return `${rate.toFixed(6)}${unit}`;
}

/**
 * Estimate time until stream completes based on balance
 */
export function estimateStreamDuration(
  balanceWei: string,
  flowRateWeiPerSecond: string,
  decimals: number = 18
): number {
  const balance = parseFloat(balanceWei);
  const flowRate = parseFloat(flowRateWeiPerSecond);

  if (flowRate === 0) return Infinity;

  const seconds = balance / flowRate;
  return seconds; // in seconds
}

/**
 * Convert seconds to human readable duration
 */
export function formatDuration(seconds: number): string {
  if (!isFinite(seconds)) return "∞";

  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  if (minutes > 0) return `${minutes}m ${secs}s`;
  return `${secs}s`;
}

/**
 * Cache streaming data to localStorage
 */
export function cacheStreamingData(
  walletAddress: string,
  streams: StreamData[]
): void {
  const key = `streaming_data_${walletAddress}`;
  localStorage.setItem(
    key,
    JSON.stringify({
      data: streams,
      timestamp: Date.now(),
    })
  );
}

/**
 * Get cached streaming data (if less than 5 minutes old)
 */
export function getCachedStreamingData(walletAddress: string): StreamData[] | null {
  const key = `streaming_data_${walletAddress}`;
  const cached = localStorage.getItem(key);

  if (!cached) return null;

  const { data, timestamp } = JSON.parse(cached);
  const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;

  if (timestamp > fiveMinutesAgo) {
    return data;
  }

  localStorage.removeItem(key);
  return null;
}
