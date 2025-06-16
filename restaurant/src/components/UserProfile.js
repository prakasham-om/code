import React from "react";
import { useSelector } from "react-redux";
import { MdVerified, MdEmail, MdFingerprint, MdAdminPanelSettings } from "react-icons/md";

const UserProfile = () => {
  const user = useSelector((state) => state.user);
  const isAdmin = process.env.REACT_APP_ADMIN_ID === user.email;

  if (!user.email) {
    return (
      <div className="flex justify-center items-center h-[70vh] text-gray-500 text-lg">
        Please sign in to view your profile.
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-6 mt-20 bg-white shadow-lg rounded-xl">
      <div className="flex items-center gap-6">
        <img
          src={user.img}
          alt="Profile"
          className="w-24 h-24 rounded-full border-4 border-gray-300 object-cover"
        />
        <div className="space-y-1">
          <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            {user.name}
            <MdVerified className="text-green-500" />
            {isAdmin && (
              <span className="ml-2 text-xs bg-red-600 text-white px-2 py-1 rounded-full flex items-center gap-1">
                <MdAdminPanelSettings /> Admin
              </span>
            )}
          </h2>
          <p className="flex items-center text-sm text-gray-600 gap-2">
            <MdEmail className="text-blue-500" />
            {user.email}
          </p>
          <p className="flex items-center text-sm text-gray-600 gap-2">
            <MdFingerprint className="text-purple-500" />
            UID: {user.uid}
          </p>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;
