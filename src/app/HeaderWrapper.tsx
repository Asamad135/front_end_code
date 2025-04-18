// app/HeaderWrapper.tsx
"use client";

import { usePathname } from "next/navigation";
import Header from "./header/Header";

const HeaderWrapper = () => {
  const pathname = usePathname();

  // Adjust this condition based on your needs
  const shouldHideHeaders = pathname === "/login";

  if (shouldHideHeaders) return null;

  return (
    <div>
      <Header />
    </div>
  );
};

export default HeaderWrapper;
