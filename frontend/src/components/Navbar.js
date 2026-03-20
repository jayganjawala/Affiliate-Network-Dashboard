import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import Cookies from "js-cookie";
import { toast } from "react-hot-toast";

const API_BASE_URL =
  process.env.REACT_APP_API_BASE_URL || "http://localhost:5001/api";

function Navbar({ onLogoutClick }) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showOffcanvas, setShowOffcanvas] = useState(false);

  const handleLogout = async () => {
    setLoading(true);
    try {
      const phone = Cookies.get("dashboardphone");
      const token = Cookies.get("dashboardtoken");

      await axios.post(
        `${API_BASE_URL}/logout`,
        { phone: phone || "" },
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      Cookies.remove("dashboardtoken");
      Cookies.remove("dashboardphone");
      toast.success("Logged out successfully!");
      navigate("/", { replace: true });
    } catch (error) {
      console.error("Logout error:", error);
      const message =
        error.response?.data?.error || error.message || "Logout failed";
      toast.error(`Failed to logout: ${message}`);
    } finally {
      setLoading(false);
      setShowLogoutModal(false);
      setShowOffcanvas(false);
    }
  };

  const toggleOffcanvas = () => setShowOffcanvas(!showOffcanvas);

  return (
    <section className="poppins-regular">
      <header className="bg-white py-3 sticky-top">
        <div className="container">
          <div className="row align-items-center">
            <div className="col d-flex align-items-center">
              {/* Hamburger button */}
              <i
                className="fa-solid fa-bars me-1"
                onClick={toggleOffcanvas}
                style={{ cursor: "pointer" }}
              ></i>

              {/* Logo */}
              <Link className="nav-link bg-transparent d-none" to="/dashboard">
                <img
                  loading="lazy"
                  className="img-fluid my-0 my-md-1"
                  style={{ width: "220px", height: "auto" }}
                  src="https://equitypandit.in/ep-imgs/ep-advisor-logo.svg"
                  alt="EP-Investment-Advisor"
                />
              </Link>
              <Link className="nav-link p-0" to="/dashboard">
                <img src="JD.svg" className="img-fluid" alt="logo" />
              </Link>
            </div>

            <div className="col-auto">
              <div className="dropdown text-end">
                <a
                  href="/dashboard"
                  className="d-block link-body-emphasis text-decoration-none dropdown-toggle"
                  data-bs-toggle="dropdown"
                  aria-expanded="false"
                  onClick={(e) => e.preventDefault()}
                >
                  <img
                    src="https://imgs.search.brave.com/3rh24kV5qNSeAQSUMeFbL0kQndiXRstkTKVlwMDW67g/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly9taXIt/czMtY2RuLWNmLmJl/aGFuY2UubmV0L3By/b2plY3RzLzQwNC81/ZTVhNzI5ODkwMzM5/NS5ZM0p2Y0N3NU1q/QXNOekl3TERFNE1D/d3cuanBn"
                    alt="profile"
                    width="40"
                    height="40"
                    className="rounded-circle"
                  />
                </a>

                <ul className="dropdown-menu dropdown-menu-end text-small">
                  <li>
                    <Link className="dropdown-item" to="/myprofile">
                      My Profile <i className="fa-solid fa-circle-user"></i>
                    </Link>
                  </li>

                  <li>
                    <hr className="dropdown-divider" />
                  </li>

                  <li>
                    <button
                      className="dropdown-item text-danger"
                      onClick={() => setShowLogoutModal(true)}
                      disabled={loading}
                    >
                      Sign out{" "}
                      <i className="fa-solid fa-right-from-bracket text-danger"></i>
                    </button>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Offcanvas Sidebar */}
      <div
        style={{
          position: "fixed",
          top: 0,
          bottom: 0,
          left: 0,
          width: "260px",
          backgroundColor: "#f8f9fa", // subtle background for the sidebar
          zIndex: 1050,
          padding: "1rem",
          overflowY: "auto",
          transition: "transform 0.3s ease-in-out",
          transform: showOffcanvas ? "translateX(0)" : "translateX(-100%)",
          boxShadow: showOffcanvas ? "2px 0 8px rgba(0,0,0,0.3)" : "none",
        }}
      >
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h5 className="mb-0">Menu</h5>
          <button className="btn-close" onClick={toggleOffcanvas}></button>
        </div>

        <ul className="list-unstyled">
          {[
            { to: "/dashboard", icon: "fa-gauge", label: "Dashboard" },
            { to: "/payment", icon: "fa-credit-card", label: "Payments" },
            { to: "/users", icon: "fa-users", label: "Users" },
            {
              to: "/support",
              icon: "fa-circle-question",
              label: "User Support",
            },
            {
              to: "/uploadleads",
              icon: "fa-cloud-arrow-up",
              label: "Upload Leads",
            },
            {
              to: "/history",
              icon: "fa-clock-rotate-left",
              label: "View History",
            },
            { to: "/myprofile", icon: "fa-circle-user", label: "My Profile" },
          ].map((item) => (
            <li key={item.to} className="mb-3">
              <Link
                to={item.to}
                onClick={toggleOffcanvas}
                className="d-flex align-items-center text-decoration-none text-dark p-3 rounded border"
                style={{
                  backgroundColor: "white",
                  transition: "all 0.2s ease-in-out",
                }}
              >
                <i
                  className={`fa-solid ${item.icon} me-3`}
                  style={{ fontSize: "1.2rem" }}
                ></i>
                <span>{item.label}</span>
              </Link>
            </li>
          ))}
        </ul>
      </div>

      {/* Overlay */}
      {showOffcanvas && (
        <div
          onClick={toggleOffcanvas}
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0,0,0,0.5)",
            zIndex: 1040,
          }}
        />
      )}

      {/* Logout Modal */}
      {showLogoutModal && (
        <div
          className="modal fade show d-block"
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
        >
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Confirm Logout</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowLogoutModal(false)}
                />
              </div>
              <div className="modal-body">
                <p className="mb-0">
                  Are you sure you want to logout from your account?
                </p>
              </div>
              <div className="modal-footer">
                <button
                  className="btn btn-secondary"
                  onClick={() => setShowLogoutModal(false)}
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  className="btn btn-danger"
                  onClick={handleLogout}
                  disabled={loading}
                >
                  {loading ? "Logging out..." : "Logout"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

export default Navbar;
