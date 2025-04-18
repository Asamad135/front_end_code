"use client";

import {
  Button,
  Column,
  FlexGrid,
  Form,
  PasswordInput,
  Row,
  Stack,
  TextInput,
  Tile,
} from "@carbon/react";
import * as Yup from "yup";
import { useDispatch, useSelector } from "react-redux";
import { useFormik } from "formik";
import { useRouter } from "next/navigation";
import { updateUserStatus } from "@/redux/user/userSlice";
import bgimage from "../../../public/Intellisphere_login_page.png";
import { useState } from "react";
import { ReduxType } from "@/redux/store";

export interface ErrorResponse {
  error: string;
  message: string;
  status: string;
}

const Login = () => {
  const router = useRouter();
  const dispatch = useDispatch();
  const [isLoading, setIsLoading] = useState(false);

  const validationSchema = Yup.object({
    username: Yup.string()
      .min(3, "Username must be at least 3 characters")
      .required("Username is required!"),
    password: Yup.string()
      .min(8, "Password must be at least 8 characters")
      .max(12, "Password cannot be longer than 12 characters")
      .required("Password is required!"),
  });

  const formik = useFormik({
    initialValues: {
      username: "",
      password: "",
    },
    validationSchema,
    onSubmit: async (values) => {
      try {
        setIsLoading(true);
        const baseUrl = process.env.NEXT_PUBLIC_LOGIN_URL;
        const apiUrl = `${baseUrl}/api/auth/login`;
        const response = await fetch(apiUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(values),
        });

        const data = await response.json();

        if (!response.ok || !data.details?.data) {
          // Check for error message in the nested details object
          const errorMessage = data?.details?.message;
          if (errorMessage === "Invalid username or password") {
            formik.setErrors({
              username: "Invalid username or password",
              password: "Invalid username or password",
            });
          } else {
            formik.setErrors({
              username: "",
              password: "",
            });
          }
          return; // Prevent further execution if login fails
        }

        dispatch(updateUserStatus(data.details.data));
        router.push("/dashboard");
      } catch (error) {
        console.error("Login error:", error);
      } finally {
        setIsLoading(false);
      }
    },
  });

  const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    formik.setFieldValue("username", e.target.value, false);
    formik.setFieldValue("password", "");
    formik.setErrors({ ...formik.errors, password: "" });
  };

  return (
    <FlexGrid fullWidth>
      <div
        style={{
          position: "relative",
          height: "100vh",
          width: "100%",
          backgroundImage: `url(${bgimage.src})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div
          className="login-container"
          style={{
            position: "absolute",
            top: "60%",
            left: "75%",
            transform: "translate(-50%, -50%)",
            padding: "2rem",
          }}
        >
          <Stack gap={5}>
            <h2 style={{ textAlign: "center" }}>Login Page</h2>
            <Tile className="tile" style={{ width: "700px" }}>
              <Form onSubmit={formik.handleSubmit}>
                <Stack gap={5}>
                  <TextInput
                    className="input-test-class"
                    helperText="Username"
                    id="username"
                    labelText="Username"
                    value={formik.values.username}
                    onChange={handleUsernameChange}
                    onBlur={formik.handleBlur}
                    placeholder="username"
                    size="md"
                    type="text"
                    invalid={Boolean(
                      formik.touched.username && formik.errors.username
                    )}
                    invalidText={String(formik.errors.username ?? "")}
                  />

                  <PasswordInput
                    autoComplete="true"
                    helperText="Optional help text"
                    id="password"
                    value={formik.values.password}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    invalid={Boolean(
                      formik.touched.password && formik.errors.password
                    )}
                    invalidText={String(formik.errors.password ?? "")}
                    labelText="Password"
                    placeholder="Placeholder text password"
                    size="md"
                  />

                  <Button
                    type="submit"
                    disabled={!formik.isValid || !formik.values.password || isLoading}
                  >
                    {isLoading ? "Loading..." : "Login"}
                  </Button>
                </Stack>
              </Form>
            </Tile>
          </Stack>
        </div>
      </div>
    </FlexGrid>
  );
};

export default Login;
