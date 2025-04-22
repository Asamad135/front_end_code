"use client";

import { ReduxType } from "@/redux/store";
import {
  Column,
  DataTable,
  FlexGrid,
  Row,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableHeader,
  TableRow,
  TableToolbar,
  TableToolbarContent,
  TableToolbarSearch,
  Tabs,
  Tab,
  TabList,
} from "@carbon/react";
import { useSelector } from "react-redux";
import { useEffect, useState } from "react";
import LeaveManagement from "@/app/leaveManagement/page";
import LeaveApproval from "@/app/leaveApproval/page";

interface LeaveHistoryResponse {
  details: {
    message: string;
    data: Array<{
      id: number;
      leaveType: string;
      fromDate: string;
      toDate: string;
      numberOfDays: number;
      reason: string;
      projectName: string;
      approverName: string;
      status: string;
      appliedDate: string;
      EmpId: string;
      name: string;
    }>;
    statusCode: string;
    errorCode: null;
  };
}

const Dashboard = () => {
  const userInfo = useSelector((s: ReduxType) => s.userSlice.userDetails);
  const userName = userInfo?.name;
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [leaveData, setLeaveData] = useState<LeaveHistoryResponse["details"]["data"]>([]);

  const fetchLeaveHistory = async () => {
    try {
      const baseUrl = process.env.NEXT_PUBLIC_LOGIN_URL;
      const response = await fetch(`${baseUrl}/api/leave/user?EmpId=${userInfo?.EmpId}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const data = (await response.json()) as LeaveHistoryResponse;

      if (!response.ok) {
        throw new Error(data?.details?.message || "Failed to fetch leave history");
      }

      setLeaveData(data.details.data);
    } catch (error) {
      console.error("Error fetching leave history:", error);
    }
  };

  useEffect(() => {
    if (userInfo?.EmpId) {
      fetchLeaveHistory();
    }
  }, [userInfo?.EmpId]);

  const headers = [
    { key: "leaveType", header: "Leave Type" },
    { key: "fromDate", header: "From Date" },
    { key: "toDate", header: "To Date" },
    { key: "numberOfDays", header: "No of Days" },
    { key: "projectName", header: "Project" },
    { key: "status", header: "Approver Status" },
    { key: "appliedDate", header: "Applied On" },
  ];
  const leaveTypeDisplayMap: Record<string, string> = {
    SICK_LEAVE: "Sick Leave",
    CASUAL_LEAVE: "Casual Leave",
    PRIVILEGE_LEAVE: "Privilege Leave",
  };
  return (
    <FlexGrid fullWidth className="Dashboard_container" style={{ padding: "4rem" }}>
      <Stack gap={7}>
        <Row>
          <Column lg={16}>
            <h3>Welcome, {userName}</h3>
          </Column>
        </Row>

        <Row>
          <Column lg={16}>
            <Tabs
              selectedIndex={selectedIndex}
              onChange={(e: { selectedIndex: number }) => setSelectedIndex(e.selectedIndex)}
            >
              <TabList aria-label="Leave Tabs">
                <Tab style={{ fontSize: "1rem", marginRight: "1rem" }}>Leave Management</Tab>
                {userInfo?.isManager && <Tab style={{ fontSize: "1rem", marginRight: "1rem" }}>Leave Approval</Tab>}
                <Tab style={{ fontSize: "1rem" }}>Leave List</Tab>
              </TabList>
            </Tabs>

            {/* Render component based on tab selection */}
            {selectedIndex === 0 && (
              <div style={{ marginTop: "1rem" }}>
                <LeaveManagement
                  onLeaveSubmitted={fetchLeaveHistory}
                  onSwitchToLeaveList={() => setSelectedIndex(2)} // 👈 Switch to Leave List tab
                />
              </div>
            )}
            {selectedIndex === 1 && userInfo?.isManager && (
              <div style={{ marginTop: "1rem" }}>
                <LeaveApproval />
              </div>
            )}
            {selectedIndex === 2 && (
              <div style={{ marginTop: "1rem", marginBottom: "1rem" }}>
                <Row className="xyz">
                  <Column lg={16}>
                    <DataTable rows={leaveData} headers={headers} isSortable>
                      {({
                        rows,
                        headers,
                        getHeaderProps,
                        getRowProps,
                        getTableProps,
                        getToolbarProps,
                        onInputChange,
                      }) => (
                        <TableContainer title="Leave Dashboard">
                          <TableToolbar {...getToolbarProps()}>
                            <TableToolbarContent>
                              <TableToolbarSearch
                                onChange={(e) =>
                                  onInputChange(e as React.ChangeEvent<HTMLInputElement>)
                                }
                                placeholder="Search..."
                              />
                            </TableToolbarContent>
                          </TableToolbar>

                          <Table {...getTableProps()}>
                            <TableHead>
                              <TableRow>
                                {headers.map((header) => (
                                  <TableHeader
                                    key={header.key}
                                    {...getHeaderProps({ header })}
                                  >
                                    {header.header}
                                  </TableHeader>
                                ))}
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              {rows.length > 0 ? (
                                rows.map((row) => (
                                  <TableRow key={row.id} {...getRowProps({ row })}>
                                    {row.cells.map((cell) => (
                                      <TableCell key={cell.id}>
                                        {cell.info.header === "leaveType"
                                          ? leaveTypeDisplayMap[cell.value] || cell.value
                                          : cell.value}
                                      </TableCell>
                                    ))}

                                  </TableRow>
                                ))
                              ) : (
                                <TableRow>
                                  <TableCell colSpan={headers.length} style={{ textAlign: "center" }}>
                                    No records found.
                                  </TableCell>
                                </TableRow>
                              )}
                            </TableBody>
                          </Table>
                        </TableContainer>
                      )}
                    </DataTable>
                  </Column>
                </Row>
              </div>
            )}
          </Column>
        </Row>
      </Stack>
    </FlexGrid>
  );
};

export default Dashboard;
