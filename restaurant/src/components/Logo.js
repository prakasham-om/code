import React from 'react';

const Logo = () => {
  return (
    <div className="relative select-none flex">
      <h1 className="
        text-3xl sm:text-4xl md:text-4xl lg:text-4xl xl:text-4xl 
        font-extrabold 
        bg-gradient-to-r from-orange-500 via-white to-green-500 
        text-transparent bg-clip-text 
        animate-pulse
      ">
        JB
      </h1>
      <p className="absolute bottom-1 sm:left-10 left-9 text-[10px] font-semibold italic text-gray-800 " style={{ fontFamily: 'cursive' }}>
  internet
</p>

    </div>
  );
};

export default Logo;
