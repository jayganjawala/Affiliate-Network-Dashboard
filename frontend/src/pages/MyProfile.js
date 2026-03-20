import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Cookies from "js-cookie";
import axios from "axios";
import { toast } from "react-hot-toast";

const API_BASE_URL =
  process.env.REACT_APP_API_BASE_URL || "http://localhost:5001/api";

function MyProfile() {
  const navigate = useNavigate();
  const phone = Cookies.get("dashboardphone");

  const [profile, setProfile] = useState({
    name: "",
    email: "",
    phone: "",
    communicator: { name: "", phone: "", commissionrate: "" },
    organization: { name: "", address: "", phone: "", email: "" },
  });

  useEffect(() => {
    const fetchProfile = async () => {
      if (!phone) {
        navigate("/login");
        return;
      }

      try {
        const token = Cookies.get("dashboardtoken");
        const response = await axios.get(
          `${API_BASE_URL}/myprofile?phone=${phone}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        );

        if (response.data.success) {
          const data = response.data.profile;

          setProfile({
            name: data.personalInformation.fullName || "",
            email: data.personalInformation.email || "",
            phone: data.personalInformation.phone || "",
            communicator: {
              name: data.relationshipManager.fullName || "",
              phone: data.relationshipManager.phone || "",
              commissionrate:
                data.relationshipManager.commission || "Not Specified",
            },
            organization: {
              name: data.organization.name || "",
              address: data.organization.address || "",
              phone: data.organization.phone || "",
              email: data.organization.email || "",
            },
          });
        } else {
          toast.error(response.data.error || "Failed to fetch profile");
        }
      } catch (err) {
        console.error("API Error:", err);
        toast.error("Failed to fetch profile from server");
      }
    };

    fetchProfile();
  }, [phone, navigate]);

  return (
    <section className="poppins-regular">
      <div className="container mt-3">
        {/* Back Button */}
        <div className="row mb-3 g-3">
          <div className="col">
            <i
              className="fa fa-arrow-left mt-2"
              style={{ cursor: "pointer" }}
              onClick={() => navigate("/dashboard")}
            ></i>
          </div>
        </div>

        {/* Title */}
        <div className="row mb-3 g-3 align-items-center">
          <div className="col-12 col-lg-12">
            <h4 className="fw-bold mb-0">My Profile</h4>
          </div>
        </div>

        {/* Personal Info Card */}
        <div className="p-3 rounded bg-body border-start border-5 border-success border-opacity-50 mb-3">
          <div className="row mb-3">
            <div className="col">
              <h5 className="fw-semibold">
                <i className="fa-solid fa-circle-user"></i> Personal Information
              </h5>
            </div>
          </div>
          <div className="row g-3">
            <div className="col-md-4">
              <small className="text-muted">
                <i className="fa-solid fa-user text-secondary"></i> Name
              </small>
              <h6 className="fw-semibold">{profile.name}</h6>
            </div>
            <div className="col-md-4">
              <small className="text-muted">
                <i className="fa-solid fa-envelope text-warning"></i> Email
              </small>
              <h6 className="fw-semibold">{profile.email}</h6>
            </div>
            <div className="col-md-4">
              <small className="text-muted">
                <i className="fa-solid fa-phone text-success"></i> Phone
              </small>
              <h6 className="fw-semibold">{profile.phone}</h6>
            </div>
          </div>
        </div>

        {/* Relationship Manager Card */}
        <div className="p-3 rounded bg-body border-start border-5 border-primary border-opacity-50 mb-3">
          <div className="row mb-3">
            <div className="col">
              <h5 className="fw-semibold">
                <i className="fa-sharp fa-solid fa-handshake-angle"></i>{" "}
                Relationship Manager
              </h5>
            </div>
          </div>
          <div className="row g-3">
            <div className="col-md-4">
              <small className="text-muted">
                <i className="fa-solid fa-user text-secondary"></i> Name
              </small>
              <div className="fw-semibold">{profile.communicator.name}</div>
            </div>
            <div className="col-md-4">
              <small className="text-muted">
                <i className="fa-solid fa-phone text-success"></i> Phone
              </small>
              <div className="fw-semibold">{profile.communicator.phone}</div>
            </div>
            <div className="col-md-4">
              <small className="text-muted">
                <i className="fa-solid fa-percent"></i> Commission
              </small>
              <div className="fw-semibold">
                {profile.communicator.commissionrate}
              </div>
            </div>
          </div>
        </div>

        {/* Organization Card */}
        <div className="p-3 rounded bg-body border-start border-5 border-warning border-opacity-50 mb-3">
          <div className="row mb-3">
            <div className="col">
              <h5 className="fw-semibold">
                <i className="fa-solid fa-building"></i> Organization
              </h5>
            </div>
          </div>
          <div className="row g-3">
            <div className="col-md-6">
              <small className="text-muted">
                <i className="fa-solid fa-user text-secondary"></i> Name
              </small>
              <div className="fw-semibold">{profile.organization.name}</div>
            </div>
            <div className="col-md-6">
              <small className="text-muted">
                <i className="fa-solid fa-phone text-success"></i> Phone
              </small>
              <div className="fw-semibold">{profile.organization.phone}</div>
            </div>
            <div className="col-md-6">
              <small className="text-muted">
                <i className="fa-solid fa-envelope text-warning"></i> Email
              </small>
              <div className="fw-semibold">{profile.organization.email}</div>
            </div>
            <div className="col-md-6">
              <small className="text-muted">
                <i className="fa-solid fa-location-dot text-danger"></i> Address
              </small>
              <div className="fw-semibold">{profile.organization.address}</div>
            </div>
          </div>
        </div>

        {/* Note */}
        <div className="alert alert-info">
          <strong>Note:</strong> If you want to edit your profile, please
          contact to your communicator.
        </div>
      </div>
    </section>
  );
}

export default MyProfile;
