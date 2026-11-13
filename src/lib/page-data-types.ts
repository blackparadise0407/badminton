import type { getOwing, getUnsavedSessions } from "@/lib/owing";
import type { loadSessionData } from "@/lib/session-data";
import type { getHostSettlement, getLeaderboard } from "@/lib/stats";

export type PlayerRecord = {
  id: number;
  name: string;
  nickname: string | null;
  isRegular: boolean;
  isActive: boolean;
  defaultHours: number;
};

export type DashboardData = {
  rows: Awaited<ReturnType<typeof getOwing>>;
  unsavedSessions: Awaited<ReturnType<typeof getUnsavedSessions>>;
};

export type SessionListRow = {
  id: number;
  date: string;
  venue: string | null;
  count: number;
  unpaid: number;
};

type LoadedSession = NonNullable<Awaited<ReturnType<typeof loadSessionData>>>;

export type SessionDetailData = Omit<LoadedSession, "attendees"> & {
  attendees: (Omit<LoadedSession["attendees"][number], "paidAt"> & {
    paidAt: string | null;
  })[];
  activePlayers: { id: number; name: string }[];
};

export type NewSessionData = {
  players: {
    id: number;
    name: string;
    nickname: string | null;
    isRegular: boolean;
  }[];
  defaults: {
    date: string;
    venue: string;
    courts: number;
    courtRatePerHour: number | "";
    shuttlePrice: number | "";
    startHour: number;
    endHour: number;
  };
};

export type StatsData = Awaited<ReturnType<typeof getLeaderboard>> & {
  today: string;
  hostSettlement: Awaited<ReturnType<typeof getHostSettlement>>;
};
