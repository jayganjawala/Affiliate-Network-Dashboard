import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Cookies from "js-cookie";
import axios from "axios";
import dayjs from "dayjs";

const API_BASE_URL =
  process.env.REACT_APP_API_BASE_URL || "http://localhost:5001/api";

function Users() {
  const navigate = useNavigate();
  const phone = Cookies.get("dashboardphone");

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const [users, setUsers] = useState([]);

  const [search, setSearch] = useState("");
  const [statusSearch, setStatusSearch] = useState("");
  const [sortOrder, setSortOrder] = useState("desc");

  useEffect(() => {
    const fetchUsers = async () => {
      if (!phone) {
        navigate("/login");
        return;
      }

      try {
        const token = Cookies.get("dashboardtoken");
        const response = await axios.get(
          `${API_BASE_URL}/users?phone=${phone}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        );

        const data = response.data;

        if (!data.success) {
          setUsers([]);
        } else {
          setUsers(data.users);
        }
      } catch (err) {
        console.error("API Error:", err);
      } finally {
      }
    };

    fetchUsers();
  }, [phone, navigate]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, statusSearch, sortOrder]);

  const filteredUsers = users
    .filter((item) => {
      const namePhoneEmailMatch =
        item.name?.toLowerCase().includes(search.toLowerCase()) ||
        false ||
        item.phone?.includes(search) ||
        false ||
        item.email?.toLowerCase().includes(search.toLowerCase()) ||
        false;

      const statusMatch =
        statusSearch === "" ||
        item.status.toLowerCase() === statusSearch.toLowerCase();

      return namePhoneEmailMatch && statusMatch;
    })
    .sort((a, b) => {
      const dateA = new Date(a.createdAt);
      const dateB = new Date(b.createdAt);
      return sortOrder === "asc" ? dateA - dateB : dateB - dateA;
    });

  const getStatusBadge = (status) => {
    switch (status) {
      case "Client":
        return "bg-success";
      case "Lead":
        return "bg-warning text-dark";
      default:
        return "bg-secondary";
    }
  };

  /* ================= PAGINATION ================= */
  const indexOfLast = currentPage * itemsPerPage;
  const indexOfFirst = indexOfLast - itemsPerPage;
  const currentUsers = filteredUsers.slice(indexOfFirst, indexOfLast);
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);

  const goToNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage((prev) => prev + 1);
    }
  };

  const goToPreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage((prev) => prev - 1);
    }
  };

  return (
    <section className="poppins-regular py-3">
      <div className="container">
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

        {/* Title + Upload Leads Button */}
        <div className="row mb-3 g-3 align-items-center">
          <div className="col-6 col-lg-10">
            <h4 className="fw-bold mb-0">Users</h4>
          </div>
          <div className="col-6 col-lg-2 text-end">
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={() => navigate("/uploadleads")}
            >
              <i className="fa-solid fa-upload"></i> Upload Leads
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="row g-3 mb-3">
          <div className="col-12 col-md-5">
            <input
              type="text"
              className="form-control"
              placeholder="Search by Name, Phone number or Email"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="col-6 col-md-3">
            <select
              className="form-select"
              value={statusSearch}
              onChange={(e) => setStatusSearch(e.target.value)}
            >
              <option value="">All Status</option>
              <option value="lead">Lead</option>
              <option value="client">Client</option>
            </select>
          </div>
          <div className="col-6 col-md-2">
            <select
              className="form-select"
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
            >
              <option value="desc">Newest First</option>
              <option value="asc">Oldest First</option>
            </select>
          </div>
          <div className="col-12 col-md-2">
            <button
              className="btn btn-secondary w-100"
              onClick={() => {
                setSearch("");
                setStatusSearch("");
                setSortOrder("desc");
              }}
            >
              Clear
            </button>
          </div>
        </div>

        {/* Applied Filters */}
        {(search || statusSearch || (sortOrder && sortOrder !== "desc")) && (
          <div className="row g-3 mb-3">
            <div className="col-auto">
              <span className="fw-semibold">Filters applied:</span>
            </div>

            {search && (
              <div className="col-auto">
                <span className="badge bg-secondary">
                  Search: {search}{" "}
                  <i
                    className="fa fa-times ms-1"
                    style={{ cursor: "pointer" }}
                    onClick={() => setSearch("")}
                  ></i>
                </span>
              </div>
            )}

            {statusSearch && (
              <div className="col-auto">
                <span className="badge bg-secondary">
                  Status: {statusSearch}{" "}
                  <i
                    className="fa fa-times ms-1"
                    style={{ cursor: "pointer" }}
                    onClick={() => setStatusSearch("")}
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

        {/* Header (Desktop only) */}
        <div className="d-none d-md-block p-3 rounded bg-dark text-light">
          <div className="row g-3">
            <div className="col-md-2">#</div>
            <div className="col-md-3">User Name</div>
            <div className="col-md-3">Contact Details</div>
            <div className="col-md-2">Status</div>
            <div className="col-md-2 text-end">Date</div>
          </div>
        </div>

        {/* Data Rows */}
        {currentUsers.length > 0 ? (
          currentUsers.map((item) => (
            <div
              key={item.id}
              className="border p-3 rounded text-dark my-2 bg-body"
            >
              <div className="row g-3 align-items-start">
                {/* # */}
                <div className="col-md-2 col-6 order-1 order-md-1 d-none d-md-block">
                  <span className="fw-semibold">{item.id}</span>
                </div>

                <div className="col-md-3 col-8 order-md-2 order-1">
                  <span className="d-md-none fw-semibold">
                    {item.id}. {item.fullName}
                  </span>

                  <span className="fw-semibold d-none d-md-inline">
                    {item.fullName}
                  </span>
                </div>

                {/* Contact Details */}
                <div className="col-md-3 col-12 order-3 order-md-3 text-md-start">
                  <div className="row align-items-center mb-1">
                    <div className="col">
                      <span className="fw-semibold d-md-none d-block">
                        Contact Details
                      </span>

                      {/* Phone */}
                      <div className="mt-1 mt-md-0">
                        <span className="">{item.phone}</span>
                      </div>

                      {/* Email */}
                      {item.email && (
                        <div className="text-muted small mt-1">
                          <strong>{item.email}</strong>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Status */}
                <div className="col-md-2 col-4 text-end text-md-start order-2 order-md-4">
                  <span className={`badge ${getStatusBadge(item.status)}`}>
                    {item.status}
                  </span>
                </div>

                {/* Date */}
                <div className="col-md-2 col-12 text-md-end order-4 order-md-5">
                  <span className="fw-semibold d-md-none d-block">Date</span>
                  <span className="">
                    {" "}
                    {item.updatedAt
                      ? dayjs(item.updatedAt).format("DD MMM YYYY, hh:mm A")
                      : "-"}{" "}
                  </span>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-5 text-muted">No users found</div>
        )}

        {/* PAGINATION */}
        {filteredUsers.length > 0 && (
          <div className="d-flex justify-content-between align-items-center mb-3">
            <div>
              Page {currentPage} of {totalPages} • {filteredUsers.length}{" "}
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

export default Users;
