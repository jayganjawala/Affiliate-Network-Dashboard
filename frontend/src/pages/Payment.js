import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Cookies from "js-cookie";
import axios from "axios";
import dayjs from "dayjs";
import { toast } from "react-hot-toast";

const API_BASE_URL =
  process.env.REACT_APP_API_BASE_URL || "http://localhost:5001/api";

function Payment() {
  const navigate = useNavigate();

  // Wallet balance
  const [walletBalance, setWalletBalance] = useState(0);

  // Modal and withdraw steps
  const [showModal, setShowModal] = useState(false);
  const [step, setStep] = useState(1);

  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState("upi");

  const [loading, setLoading] = useState(false);
  // Filters
  const [search, setSearch] = useState("");
  const [txnSearch, setTxnSearch] = useState("");
  const [statusSearch, setStatusSearch] = useState("");
  const [sortOrder, setSortOrder] = useState("desc");

  const [payments, setPayments] = useState([]);

  const [currentPage, setCurrentPage] = useState(1);
  const paymentsPerPage = 5;

  const phone = Cookies.get("dashboardphone");
  const token = Cookies.get("dashboardtoken");

  useEffect(() => {
    const fetchPayments = async () => {
      if (!phone) return;
      setLoading(true);
      try {
        const res = await axios.get(`${API_BASE_URL}/payments?phone=${phone}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.data.success) {
          setPayments(res.data?.payments);
          setWalletBalance(res.data?.employee?.totalBalance);
        } else {
          toast.error(res.data.error || "Failed to fetch payments");
        }
      } catch (err) {
        console.error("Payments fetch error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchPayments();
  }, [phone, token]);

  const resetWithdrawForm = () => {
    setAmount("");
    setMethod("upi");
    setStep(1);
    setLoading(false);
  };

  const validateAmount = () => {
    const num = Number(amount);
    if (!amount || isNaN(num) || num <= 0) return "Please enter a valid amount";
    if (num < 100) return "Minimum withdrawal amount is ₹100";
    if (num > walletBalance)
      return `Insufficient balance. Available: ₹${walletBalance.toLocaleString()}`;
    return "";
  };

  const handleNext = () => {
    const error = validateAmount();
    if (error) {
      toast.error(error);
      return;
    }
    setStep(2);
  };

  const handleWithdrawConfirm = () => {
    setLoading(true);
    setTimeout(() => {
      const success = Math.random() > 0.2;
      if (success) {
        toast.success(
          `Withdraw Amount: ₹${amount} requested (Ref: WD${Date.now().toString().slice(-6)})`,
        );
      } else {
        toast.error("Withdrawal request failed. Please try again.");
      }
      setLoading(false);
      setShowModal(false);
      resetWithdrawForm();
    }, 1800);
  };

  /* ✅ RESET PAGE ON FILTER CHANGE */
  useEffect(() => {
    setCurrentPage(1);
  }, [search, txnSearch, statusSearch, sortOrder]);

  const filteredPayments = payments
    .filter((item) => {
      const namePhoneMatch =
        (item.clientName?.toLowerCase() || "").includes(search.toLowerCase()) ||
        (item.clientPhone || "").includes(search);

      const txnMatch =
        txnSearch === "" ||
        (item.transactionId?.toLowerCase() || "").includes(
          txnSearch.toLowerCase(),
        );

      const statusMatch =
        statusSearch === "" ||
        (item.paymentStatus?.toLowerCase() || "").includes(
          statusSearch.toLowerCase(),
        );

      return namePhoneMatch && txnMatch && statusMatch;
    })
    .sort((a, b) => {
      const dateA = new Date(a.paymentDate || a.date || 0).getTime();
      const dateB = new Date(b.paymentDate || b.date || 0).getTime();
      return sortOrder === "asc" ? dateA - dateB : dateB - dateA;
    });

  /* ✅ PAGINATION LOGIC */
  const indexOfLast = currentPage * paymentsPerPage;
  const indexOfFirst = indexOfLast - paymentsPerPage;
  const currentPayments = filteredPayments.slice(indexOfFirst, indexOfLast);
  const totalPages = Math.ceil(filteredPayments.length / paymentsPerPage);

  const goToNextPage = () => {
    if (currentPage < totalPages) setCurrentPage((prev) => prev + 1);
  };

  const goToPreviousPage = () => {
    if (currentPage > 1) setCurrentPage((prev) => prev - 1);
  };

  const handleAmountChange = (e) => {
    const rawValue = e.target.value.replace(/,/g, "");
    if (!/^\d*$/.test(rawValue)) return;
    setAmount(rawValue);
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

        {/* Title + Withdraw Button */}
        <div className="row mb-3 g-3 align-items-center">
          <div className="col-7 col-lg-10">
            <h4 className="fw-bold mb-0">Recent Payments</h4>
          </div>
          <div className="col-5 col-lg-2 text-end">
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={() => setShowModal(true)}
            >
              <i className="fa-solid fa-money-bill-transfer"></i> Withdraw
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="row g-3 mb-3">
          <div className="col-6 col-md-3">
            <input
              type="text"
              className="form-control"
              placeholder="Name or Phone number"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="col-6 col-md-3">
            <input
              type="text"
              className="form-control"
              placeholder="Transaction ID"
              value={txnSearch}
              onChange={(e) => setTxnSearch(e.target.value)}
            />
          </div>
          <div className="col-6 col-md-2">
            <select
              className="form-select"
              value={statusSearch}
              onChange={(e) => setStatusSearch(e.target.value)}
            >
              <option value="">All Status</option>
              <option value="Success">Success</option>
              <option value="Pending">Pending</option>
              <option value="Rejected">Rejected</option>
            </select>
          </div>
          <div className="col-6 col-md-2">
            <select
              className="form-select"
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
            >
              <option value="desc">Newest</option>
              <option value="asc">Oldest</option>
            </select>
          </div>
          <div className="col-12 col-md-2">
            <button
              className="btn btn-secondary w-100"
              onClick={() => {
                setSearch("");
                setTxnSearch("");
                setStatusSearch("");
                setSortOrder("desc");
              }}
            >
              Clear
            </button>
          </div>
        </div>

        {/* Applied Filters */}
        {(search ||
          txnSearch ||
          statusSearch ||
          (sortOrder && sortOrder !== "desc")) && (
          <div className="row g-3 mb-3">
            <div className="col-auto">
              <span className="fw-semibold">Filters applied:</span>
            </div>
            {search && (
              <div className="col-auto">
                <span className="badge bg-secondary">
                  Name/Phone: {search}{" "}
                  <i
                    className="fa fa-times ms-1"
                    style={{ cursor: "pointer" }}
                    onClick={() => setSearch("")}
                  ></i>
                </span>
              </div>
            )}
            {txnSearch && (
              <div className="col-auto">
                <span className="badge bg-secondary">
                  Transaction ID: {txnSearch}{" "}
                  <i
                    className="fa fa-times ms-1"
                    style={{ cursor: "pointer" }}
                    onClick={() => setTxnSearch("")}
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

        {/* Header */}
        <div className="d-none d-md-block p-3 rounded-1 bg-dark text-light">
          <div className="row g-3">
            <div className="col-md-1">#</div>
            <div className="col-md-3">Transaction Details</div>
            <div className="col-md-2">Total Amount</div>
            <div className="col-md-2">Paid Amount</div>
            <div className="col-md-2 text-center">Pending Amount</div>
            <div className="col-md-2 text-end">Status</div>
          </div>
        </div>

        {/* Data Rows */}
        {currentPayments.length > 0 ? (
          currentPayments.map((item) => (
            <div
              key={item.id}
              className="border p-3 rounded-1 text-dark my-2 bg-body"
            >
              <div className="row g-3 align-items-start">
                <div className="col-md-1 col-6 order-1 order-md-1 d-none d-md-block">
                  <span className="fw-semibold">{item.id}</span>
                </div>

                <div className="col-md-3 col-9 order-1 order-md-3 text-md-start">
                  <div>
                    <div className="row align-items-center mb-1">
                      <div className="col">
                        <span className="fw-semibold d-md-none">
                          {item.id}.{" "}
                        </span>
                        <span className="fw-semibold">{item.clientName}</span>
                        <div className="text-muted mt-1">
                          {item.clientPhone}
                        </div>
                        <div className="text-muted small mt-1">
                          Txn ID: <strong>{item.transactionId}</strong>
                        </div>
                        <div className="text-muted small mt-1">
                          <strong>
                            (
                            {item.paymentDate
                              ? dayjs(item.paymentDate).format(
                                  "DD MMM YYYY, hh:mm A",
                                )
                              : "-"}
                            )
                          </strong>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="col-md-2 col-4 order-3 order-md-3">
                  <small className="fw-bold d-md-none d-block">Total</small>₹
                  {Number(item.totalAmount || 0).toLocaleString("en-IN")}
                </div>
                <div className="col-md-2 col-4 order-4 order-md-3">
                  <small className="fw-bold d-md-none d-block">Paid</small>₹
                  {Number(item.paidAmount || 0).toLocaleString("en-IN")}
                </div>
                <div className="col-md-2 col-4 text-end text-md-center order-md-4 order-5">
                  <small className="fw-bold d-md-none d-block">Pending</small>₹
                  {Number(item.remainingAmount || 0).toLocaleString("en-IN")}
                </div>
                <div className="col-md-2 col-3 text-end d-md-block order-2 order-md-5">
                  <span
                    className={`badge ${
                      item.paymentStatus === "Success"
                        ? "bg-success"
                        : item.paymentStatus === "Pending"
                          ? "bg-warning text-dark"
                          : "bg-danger"
                    }`}
                  >
                    {item.paymentStatus}
                  </span>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-5 text-muted">No records found</div>
        )}

        {/* PAGINATION */}
        {filteredPayments.length > 0 && (
          <div className="d-flex justify-content-between align-items-center mb-3">
            <div>
              Page {currentPage} of {totalPages} • {filteredPayments.length}{" "}
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

        {/* Withdraw Modal */}
        {showModal && (
          <>
            <div
              className="modal fade show d-block"
              tabIndex="-1"
              style={{ backgroundColor: "rgba(0,0,0,0.6)" }}
            >
              <div className="modal-dialog modal-dialog-centered">
                <div className="modal-content border-0 shadow-lg">
                  <div className="modal-header bg-primary text-white">
                    <h5 className="modal-title fw-bold">
                      {step === 1 ? "Withdraw Funds" : "Confirm Withdrawal"}
                    </h5>
                    <button
                      type="button"
                      className="btn-close btn-close-white"
                      onClick={() => {
                        setShowModal(false);
                        resetWithdrawForm();
                      }}
                      disabled={loading}
                    ></button>
                  </div>
                  <div className="modal-body">
                    {step === 1 ? (
                      <>
                        <div className="mb-4">
                          <label className="form-label fw-bold">
                            Available Balance
                          </label>
                          <div className="fs-3 fw-bold text-success">
                            ₹
                            {Number(walletBalance ?? 0).toLocaleString("en-IN")}
                          </div>
                        </div>
                        <div className="mb-3">
                          <label className="form-label fw-bold">
                            Amount (₹)
                          </label>
                          <input
                            type="text"
                            className="form-control form-control-lg"
                            placeholder="Enter amount"
                            value={Number(amount || 0).toLocaleString("en-IN")}
                            onChange={handleAmountChange}
                            min="100"
                            disabled={loading}
                          />
                          <small className="text-muted mt-1 d-block">
                            Min: ₹100 • Max: ₹
                            {Number(walletBalance ?? 0).toLocaleString("en-IN")}
                          </small>
                        </div>
                        <div className="mb-4">
                          <label className="form-label fw-bold">
                            Withdrawal Method
                          </label>
                          <select
                            className="form-select form-select-lg"
                            value={method}
                            onChange={(e) => setMethod(e.target.value)}
                            disabled={loading}
                          >
                            <option value="upi">UPI</option>
                            <option value="bank">Bank Transfer</option>
                          </select>
                        </div>
                        <button
                          className="btn btn-primary btn-lg w-100"
                          onClick={handleNext}
                          disabled={loading}
                        >
                          Review & Confirm
                        </button>
                      </>
                    ) : (
                      <div className="text-center py-4">
                        <h5 className="mb-4">Confirm Withdrawal</h5>
                        <div className="mb-4">
                          <div className="fs-1 fw-bold text-primary">
                            ₹{Number(amount).toLocaleString()}
                          </div>
                          <div className="text-muted mt-2">
                            to <strong>{method.toUpperCase()}</strong>
                          </div>
                        </div>
                        <div className="alert alert-warning small mb-4">
                          This action cannot be undone.
                          <br />
                          Processing usually takes 1–24 hours.
                        </div>
                        <div className="d-grid gap-2">
                          <button
                            className="btn btn-success btn-lg"
                            onClick={handleWithdrawConfirm}
                            disabled={loading}
                          >
                            {loading ? (
                              <>
                                <span className="spinner-border spinner-border-sm me-2"></span>
                                Processing...
                              </>
                            ) : (
                              "Confirm & Withdraw"
                            )}
                          </button>
                          <button
                            className="btn btn-outline-secondary"
                            onClick={() => setStep(1)}
                            disabled={loading}
                          >
                            Back
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="modal-footer bg-light">
                    <small className="text-muted">
                      Secure withdrawal • Bank-grade encryption
                    </small>
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

export default Payment;
