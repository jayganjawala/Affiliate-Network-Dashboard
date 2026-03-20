import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";
import Cookies from "js-cookie";
import { useState, useEffect } from "react";
import Login from "./pages/login";
import Dashboard from "./pages/Dashboard";
import Payment from "./pages/Payment";
import Support from "./pages/Support";
import MyProfile from "./pages/MyProfile";
import Users from "./pages/Users";
import UploadLeads from "./pages/UploadLeads";
import LeadHistory from "./pages/LeadHistory";
import Overview from "./pages/Overview";
import ProtectedLayout from "./layouts/ProtectedLayout";

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(
    () => !!Cookies.get("dashboardtoken"),
  );

  function ScrollToTop() {
    const { pathname } = useLocation();

    useEffect(() => {
      window.scrollTo(0, 0);
    }, [pathname]);

    return null;
  }

  return (
    <BrowserRouter>
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<Login setAuth={setIsAuthenticated} />} />

        <Route element={<ProtectedLayout />}>
          <Route
            path="/dashboard"
            element={
              isAuthenticated ? <Dashboard /> : <Navigate to="/" replace />
            }
          />

          <Route
            path="/payment"
            element={
              isAuthenticated ? <Payment /> : <Navigate to="/" replace />
            }
          />

          <Route
            path="/support"
            element={
              isAuthenticated ? <Support /> : <Navigate to="/" replace />
            }
          />

          <Route
            path="/myprofile"
            element={
              isAuthenticated ? <MyProfile /> : <Navigate to="/" replace />
            }
          />

          <Route
            path="/users"
            element={isAuthenticated ? <Users /> : <Navigate to="/" replace />}
          />

          <Route
            path="/uploadleads"
            element={
              isAuthenticated ? <UploadLeads /> : <Navigate to="/" replace />
            }
          />

          <Route
            path="/history"
            element={
              isAuthenticated ? <LeadHistory /> : <Navigate to="/" replace />
            }
          />

          <Route
            path="/overview"
            element={
              isAuthenticated ? <Overview /> : <Navigate to="/" replace />
            }
          />

        </Route>

        <Route path="*" element={<div>404 - Page not found</div>} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
