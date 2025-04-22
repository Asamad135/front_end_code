"use client";

import {
  FlexGrid,
  Row,
  Column,
  Button,
  DataTable,
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableHeader,
  TableBody,
  TableCell,
  TableToolbar,
  TableToolbarContent,
  TableToolbarSearch,
  TableBatchActions,
  TableBatchAction,
  TableSelectAll,
  TableSelectRow,
  Modal,
} from "@carbon/react";
import { useRouter } from "next/navigation";
import { useRef, useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { ReduxType } from "@/redux/store";

interface TeamLeaveResponse {
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

const LeaveApproval = () => {
  const router = useRouter();
  const userInfo = useSelector((s: ReduxType) => s.userSlice.userDetails);
  const [leaveRequests, setLeaveRequests] = useState<
    TeamLeaveResponse["details"]["data"]
  >([]);
  const selectedRowIdsRef = useRef<string[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMessage, setModalMessage] = useState("");

  const fetchTeamLeaves = async () => {
    try {
      const baseUrl = process.env.NEXT_PUBLIC_LOGIN_URL;
      const response = await fetch(
        `${baseUrl}/api/leave/team?approverId=${userInfo?.EmpId}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      const data = (await response.json()) as TeamLeaveResponse;

      if (!response.ok) {
        throw new Error(
          data?.details?.message || "Failed to fetch team leaves"
        );
      }

      setLeaveRequests(data.details.data);
    } catch (error) {
      console.error("Error fetching team leaves:", error);
      setModalMessage("Failed to fetch team leaves");
      setIsModalOpen(true);
    }
  };

  useEffect(() => {
    fetchTeamLeaves();
  }, [userInfo?.EmpId]);

  const headers = [
    { key: "EmpId", header: "Employee ID" },
    { key: "name", header: "Name" },
    { key: "projectName", header: "Project" },
    { key: "appliedDate", header: "Applied On" },
    { key: "fromDate", header: "From" },
    { key: "toDate", header: "To" },
    { key: "numberOfDays", header: "No of Days" },
    { key: "leaveType", header: "Leave Type" },
    { key: "reason", header: "Reason" },
    { key: "status", header: "Approver Status" },
  ];

  const handleAction = async (
    type: "approve" | "reject",
    payload: { ids: (number | string)[] }
  ) => {
    try {
      const baseUrl = process.env.NEXT_PUBLIC_LOGIN_URL;
      const response = await fetch(
        `${baseUrl}/api/leave/status?approverId=${userInfo?.EmpId}&status=${
          type === "approve" ? "APPROVED" : "REJECTED"
        }`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ leaveIds: payload.ids }),
        }
      );

      if (!response.ok) {
        throw new Error("API call failed");
      }

      // ✅ Remove updated rows from table immediately
      setLeaveRequests((prev) =>
        prev.filter((leave) => !payload.ids.includes(leave.id))
      );

      setModalMessage(
        type === "approve"
          ? "Leave(s) approved successfully!"
          : "Leave(s) rejected successfully!"
      );
      setIsModalOpen(true);
    } catch (error) {
      console.error(`${type} error:`, error);
      setModalMessage(`Failed to ${type} leave(s).`);
      setIsModalOpen(true);
    }
  };

  return (
    <FlexGrid fullWidth style={{ padding: "0rem" }}>
      <Row>
        <Column>
          <h3>Approve Leave</h3>
        </Column>
      </Row>

      <Row style={{ marginTop: "2rem" }}>
        <Column sm={4} md={8} lg={16}>
          <DataTable rows={leaveRequests} headers={headers} isSortable>
            {({
              rows,
              headers,
              getHeaderProps,
              getRowProps,
              getTableProps,
              getSelectionProps,
              getToolbarProps,
              getBatchActionProps,
              selectedRows,
              onInputChange,
            }) => {
              selectedRowIdsRef.current = selectedRows.map((r) => r.id);

              return (
                <TableContainer title="Leave Requests">
                  <TableToolbar {...getToolbarProps()}>
                    <TableBatchActions {...getBatchActionProps()}>
                      <TableBatchAction
                        onClick={() =>
                          handleAction("approve", {
                            ids: selectedRowIdsRef.current,
                          })
                        }
                      >
                        Approve
                      </TableBatchAction>

                      <TableBatchAction
                        onClick={() =>
                          handleAction("reject", {
                            ids: selectedRowIdsRef.current,
                          })
                        }
                      >
                        Reject
                      </TableBatchAction>
                    </TableBatchActions>
                    <TableToolbarContent>
                      <TableToolbarSearch
                        placeholder="Search leave requests"
                        onChange={(e) =>
                          onInputChange(
                            e as React.ChangeEvent<HTMLInputElement>
                          )
                        }
                      />
                    </TableToolbarContent>
                  </TableToolbar>

                  <Table {...getTableProps()}>
                    <TableHead>
                      <TableRow>
                        <TableSelectAll {...getSelectionProps()} />
                        {headers.map((header) => (
                          <TableHeader {...getHeaderProps({ header })}>
                            {header.header}
                          </TableHeader>
                        ))}
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {rows.map((row) => (
                        <TableRow {...getRowProps({ row })}>
                          <TableSelectRow {...getSelectionProps({ row })} />
                          {row.cells.map((cell) => (
                            <TableCell key={cell.id}>{cell.value}</TableCell>
                          ))}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              );
            }}
          </DataTable>
        </Column>
      </Row>

      <Modal
        open={isModalOpen}
        onRequestClose={() => {
          setIsModalOpen(false);
          router.push("/dashboard");
        }}
        modalHeading="Status"
        primaryButtonText="OK"
        onRequestSubmit={() => {
          setIsModalOpen(false);
          router.push("/dashboard");
        }}
      >
        <p>{modalMessage}</p>
      </Modal>
    </FlexGrid>
  );
};

export default LeaveApproval;
