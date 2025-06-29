import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import DeliveryImage from "../assest/img/delivery.png";
import { motion } from "framer-motion";
import AdminDashboard from "../components/page/Admin";
import UserDashboard from "../components/page/User";
import { getAuth, onAuthStateChanged, signOut } from "firebase/auth";
import { app } from "../firebase.config";

const Home = () => {
  const navigate = useNavigate();
  const auth = getAuth(app);
  const [userEmail, setUserEmail] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUserEmail(user.email);
      } else {
        setUserEmail(null);
        localStorage.clear();
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, [auth]);

  const services = [
    { name: "Aadhar Card", img: "https://www.bing.com/th/id/OIP.SjAyAH0IdYCvSm7_UGNGWQHaFP?w=219&h=211", price: "₹50" },
    { name: "PAN Card", img: "https://th.bing.com/th/id/OIP.cQUk10dOsl8BRpZJ4iXsZwHaE8?w=279&h=186", price: "₹50" },
    { name: "Voter ID", img: "https://th.bing.com/th/id/OIP.-EpFvI_Jml3mSP1kk1LCogHaMe?w=115&h=180", price: "₹50" },
    { name: "Color Print", img: "https://th.bing.com/th/id/OIP.lYmRXQp3GQawOJ61AvbtUwHaFg?w=282&h=210", price: "₹10/page" },
    { name: "Online Job Apply", img: "https://th.bing.com/th/id/OIP.qPEGsgsn_tDeCNrNzzDoGgHaFX?w=231&h=180", price: "₹50/form" },
  ];

  const handleClick = (service) => {
    navigate("/upload", { state: { service } });
  };

  const handleLogout = () => {
    signOut(auth)
      .then(() => {
        localStorage.clear();
        setUserEmail(null);
        navigate("/");
      })
      .catch((err) => console.error("Logout error:", err));
  };

  useEffect(() => {
    if (!userEmail && !loading) {
      navigate("/");
    }
  }, [userEmail, loading, navigate]);

  if (loading) return <p className="text-center mt-20 text-gray-500">Checking login...</p>;

  if (userEmail === "rohitsahoo866@gmail.com") return <AdminDashboard key={userEmail} />;
  if (userEmail) return <UserDashboard key={userEmail} />;

  return (
    <div className="min-h-screen px-6 py-12 bg-gradient-to-br from-white via-blue-50 to-white">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-10 mb-16 items-center">
        <div className="space-y-6">
          <div className="flex items-center gap-3 bg-green-100 text-green-800 py-1 px-5 rounded-full shadow w-fit">
            <p className="text-sm font-semibold">Fast PVC Printing</p>
            <motion.img
              src={DeliveryImage}
              alt="Delivery"
              className="w-6 h-6"
              animate={{ x: [0, 10, 0] }}
              transition={{ repeat: Infinity, duration: 1.5 }}
            />
          </div>

          <h1 className="text-4xl md:text-5xl font-bold text-blue-900 leading-tight">
            Instant <span className="text-green-600">Card Printing</span><br /> & Online Job Services
          </h1>

          <p className="text-gray-700 text-sm text-justify max-w-md">
            We specialize in fast and professional digital services. Whether you're printing your
            Aadhar or PAN card, applying for a job, or simply need high-quality color prints—we
            handle it all with speed and reliability.
          </p>

          <button
            onClick={() => handleClick()}
            className="bg-green-500 text-white py-2 px-6 rounded-lg hover:bg-green-600 transition shadow-md text-sm"
          >
            Choose Your Service <span className="ml-2">👉</span>
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 justify-center">
          {services.map((item, index) => (
            <motion.div
              key={index}
              onClick={() => handleClick(item)}
              whileHover={{ scale: 1.05 }}
              className="cursor-pointer bg-white rounded-2xl p-4 shadow-md hover:shadow-xl transition border border-blue-100 hover:border-blue-300"
            >
              <img
                src={item.img}
                alt={item.name}
                className="w-24 h-24 mx-auto object-contain mb-3"
              />
              <h5 className="text-sm font-semibold text-blue-700">{item.name}</h5>
              <p className="text-green-600 text-xs font-medium">{item.price}</p>
            </motion.div>
          ))}
        </div>
      </div>

      <div className="bg-white shadow-lg rounded-xl p-6 mt-10 max-w-5xl mx-auto space-y-4 border-t-4 border-blue-200">
        <h2 className="text-xl font-bold text-blue-800">Why Choose Us?</h2>
        <ul className="list-disc ml-6 text-sm text-gray-700 space-y-2">
          <li><strong>Affordable Rates:</strong> Transparent pricing for all services.</li>
          <li><strong>Quick Turnaround:</strong> Most cards ready in under 30 minutes.</li>
          <li><strong>Job Application Help:</strong> For govt & private sector jobs.</li>
          <li><strong>High Quality:</strong> Premium PVC card & print output.</li>
          <li><strong>Trust:</strong> Your data is secure and deleted after use.</li>
        </ul>
      </div>
    </div>
  );
};

export default Home;
