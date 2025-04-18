"use client";
import {
  Header as CarbonHeader,
  HeaderName,
  HeaderGlobalBar,
  HeaderGlobalAction,
  HeaderPanel,
} from "@carbon/react";
import {
  Close,
  Switcher as SwitcherIcon,
  Power,
  Moon,
} from "@carbon/icons-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ReduxType } from "@/redux/store";
import { useSelector } from "react-redux";

const Header = () => {
  const router = useRouter();
  const [isSwitcherOpen, setIsSwitcherOpen] = useState(false);
  const userName = useSelector(
    (s: ReduxType) => s.userSlice.userDetails?.username
  );
  const isNotApprover = !["John Doe", "Jane Smith", "Michael Brown"].includes(
    userName ?? ""
  );
  return (
    <CarbonHeader aria-label="Leave Management" className="header ">
      {/* Add navigation or branding if needed */}
      {/* <span style={{ color: "#fff", marginLeft: "1rem" }}>Intellisphere</span> */}
      <HeaderName
        className="app-name color"
        onClick={() => {
          router.push("/dashboard");
        }}
      >
        Intellisphere
      </HeaderName>
      <HeaderGlobalBar>
        <HeaderGlobalAction aria-label="Logout" title="Logout">
          <Power
            size="20"
            className="color"
            onClick={() => router.push("/login")}
          />
        </HeaderGlobalAction>
        <HeaderGlobalAction
          aria-label="App Switcher"
          title="App Switcher"
          onClick={() => setIsSwitcherOpen((prev) => !prev)}
          isActive={isSwitcherOpen}
          tooltipAlignment="end"
        >
          {isSwitcherOpen ? (
            <Close size="20" />
          ) : (
            <SwitcherIcon size="20" className="color" />
          )}

          {isSwitcherOpen && (
            <div>
              <HeaderPanel
                expanded
                onClick={() => router.push("/leaveManagement")}
              >
                Leave Management
              </HeaderPanel>
              {!isNotApprover && (
                <HeaderPanel
                  expanded
                  onClick={() => router.push("/leaveApproval")}
                >
                  Leave Approval
                </HeaderPanel>
              )}
            </div>
          )}
        </HeaderGlobalAction>
      </HeaderGlobalBar>
    </CarbonHeader>
  );
};

export default Header;
