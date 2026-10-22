"use client";
import React, { ReactNode } from "react";
import { useLiturgyRoster } from "@/app/liturgische-dienste/(liturgy-roster-store)/liturgy-roster-store";
import { Loading } from "@/components/Loading";

export function LiturgySite(props: { children?: ReactNode }) {
  const { loaded } = useLiturgyRoster((state) => state);

  return !loaded ? <Loading /> : props.children;
}
