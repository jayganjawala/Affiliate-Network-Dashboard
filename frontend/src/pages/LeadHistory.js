import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Cookies from "js-cookie";
import dayjs from "dayjs";

const API_BASE_URL =
  process.env.REACT_APP_API_BASE_URL || "http://localhost:5001/api";

function LeadHistory() {
  const navigate = useNavigate();
  const [uploads, setUploads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchDate, setSearchDate] = useState("");
  const [sortOrder, setSortOrder] = useState("desc");

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    const fetchLeadHistory = async () => {
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
          const data = response.data.dailyStats.map((item, index) => ({
            id: index + 1,
            date: item.date,
            totalLeads: item.totalLeads,
            approvedLeads: item.approvedLeads,
            duplicateLeads: item.duplicateLeads,
            totalClients: item.totalClients,
          }));

          setUploads(data);
          setError("");
        } else {
          setError(response.data.error || "Failed to fetch lead history");
        }
      } catch (err) {
        console.error(err);
        setError("Error fetching lead history");
      } finally {
        setLoading(false);
      }
    };

    fetchLeadHistory();
  }, []);

  /* ✅ RESET PAGE WHEN FILTER CHANGES */
  useEffect(() => {
    setCurrentPage(1);
  }, [searchDate, sortOrder]);

  const filteredUploads = uploads
    .filter((item) => {
      if (!searchDate) return true;

      return dayjs(item.date).format("YYYY-MM-DD") === searchDate;
    })
    .sort((a, b) => {
      const dateA = dayjs(a.date);
      const dateB = dayjs(b.date);
      return sortOrder === "asc" ? dateA.diff(dateB) : dateB.diff(dateA);
    });

  const indexOfLast = currentPage * itemsPerPage;
  const indexOfFirst = indexOfLast - itemsPerPage;
  const currentUploads = filteredUploads.slice(indexOfFirst, indexOfLast);
  const totalPages = Math.ceil(filteredUploads.length / itemsPerPage);

  const goToNextPage = () => {
    if (currentPage < totalPages) setCurrentPage((prev) => prev + 1);
  };

  const goToPreviousPage = () => {
    if (currentPage > 1) setCurrentPage((prev) => prev - 1);
  };

  const handleClear = () => {
    setSearchDate("");
    setSortOrder("desc");
  };

  return (
    <section className="poppins-regular">
      <div className="container mt-3">
        <div className="row mb-3 g-3">
          <div className="col">
            <i
              className="fa fa-arrow-left mt-2"
              style={{ cursor: "pointer" }}
              onClick={() => navigate("/uploadleads")}
            ></i>
          </div>
        </div>

        <div className="row mb-3 g-3 align-items-center">
          <div className="col-12 col-lg-12">
            <h4 className="fw-bold mb-0">Leads History</h4>
          </div>
        </div>

        {/* Filters */}
        <div className="row g-3 mb-3">
          <div className="col-12 col-md-6">
            <input
              type="date"
              className="form-control"
              placeholder="Search by date (YYYY-MM-DD)"
              value={searchDate}
              onChange={(e) => setSearchDate(e.target.value)}
            />
          </div>
          <div className="col-6 col-md-3">
            <select
              className="form-select"
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
            >
              <option value="desc">Newest First</option>
              <option value="asc">Oldest First</option>
            </select>
          </div>
          <div className="col-6 col-md-3">
            <button className="btn btn-secondary w-100" onClick={handleClear}>
              Clear
            </button>
          </div>
        </div>

        {/* Applied Filters */}
        {(searchDate || (sortOrder && sortOrder !== "desc")) && (
          <div className="row g-3 mb-3">
            <div className="col-auto">
              <span className="fw-semibold">Filters applied:</span>
            </div>

            {searchDate && (
              <div className="col-auto">
                <span className="badge bg-secondary">
                  Date: {searchDate}{" "}
                  <i
                    className="fa fa-times ms-1"
                    style={{ cursor: "pointer" }}
                    onClick={() => setSearchDate("")}
                  ></i>
                </span>
              </div>
            )}

            {sortOrder && sortOrder !== "desc" && (
              <div className="col-auto">
                <span className="badge bg-secondary">
                  Sort: {sortOrder === "asc" ? "Oldest First" : "Newest First"}{" "}
                  <i
                    className="fa fa-times ms-1"
                    style={{ cursor: "pointer" }}
                    onClick={() => setSortOrder("desc")}
                  ></i>
                </span>
              </div>
            )}
          </div>
        )}

        {/* Loading/Error */}
        {loading && <div className="text-center py-5">Loading...</div>}
        {error && !loading && (
          <div className="text-center py-5 text-danger">{error}</div>
        )}

        {/* Header */}
        {!loading && !error && filteredUploads.length > 0 && (
          <div className="d-none d-md-block p-3 rounded bg-dark text-light">
            <div className="row g-3">
              <div className="col-md-2">#</div>
              <div className="col-md-3">Total Leads</div>
              <div className="col-md-3">Approved Leads</div>
              <div className="col-md-2">Duplicate Leads</div>
              <div className="col-md-2 text-end">Date</div>
            </div>
          </div>
        )}

        {/* Data Rows */}
        {!loading && !error && currentUploads.length > 0
          ? currentUploads.map((item) => (
              <div
                key={item.id}
                className="border p-3 rounded text-dark my-2 bg-body"
                style={{ cursor: "pointer" }}
                onClick={() => {
                  if (!item.date)
                    return alert("Date not available for this upload");
                  navigate("/overview", { state: { date: item.date } });
                }}
              >
                <div className="row g-3 align-items-start">
                  <div className="col-md-2 col-6 order-1 order-md-1 d-none d-md-block">
                    <span>{item.id}</span>
                  </div>
                  <div className="col-md-3 col-6 order-md-2 order-1">
                    <span className="d-md-none fw-semibold">Total Leads</span>
                    <span className="d-block">{item.totalLeads}</span>
                  </div>
                  <div className="col-md-3 col-6 order-3 order-md-3 text-end text-md-start">
                    <span className="d-md-none fw-semibold">
                      Approved Leads
                    </span>
                    <span className="d-block">{item.approvedLeads}</span>
                  </div>
                  <div className="col-md-2 col-6 order-4 order-md-4 text-md-start">
                    <span className="d-md-none fw-semibold">
                      Duplicate Leads
                    </span>
                    <span className="d-block">{item.duplicateLeads}</span>
                  </div>
                  <div className="col-md-2 col-6 text-end order-5 order-md-5">
                    <span className="d-md-none fw-semibold d-block">Date</span>
                    <span>
                      {item.date ? dayjs(item.date).format("DD MMM YYYY") : "-"}
                    </span>
                  </div>
                </div>
              </div>
            ))
          : !loading &&
            !error && (
              <div className="text-center py-5 text-muted">
                No upload history found
              </div>
            )}

        {/* PAGINATION */}
        {!loading && !error && filteredUploads.length > 0 && (
          <div className="d-flex justify-content-between align-items-center mb-3">
            <div>
              Page {currentPage} of {totalPages} • {filteredUploads.length}{" "}
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

export default LeadHistory;
