import React from "react";
import { Link } from "react-router-dom";
import { FaTwitter, FaFacebookF, FaInstagram } from "react-icons/fa";

function Footer() {
  return (
    <section className="poppins-regular">
      <footer className="bg-white pt-5 pb-3 border border-top border-dark">
        <div className="container">
          <div className="row">
            {/* Company Info */}
            <div className="col-md-4 mb-4">
              <Link className="nav-link p-0" to="/">
                <img src="JD.svg" className="img-fluid" alt="logo" />
              </Link>

              <p className="mt-2 mb-0">
                <span className="fw-semibold">Address:</span> 101 - The XYZ,
                Pal, Surat, Gujarat - 395009
              </p>

              <p className="mt-2 mb-0">
                <span className="fw-semibold">Phone:</span> +91 90164 19325
              </p>

              <p className="mt-2 mb-0">
                <span className="fw-semibold">Email:</span>{" "}
                support@affilatenetwork.com
              </p>

              <div className="d-flex gap-3 mt-3">
                <FaTwitter size={20} />
                <FaFacebookF size={20} />
                <FaInstagram size={20} />
              </div>
            </div>

            {/* Company Links */}
            <div className="col-md-2 mb-4">
              <h6 className="fw-bold">Company</h6>
              <ul className="list-unstyled">
                <li>
                  <a href="/" className="text-dark text-decoration-none">
                    Home
                  </a>
                </li>
                <li>
                  <a href="/contact" className="text-dark text-decoration-none">
                    Contact Us
                  </a>
                </li>
              </ul>
            </div>

            {/* Services */}
            <div className="col-md-3 mb-4">
              <h6 className="fw-bold">Our Deployments</h6>
              <ul className="list-unstyled">
                <li>
                  <a
                    href="/services"
                    className="text-dark text-decoration-none"
                  >
                    Cloud SaaS
                  </a>
                </li>
                <li>
                  <a
                    href="/services"
                    className="text-dark text-decoration-none"
                  >
                    Local Platform
                  </a>
                </li>
                <li>
                  <a
                    href="/services"
                    className="text-dark text-decoration-none"
                  >
                    Hybrid Platform
                  </a>
                </li>
              </ul>
            </div>

            {/* Download App */}
            {/* <div className="col-md-2 mb-4">
            <h6 className="fw-bold">Download App</h6>
            <ul className="list-unstyled">
              <li>
                <a href="/" className="text-dark text-decoration-none">
                  Android
                </a>
              </li>
              <li>
                <a href="/" className="text-dark text-decoration-none">
                  IOS
                </a>
              </li>
              <li>
                <a href="/" className="text-dark text-decoration-none">
                  Download APK
                </a>
              </li>
            </ul>
          </div> */}

            {/* Legal */}
            <div className="col-md-3 mb-4">
              <h6 className="fw-bold">Legal & Privacy</h6>
              <ul className="list-unstyled">
                <li>
                  <a href="/" className="text-dark text-decoration-none">
                    Terms and Conditions
                  </a>
                </li>
                <li>
                  <a href="/" className="text-dark text-decoration-none">
                    Privacy Policy
                  </a>
                </li>
              </ul>
            </div>
          </div>

          {/* Bottom */}
          <div className="text-center border-top pt-3 mt-3">
            <p className="mb-0">
              For any grievances/support, contact our support team at{" "}
              <strong>support@affilatenetwork.com</strong> or call us at{" "}
              <strong>90164 19325</strong>
            </p>
          </div>
        </div>
      </footer>
    </section>
  );
}

export default Footer;
