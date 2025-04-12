import { Link } from "react-router-dom";
import hotel_logo from "../assets/hotel_logo.png";
import { footerLinks } from "../constants/Footer";

const Footer = () => {
  return (
    <footer className="relative bg-gray-100 px-6 sm:px-10 md:px-15 py-6 font-montserrat">
      <img
        loading="lazy"
        src={hotel_logo}
        className="h-12 w-auto cursor-pointer mb-4 mx-auto sm:mx-0"
      />
      <div className="px-5">
        <div className="flex items-center gap-2 justify-center sm:justify-start">
          <i className="fa-solid fa-location-dot text-violet-600"></i>
          <h6 className="text-sm italic">Brgy. Bubukal, Sta. Cruz, Laguna</h6>
        </div>

        {/* Footer Sections */}
        <section className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8 py-4 mt-2">
          {footerLinks.map((section, sectionIndex) => (
            <div key={sectionIndex} className="text-left">
              <h1 className="text-base font-semibold">{section.title}</h1>
              <ul className="pt-2">
                {section.links.map((link, linkIndex) => (
                  <li key={linkIndex} className="text-sm pt-2">
                    <Link
                      to={link.to}
                      className="text-blue-600 hover:underline transition-all duration-300"
                    >
                      {link.links}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          {/* Contact */}
          <div className="text-left">
            <h1 className="text-base font-semibold">Contact</h1>
            <ul className="pt-2 space-y-2">
              <li className="flex items-center gap-2 text-sm">
                <i className="fas fa-phone"></i> 098-765-4321
              </li>
              <li className="flex items-center gap-2 text-sm">
                <i className="fas fa-envelope"></i>
                azureahotelmanagement@gmail.com
              </li>
            </ul>
          </div>

          {/* Social Media */}
          <div className="text-left sm:text-left">
            <h1 className="text-base font-semibold">Follow Us</h1>
            <div className="flex flex-wrap justify-start gap-3 pt-3">
              {[
                { class: "fa-instagram", bg: "black" },
                { class: "fa-facebook-f", bg: "blue-500" },
                { class: "fa-x-twitter", bg: "black" },
                { class: "fa-tiktok", bg: "black" },
                { class: "fa-linkedin-in", bg: "[#0077b5]" },
              ].map((icon, index) => (
                <i
                  key={index}
                  className={`fa-brands ${icon.class} text-lg border border-black p-2 rounded-full transition-all duration-300 hover:bg-${icon.bg} hover:text-white`}
                ></i>
              ))}
            </div>
          </div>
        </section>

        {/* Bottom Section */}
        <section className="flex flex-col md:flex-row justify-center items-center py-5 border-t-2 border-gray-200 mt-5 gap-3 text-center md:text-left">
          <h1 className="text-sm md:text-md">
            &copy; {new Date().getFullYear()} Azurea Hotel Management System
            &trade; | All rights reserved.
          </h1>
        </section>
      </div>
    </footer>
  );
};

export default Footer;
