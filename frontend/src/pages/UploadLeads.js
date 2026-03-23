import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Papa from "papaparse";
import Cookies from "js-cookie";
import axios from "axios";
import dayjs from "dayjs";
import { toast } from "react-hot-toast";

const API_BASE_URL =
  process.env.REACT_APP_API_BASE_URL || "http://localhost:5001/api";

function UploadLeads() {
  const navigate = useNavigate();

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const phone = Cookies.get("dashboardphone");
  const token = Cookies.get("dashboardtoken");

  const [file, setFile] = useState(null);
  const [uploadStatus, setUploadStatus] = useState(null); // null | 'uploading' | 'success' | 'error'
  const [stats, setStats] = useState({ total: 0, approved: 0, duplicate: 0 });
  const [approvedData, setApprovedData] = useState([]);
  const [duplicateData, setDuplicateData] = useState([]);
  const [filter, setFilter] = useState("approved"); // approved | duplicate

  useEffect(() => {
    setCurrentPage(1);
  }, [filter, approvedData, duplicateData]);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setUploadStatus(null);
    setStats({ total: 0, approved: 0, duplicate: 0 });
    setApprovedData([]);
    setDuplicateData([]);
  };

  // 🔹 API CALL USING AXIOS
  const uploadLeadsToServer = async (leads) => {
    return axios.post(
      `${API_BASE_URL}/users/upload`,
      { leads },
      {
        params: { phone },
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      },
    );
  };

  const handleUpload = () => {
    if (!file) {
      toast.error("Please select a CSV file first");
      return;
    }

    if (!phone || !token) {
      toast.error("Authentication missing. Please login again.");
      return;
    }

    setUploadStatus("uploading");

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (result) => {
        try {
          const rows = result.data;

          const leads = rows
            .filter((row) => row.Phone && row.Name)
            .map((row) => ({
              prefix: row.Prefix?.trim() || null,
              fullName: row.Name.trim(),
              phone: row.Phone.toString().trim(),
              email: row.Email?.trim() || null,
            }));

          if (leads.length === 0) {
            toast.error("No valid leads found in CSV");
            setUploadStatus("error");
            return;
          }

          const response = await uploadLeadsToServer(leads);
          const data = response.data;

          setStats({
            total: data.total,
            approved: data.inserted,
            duplicate: data.duplicates,
          });

          // Frontend lists (backend is source of truth)
          setApprovedData(data.approvedLeads || []);
          setDuplicateData(data.duplicateLeads || []);

          setUploadStatus("success");
          toast.success(
            `Upload complete: ${data.inserted} approved, ${data.duplicates} duplicate(s)`,
          );
        } catch (err) {
          console.error(err);
          setUploadStatus("error");
          toast.error(
            err.response?.data?.error || err.message || "Upload failed",
          );
        }
      },
      error: () => {
        setUploadStatus("error");
        toast.error("Failed to parse CSV file");
      },
    });
  };

  const downloadCSV = (data, filename) => {
    if (data.length === 0) {
      alert("No leads available to download");
      return;
    }

    const headers = Object.keys(data[0] || {});
    const csvRows = [
      headers.join(","),
      ...data.map((row) =>
        headers
          .map((h) => `"${(row[h] || "").toString().replace(/"/g, '""')}"`)
          .join(","),
      ),
    ];

    const csvContent = csvRows.join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const getStatusBadge = (status) => {
    switch (status?.toLowerCase()) {
      case "client":
        return "bg-success";
      case "lead":
        return "bg-warning text-dark";
      default:
        return "bg-secondary";
    }
  };

  const allData = filter === "approved" ? approvedData : duplicateData;
  const totalPages = Math.ceil(allData.length / itemsPerPage);
  const indexOfLast = currentPage * itemsPerPage;
  const indexOfFirst = indexOfLast - itemsPerPage;
  const displayedData = allData.slice(indexOfFirst, indexOfLast);

  const goToNextPage = () => {
    if (currentPage < totalPages) setCurrentPage((prev) => prev + 1);
  };

  const goToPreviousPage = () => {
    if (currentPage > 1) setCurrentPage((prev) => prev - 1);
  };

  return (
    <section className="poppins-regular py-3">
      <div className="container">
        {/* Back button */}
        <div className="row mb-3 g-3">
          <div className="col">
            <i
              className="fa fa-arrow-left mt-2"
              style={{ cursor: "pointer" }}
              onClick={() => navigate("/users")}
            ></i>
          </div>
        </div>

        {/* Title */}
        <div className="row mb-3 g-3 align-items-center">
          <div className="col-5 col-lg-8">
            <h4 className="fw-bold mb-0">Upload Leads</h4>
          </div>

          <div className="col-7 col-lg-4 d-flex justify-content-end align-items-center gap-2">
            <a
              href="/Templets_Leads%20-%20Sheet1.csv"
              download="Templets_Leads - Sheet1.csv"
              className="btn btn-outline-secondary btn-sm"
            >
              {/* <i className="fa-solid fa-file-csv"></i> Download Template */}
              <i className="fa-solid fa-download"></i> Template
            </a>
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={() => navigate("/history")}
            >
              <i className="fa-solid fa-arrow-right"></i> History
            </button>
          </div>
        </div>

        <div className="card mb-3">
          <div className="card-body">
            <h5>
              <i className="fa-solid fa-file-csv"></i> Upload CSV File
            </h5>
            <p className="text-muted small mb-3 ms-1">
              Expected columns: <strong>Prefix, Name, Phone, Email</strong>
            </p>

            <div className="input-group">
              <input
                type="file"
                className="form-control"
                accept=".csv"
                onChange={handleFileChange}
                disabled={uploadStatus === "uploading"}
              />
              <button
                className="btn btn-primary"
                onClick={handleUpload}
                disabled={!file || uploadStatus === "uploading"}
              >
                <i className="fa-solid fa-upload me-2"></i>
                {uploadStatus === "uploading"
                  ? "Processing..."
                  : "Process Leads"}
              </button>
            </div>
            <div className="form-text mt-1 ms-1">
              <i className="fa-solid fa-circle-info"></i> Only{" "}
              <strong>.csv</strong> files are supported
            </div>
          </div>
        </div>

        {/* Stats */}
        {stats.total > 0 && (
          <div className="row g-3">
            <div className="col-md-4">
              <div className="card text-center border-primary">
                <div className="card-body">
                  <h6 className="text-primary">
                    <i className="fa-solid fa-list"></i> Total Leads
                  </h6>
                  <h5>{stats.total}</h5>
                </div>
              </div>
            </div>
            <div className="col-md-4">
              <div className="card text-center border-success">
                <div className="card-body">
                  <h6 className="text-success">
                    <i className="fa-solid fa-circle-check"></i> Approved
                  </h6>
                  <h5>{stats.approved}</h5>
                </div>
              </div>
            </div>
            <div className="col-md-4">
              <div className="card text-center border-danger">
                <div className="card-body">
                  <h6 className="text-danger">
                    <i className="fa-solid fa-user-times"></i> Duplicates
                  </h6>
                  <h5>{stats.duplicate}</h5>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Approved / Duplicate Leads */}
        {displayedData.length > 0 && (
          <>
            <div className="row align-items-center pt-3 g-3 mb-3">
              <div className="col-6 col-md-8">
                <h6 className="mb-0">
                  {filter === "approved" ? (
                    <>
                      <i className="fa-solid fa-circle-check"></i> Approved
                      Leads
                    </>
                  ) : (
                    <>
                      <i className="fa-solid fa-user-times"></i> Duplicate Leads
                    </>
                  )}
                </h6>
              </div>

              <div className="col-6 col-md-2">
                {/* Filter */}
                <select
                  className="form-select form-select-sm"
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                >
                  <option value="approved">Approved ({stats.approved})</option>
                  <option value="duplicate">
                    Duplicate ({stats.duplicate})
                  </option>
                </select>
              </div>

              <div className="col-12 col-md-2 text-center text-md-end">
                <span
                  role="button"
                  className="text-success"
                  onClick={() =>
                    downloadCSV(
                      filter === "approved" ? approvedData : duplicateData,
                      filter === "approved"
                        ? "approved_leads.csv"
                        : "duplicate_leads.csv",
                    )
                  }
                >
                  <i className="fa-solid fa-download"></i> Download CSV
                </span>
              </div>
            </div>

            {/* Desktop header */}
            <div className="d-none d-md-block p-3 rounded bg-dark text-light mb-2">
              <div className="row g-3">
                <div className="col-md-2">#</div>
                <div className="col-md-3">Name</div>
                <div className="col-md-3">Contact Details</div>
                <div className="col-md-2">Status</div>
                <div className="col-md-2 text-end">Date</div>
              </div>
            </div>

            {displayedData.map((item, index) => (
              <div
                key={index}
                className="border p-3 rounded text-dark mb-2 bg-body"
              >
                <div className="row g-3 align-items-start">
                  <div className="col-md-2 col-6 order-1 order-md-1 d-none d-md-block">
                    <span>{index + 1}</span>
                  </div>

                  <div className="col-md-3 col-6 order-md-2 order-1">
                    <span className="d-md-none fw-semibold">
                      {index + 1}.{" "}
                      {item.prefix + " " + item.fullName || item.name || "—"}
                    </span>
                    <span className="d-none d-md-inline">
                      {item.prefix + " " + item.fullName || item.name || "—"}
                    </span>
                  </div>

                  <div className="col-md-3 col-6 order-3 order-md-3 text-md-start">
                    <div className="row align-items-center mb-1">
                      <div className="col">
                        <span className="fw-semibold d-md-none d-block">
                          Contact Details
                        </span>

                        <div className="mt-1 mt-md-0">
                          <span>{item.Phone || item.phone || "—"}</span>
                        </div>

                        {(item.Email || item.email) && (
                          <div className="small mt-1">
                            <span>{item.Email || item.email}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="col-md-2 col-6 text-end text-md-start order-2 order-md-4">
                    <span className={`badge ${getStatusBadge(item.status)}`}>
                      {item.status || "Lead"}
                    </span>
                  </div>

                  <div className="col-md-2 col-6 text-end order-4 order-md-5">
                    <span className="fw-semibold d-md-none d-block">Date</span>
                    <span>
                      {" "}
                      {item.createdAt
                        ? dayjs(item.createdAt).format("DD MMM YYYY, hh:mm A")
                        : "-"}{" "}
                    </span>
                  </div>
                </div>
              </div>
            ))}

            {/* PAGINATION */}
            {allData.length > itemsPerPage && (
              <div className="d-flex justify-content-between align-items-center mb-3">
                <div>
                  Page {currentPage} of {totalPages} • {allData.length} records
                </div>
                <div>
                  <button
                    className="btn btn-sm border-0"
                    onClick={goToPreviousPage}
                    disabled={currentPage === 1}
                  >
                    <i className="fa-solid fa-chevron-left"></i>
                  </button>
                  <button
                    className="btn btn-sm border-0"
                    onClick={goToNextPage}
                    disabled={currentPage === totalPages || totalPages === 0}
                  >
                    <i className="fa-solid fa-chevron-right"></i>
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
}

export default UploadLeads;
