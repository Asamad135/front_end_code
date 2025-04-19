// app/HeaderWrapper.tsx
"use client";

import { usePathname, useRouter } from "next/navigation";
import Header from "./header/Header";

const HeaderWrapper = () => {
  const pathname = usePathname();
const router = useRouter();
  // Adjust this condition based on your needs
  const shouldHideHeaders = pathname === "/login";
if(pathname === "/"){
  return router.push("/login")
  
} 
  if (shouldHideHeaders) return null;

  return (
    <div>
      <Header />
    </div>
  );
};

export default HeaderWrapper;