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
    <div
      className="container-fluid min-vh-100 d-flex align-items-center poppins-regular"
      style={{
        background: "linear-gradient(180deg, #ffffff, #EDE8CE, #ffe57f)",
      }}
    >
      <div className="row w-100">
        {/* Left side - Login Form */}
        <div className="col-lg-6 d-flex align-items-center justify-content-center p-4 p-lg-5">
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

            <form onSubmit={step === "phone" ? handleSendOtp : handleVerifyOtp}>
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
        <div
          className="col-lg-6 d-none d-lg-block position-relative rounded-5"
          style={{
            backgroundImage:
              'url("https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&q=80&w=2000")',
            backgroundSize: "cover",
            backgroundPosition: "center",
            minHeight: "90vh",
          }}
        >
          {/* Floating task cards - unchanged */}
          <div
            className="position-absolute"
            style={{ top: "15%", left: "10%", width: "320px" }}
          >
            <div className="card border-0 rounded-4 overflow-hidden">
              <div
                className="p-2 fw-semibold text-white fs-5"
                style={{ backgroundColor: "#6c5ce7" }}
              >
                Task Review With Team
              </div>
              <div className="card-body bg-white">
                <p className="mb-1 text-muted">09:30am - 10:00am</p>
              </div>
            </div>
          </div>

          {/* Small calendar - unchanged */}
          <div
            className="position-absolute bg-white rounded-3 p-3 text-center"
            style={{
              top: "62%",
              left: "65%",
              transform: "translateX(-50%)",
              width: "280px",
            }}
          >
            <div
              className="d-grid text-muted text-center small mb-2"
              style={{
                gridTemplateColumns: "repeat(7, 1fr)",
              }}
            >
              <span>Sun</span>
              <span>Mon</span>
              <span>Tue</span>
              <span>Wed</span>
              <span>Thu</span>
              <span>Fri</span>
              <span>Sat</span>
            </div>

            <div
              className="d-grid text-center"
              style={{
                gridTemplateColumns: "repeat(7, 1fr)",
              }}
            >
              {[22, 23, 24, 25, 26, 27, 28].map((day) => (
                <div
                  key={day}
                  className={`mx-auto d-flex align-items-center justify-content-center rounded-circle ${
                    day === 26 ? "text-white" : ""
                  }`}
                  style={{
                    width: "32px",
                    height: "32px",
                    backgroundColor: day === 26 ? "#6c5ce7" : "transparent",
                  }}
                >
                  {day}
                </div>
              ))}
            </div>
          </div>

          <div
            className="position-absolute"
            style={{ bottom: "15%", right: "30%", width: "340px" }}
          >
            <div className="card shadow-lg border-0 rounded-4 overflow-hidden">
              <div className="bg-white p-3 border-bottom">
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <h6 className="mb-0">Daily Meeting</h6>
                    <small className="text-muted">12:00pm - 01:00pm</small>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
