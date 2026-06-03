"use client";

import React from "react";
import { usePathname } from "next/navigation";

export default function PageTransition({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = usePathname();

  return (
    <main key={pathname} className="page-transition-wrapper">
      {children}
    </main>
  );
}
