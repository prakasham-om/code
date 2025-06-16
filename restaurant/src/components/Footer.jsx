import React from "react";

const Footer = () => {
  return (
    <div className="p-4 bg-slate-900 text-center text-white font-semibold">
              <p className="text-md">📍 JB Internet, Malud, Odisha, India</p>
        <p className="mt-2">📞 +91-9692750419 | ✉️ jbinternet123@gmail.com</p>
        <p className="text-sm mt-4">&copy; {new Date().getFullYear()} JB Internet — Powered by JB Group 💻</p>

    </div>
  );
};

export default Footer;
