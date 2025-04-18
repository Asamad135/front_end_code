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
import { ErrorResponse } from "../login/page";
import { useEffect, useState } from "react";

interface LeaveData {
  leaveType: string;
  appliedOn: string;
  fromDate: string;
  toDate: string;
  project: string;
  reason: string;
  approver: string;
  status: string;
}

const Dashboard = () => {
  const router = useRouter();
  const rData = useSelector((s: ReduxType) => s.leaveSlice);
  const [leaveData, setLeaveData] = useState<LeaveData[]>([])
  const userName = useSelector(
    (s: ReduxType) => s.userSlice.userDetails?.name
);
  const userInfo =useSelector(
    (s: ReduxType) => s.userSlice.userDetails
  );

  
const LeaveDetails = async() => {
  const baseUrl = process.env.NEXT_PUBLIC_LOGIN_URL;
        
        const apiUrl = `${baseUrl}/api/leave/user?EmpId=${userInfo?.EmpId}`;
        const response = await fetch(apiUrl, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
          // body: JSON.stringify(values),
        });

        const data = await response.json();
        const dataWithIds = data.map((item: LeaveData, index: number) => ({
          ...item,
          id: String(index + 1)
        }));
        setLeaveData(dataWithIds)

        if (!response.ok) {
          const errorData = data as ErrorResponse;
          
          throw new Error(errorData.message);
        }
}
  const headers = [
    { key: "leaveType", header: "Leave Type" },
    { key: "appliedOn", header: "Applied On" },
    { key: "fromDate", header: "From" },
    { key: "toDate", header: "To" },
    { key: "project", header: "Project" },
    { key: "reason", header: "Reason" },
    { key: "approver", header: "Approver" },
    { key: "status", header: "Status" },
  ];

  const rowData = rData?.leaveDetails?.map((item, index) => ({
    id: String(index + 1),
    ...item,
  }));

  useEffect(() => {
    LeaveDetails()
    
  }, [])
  

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
