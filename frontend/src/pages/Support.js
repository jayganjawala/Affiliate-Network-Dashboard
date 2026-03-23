import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Cookies from "js-cookie";
import dayjs from "dayjs";
import { toast } from "react-hot-toast";

const API_BASE_URL =
  process.env.REACT_APP_API_BASE_URL || "http://localhost:5001/api";

function Support() {
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const phone = Cookies.get("dashboardphone");
  const token = Cookies.get("dashboardtoken");

  const [employee, setEmployee] = useState({
    id: null,
    name: "",
  });
  const [tickets, setTickets] = useState([]);

  const [filterId, setFilterId] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [sortOrder, setSortOrder] = useState("desc");

  const [modalType, setModalType] = useState(null); // "add", "edit", null
  const [activeTicketId, setActiveTicketId] = useState(null);
  const [activeRelatedUserId, setActiveRelatedUserId] = useState(null);
  const [editResponseId, setEditResponseId] = useState(null);
  const [responseText, setResponseText] = useState("");
  const [responseStatus, setResponseStatus] = useState("Open");

  const [deleteType, setDeleteType] = useState(null); // "ticket" | "response"
  const [deleteTicketId, setDeleteTicketId] = useState(null);
  const [deleteResponseId, setDeleteResponseId] = useState(null);

  /* ================= FETCH SUPPORT ================= */

  const fetchSupportTickets = useCallback(async () => {
    if (!phone || !token) return;

    try {
      const res = await axios.get(`${API_BASE_URL}/support?phone=${phone}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.data.success) {
        setEmployee({
          id: res.data.employee.id,
          name: res.data.employee.name,
        });

        const formatted = res.data.requests.map((req) => ({
          id: req.id,
          name: req.clientName,
          message: req.description,
          date: req.createdAt,
          status: req.status,
          relatedUserId: req.relatedUserId,
          responses: req.followups.map((f) => ({
            id: f.id,
            text: f.description,
            status: f.status,
            date: f.createdAt,
          })),
        }));

        setTickets(formatted);
      } else {
        toast.error(res.data.error || "Failed to fetch tickets");
      }
    } catch (err) {
      console.error("Support fetch error:", err);
      toast.error("Server error");
    }
  }, [phone, token]);

  useEffect(() => {
    fetchSupportTickets();
  }, [fetchSupportTickets]);

  /* ================= Pagination ================= */
  useEffect(() => {
    setCurrentPage(1);
  }, [filterId, filterStatus, sortOrder]);

  /* ================= Get Latest Status ================= */
  const getLatestStatus = (ticket) => {
    if (ticket.responses.length > 0) {
      return ticket.responses[ticket.responses.length - 1].status;
    }
    return ticket.status; // fallback to original ticket status
  };

  /* ================= MODALS ================= */

  const openAddResponseModal = (ticket) => {
    setModalType("add");
    setActiveTicketId(ticket.id);
    setActiveRelatedUserId(ticket.relatedUserId);
    setEditResponseId(null);
    setResponseText("");
    setResponseStatus(ticket.status);
  };

  const openEditResponseModal = (ticket, response) => {
    setModalType("edit");
    setActiveTicketId(ticket.id);
    setActiveRelatedUserId(ticket.relatedUserId);
    setEditResponseId(response.id);
    setResponseText(response.text);
    setResponseStatus(response.status);
  };

  /* ================= ADD / UPDATE FOLLOWUP ================= */

  const saveResponse = async () => {
    if (!responseText.trim()) {
      toast.error("Response cannot be empty");
      return;
    }

    try {
      if (modalType === "add") {
        await axios.post(
          `${API_BASE_URL}/support/followup`,
          {
            raisedByEmployeeId: employee.id,
            relatedUserId: activeRelatedUserId,
            reqId: activeTicketId,
            description: responseText,
            status: responseStatus,
          },
          { headers: { Authorization: `Bearer ${token}` } },
        );

        toast.success("Response added");
      } else {
        await axios.put(
          `${API_BASE_URL}/support/followup/${editResponseId}`,
          {
            description: responseText,
            status: responseStatus,
          },
          { headers: { Authorization: `Bearer ${token}` } },
        );

        toast.success("Response updated");
      }

      setModalType(null);
      setResponseText("");
      setEditResponseId(null);

      fetchSupportTickets();
    } catch (err) {
      console.error("Save response error:", err);
      toast.error("Failed to save response");
    }
  };

  const removeResponse = (ticketId, responseId) => {
    setDeleteType("response");
    setDeleteTicketId(ticketId);
    setDeleteResponseId(responseId);
  };

  const confirmDeleteTicket = (id) => {
    setDeleteType("ticket");
    setDeleteTicketId(id);
    setDeleteResponseId(null);
  };

  const confirmDelete = async () => {
    try {
      const id = deleteType === "ticket" ? deleteTicketId : deleteResponseId;

      await axios.delete(`${API_BASE_URL}/support/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      toast.success("Deleted successfully");

      setTickets((prev) =>
        deleteType === "ticket"
          ? prev.filter((t) => t.id !== deleteTicketId)
          : prev.map((t) =>
              t.id === deleteTicketId
                ? {
                    ...t,
                    responses: t.responses.filter(
                      (r) => r.id !== deleteResponseId,
                    ),
                  }
                : t,
            ),
      );
      fetchSupportTickets();
    } catch (err) {
      console.error("Delete error:", err);
      toast.error("Delete failed");
    } finally {
      setDeleteType(null);
      setDeleteTicketId(null);
      setDeleteResponseId(null);
    }
  };

  /* ================= FILTERS & SORT ================= */

  const filteredTickets = tickets
    .filter((t) => {
      const idMatch =
        filterId === "" || t.id.toString().includes(filterId.trim());

      const latestStatus = getLatestStatus(t);

      const statusMatch =
        filterStatus === "" ||
        latestStatus.toLowerCase() === filterStatus.toLowerCase();

      return idMatch && statusMatch;
    })
    .sort((a, b) => {
      const dateA = new Date(a.date);
      const dateB = new Date(b.date);
      return sortOrder === "asc" ? dateA - dateB : dateB - dateA;
    });

  const getStatusBadge = (status) => {
    switch (status) {
      case "Open":
        return "bg-warning text-dark";
      case "In Progress":
        return "bg-info text-dark";
      case "Closed":
        return "bg-success";
      default:
        return "bg-secondary";
    }
  };

  /* ================= Pagination ================= */
  const indexOfLast = currentPage * itemsPerPage;
  const indexOfFirst = indexOfLast - itemsPerPage;
  const currentTickets = filteredTickets.slice(indexOfFirst, indexOfLast);
  const totalPages = Math.ceil(filteredTickets.length / itemsPerPage);

  const goToNextPage = () => {
    if (currentPage < totalPages) setCurrentPage((prev) => prev + 1);
  };

  const goToPreviousPage = () => {
    if (currentPage > 1) setCurrentPage((prev) => prev - 1);
  };

  /* ================= RENDER ================= */

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

        {/* Title */}
        <div className="row mb-3 g-3 align-items-center">
          <div className="col-8 col-lg-10">
            <h4 className="fw-bold mb-0">Support Tickets</h4>
          </div>
        </div>

        {/* Filters */}
        <div className="row g-3 mb-3">
          <div className="col-6 col-md-3">
            <input
              type="text"
              className="form-control"
              placeholder="Ticket ID"
              value={filterId}
              onChange={(e) => setFilterId(e.target.value)}
            />
          </div>
          <div className="col-6 col-md-3">
            <select
              className="form-select"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="">All Status</option>
              <option value="Open">Open</option>
              <option value="In Progress">In Progress</option>
              <option value="Closed">Closed</option>
            </select>
          </div>
          <div className="col-6 col-md-3">
            <select
              className="form-select"
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
            >
              <option value="desc">Newest</option>
              <option value="asc">Oldest</option>
            </select>
          </div>
          <div className="col-6 col-md-3">
            <button
              className="btn btn-secondary w-100"
              onClick={() => {
                setFilterId("");
                setFilterStatus("");
                setSortOrder("desc");
              }}
            >
              Clear
            </button>
          </div>
        </div>

        {/* Applied Filters */}
        {(filterId || filterStatus || (sortOrder && sortOrder !== "desc")) && (
          <div className="row g-3 mb-3">
            <div className="col-auto">
              <span className="fw-semibold">Filters applied:</span>
            </div>

            {filterId && (
              <div className="col-auto">
                <span className="badge bg-secondary">
                  Ticket ID: {filterId}{" "}
                  <i
                    className="fa fa-times ms-1"
                    style={{ cursor: "pointer" }}
                    onClick={() => setFilterId("")}
                  ></i>
                </span>
              </div>
            )}

            {filterStatus && (
              <div className="col-auto">
                <span className="badge bg-secondary">
                  Status: {filterStatus}{" "}
                  <i
                    className="fa fa-times ms-1"
                    style={{ cursor: "pointer" }}
                    onClick={() => setFilterStatus("")}
                  ></i>
                </span>
              </div>
            )}

            {sortOrder && sortOrder !== "desc" && (
              <div className="col-auto">
                <span className="badge bg-secondary">
                  Sort: {sortOrder === "asc" ? "Oldest" : "Newest"}{" "}
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

        {/* Header (desktop only) – updated label to match content */}
        <div className="d-none d-md-block p-3 rounded-1 bg-dark text-light">
          <div className="row g-3">
            <div className="col-md-1">
              <span>#</span>
            </div>
            <div className="col-md-2">
              <span>Client Name</span>
            </div>
            <div className="col-md-5">
              <span>Issue & Responses</span>
            </div>
            <div className="col-md-2 text-end">
              <span>Status</span>
            </div>
            <div className="col-md-2 text-end">
              <span>Actions</span>
            </div>
          </div>
        </div>

        {/* Tickets */}
        {currentTickets.length > 0 ? (
          currentTickets.map((t) => (
            <div
              key={t.id}
              className="border p-3 rounded-1 text-dark my-2 bg-body"
            >
              <div className="row g-3 align-items-start">
                <div className="col-md-1 col-8 text-md-start order-1 order-md-1">
                  <span className="fw-semibold">{t.id}</span>
                  <span className="fw-semibold d-md-none">. {t.name}</span>
                </div>

                <div className="col-md-2 col-6 text-md-start order-md-2 text-end d-none d-md-block">
                  <span className="fw-semibold">{t.name}</span>
                </div>

                <div className="col-md-5 col-12 order-md-3 order-3">
                  <div>
                    <div className="row align-items-center mb-1">
                      <div className="col">
                        <small className="text-muted">
                          ({" "}
                          {t.date
                            ? dayjs(t.date).format("DD MMM YYYY, hh:mm A")
                            : "-"}{" "}
                          )
                        </small>
                      </div>
                      <div className="col-auto d-md-none">
                        <span
                          className={`badge ${getStatusBadge(getLatestStatus(t))}`}
                        >
                          {getLatestStatus(t)}
                        </span>
                      </div>
                    </div>

                    <div className="text-muted small">{t.message}</div>

                    <hr className="d-md-none border-1 border-dark" />

                    <div className="mt-3">
                      {t.responses.length === 0 ? (
                        <small className="text-muted fst-italic">
                          No responses yet
                        </small>
                      ) : (
                        t.responses.map((resp) => (
                          <div
                            key={resp.id}
                            className="border rounded-3 p-2 mb-2 bg-light"
                          >
                            <div className="row align-items-start">
                              <div className="col">
                                <small className="text-muted">
                                  ({" "}
                                  {resp.date
                                    ? dayjs(resp.date).format(
                                        "DD MMM YYYY, hh:mm A",
                                      )
                                    : "-"}{" "}
                                  ) • {employee.name}
                                </small>
                                <div className="mt-1">{resp.text}</div>
                              </div>

                              <div className="col-auto">
                                <i
                                  className="fa fa-edit text-primary me-1"
                                  style={{ cursor: "pointer" }}
                                  onClick={() => openEditResponseModal(t, resp)}
                                  title="Edit response"
                                />
                                <i
                                  className="fa fa-trash text-danger"
                                  style={{ cursor: "pointer" }}
                                  onClick={() => removeResponse(t.id, resp.id)}
                                  title="Delete response"
                                />
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>

                <div className="col-md-2 col-6 text-end d-none d-md-block order-md-4">
                  <span
                    className={`badge ${getStatusBadge(getLatestStatus(t))}`}
                  >
                    {getLatestStatus(t)}
                  </span>
                </div>

                <div className="col-md-2 col-4 text-end order-md-5 order-2">
                  <i
                    className="fa fa-reply text-primary"
                    style={{ cursor: "pointer" }}
                    onClick={() => openAddResponseModal(t)}
                    title="Add response"
                  />
                  <i
                    className="fa fa-times text-danger"
                    style={{ cursor: "pointer" }}
                    onClick={() => confirmDeleteTicket(t.id)}
                    title="Delete ticket"
                  />
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-5 text-muted">No tickets found</div>
        )}

        {/* PAGINATION */}
        {filteredTickets.length > 0 && (
          <div className="d-flex justify-content-between align-items-center mb-3">
            <div>
              Page {currentPage} of {totalPages} • {filteredTickets.length}{" "}
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

        {/* Response Modal */}
        {modalType && (
          <>
            <div className="modal fade show d-block" tabIndex="-1">
              <div className="modal-dialog modal-dialog-centered">
                <div className="modal-content">
                  <div className="modal-header">
                    <h5 className="modal-title">
                      {modalType === "edit" ? "Edit Response" : "Add Response"}{" "}
                      for Ticket #{activeTicketId}
                    </h5>
                    <button
                      type="button"
                      className="btn-close"
                      onClick={() => setModalType(null)}
                    ></button>
                  </div>
                  <div className="modal-body">
                    <div className="mb-3">
                      <label className="form-label">Status</label>
                      <select
                        className="form-select"
                        value={responseStatus}
                        onChange={(e) => setResponseStatus(e.target.value)}
                      >
                        <option value="Open">Open</option>
                        <option value="In Progress">In Progress</option>
                        <option value="Closed">Closed</option>
                      </select>
                    </div>
                    <textarea
                      className="form-control"
                      rows="4"
                      placeholder="Write your response..."
                      value={responseText}
                      onChange={(e) => setResponseText(e.target.value)}
                    />
                  </div>
                  <div className="modal-footer">
                    <button
                      className="btn btn-secondary"
                      onClick={() => setModalType(null)}
                    >
                      Cancel
                    </button>
                    <button className="btn btn-success" onClick={saveResponse}>
                      {modalType === "edit" ? "Update" : "Send"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
            <div className="modal-backdrop fade show"></div>
          </>
        )}

        {/* Delete Confirmation Modal */}
        {deleteType && (
          <>
            <div className="modal fade show d-block" tabIndex="-1">
              <div className="modal-dialog modal-dialog-centered">
                <div className="modal-content">
                  <div className="modal-header">
                    <h5 className="modal-title text-danger">Confirm Delete</h5>
                    <button
                      type="button"
                      className="btn-close"
                      onClick={() => {
                        setDeleteType(null);
                        setDeleteTicketId(null);
                        setDeleteResponseId(null);
                      }}
                    ></button>
                  </div>
                  <div className="modal-body">
                    Are you sure you want to delete this{" "}
                    {deleteType === "ticket" ? "ticket" : "response"}? This
                    action cannot be undone.
                  </div>
                  <div className="modal-footer">
                    <button
                      className="btn btn-secondary"
                      onClick={() => {
                        setDeleteType(null);
                        setDeleteTicketId(null);
                        setDeleteResponseId(null);
                      }}
                    >
                      Cancel
                    </button>
                    <button className="btn btn-danger" onClick={confirmDelete}>
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            </div>
            <div className="modal-backdrop fade show"></div>
          </>
        )}
      </div>
    </section>
  );
}

export default Support;
