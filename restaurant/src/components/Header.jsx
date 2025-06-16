import React, { useState } from "react";
import { getAuth, signInWithPopup, GoogleAuthProvider } from "firebase/auth";
import { app } from "../firebase.config";
import { useSelector, useDispatch } from "react-redux";
import { setLoginGoogle } from "../redux/userSlice";
import { Link, NavLink } from "react-router-dom";
import { motion } from "framer-motion";
import {
  MdShoppingCart,
  MdAccountCircle,
  MdLogout,
  MdAddCircleOutline,
  MdVerified,
  MdAdminPanelSettings,
  MdPerson,
} from "react-icons/md";
import Logo from "./Logo";

const Header = () => {
  const user = useSelector((state) => state.user);
  const cartProductNumber = useSelector((state) => state.cartProduct.cartProductItem).length;
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
    localStorage.clear();
    dispatch(setLoginGoogle({ name: "", img: "", email: "", uid: "", token: "" }));
    setIsLogin(false);
  };

  const navLinkClass = ({ isActive }) =>
    `text-base font-medium hover:text-red-600 transition px-2 py-1 ${
      isActive ? "text-red-600 font-semibold" : "text-gray-700"
    }`;

  const isAdmin = process.env.REACT_APP_ADMIN_ID === user.email;

  return (
    <header className="fixed top-0 left-0 w-full bg-white shadow-md z-50">
      {/* Desktop Header */}
      <div className="hidden md:flex justify-between items-center px-6 py-3">
        <Link to="/" className="flex items-center gap-2" onClick={() => window.scrollTo({ top: 0 })}>
          <Logo />
        </Link>

        <nav className="flex items-center gap-8">
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

        <div className="flex items-center gap-6 relative">
          {user.email && (
            <div className="flex items-center gap-2 text-sm text-red-600">
              <MdVerified />
              <p>{user.name}</p>
              {isAdmin && (
                <span className="bg-red-600 text-white text-xs px-2 py-1 rounded-full">Admin</span>
              )}
            </div>
          )}

          {user.email && (
            <Link to="/cart" className="relative">
              <MdShoppingCart className="text-2xl text-gray-700" />
              {cartProductNumber > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-600 text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">
                  {cartProductNumber}
                </span>
              )}
            </Link>
          )}

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
                <li className="px-4 py-2 flex items-center gap-2 font-semibold">
                  <MdPerson /> {user.name}
                </li>

                <li>
                  <Link
                    to="/profile"
                    className="flex items-center gap-2 px-4 py-2 hover:bg-gray-100"
                    onClick={() => setIsLogin(false)}
                  >
                    <MdAccountCircle /> Profile
                  </Link>
                </li>

                {isAdmin && (
                  <>
                    <li>
                      <Link
                        to="/admin/dashboard"
                        className="flex items-center gap-2 px-4 py-2 hover:bg-gray-100 text-red-600"
                        onClick={() => setIsLogin(false)}
                      >
                        <MdAdminPanelSettings /> Admin Panel
                      </Link>
                    </li>

                    <li>
                      <Link
                        to="/createitem"
                        className="flex items-center gap-2 px-4 py-2 hover:bg-gray-100"
                        onClick={() => setIsLogin(false)}
                      >
                        <MdAddCircleOutline /> New Item
                      </Link>
                    </li>
                  </>
                )}

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
          {user.email && (
            <Link to="/cart" className="relative">
              <MdShoppingCart className="text-2xl text-gray-700" />
              {cartProductNumber > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-600 text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">
                  {cartProductNumber}
                </span>
              )}
            </Link>
          )}
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

            <Link to="/profile" className="text-sm text-gray-700 hover:text-blue-600" onClick={() => setIsLogin(false)}>
              Profile
            </Link>

            {isAdmin && (
              <>
                <Link to="/admin/dashboard" className="text-sm text-red-600" onClick={() => setIsLogin(false)}>
                  Admin Panel
                </Link>
                <Link to="/createitem" className="text-sm" onClick={() => setIsLogin(false)}>
                  New Item
                </Link>
              </>
            )}

            <button onClick={handleLogout} className="text-sm text-red-600 text-left hover:underline">
              Logout ({user.name?.split(" ")[0]})
            </button>
          </ul>
        </motion.div>
      )}
    </header>
  );
};

export default Header;
