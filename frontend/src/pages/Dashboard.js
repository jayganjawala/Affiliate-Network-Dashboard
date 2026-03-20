import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Cookies from "js-cookie";
import axios from "axios";
import dayjs from "dayjs";

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend,
} from "chart.js";
import { Bar } from "react-chartjs-2";

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

/* ===== COMMON GRID ===== */
const commonGrid = {
  grid: {
    display: false,
    drawBorder: false,
  },
  ticks: {
    font: { size: 11 },
  },
};

const API_BASE_URL =
  process.env.REACT_APP_API_BASE_URL || "http://localhost:5001/api";

function Dashboard() {
  const navigate = useNavigate();

  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState("success");

  // Responsive bar thickness
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const phone = Cookies.get("dashboardphone");
  const token = Cookies.get("dashboardtoken");

  const [profile, setProfile] = useState(null);
  const [payments, setPayments] = useState({
    commissionTotalAmount: 0,
    commission: "",
    totalBalance: 0,
  });
  const [supportData, setSupportData] = useState({
    totalRequests: 0,
    pending: 0,
    resolved: 0,
  });

  const [leadSummary, setLeadSummary] = useState({
    totalLeads: 0,
    approvedLeads: 0,
    duplicateLeads: 0,
    totalClients: 0,
  });

  const [leadHistory, setLeadHistory] = useState([]);

  const [monthlyPayments, setMonthlyPayments] = useState([]);

  // Fetch Profile
  useEffect(() => {
    const fetchProfile = async () => {
      if (!phone) {
        navigate("/login");
        return;
      }

      try {
        const res = await axios.get(
          `${API_BASE_URL}/myprofile?phone=${phone}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        );

        if (res.data.success) {
          setProfile(res.data.profile);
        } else {
          setToastType("danger");
          setToastMessage("Failed to load profile");
          setShowToast(true);
          setTimeout(() => setShowToast(false), 4000);
        }
      } catch (err) {
        console.error("Profile fetch failed", err);
        setToastType("danger");
        setToastMessage("Server error while loading profile");
        setShowToast(true);
        setTimeout(() => setShowToast(false), 4000);
      }
    };

    fetchProfile();
  }, [phone, token, navigate]);

  // Fetch Payment Card Info
  useEffect(() => {
    const fetchPayments = async () => {
      if (!phone || !token) return;

      try {
        const res = await axios.get(`${API_BASE_URL}/payments?phone=${phone}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.data.success) {
          throw new Error(res.data.error || "Failed to fetch payments");
        }

        // Update main payments info
        setPayments({
          // commissionTotalAmount: res.data.commissionTotalAmount,
          paidAmount: res.data.totalPaidAmount,
          commission: res.data.employee?.commission,
          totalBalance: res.data.employee?.totalBalance,
        });

        // Aggregate daily payments
        // const dailyDataMap = {};
        // res.data.payments.forEach((p) => {
        //   const dayKey = dayjs(p.paymentDate).format("YYYY-MM-DD");

        //   if (!dailyDataMap[dayKey]) {
        //     dailyDataMap[dayKey] = {
        //       clients: 0,
        //       eligibleClients: 0,
        //       payment: 0,
        //     };
        //   }

        //   dailyDataMap[dayKey].payment += Number(p.paidAmount || 0);
        //   if (
        //     p.paymentStatus === "Success" &&
        //     Number(p.remainingAmount) === 0 &&
        //     Number(p.isPartial) === 0
        //   ) {
        //     dailyDataMap[dayKey].clients += 1;
        //     dailyDataMap[dayKey].eligibleClients += 1;
        //   }
        // });

        // const dailyArray = Object.keys(dailyDataMap)
        //   .sort()
        //   .map((day) => ({
        //     date: day,
        //     clients: dailyDataMap[day].clients,
        //     eligibleClients: dailyDataMap[day].eligibleClients,
        //     payment: dailyDataMap[day].payment,
        //   }));

        const dailyDataMap = {};

        res.data.payments.forEach((p) => {
          const dayKey = dayjs(p.paymentDate).format("YYYY-MM-DD");

          if (!dailyDataMap[dayKey]) {
            dailyDataMap[dayKey] = {
              clientsSet: new Set(),
              eligibleClientsSet: new Set(),
              payment: 0,
            };
          }

          // Add payment amount
          dailyDataMap[dayKey].payment += Number(p.paidAmount || 0);

          // Track unique clients
          if (p.userId) {
            dailyDataMap[dayKey].clientsSet.add(p.userId);
          }

          // Track eligible unique clients
          if (
            p.paymentStatus === "Success" &&
            Number(p.remainingAmount) === 0 &&
            Number(p.isPartial) === 0 &&
            p.userId
          ) {
            dailyDataMap[dayKey].eligibleClientsSet.add(p.userId);
          }
        });

        const dailyArray = Object.keys(dailyDataMap)
          .sort()
          .map((day) => ({
            date: day,
            clients: dailyDataMap[day].clientsSet.size,
            eligibleClients: dailyDataMap[day].eligibleClientsSet.size,
            payment: dailyDataMap[day].payment,
          }));

        setMonthlyPayments(dailyArray);
      } catch (err) {
        console.error("Payments fetch failed", err);
        setToastType("danger");
        setToastMessage(
          err.response?.data?.error ||
            err.message ||
            "Server error while loading payments",
        );
        setShowToast(true);
        setTimeout(() => setShowToast(false), 4000);
      }
    };

    fetchPayments();
  }, [phone, token, navigate]);

  // Fetch Support Data
  useEffect(() => {
    const fetchSupportData = async () => {
      if (!phone) return;

      try {
        const res = await axios.get(`${API_BASE_URL}/support?phone=${phone}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (res.data.success) {
          setSupportData({
            totalRequests: res.data.requestsCount,
            pending: res.data.pendingCount,
            resolved: res.data.resolvedCount,
          });
        } else {
          setToastType("danger");
          setToastMessage("Failed to fetch support requests");
          setShowToast(true);
          setTimeout(() => setShowToast(false), 4000);
        }
      } catch (err) {
        console.error("Support fetch failed", err);
        setToastType("danger");
        setToastMessage("Server error while fetching support requests");
        setShowToast(true);
        setTimeout(() => setShowToast(false), 4000);
      }
    };

    fetchSupportData();
  }, [phone, token]);

  // Fetch Lead Summary
  useEffect(() => {
    const fetchLeadSummary = async () => {
      if (!phone) return;

      try {
        const res = await axios.get(
          `${API_BASE_URL}/leadhistory?phone=${phone}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        );

        if (res.data.success) {
          setLeadHistory(res.data.dailyStats || []);
          setLeadSummary(res.data.summary);
        } else {
          setToastType("danger");
          setToastMessage("Failed to fetch lead summary");
          setShowToast(true);
          setTimeout(() => setShowToast(false), 4000);
        }
      } catch (err) {
        console.error("Lead summary fetch failed", err);
        setToastType("danger");
        setToastMessage("Server error while fetching lead summary");
        setShowToast(true);
        setTimeout(() => setShowToast(false), 4000);
      }
    };

    fetchLeadSummary();
  }, [phone, token]);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    window.addEventListener("resize", handleResize);
    // Cleanup
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const barThickness = isMobile ? 20 : 50;
  const maxBarThickness = isMobile ? 20 : 55;

  // ── Filters for merged analytics chart ──
  const [paymentsYear, setPaymentsYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState("all");

  // ── Year navigation for Lead Status chart ──
  const [currentLeadYear, setCurrentLeadYear] = useState(
    new Date().getFullYear(),
  );

  const goToPreviousLeadYear = () => {
    setCurrentLeadYear((prev) => prev - 1);
  };

  const goToNextLeadYear = () => {
    setCurrentLeadYear((prev) => prev + 1);
  };

  /* ================= MERGED ANALYTICS CHART DATA ================= */
  const commissionLabel = payments?.commission || "";
  const isPercentageCommission = commissionLabel.includes("%");
  const isFlatCommission = commissionLabel.includes("/Flat");

  // Filter data for the selected year
  const filteredKeys = monthlyPayments.filter((item) => {
    const [year] = item.date.split("-");
    return Number(year) === paymentsYear;
  });

  // Aggregate data
  let chartData = [];

  if (selectedMonth === "all") {
    // Sum by month
    const monthlyMap = {};

    filteredKeys.forEach((item) => {
      const [year, month] = item.date.split("-");
      const key = `${year}-${month}`;

      if (!monthlyMap[key]) {
        monthlyMap[key] = { clients: 0, payment: 0, eligibleClients: 0 };
      }

      // Sum all payments/clients in the same month
      monthlyMap[key].clients += item.clients;
      monthlyMap[key].payment += item.payment;
      monthlyMap[key].eligibleClients += item.eligibleClients;
    });

    // Convert map to array and sort by month
    chartData = Object.entries(monthlyMap)
      .map(([date, data]) => ({
        date,
        ...data,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));
  } else {
    // Day-wise data for a specific month
    chartData = filteredKeys.filter((item) => {
      const [, month] = item.date.split("-");
      return month === selectedMonth;
    });
  }

  // Labels
  const labels = chartData.map((item) => {
    const [year, month] = item.date.split("-");
    if (selectedMonth === "all") {
      return new Date(Number(year), Number(month) - 1).toLocaleString(
        "default",
        {
          month: "short",
          year: "numeric",
        },
      );
    }
    return dayjs(item.date).format("DD MMM"); // day-wise
  });

  // Datasets
  const clientData = chartData.map((item) => item.clients);
  const paymentData = chartData.map((item) => item.payment);

  let commissionData = [];
  if (isPercentageCommission) {
    const commissionPercent = Number(commissionLabel.replace("%", "")) || 0;
    commissionData = paymentData.map((amt) =>
      Number(((amt * commissionPercent) / 100).toFixed(2)),
    );
  } else if (isFlatCommission) {
    const flatAmount = Number(commissionLabel.replace("/Flat", "").trim()) || 0;
    commissionData = chartData.map((item) => item.eligibleClients * flatAmount);
  }

  const datasets = [
    {
      label: "Clients Converted",
      data: clientData,
      yAxisID: "yClients",
      backgroundColor: "#0d6efd65",
      borderRadius: 8,
      barThickness,
      maxBarThickness,
    },
    {
      label: "Payments (₹)",
      data: paymentData,
      yAxisID: "yAmount",
      backgroundColor: "#19875475",
      borderRadius: 8,
      barThickness,
      maxBarThickness,
      stack: "amount",
    },
  ];

  if (isPercentageCommission || isFlatCommission) {
    datasets.push({
      label: `Commission (${payments.commission})`,
      data: commissionData,
      yAxisID: "yAmount",
      backgroundColor: "#ffc10765",
      borderRadius: 8,
      barThickness,
      maxBarThickness,
    });
  }

  const mergedChartData = {
    labels,
    datasets,
  };

  const mergedChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    animation: { duration: 800 },
    plugins: {
      legend: {
        position: "top",
        labels: { font: { size: isMobile ? 11 : 12 } },
      },
      title: {
        display: true,
        text: `Clients + Payments (${paymentsYear})${
          selectedMonth !== "all"
            ? " – " +
              new Date(0, Number(selectedMonth) - 1).toLocaleString("default", {
                month: "long",
              })
            : ""
        }`,
        font: { size: isMobile ? 13 : 14 },
      },
      tooltip: {
        titleFont: { size: isMobile ? 12 : 14 },
        bodyFont: { size: isMobile ? 12 : 13 },
        callbacks: {
          label: (ctx) => {
            const value = ctx.parsed.y || 0;
            if (ctx.dataset.label.includes("Client")) {
              return `Clients: ${value}`;
            }
            return `${ctx.dataset.label}: ₹${value.toLocaleString()}`;
          },
        },
      },
    },
    scales: {
      x: { ...commonGrid, ticks: { font: { size: isMobile ? 10 : 11 } } },
      yClients: {
        type: "linear",
        position: "left",
        beginAtZero: true,
        ...commonGrid,
        title: {
          display: false,
          text: "Clients",
          font: { size: isMobile ? 11 : 12 },
        },
        ticks: { stepSize: 10, font: { size: isMobile ? 10 : 11 } },
        // grid: { drawOnChartArea: false },
      },
      yAmount: {
        type: "linear",
        position: "right",
        beginAtZero: true,
        ...commonGrid,
        title: {
          display: false,
          text: "Amount (₹)",
          font: { size: isMobile ? 11 : 12 },
        },
        ticks: {
          // callback: (v) => (v === 0 ? "0" : `₹${v / 1000}k`),
          callback: (v) => {
            if (v === 0) return "0";

            if (v < 100000) {
              return `₹${(v / 1000).toFixed(0)}k`;
            }

            return `₹${(v / 100000).toFixed(0)}L`;
          },

          stepSize: 500000,
          font: { size: isMobile ? 10 : 11 },
        },
        // grid: { drawOnChartArea: false },
      },
    },
  };

  /* ================= LEAD STATUS CHART ================= */

  // const filteredLeadHistory = leadHistory
  //   .filter((item) => dayjs(item.date).year() === currentLeadYear)
  //   .sort((a, b) => dayjs(a.date).unix() - dayjs(b.date).unix());

  const monthlyData = {};

  leadHistory.forEach((item) => {
    const date = dayjs(item.date);
    if (date.year() === currentLeadYear) {
      const monthKey = date.format("YYYY-MM");
      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = {
          totalLeads: 0,
          approvedLeads: 0,
          duplicateLeads: 0,
          label: date.format("MMM"),
        };
      }
      monthlyData[monthKey].totalLeads += item.totalLeads;
      monthlyData[monthKey].approvedLeads += item.approvedLeads;
      monthlyData[monthKey].duplicateLeads += item.duplicateLeads || 0;
    }
  });

  const filteredLeadHistory = Object.values(monthlyData).sort(
    (a, b) =>
      dayjs(`${currentLeadYear}-${a.label}`, "YYYY-MMM").month() -
      dayjs(`${currentLeadYear}-${b.label}`, "YYYY-MMM").month(),
  );

  const leadStatusData = {
    // labels: filteredLeadHistory.map((item) => dayjs(item.date).format("MMM")),
    labels: filteredLeadHistory.map((item) => item.label),
    datasets: [
      {
        label: "Total Leads",
        data: filteredLeadHistory.map((item) => item.totalLeads),
        backgroundColor: "#0d6efd65",
        borderRadius: 8,
        barThickness,
        maxBarThickness,
      },
      {
        label: "Approved Leads",
        data: filteredLeadHistory.map((item) => item.approvedLeads),
        backgroundColor: "#19875475",
        borderRadius: 8,
        barThickness,
        maxBarThickness,
      },
      {
        label: "Duplicate Leads",
        data: filteredLeadHistory.map((item) => item.duplicateLeads || 0),
        backgroundColor: "#dc354575",
        borderRadius: 8,
        barThickness,
        maxBarThickness,
      },
    ],
  };

  const leadStatusOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      title: {
        display: true,
        text: `Leads (${currentLeadYear})`,
        font: { size: 12 },
      },
    },
    scales: {
      x: {
        stacked: false,
        barPercentage: 1,
        categoryPercentage: 1,
        ...commonGrid,
        ticks: { font: { size: isMobile ? 10 : 11 } },
      },
      y: {
        stacked: false,
        beginAtZero: true,
        ...commonGrid,
        ticks: {
          stepSize: 1,
          callback: function (value) {
            return Number.isInteger(value) ? value : null;
          },
        },
      },
    },
  };

  return (
    <section className="poppins-regular">
      <div className="container py-2">
        <div className="row">
          <div className="col-12 col-lg-12 mt-2">
            <h4 className="fw-bold fs-3 mb-3">
              Hello, {profile?.personalInformation?.fullName}
            </h4>
            <small className="d-block mb-2">
              Last Updated:{" "}
              {/* <span className="text-black">
                {profile?.personalInformation?.updatedAt
                  ? dayjs(profile.personalInformation.updatedAt).format(
                      "DD MMM YYYY, hh:mm A",
                    )
                  : "—"}
              </span> */}
              <span className="text-black">
                {dayjs(new Date()).format("DD MMM YYYY, hh:mm A")}
              </span>
            </small>
          </div>
        </div>

        <div className="row g-3">
          <div className="col-12 col-lg-4">
            <div
              className="text-body-emphasis text-decoration-none p-3 rounded h-100"
              onClick={() => navigate("/users")}
              style={{ cursor: "pointer", backgroundColor: "#03002e" }}
              data-bs-theme="dark"
            >
              <div className="row align-items-start">
                <div className="col">
                  <h5 className="fw-semibold mb-0">Leads</h5>
                </div>
                <div className="col-auto">
                  <i className="fa fa-arrow-right mt-2" aria-hidden="true"></i>
                </div>
              </div>

              <div className="row g-3 mt-2">
                <div className="col-6 col-md-4 d-block">
                  <small className="text-muted">
                    Total Leads{" "}
                    <i
                      className="fa fa-info-circle"
                      style={{ cursor: "pointer" }}
                    ></i>
                  </small>
                  <h6 className="mb-0 text-body-emphasis">
                    {leadSummary?.totalLeads}
                  </h6>
                </div>

                <div className="col-6 col-md-4 d-block text-md-start text-end">
                  <small className="text-muted">
                    Approved{" "}
                    <i
                      className="fa fa-info-circle"
                      style={{ cursor: "pointer" }}
                    ></i>
                  </small>
                  <h6 className="mb-0 text-success-emphasis">
                    {leadSummary?.approvedLeads}
                  </h6>
                </div>

                <div className="col-md-4 d-none d-md-block">
                  <small className="text-muted">
                    Total Clients{" "}
                    <i
                      className="fa fa-info-circle"
                      style={{ cursor: "pointer" }}
                    ></i>
                  </small>
                  <h6 className="mb-0 text-success-emphasis">
                    {leadSummary?.totalClients}
                  </h6>
                </div>

                <hr
                  className="d-md-none"
                  style={{ borderTop: "2px solid white" }}
                />

                <div className="col-6 d-block d-md-none mt-0">
                  <small className="text-muted">
                    Total Clients{" "}
                    <i
                      className="fa fa-info-circle"
                      style={{ cursor: "pointer" }}
                    ></i>
                  </small>
                </div>
                <div className="col-6 d-block d-md-none mt-0 text-end">
                  <h6 className="mb-0 text-success-emphasis">
                    {leadSummary?.totalClients}
                  </h6>
                </div>
              </div>
            </div>
          </div>

          {/* Cards row */}
          <div className="col-12 col-lg-8">
            <div className="row g-3">
              <div className="col-12 col-md-6 col-lg-6">
                <div className="p-3 border bg-body rounded bg-gradient">
                  <div
                    className="text-body-emphasis text-decoration-none"
                    onClick={() => navigate("/payment")}
                    style={{ cursor: "pointer" }}
                  >
                    <div className="d-flex justify-content-between align-items-start">
                      <div className="me-3">
                        <h5 className="fw-bold">Payments</h5>
                      </div>
                      <i
                        className="fa fa-arrow-right mt-2"
                        aria-hidden="true"
                      ></i>
                    </div>
                    <div className="d-flex justify-content-between align-items-center mt-4">
                      <div>
                        <small className="text-muted d-block">
                          Paid Amount
                        </small>
                        <h6 className="mb-0">
                          +{payments?.paidAmount?.toLocaleString("en-IN")}
                        </h6>
                      </div>
                      <div>
                        <small className="text-muted d-block text-end">
                          Commission
                        </small>
                        <h6 className="mb-0">{payments?.commission}</h6>
                      </div>

                      <div>
                        <small className="text-muted text-end d-block">
                          Total Balance
                        </small>
                        <h6 className="mb-0">
                          +
                          {Number(payments?.totalBalance ?? 0).toLocaleString(
                            "en-IN",
                          )}
                        </h6>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="col-12 col-md-6 col-lg-6">
                <div className="p-3 border rounded bg-body bg-gradient">
                  <div
                    className="text-body-emphasis text-decoration-none"
                    onClick={() => navigate("/support")}
                    style={{ cursor: "pointer" }}
                  >
                    <div className="d-flex justify-content-between align-items-start">
                      <div className="me-3">
                        <h5 className="fw-bold">User Support</h5>
                      </div>
                      <i
                        className="fa fa-arrow-right mt-2"
                        aria-hidden="true"
                      ></i>
                    </div>
                    <div className="d-flex justify-content-between align-items-center mt-4">
                      <div>
                        <small className="text-muted d-block">
                          Total Request
                        </small>
                        <h6 className="mb-0">{supportData.totalRequests}</h6>
                      </div>

                      <div>
                        <small className="text-muted badge bg-warning bg-opacity-50 d-block text-end">
                          Pending
                        </small>
                        <h6 className="mb-0">{supportData.pending}</h6>
                      </div>

                      <div>
                        <small className="text-muted badge bg-success bg-opacity-50 d-block text-end">
                          Resolved
                        </small>
                        <h6 className="mb-0">{supportData.resolved}</h6>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom row – two charts side by side */}
        <div className="row pt-3 g-3">
          {/* Lead Status Chart */}
          <div className="col-12 col-lg-4">
            <div className="border rounded p-3 bg-body h-100 d-flex flex-column">
              <div className="d-flex justify-content-between align-items-start flex-wrap mb-2">
                <h6 className="fw-bold mb-0">
                  {leadStatusOptions.plugins.title.text}
                </h6>
                <div>
                  <button
                    className="btn btn-outline-secondary border-0 btn-sm"
                    onClick={goToPreviousLeadYear}
                  >
                    <i className="fa fa-chevron-left"></i>
                  </button>
                  <button
                    className="btn btn-outline-secondary border-0 btn-sm ms-1"
                    onClick={goToNextLeadYear}
                  >
                    <i className="fa fa-chevron-right"></i>
                  </button>
                </div>
              </div>

              <div
                style={{ position: "relative", flex: 1, minHeight: "300px" }}
              >
                <Bar data={leadStatusData} options={leadStatusOptions} />
              </div>
            </div>
          </div>

          {/* Merged Clients + Payments Chart */}
          <div className="col-12 col-lg-8">
            <div className="border rounded p-3 bg-body h-100 d-flex flex-column">
              <div className="row g-2 align-items-start">
                {/* Title */}
                <div className="col-lg-6 col-12">
                  <h6 className="fw-bold">Payments Overview({paymentsYear})</h6>
                </div>

                {/* Filters */}
                <div className="col-lg-6 col-12">
                  <div className="row g-3">
                    {/* Year Dropdown */}
                    <div className="col-6 text-md-end">
                      <select
                        className="form-select form-select-sm"
                        value={paymentsYear}
                        onChange={(e) =>
                          setPaymentsYear(Number(e.target.value))
                        }
                      >
                        {Array.from({ length: 10 }, (_, i) => 2024 + i).map(
                          (year) => (
                            <option key={year} value={year}>
                              {year}
                            </option>
                          ),
                        )}
                      </select>
                    </div>

                    {/* Month Dropdown */}
                    <div className="col-6">
                      <select
                        className="form-select form-select-sm"
                        value={selectedMonth}
                        onChange={(e) => setSelectedMonth(e.target.value)}
                      >
                        <option value="all">All Months</option>
                        {(() => {
                          const currentYear = new Date().getFullYear();
                          const currentMonth = new Date().getMonth(); // 0-indexed
                          const monthsToShow =
                            paymentsYear < currentYear ? 12 : currentMonth + 1;

                          return Array.from({ length: monthsToShow }).map(
                            (_, i) => (
                              <option
                                key={i}
                                value={String(i + 1).padStart(2, "0")}
                              >
                                {new Date(0, i).toLocaleString("default", {
                                  month: "short",
                                })}
                              </option>
                            ),
                          );
                        })()}
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              <div
                style={{ position: "relative", flex: 1, minHeight: "300px" }}
              >
                {labels.length ? (
                  <Bar data={mergedChartData} options={mergedChartOptions} />
                ) : (
                  <div className="d-flex justify-content-center align-items-center h-100 text-muted">
                    No data available for selected period
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* 3rd Row – Partners Help & Support Banner */}
        <div className="row pt-3 pb-2 g-3">
          <div className="col-lg-6 col-12">
            <div className="p-3 rounded bg-body border-start border-5 border-primary border-opacity-50">
              <div className="row align-items-start">
                <div className="col">
                  <h5 className="fw-bold">
                    <i className="fa-sharp fa-solid fa-handshake-angle"></i>{" "}
                    Relationship Manager
                  </h5>

                  <div className="row pt-3 g-3">
                    <div className="col-md-4 col-6">
                      <small className="text-muted d-block">Name</small>
                      <h6 className="mb-0">
                        {profile?.relationshipManager?.fullName}
                      </h6>
                    </div>

                    <div className="col-md-4 col-6 text-end text-md-start">
                      <small className="text-muted d-block">Phone Number</small>
                      <h6 className="mb-0">
                        {profile?.relationshipManager?.phone}
                      </h6>
                    </div>

                    <div className="col-md-4 col-12">
                      <small className="text-muted d-block">Commission</small>
                      <h6 className="mb-0">
                        {profile?.relationshipManager?.commission}
                      </h6>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="col-lg-6 col-12">
            <div className="p-3 rounded bg-body border-start border-5 border-warning border-opacity-50">
              <div className="row align-items-start">
                <div className="col">
                  <h5 className="fw-bold">
                    <i className="fa-solid fa-headset"></i> Communicator
                  </h5>

                  <div className="row pt-3 g-3">
                    <div className="col-md-4 col-6">
                      <small className="text-muted d-block">Name</small>
                      <h6 className="mb-0">{profile?.organization?.name}</h6>
                    </div>

                    <div className="col-md-4 col-6 text-end text-md-start">
                      <small className="text-muted d-block">Phone Number</small>
                      <h6 className="mb-0">{profile?.organization?.phone}</h6>
                    </div>
                    <div className="col-md-4 col-12">
                      <small className="text-muted d-block">Email Id</small>
                      <h6 className="mb-0">{profile?.organization?.email}</h6>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Toast */}
      <div className="toast-container position-fixed top-0 end-0 p-3">
        <div
          className={`toast align-items-center text-bg-${toastType} ${
            showToast ? "show" : ""
          }`}
          role="alert"
          aria-live="assertive"
          aria-atomic="true"
        >
          <div className="d-flex">
            <div className="toast-body">{toastMessage}</div>
            <button
              type="button"
              className="btn-close btn-close-white me-2 m-auto"
              onClick={() => setShowToast(false)}
            ></button>
          </div>
        </div>
      </div>
    </section>
  );
}

export default Dashboard;
