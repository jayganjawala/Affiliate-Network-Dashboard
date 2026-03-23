import { useState } from "react";
import Cookies from "js-cookie";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "../assets/Auth.css";
import { toast } from "react-hot-toast";

const API_BASE_URL =
  process.env.REACT_APP_API_BASE_URL || "http://localhost:5001/api";

const Login = ({ setAuth }) => {
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [step, setStep] = useState("phone"); // 'phone' or 'otp'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const navigate = useNavigate();

  const handleSendOtp = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (!/^\d{10}$/.test(phone)) {
      setError("Please enter a valid 10-digit phone number");
      setLoading(false);
      return;
    }

    try {
      await axios.post(`${API_BASE_URL}/sendOtp`, { phone });
      toast.success("OTP sent successfully");
      setStep("otp");
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to send OTP");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const { data } = await axios.post(`${API_BASE_URL}/verifyOtp`, {
        phone,
        otpCode: otp,
      });

      Cookies.set("dashboardtoken", data.token, { expires: 1 });
      Cookies.set("dashboardphone", phone, { expires: 1 });
      setAuth(true);
      toast.success("Logged in successfully");
      navigate("/dashboard");
    } catch (err) {
      toast.error(err.response?.data?.error || "Invalid OTP");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="poppins-regular">
      <div
        className="container-fluid min-vh-100 d-flex align-items-center"
        style={{
          background: "linear-gradient(180deg, #ffffff, #EDE8CE, #ffe57f)",
        }}
      >
        <div className="row w-100">
          {/* Left side - Login Form */}
          <div className="col-md-6 d-flex align-items-center justify-content-center p-4 p-lg-5">
            <div className="w-100" style={{ maxWidth: "420px" }}>
              <div className="mb-5">
                <img src="JD.svg" className="img-fluid" alt="logo" />
                {/* <p className="fw-semibold mt-3">Task & Team Management</p> */}
              </div>

              <h3 className="mb-2 fw-bold">Welcome back</h3>
              <p className="text-muted mb-5">
                {step === "phone"
                  ? "Log in to your account"
                  : "Enter OTP sent to +91-" + phone}
              </p>

              {error && (
                <div className="alert alert-danger py-2 mb-4 text-center">
                  {error}
                </div>
              )}

              <form
                onSubmit={step === "phone" ? handleSendOtp : handleVerifyOtp}
              >
                {step === "phone" ? (
                  <div className="mb-4">
                    <label htmlFor="phone" className="form-label fw-medium">
                      Phone number
                    </label>
                    <div className="input-group input-group-lg">
                      <span className="input-group-text">+91</span>
                      <input
                        type="tel"
                        className="form-control"
                        id="phone"
                        pattern="[0-9]{10}"
                        inputMode="tel"
                        autoComplete="tel"
                        placeholder="Enter 10-digit number"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value.trim())}
                        required
                        maxLength={10}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="mb-4">
                    <label htmlFor="otp" className="form-label fw-medium">
                      OTP
                    </label>
                    <div className="input-group input-group-lg">
                      <input
                        type={showPassword ? "text" : "password"}
                        className="form-control"
                        id="otp"
                        placeholder="••••••"
                        value={otp}
                        onChange={(e) => setOtp(e.target.value.trim())}
                        maxLength={6}
                        required
                      />
                      <button
                        type="button"
                        className="input-group-text bg-white border-start-0"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        <i
                          className={`bi ${showPassword ? "bi-eye" : "bi-eye-slash"}`}
                        ></i>
                      </button>
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  className="btn btn-lg w-100 text-white fw-semibold mb-4"
                  style={{ backgroundColor: "#6c5ce7" }}
                  disabled={loading}
                >
                  {loading
                    ? "Please wait..."
                    : step === "phone"
                      ? "Send OTP"
                      : "Verify & Login"}
                </button>
                <div className="text-center mt-4">
                  <a href="/" className="text-muted small text-decoration-none">
                    Terms & Conditions
                  </a>
                </div>
              </form>
            </div>
          </div>

          {/* Right side background - unchanged */}
          <div className="col-md-6 d-none d-lg-block">
            <img src="login.jpg" className="img-fluid rounded-3" alt="login" />
          </div>
        </div>
      </div>
    </section>
  );
};

export default Login;
