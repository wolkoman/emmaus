"use client";

import { InternShell } from "@/components/intern/InternLayout";
import { Loading } from "@/components/Loading";
import { useUserStore } from "@/store/UserStore";
import { useEffect } from "react";

export default function LogoutPage() {
  const logout = useUserStore((state) => state.logout);
  useEffect(() => {
    if (!logout) return;
    logout();
    window.location.replace("/");
  }, [logout]);
  return (
    <InternShell>
      <main className="flex grow items-center justify-center pb-16">
        <Loading />
      </main>
    </InternShell>
  );
}
