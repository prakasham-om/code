import React, { useState } from "react";
import { getAuth, signInWithPopup, GoogleAuthProvider, signOut } from "firebase/auth";
import { app } from "../firebase.config";
import { useSelector, useDispatch } from "react-redux";
import { setLoginGoogle } from "../redux/userSlice";
import { Link, NavLink } from "react-router-dom";

import {
  MdAccountCircle,
  MdLogout,
} from "react-icons/md";
import { motion } from "framer-motion";
import Logo from "./Logo";

const Header = () => {
  const user = useSelector((state) => state.user);
  const dispatch = useDispatch();
  const [isLogin, setIsLogin] = useState(false);

  const firebaseAuth = getAuth(app);
  const provider = new GoogleAuthProvider();

  const handleLogin = async () => {
    if (!user.name) {
      const {
        user: { refreshToken, providerData },
      } = await signInWithPopup(firebaseAuth, provider);

      const userData = {
        name: providerData[0].displayName,
        img: providerData[0].photoURL,
        email: providerData[0].email,
        uid: providerData[0].uid,
        token: refreshToken,
      };

      dispatch(setLoginGoogle(userData));
      localStorage.setItem("user", JSON.stringify(userData));
    } else {
      setIsLogin((prev) => !prev);
    }
  };

  const handleLogout = () => {
    const auth = getAuth(app);
    signOut(auth)
      .then(() => {
        localStorage.clear();
        dispatch(setLoginGoogle({ name: "", img: "", email: "", uid: "", token: "" }));
        setIsLogin(false);
      })
      .catch((error) => {
        console.error("Logout error:", error);
      });
  };

  const navLinkClass = ({ isActive }) =>
    `text-base font-medium hover:text-red-600 transition px-2 py-1 ${
      isActive ? "text-red-600 font-semibold" : "text-gray-700"
    }`;

  return (
    <header className="fixed top-0 left-0 w-full bg-white shadow-md z-50">
      {/* Desktop Header */}
      <div className="hidden md:flex justify-between items-center px-2 py-3">
        <Link to="/" className="flex items-center gap-2" onClick={() => window.scrollTo({ top: 0 })}>
          <Logo />
        </Link>

        <div className="flex items-center gap-6 relative">
          <nav className="flex items-center gap-4">
            <NavLink to="/" className={navLinkClass} end>
              Home
            </NavLink>
            <NavLink to="/about" className={navLinkClass}>
              About Us
            </NavLink>
            <NavLink to="/service" className={navLinkClass}>
              Service
            </NavLink>
          </nav>

          <motion.div
            whileTap={{ scale: 0.9 }}
            onClick={handleLogin}
            className="w-9 h-9 rounded-full bg-black cursor-pointer flex items-center justify-center overflow-hidden"
          >
            {user.img ? (
              <img src={user.img} alt="user" className="w-full h-full object-cover" />
            ) : (
              <MdAccountCircle className="text-white text-xl" />
            )}
          </motion.div>

          {/* Dropdown Menu */}
          {isLogin && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="absolute top-14 right-0 bg-white shadow-xl rounded-md z-50 w-52"
            >
              <ul className="text-sm text-gray-800 py-2">
                <li>
                  <button
                    onClick={handleLogout}
                    className="w-full text-left text-red-600 flex items-center gap-2 px-4 py-2 hover:bg-red-50"
                  >
                    <MdLogout /> Logout
                  </button>
                </li>
              </ul>
            </motion.div>
          )}
        </div>
      </div>

      {/* Mobile Header */}
      <div className="flex md:hidden items-center justify-between px-4 py-3">
        <Link to="/">
          <Logo />
        </Link>

        <div className="flex items-center gap-4 relative">
          <motion.div
            whileTap={{ scale: 0.9 }}
            onClick={handleLogin}
            className="w-9 h-9 rounded-full bg-black cursor-pointer flex items-center justify-center overflow-hidden"
          >
            {user.img ? (
              <img src={user.img} alt="user" className="w-full h-full object-cover" />
            ) : (
              <MdAccountCircle className="text-white text-xl" />
            )}
          </motion.div>
        </div>
      </div>

      {/* Mobile Dropdown */}
      {isLogin && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="md:hidden px-6 pb-4 bg-white shadow-md rounded-b-md"
        >
          <ul className="flex flex-col gap-3">
            <NavLink to="/" className={navLinkClass} onClick={() => setIsLogin(false)}>
              Home
            </NavLink>
            <NavLink to="/about" className={navLinkClass} onClick={() => setIsLogin(false)}>
              About Us
            </NavLink>
            <NavLink to="/service" className={navLinkClass} onClick={() => setIsLogin(false)}>
              Service
            </NavLink>
            <button
              onClick={handleLogout}
              className="text-sm text-red-600 text-left hover:underline"
            >
              Logout ({user.name?.split(" ")[0]})
            </button>
          </ul>
        </motion.div>
      )}
    </header>
  );
};

export default Header;
