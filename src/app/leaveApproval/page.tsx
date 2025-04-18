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
import { useRef, useState } from "react";

const headers = [
  { key: "employee_id", header: "Employee ID" },
  { key: "name", header: "Name" },
  { key: "project", header: "Project" },
  { key: "appliedDate", header: "Applied On" },
  { key: "fromDate", header: "From" },
  { key: "toDate", header: "To" },
  { key: "leaveType", header: "Leave Type" },
  { key: "leaveReason", header: "Leave Reason" },
  { key: "reason", header: "Reason" },
  { key: "status", header: "Status" },
];

const initialRows = [
  {
    name: "ABC",
    employee_id: "EST_001",
    id: "1",
    leaveType: "Sick Leave",
    leaveReason: "Not well",
    appliedDate: "2025-04-10",
    fromDate: "2025-04-12",
    toDate: "2025-04-14",
    project: "Alpha",
    reason: "",
    approver: "John Doe",
    status: "Pending",
  },
  {
    name: "DEF",
    employee_id: "EST_002",
    id: "2",
    leaveType: "Planned Leave",
    leaveReason: "Vacation",
    appliedDate: "2025-04-08",
    fromDate: "2025-04-15",
    toDate: "2025-04-20",
    project: "Beta",
    reason: "",
    approver: "Jane Smith",
    status: "Pending",
  },
];

const LeaveApproval = () => {
  const router = useRouter();
  const selectedRowIdsRef = useRef<string[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMessage, setModalMessage] = useState("");

  const handleAction = async (type: "approve" | "reject", payload: any) => {
    try {
      const response = await fetch(`/api/leave/action?type=${type}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
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
      const rejected = initialRows
        .filter((row) => selectedRowIdsRef.current.includes(row.id))
        .map((row) => ({
          ...row,
          reason: values.reasons[row.id],
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
          <DataTable rows={initialRows} headers={headers} isSortable>
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
                                        (formik.errors.reasons as any)?.[
                                          row.id
                                        ]
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
