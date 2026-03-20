import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import Cookies from "js-cookie";
import dayjs from "dayjs";

const API_BASE_URL =
  process.env.REACT_APP_API_BASE_URL || "http://localhost:5001/api";

function Overview() {
  const navigate = useNavigate();
  const location = useLocation();
  const { date } = location.state || {}; // get date from LeadHistory

  const [data, setData] = useState({
    approvedLeadsData: [],
    duplicateLeadsData: [],
  });
  const [filter, setFilter] = useState("approved"); // 'approved' | 'duplicate'
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    if (!date) return;

    const fetchData = async () => {
      try {
        setLoading(true);
        const phone = Cookies.get("dashboardphone");
        const token = Cookies.get("dashboardtoken");

        if (!phone || !token) {
          setError("Phone or token not found in cookies");
          setLoading(false);
          return;
        }

        const response = await axios.get(`${API_BASE_URL}/leadhistory`, {
          params: { phone },
          headers: { Authorization: `Bearer ${token}` },
        });

        if (response.data.success) {
          const dailyData = response.data.dailyStats.find(
            (item) =>
              dayjs(item.date).format("YYYY-MM-DD") ===
              dayjs(date).format("YYYY-MM-DD"),
          );
          setData(dailyData);
          setError("");
        } else {
          setError(response.data.error || "Failed to fetch overview");
        }
      } catch (err) {
        console.error(err);
        setError("Error fetching overview data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [date]);

  useEffect(() => {
    setCurrentPage(1);
  }, [filter]);

  if (!date) {
    return <div className="text-center py-5 text-danger">No date selected</div>;
  }

  const displayedData =
    filter === "approved"
      ? data?.approvedLeadsData || []
      : data?.duplicateLeadsData || [];

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

  /* ================= PAGINATION ================= */
  const indexOfLast = currentPage * itemsPerPage;
  const indexOfFirst = indexOfLast - itemsPerPage;
  const currentData = displayedData.slice(indexOfFirst, indexOfLast);
  const totalPages = Math.ceil(displayedData.length / itemsPerPage);

  const goToNextPage = () => {
    if (currentPage < totalPages) setCurrentPage((prev) => prev + 1);
  };

  const goToPreviousPage = () => {
    if (currentPage > 1) setCurrentPage((prev) => prev - 1);
  };

  return (
    <section className="poppins-regular">
      <div className="container mt-3">
        {/* Back button */}
        <div className="row mb-3 g-3">
          <div className="col">
            <i
              className="fa fa-arrow-left mt-2"
              style={{ cursor: "pointer" }}
              onClick={() => navigate("/history")}
            ></i>
          </div>
        </div>

        {/* Title */}
        <div className="row g-3 align-items-center mb-3">
          <div className="col-12 col-lg-8">
            <h4 className="fw-bold mb-0">
              Overview - {dayjs(date).format("DD MMM YYYY")}
            </h4>
          </div>

          {/* Filter Tabs */}
          {data && (
            <div className="col-12 col-lg-4 d-flex gap-2 justify-content-lg-end">
              <button
                className={`btn btn-sm ${
                  filter === "approved" ? "btn-primary" : "btn-outline-primary"
                }`}
                onClick={() => setFilter("approved")}
              >
                Approved ({data?.approvedLeadsData?.length || 0})
              </button>
              <button
                className={`btn btn-sm ${
                  filter === "duplicate" ? "btn-danger" : "btn-outline-danger"
                }`}
                onClick={() => setFilter("duplicate")}
              >
                Duplicate ({data?.duplicateLeadsData?.length || 0})
              </button>
            </div>
          )}
        </div>

        {loading && <div className="text-center py-5">Loading...</div>}
        {error && !loading && (
          <div className="text-center py-5 text-danger">{error}</div>
        )}

        {data && (
          <>
            {/* Desktop Header */}
            <div className="d-none d-md-block p-3 rounded bg-dark text-light mb-2">
              <div className="row g-3">
                <div className="col-md-2">#</div>
                <div className="col-md-3">Name</div>
                <div className="col-md-3">Contact Details</div>
                <div className="col-md-2">Status</div>
                <div className="col-md-2 text-end">Date</div>
              </div>
            </div>

            {/* Data Rows */}
            {currentData.length > 0 ? (
              currentData.map((lead, index) => (
                <div
                  key={lead.id || index}
                  className="border p-3 rounded text-dark my-2 bg-body"
                >
                  <div className="row g-3 align-items-start">
                    {/* # */}
                    <div className="col-md-2 col-6 order-1 order-md-1 d-none d-md-block">
                      <span className="fw-semibold">{index + 1}</span>
                    </div>

                    {/* Name */}
                    <div className="col-md-3 col-8 order-md-2 order-1">
                      <span className="d-md-none fw-semibold">
                        {index + 1}. {lead.prefix ? lead.prefix + " " : ""}
                        {lead.fullName || lead.name || "—"}
                      </span>
                      <span className="fw-semibold d-none d-md-inline">
                        {lead.prefix ? lead.prefix + " " : ""}
                        {lead.fullName || lead.name || "—"}
                      </span>
                    </div>

                    {/* Contact Details */}
                    <div className="col-md-3 col-6 order-3 order-md-3 text-md-start">
                      <div className="row align-items-center mb-1">
                        <div className="col">
                          <span className="fw-semibold d-md-none d-block">
                            Contact Details
                          </span>
                          <div className="mt-1 mt-md-0">
                            {lead.phone || lead.Phone || "—"}
                          </div>
                          {lead.email || lead.Email ? (
                            <div className="text-muted small mt-1">
                              <strong>{lead.email || lead.Email}</strong>
                            </div>
                          ) : null}
                        </div>
                      </div>
                    </div>

                    {/* Status */}
                    <div className="col-md-2 col-4 text-end text-md-start order-2 order-md-4">
                      <span className={`badge ${getStatusBadge(lead.status)}`}>
                        {lead.status || "Lead"}
                      </span>
                    </div>

                    {/* Date */}
                    <div className="col-md-2 col-6 text-end order-4 order-md-5">
                      <span className="fw-semibold d-md-none d-block">
                        Date
                      </span>
                      <span>
                        {lead.updatedAt || lead.date
                          ? dayjs(lead.updatedAt || lead.date).format(
                              "DD MMM YYYY",
                            )
                          : "-"}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-5 text-muted">
                No {filter} leads found for this date
              </div>
            )}
          </>
        )}

        {/* PAGINATION */}
        {!loading && !error && displayedData.length > 0 && (
          <div className="d-flex justify-content-between align-items-center mb-3">
            <div>
              Page {currentPage} of {totalPages} • {displayedData.length}{" "}
              records
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
      </div>
    </section>
  );
}

export default Overview;
