import React from "react";
import { Outlet } from "react-router-dom";
import Navbar from "../components/Navbar";
// import Footer from "../components/Footer";

function ProtectedLayout() {
  return (
    <div className="min-vh-100 d-flex flex-column">
      <Navbar />
      <main className="flex-grow-1">
        <Outlet />
      </main>
      {/* <Footer /> */}
    </div>
  );
}

export default ProtectedLayout;
