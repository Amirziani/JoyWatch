import type { Metadata } from "next";
import { RoomEntry } from "@/components/RoomEntry";
import { t } from "@/lib/i18n";

export const metadata: Metadata = { title: t("room.pageTitle") };

export default async function RoomPage({ params }: { params: Promise<{ roomId: string }> }) {
  const { roomId } = await params;
  return <RoomEntry roomId={roomId} />;
}
