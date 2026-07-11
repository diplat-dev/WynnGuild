import { Suspense } from "react";
import { GuildCompare } from "@/components/guild-compare";

export default function Home() {
  return (
    <Suspense fallback={<div className="page-loading">Loading WynnCompare…</div>}>
      <GuildCompare />
    </Suspense>
  );
}
