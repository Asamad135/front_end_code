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
  Modal,
} from "@carbon/react";
import { useFormik } from "formik";
import * as Yup from "yup";
import { useDispatch, useSelector } from "react-redux";
import { updateLeaveStatus } from "@/redux/leave/leaveSlice";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ReduxType } from "@/redux/store";

interface Project {
  id: number;
  name: string;
  description: string;
  approverName: string | null;
}

interface ProjectResponse {
  details: {
    message: string;
    data: Project[];
    statusCode: string;
    errorCode: null;
  };
}

interface LeaveBalanceResponse {
  details: {
    message: string;
    data: {
      leaveType: string;
      balance: any;
      EmpId: string;
      name: string;
    };
    statusCode: string;
    errorCode: null;
  };
}

const LeaveManagement = () => {
  const leaveTypes = ["Sick_Leave", "Casual_Leave", "Planned_Leave"];
  const dispatch = useDispatch();
  const [isBalance, setIsBalance] = useState(0);
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectNames, setProjectNames] = useState<string[]>([]);
  const [approver, setApprover] = useState<string[]>([]);
  const router = useRouter();
  const userInfo = useSelector((s: ReduxType) => s.userSlice.userDetails);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMessage, setModalMessage] = useState("");
  const calculateDays = (from: string, to: string) => {
    if (!from || !to) return "";
    const start = new Date(from);
    const end = new Date(to);
    let count = 0;
    let current = new Date(start);

    while (current <= end) {
      const day = current.getDay();
      if (day !== 0 && day !== 6) count++;
      current.setDate(current.getDate() + 1);
    }

    return count.toString();
  };

  const validationSchema = Yup.object({
    leaveType: Yup.string().required("Leave type is required"),
    fromDate: Yup.string().required("From date is required"),
    toDate: Yup.string()
      .required("To date is required")
      .test("is-after", "To date must be after From date", function (value) {
        const { fromDate } = this.parent;
        return !fromDate || !value || new Date(value) >= new Date(fromDate);
      })
      .test(
        "days-within-balance",
        "Requested days exceed available balance",
        function (value) {
          const { fromDate } = this.parent;
          if (!fromDate || !value || !isBalance) return true;

          const start = new Date(fromDate);
          const end = new Date(value);
          let count = 0;
          let current = new Date(start);

          while (current <= end) {
            const day = current.getDay();
            if (day !== 0 && day !== 6) count++;
            current.setDate(current.getDate() + 1);
          }

          return count <= Number(isBalance);
        }
      ),
    project: Yup.string().required("Project is required"),
    reason: Yup.string().required("Reason is required"),
    approver: Yup.string().required("Approver is required"),
  });

  const formik = useFormik({
    initialValues: {
      leaveType: "",
      fromDate: "",
      toDate: "",
      project: "",
      reason: "",
      approver: "",
    },
    validationSchema,
    onSubmit: (values) => {
      const formatDate = (date: string) => {
        if (!date) return "";
        const d = new Date(date);
        const month = (d.getMonth() + 1).toString().padStart(2, "0");
        const day = d.getDate().toString().padStart(2, "0");
        const year = d.getFullYear();
        return `${month}/${day}/${year}`;
      };

      const formattedValues = {
        leaveType: values.leaveType.toUpperCase(),
        fromDate: formatDate(values.fromDate),
        toDate: formatDate(values.toDate),
        projectName: values.project,
        reason: values.reason,
        approverName: values.approver,
      };

      Applyleave(formattedValues);
    },
  });

  const GetProject = async () => {
    try {
      const baseUrl = process.env.NEXT_PUBLIC_LOGIN_URL;
      const apiUrl = `${baseUrl}/api/employees/projects?EmpId=${userInfo?.EmpId}`;
      const response = await fetch(apiUrl, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });

      const data = (await response.json()) as ProjectResponse;
      if (!response.ok) throw new Error("Failed to fetch projects");

      setProjects(data.details.data);
      setProjectNames(data.details.data.map((proj) => proj.name));
    } catch (error) {
      console.error("Error fetching projects:", error);
    }
  };

  const GetBalance = async (selectedLeaveType: string) => {
    try {
      const baseUrl = process.env.NEXT_PUBLIC_LOGIN_URL;
      const apiUrl = `${baseUrl}/api/leave/balance?EmpId=${
        userInfo?.EmpId
      }&leaveType=${selectedLeaveType.toUpperCase()}`;
      const response = await fetch(apiUrl, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });

      const data = (await response.json()) as LeaveBalanceResponse;
      if (!response.ok) throw new Error(data.details.message);
      setIsBalance(data.details.data.balance);
    } catch (error) {
      console.error("Error fetching leave balance:", error);
    }
  };

  const Applyleave = async (values: any) => {
    try {

      const baseUrl = process.env.NEXT_PUBLIC_LOGIN_URL;
      if (!baseUrl || !userInfo?.EmpId)
        throw new Error("Missing required configuration");

      const apiUrl = `${baseUrl}/api/leave/apply?EmpId=${userInfo.EmpId}`;

      const response = await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.details.message || "Failed");

      setIsModalOpen(true);
      dispatch(updateLeaveStatus(data.details.data));
      setModalMessage("leave applied successfully");
      router.push("/dashboard");
    } catch (error: any) {
      console.error("Error applying leave:", error);
      setIsModalOpen(true);
      setModalMessage(error.message || "Failed to apply leave");
    }
  };

  useEffect(() => {
    if (userInfo?.EmpId) GetProject();
  }, [userInfo?.EmpId]);

  useEffect(() => {
    if (formik.values.leaveType) GetBalance(formik.values.leaveType);
  }, [formik.values.leaveType]);

  useEffect(() => {
    const selectedProject = projects.find(
      (proj) => proj.name === formik.values.project
    );
    if (selectedProject?.approverName) {
      setApprover([selectedProject.approverName]);
      formik.setFieldValue("approver", selectedProject.approverName);
    } else {
      setApprover([]);
      formik.setFieldValue("approver", "");
    }
  }, [formik.values.project, projects]);

  return (
    <FlexGrid fullWidth style={{ padding: "4rem" }}>
      <Row>
        <Button onClick={() => router.push("/dashboard")}>Go back</Button>
      </Row>
      <Row>
        <h3>Apply leave</h3>
      </Row>
      <Tile>
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
                    if (selectedItem) GetBalance(selectedItem);
                  }}
                  invalid={
                    !!formik.errors.leaveType && formik.touched.leaveType
                  }
                  invalidText={formik.errors.leaveType}
                  label="Choose an option"
                />

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
                        placeholder="MM/DD/YYYY"
                        invalid={
                          !!formik.errors.fromDate && formik.touched.fromDate
                        }
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
                        placeholder="MM/DD/YYYY"
                        invalid={
                          !!formik.errors.toDate && formik.touched.toDate
                        }
                        invalidText={formik.errors.toDate}
                      />
                    </DatePicker>
                  </Column>
                  <Column lg={2}>
                    <TextInput
                      id="balance"
                      labelText="Balance"
                      value={isBalance?.toString() || "0"}
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

                <Dropdown
                  id="project"
                  titleText="Current Project"
                  items={projectNames}
                  selectedItem={formik.values.project}
                  onChange={({ selectedItem }) =>
                    formik.setFieldValue("project", selectedItem)
                  }
                  invalid={!!formik.errors.project && formik.touched.project}
                  invalidText={formik.errors.project}
                  label="Choose a project"
                />

                <TextArea
                  id="reason"
                  labelText="Reason for Leave"
                  placeholder="Enter your reason..."
                  value={formik.values.reason}
                  onChange={(e) =>
                    formik.setFieldValue("reason", e.target.value)
                  }
                  invalid={!!formik.errors.reason && formik.touched.reason}
                  style={{
                    border: "1px solid #8d8d8d",
                    borderRadius: "4px",
                  }}
                  invalidText={formik.errors.reason}
                />

                <Dropdown
                  id="approver"
                  titleText="Approver"
                  items={approver}
                  selectedItem={formik.values.approver}
                  onChange={({ selectedItem }) =>
                    formik.setFieldValue("approver", selectedItem)
                  }
                  invalid={!!formik.errors.approver && formik.touched.approver}
                  invalidText={formik.errors.approver}
                  label="Approver"
                />

                <Button kind="primary" type="submit">
                  Submit Request
                </Button>
              </Stack>
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
        </form>
      </Tile>
      
    </FlexGrid>
  );
};

export default LeaveManagement;