import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { FloatingLabel, Form } from "react-bootstrap";
import { toast } from "react-toastify";
import axiosInstance from "../../utils/axiosInstance.ts";
import { AxiosError } from "axios";

export default function ChangePassword() {
  const { token } = useParams();
  const navigate = useNavigate();

  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate new password and confirm password
    if (newPassword !== confirmNewPassword) {
      toast.error("New passwords do not match!");
      return;
    }

    try {
      // Make a request to change the password
      const { data } = await axiosInstance.post("/api/auth/password/change", {
        newPassword: newPassword,
        token: token,
      });
      console.log("Change pass", data);
      toast.success("Password changed successfully!");

      // Optionally redirect to another page (like login or profile)
      navigate("/accounts/login");
    } catch (error) {
      if (error instanceof AxiosError) {
        const errorMessage = error.response?.data?.message;
        toast.error(errorMessage);
      }
      console.error(error);
    }
  };

  return (
    <>
      <div className="d-flex flex-grow-1 bg-body-tertiary">
        <div className="container-xxl d-flex justify-content-center align-items-center">
          <Form
            className="p-4 border border-dark-subtle rounded-4 w-25 bg-white shadow m-5"
            onSubmit={handleSubmit}
          >
            {/* <h3 className="text-center mb-3">Sign In</h3>
             */}
            <div className="d-flex justify-content-center align-items-center mb-4 border-bottom">
              <h3 className="mb-3">Change Password</h3>
            </div>
            <FloatingLabel
              className="mb-3"
              label="New Password"
              style={{
                color: "#666666",
              }}
            >
              <Form.Control
                required
                type="password"
                placeholder="New Password"
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </FloatingLabel>

            <FloatingLabel
              className="mb-3"
              label="Confirm New Password"
              style={{
                color: "#666666",
              }}
            >
              <Form.Control
                required
                type="password"
                placeholder="Confirm New Password"
                onChange={(e) => setConfirmNewPassword(e.target.value)}
              />
            </FloatingLabel>

            <div className="mb-2">
              <button type="submit" className="btn btn-primary w-100">
                Change Password
              </button>
            </div>
          </Form>
        </div>
      </div>
    </>
  );
}
