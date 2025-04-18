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

const LeaveManagement = () => {
  const leaveTypes = ["Sick_Leave", "Casual_Leave", "Planned_Leave"];
  const approvers = ["Barnali"];
  const dispatch = useDispatch();
  const [isLoading, setIsLoading] = useState(false);
  const [isProject, setIsProject] = useState([]);
  const [isBalance, setIsBalance] = useState([]);
  const router = useRouter();
  const userInfo =useSelector(
      (s: ReduxType) => s.userSlice.userDetails
    );
    const formik = useFormik({
      initialValues: {
        leaveType: "",
        fromDate: "",
        toDate: "",
        project: "",
        reason: "",
        approver: "",
        empId: userInfo?.EmpId,
      },
      validationSchema: Yup.object({
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
      }),
      onSubmit: (values) => {
        const formatDate = (date: Date | string): string => {
          const d = new Date(date);
          return d.toISOString().split('T')[0]; // Output: '2025-04-01'
        };
      
        const payloadWithDate = {
          ...values,
          fromDate: formatDate(values.fromDate),
          toDate: formatDate(values.toDate),
          appliedDate: formatDate(new Date()),
          empId: userInfo?.EmpId
        };
        Applyleave(payloadWithDate);
      }
      
    });
    const GetProject = async() => {
      const baseUrl = process.env.NEXT_PUBLIC_LOGIN_URL;
      const apiUrl = `${baseUrl}/api/employees/projects?EmpId=${userInfo?.EmpId}`;
      const response = await fetch(apiUrl, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });
  
      const data = await response.json();
  
      if (!response.ok) {
        const errorData = data as ErrorResponse;
        
        throw new Error(errorData.message);
      }
      const projectNames = data.details.data.map((project: any) => project.name);
      setIsProject(projectNames)
      return projectNames;
    }
    const GetBalance = async() => {
      const baseUrl = process.env.NEXT_PUBLIC_LOGIN_URL;
      const apiUrl = `${baseUrl}/api/leave/balance?EmpId=${userInfo?.EmpId}&leaveType=SICK_LEAVE`;
      const response = await fetch(apiUrl, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });
  
      const data = await response.json();
      if (!response.ok) {
        const errorData = data as ErrorResponse;
        
        throw new Error(errorData.message);
      }
      setIsBalance(data.details.data.balance)
      return data.details.data.balance;}
useEffect(() => {
  
  GetProject()
  GetBalance()
}, [formik.values.leaveType])

    
  const Applyleave = async(payloadWithDate: any) => {
    
    try {
            setIsLoading(true);
            const baseUrl = process.env.NEXT_PUBLIC_LOGIN_URL;
            const apiUrl = `${baseUrl}/api/leave/apply?EmpId=${userInfo?.EmpId}`; // Update the URL to match your API endpoint
            const response = await fetch(apiUrl, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify(payloadWithDate),
            });
    
            const data = await response.json();
    console.log(data, 'datassss');
    
            if (!response.ok) {
              const errorData = data as ErrorResponse;
              
              throw new Error(errorData.message);
            }
    
            dispatch(updateLeaveStatus(payloadWithDate));
      router.push("/dashboard");
          } catch (error) {
            console.error("Error:", error);
          } finally {
            setIsLoading(false);
          }
  }
  


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
                  onChange={({ selectedItem }) =>
                    formik.setFieldValue("leaveType", selectedItem)
                  }
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
                          placeholder="mm/dd/yyyy"
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
                          placeholder="mm/dd/yyyy"
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
                        value={isBalance}
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
                  items={isProject}
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
