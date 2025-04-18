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
  TextInput,
  Modal,
} from "@carbon/react";
import { useRouter } from "next/navigation";
import { useFormik } from "formik";
import * as Yup from "yup";
import { useRef, useState, useEffect } from "react";
import { useSelector } from "react-redux";

// Add interface for the API response
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
  const [leaveRequests, setLeaveRequests] = useState<TeamLeaveResponse["details"]["data"]>([]);
  const selectedRowIdsRef = useRef<string[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMessage, setModalMessage] = useState("");

  const fetchTeamLeaves = async () => {
    try {
      const baseUrl = process.env.NEXT_PUBLIC_LOGIN_URL;
      const response = await fetch(`${baseUrl}/api/leave/team?approverId=EST1001`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const data = (await response.json()) as TeamLeaveResponse;

      if (!response.ok) {
        throw new Error(data?.details?.message || "Failed to fetch team leaves");
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
    { key: "numberOfDays", header: "Days" },
    { key: "leaveType", header: "Leave Type" },
    { key: "reason", header: "Reason" },
    { key: "status", header: "Status" },
  ];

  const handleAction = async (type: "approve" | "reject", payload: any) => {
    try {
      const baseUrl = process.env.NEXT_PUBLIC_LOGIN_URL;
      const response = await fetch(`${baseUrl}/api/leave/status?approverId=EST1001&status=APPROVED`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ leaveIds: payload.ids }),
      });

      if (!response.ok) {
        throw new Error("API call failed");
      }
      
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

  const formik = useFormik({
    initialValues: {
      reasons: {} as Record<string, string>,
    },
    validationSchema: Yup.object({
      reasons: Yup.object().test(
        "all-selected-have-reason",
        "Reason is required for all rejected rows",
        function (reasons) {
          return selectedRowIdsRef.current.every((id) =>
            (reasons as Record<string, string>)[id]?.trim()
          );
        }
      ),
    }),
    onSubmit: async (values) => {
      const rejected = leaveRequests
        .filter((row) => selectedRowIdsRef.current.includes(row.id.toString()))
        .map((row) => ({
          ...row,
          reason: values.reasons[row.id.toString()],
        }));

      await handleAction("reject", { ids: rejected.map((r) => r.id) });
    },
  });

  return (
    <FlexGrid fullWidth style={{ padding: "4rem" }}>
      <Row>
        <Column>
          <Button onClick={() => router.push("/dashboard")}>Go back</Button>
        </Column>
      </Row>

      <Row style={{ marginTop: "1rem" }}>
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
                <form onSubmit={formik.handleSubmit}>
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
                        <TableBatchAction type="submit">Reject</TableBatchAction>
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
                            {row.cells.map((cell) => {
                              const isSelected =
                                selectedRowIdsRef.current.includes(row.id);

                              if (
                                cell.info.header === "reason" &&
                                isSelected
                              ) {
                                return (
                                  <TableCell key={cell.id}>
                                    <TextInput
                                      id={`reasons.${row.id}`}
                                      name={`reasons.${row.id}`}
                                      value={
                                        formik.values.reasons[row.id] || ""
                                      }
                                      onChange={formik.handleChange}
                                      labelText=""
                                      placeholder="Enter reason"
                                      invalid={
                                        !!(
                                          formik.errors.reasons &&
                                          formik.touched.reasons &&
                                          (formik.errors.reasons as any)[row.id]
                                        )
                                      }
                                      invalidText={
                                        (formik.errors.reasons as any)?.[row.id]
                                      }
                                    />
                                  </TableCell>
                                );
                              }

                              return (
                                <TableCell key={cell.id}>
                                  {cell.value}
                                </TableCell>
                              );
                            })}
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </form>
              );
            }}
          </DataTable>
        </Column>
      </Row>

      <Modal
        open={isModalOpen}
        onRequestClose={() => setIsModalOpen(false)}
        modalHeading="Status"
        primaryButtonText="OK"
        onRequestSubmit={() => setIsModalOpen(false)}
      >
        <p>{modalMessage}</p>
      </Modal>
    </FlexGrid>
  );
};

export default LeaveApproval;
