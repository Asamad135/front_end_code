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
  Tile,
} from "@carbon/react";
import { useRouter } from "next/navigation";
import { useSelector } from "react-redux";
import { useEffect, useState } from "react";

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
  const router = useRouter();
  const userInfo = useSelector((s: ReduxType) => s.userSlice.userDetails);
  const userName = useSelector((s: ReduxType) => s.userSlice.userDetails?.name);
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
    fetchLeaveHistory();
  }, [userInfo?.EmpId]);

  const headers = [
    { key: "leaveType", header: "Leave Type" },
    { key: "fromDate", header: "From Date" },
    { key: "toDate", header: "To Date" },
    { key: "numberOfDays", header: "Days" },
    { key: "projectName", header: "Project" },
    { key: "status", header: "Status" },
    { key: "appliedDate", header: "Applied On" },
  ];

  return (
    <FlexGrid
      fullWidth
      className="Dashboard_container"
      style={{ padding: "4rem" }}
    >
      <Stack gap={7}>
        <Row>
          <Column lg={16}>
            <h3>Welcome, {userName}</h3>
          </Column>
        </Row>

        <Row className="tile-container">
          <Column lg={4} className="tile-wrapper">
            <Tile onClick={() => router.push("/leaveManagement")}>
              Leave Management
            </Tile>
          </Column>
          {userInfo?.isManager && (
            <Column
              lg={4}
              className="tile-wrapper"
              style={{ marginLeft: "20px" }}
            >
              <Tile onClick={() => router.push("/leaveApproval")}>
                Leave Approval
              </Tile>
            </Column>
          )}
        </Row>

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
                          onInputChange(
                            e as React.ChangeEvent<HTMLInputElement>
                          )
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
                              <TableCell key={cell.id}>{cell.value}</TableCell>
                            ))}
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell
                            colSpan={headers.length}
                            style={{ textAlign: "center" }}
                          >
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
      </Stack>
    </FlexGrid>
  );
};

export default Dashboard;
