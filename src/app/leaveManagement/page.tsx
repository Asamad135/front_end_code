"use client";

import {
  FlexGrid,
  Row,
  Column,
  Dropdown,
  DatePicker,
  DatePickerInput,
  TextArea,
  Button,
  Tile,
  Stack,
  TextInput,
} from "@carbon/react";
import { useFormik } from "formik";
import * as Yup from "yup";
import { useDispatch, useSelector } from "react-redux";
import { updateLeaveStatus } from "@/redux/leave/leaveSlice";
import { useRouter } from "next/navigation";
import { ErrorResponse } from "../login/page";
import { useEffect, useState } from "react";
import { ReduxType } from "@/redux/store";

// First, add interfaces for the API response
interface Project {
  id: number;
  name: string;
  description: string;
  approverName: string;
}

interface ProjectResponse {
  details: {
    message: string;
    data: Project[];
    statusCode: string;
    errorCode: null;
  };
}

interface LeaveApplicationResponse {
  details: {
    message: string;
    data: {
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
    };
    statusCode: string;
    errorCode: null;
  };
}

interface LeaveBalanceResponse {
  details: {
    message: string;
    data: {
      leaveType: string;
      balance: number;
      EmpId: string;
      name: string;
    };
    statusCode: string;
    errorCode: null;
  };
}

const LeaveManagement = () => {
  const leaveTypes = ["Sick_Leave", "Casual_Leave", "Planned_Leave"];
  const approvers = ["Barnali"];
  const dispatch = useDispatch();
  const [isLoading, setIsLoading] = useState(false);
  const [isBalance, setIsBalance] = useState([]);
  const [projects, setProjects] = useState<string[]>([]);
  const router = useRouter();
  const userInfo = useSelector((s: ReduxType) => s.userSlice.userDetails);
  const validationSchema = Yup.object({
    leaveType: Yup.string().required("Leave type is required"),
    fromDate: Yup.string().required("From date is required"),
    toDate: Yup.string()
      .required("To date is required")
      .test("is-after", "To date must be after From date", function (value) {
        const { fromDate } = this.parent;
        return !fromDate || !value || new Date(value) >= new Date(fromDate);
      }),
    project: Yup.string().required("Project is required"),
    reason: Yup.string().required("Reason is required"),
    approver: Yup.string().required("Approver is required"),
  });

  const formik = useFormik({
    initialValues: {
      leaveType: '',
      fromDate: '',
      toDate: '',
      project: '',
      reason: '',
      approver: '',
    },
    validationSchema,
    onSubmit: (values) => {
      // Format dates to MM/DD/YYYY with forward slashes
      const formatDate = (date: string) => {
        if (!date) return '';
        // Parse the date string (which might be in any format)
        const d = new Date(date);
        // Format to MM/DD/YYYY with forward slashes
        const month = (d.getMonth() + 1).toString().padStart(2, '0');
        const day = d.getDate().toString().padStart(2, '0');
        const year = d.getFullYear();
        return `${month}/${day}/${year}`;
      };

      const formattedValues = {
        leaveType: values.leaveType.toUpperCase(),
        fromDate: formatDate(values.fromDate),
        toDate: formatDate(values.toDate),
        projectName: values.project,
        reason: values.reason,
        approverName: values.approver
      };

      console.log('Formatted values:', formattedValues); // For debugging
      Applyleave(formattedValues);
    },
  });

  const GetProject = async () => {
    try {
      const baseUrl = process.env.NEXT_PUBLIC_LOGIN_URL;
      const apiUrl = `${baseUrl}/api/employees/projects?EmpId=${userInfo?.EmpId}`;
      const response = await fetch(apiUrl, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const data = (await response.json()) as ProjectResponse;

      if (!response.ok) {
        throw new Error("Failed to fetch projects");
      }

      // Extract project names from the response
      const projectNames = data.details.data.map((project) => project.name);
      setProjects(projectNames);
    } catch (error) {
      console.error("Error fetching projects:", error);
    }
  };

  const GetBalance = async (selectedLeaveType: string) => {
    try {
      const baseUrl = process.env.NEXT_PUBLIC_LOGIN_URL;
      // Keep the underscore and just convert to uppercase
      const formattedLeaveType = selectedLeaveType.toUpperCase();
      const apiUrl = `${baseUrl}/api/leave/balance?EmpId=${userInfo?.EmpId}&leaveType=${formattedLeaveType}`;
      
      const response = await fetch(apiUrl, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const data = await response.json() as LeaveBalanceResponse;

      if (!response.ok) {
        throw new Error(data?.details?.message || 'Failed to fetch leave balance');
      }

      setIsBalance(data.details.data.balance);
    } catch (error) {
      console.error("Error fetching leave balance:", error);
      setIsBalance(0);
    }
  };

  useEffect(() => {
    GetProject();
  }, [userInfo?.EmpId]);

  useEffect(() => {
    GetBalance(formik.values.leaveType);
  }, [userInfo?.EmpId, formik.values.leaveType]);

  const Applyleave = async (values: any) => {
    try {
      setIsLoading(true);
      const baseUrl = process.env.NEXT_PUBLIC_LOGIN_URL;
      
      if (!baseUrl || !userInfo?.EmpId) {
        throw new Error('Missing required configuration');
      }

      const apiUrl = `${baseUrl}/api/leave/apply?EmpId=${userInfo.EmpId}`;
      
      const payload = {
        leaveType: values.leaveType,
        fromDate: values.fromDate,  // Already in MM/DD/YYYY format
        toDate: values.toDate,      // Already in MM/DD/YYYY format
        projectName: values.projectName,
        reason: values.reason,
        approverName: values.approverName
      };

      console.log('Sending payload:', payload); // For debugging

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      console.log('API Response:', data); // For debugging

      if (!response.ok) {
        throw new Error(data?.details?.message || data?.message || 'Failed to apply leave');
      }

      alert('Leave applied successfully!');
      dispatch(updateLeaveStatus(data.details.data));
      router.push('/dashboard');
    } catch (error: any) {
      console.error('Error applying leave:', error);
      alert(error.message || 'Failed to apply leave. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const calculateDays = (from: string, to: string) => {
    if (!from || !to) return "";
    const start = new Date(from);
    const end = new Date(to);
    let count = 0;
    let current = new Date(start);

    while (current <= end) {
      const day = current.getDay();
      if (day !== 0 && day !== 6) {
        count++;
      }
      current.setDate(current.getDate() + 1);
    }

    return count.toString();
  };

  return (
    <FlexGrid fullWidth style={{ padding: "4rem" }}>
      <Row className="abc">
        <Button onClick={() => router.push("/dashboard")}>Go back</Button>
      </Row>
      <Row>
        <h3>Apply leave</h3>
      </Row>
      <Tile className="tile">
        <form onSubmit={formik.handleSubmit}>
          <Row>
            <Column sm={4} md={8} lg={16}>
              <Stack gap={6}>
                <Dropdown
                  id="leave-type"
                  titleText="Leave Type"
                  items={leaveTypes}
                  selectedItem={formik.values.leaveType}
                  onChange={({ selectedItem }) => {
                    formik.setFieldValue("leaveType", selectedItem);
                    if (selectedItem) {
                      GetBalance(selectedItem);
                    }
                  }}
                  onBlur={(e) => {
                    formik.handleBlur(e);
                    if (formik.values.leaveType !== "") {
                      formik.setTouched({
                        ...formik.touched,
                        leaveType: false,
                      });
                    } else {
                      formik.setTouched({ ...formik.touched, leaveType: true });
                    }
                  }}
                  invalid={Boolean(
                    formik.touched.leaveType && formik.errors.leaveType
                  )}
                  invalidText={formik.errors.leaveType}
                  label="Choose an option"
                />

                {formik.values.leaveType && (
                  <Row>
                    <Column lg={6}>
                      <DatePicker
                        datePickerType="single"
                        onChange={(e) =>
                          formik.setFieldValue("fromDate", e[0] || "")
                        }
                      >
                        <DatePickerInput
                          id="from-date"
                          labelText="From Date"
                          placeholder="MM/DD/YYYY"  // Updated placeholder
                          onBlur={(e) => {
                            formik.handleBlur(e);
                            if (formik.values.fromDate !== "") {
                              formik.setTouched({
                                ...formik.touched,
                                fromDate: false,
                              });
                            } else {
                              formik.setTouched({
                                ...formik.touched,
                                fromDate: true,
                              });
                            }
                          }}
                          invalid={Boolean(
                            formik.errors.fromDate && formik.touched.fromDate
                          )}
                          invalidText={formik.errors.fromDate}
                        />
                      </DatePicker>
                    </Column>
                    <Column lg={6}>
                      <DatePicker
                        datePickerType="single"
                        onChange={(e) =>
                          formik.setFieldValue("toDate", e[0] || "")
                        }
                      >
                        <DatePickerInput
                          id="to-date"
                          labelText="To Date"
                          placeholder="MM/DD/YYYY"  // Updated placeholder
                          onBlur={(e) => {
                            formik.handleBlur(e);
                            if (formik.values.toDate !== "") {
                              formik.setTouched({
                                ...formik.touched,
                                toDate: false,
                              });
                            } else {
                              formik.setTouched({
                                ...formik.touched,
                                toDate: true,
                              });
                            }
                          }}
                          invalid={Boolean(
                            formik.errors.toDate && formik.touched.toDate
                          )}
                          invalidText={formik.errors.toDate}
                        />
                      </DatePicker>
                    </Column>
                    <Column lg={2}>
                      <TextInput
                        id="balance"
                        labelText="Balance"
                        value={isBalance?.toString() || '0'}
                        disabled
                      />
                    </Column>
                    <Column lg={2}>
                      <TextInput
                        id="number-of-days"
                        labelText="No. of Days"
                        value={calculateDays(
                          formik.values.fromDate,
                          formik.values.toDate
                        )}
                        disabled
                      />
                    </Column>
                  </Row>
                )}

                <Dropdown
                  id="project"
                  titleText="Current Project"
                  items={projects} // Use the fetched projects here
                  selectedItem={formik.values.project}
                  onChange={({ selectedItem }) =>
                    formik.setFieldValue("project", selectedItem)
                  }
                  onBlur={(e) => {
                    formik.handleBlur(e);
                    if (formik.values.project !== "") {
                      formik.setTouched({
                        ...formik.touched,
                        project: false,
                      });
                    } else {
                      formik.setTouched({ ...formik.touched, project: true });
                    }
                  }}
                  invalid={!!formik.errors.project && formik.touched.project}
                  invalidText={formik.errors.project}
                  label="Choose an option"
                />

                <TextArea
                  id="reason"
                  labelText="Reason for Leave"
                  placeholder="Enter your reason..."
                  value={formik.values.reason}
                  onChange={(e) =>
                    formik.setFieldValue("reason", e.target.value)
                  }
                  onBlur={formik.handleBlur}
                  invalid={!!formik.errors.reason && formik.touched.reason}
                  invalidText={formik.errors.reason}
                  className="custom-textarea"
                  style={{
                    border: "1px solid #8d8d8d",
                    borderRadius: "4px",
                  }}
                />

                <Dropdown
                  id="approver"
                  titleText="Approver"
                  items={approvers}
                  selectedItem={formik.values.approver}
                  onChange={({ selectedItem }) =>
                    formik.setFieldValue("approver", selectedItem)
                  }
                  onBlur={(e) => {
                    formik.handleBlur(e);
                    if (formik.values.approver !== "") {
                      formik.setTouched({
                        ...formik.touched,
                        approver: false,
                      });
                    } else {
                      formik.setTouched({ ...formik.touched, approver: true });
                    }
                  }}
                  invalid={!!formik.errors.approver && formik.touched.approver}
                  invalidText={formik.errors.approver}
                  label="Choose an option"
                />

                <Button kind="primary" type="submit">
                  Submit Request
                </Button>
              </Stack>
            </Column>
          </Row>
        </form>
      </Tile>
    </FlexGrid>
  );
};

export default LeaveManagement;
