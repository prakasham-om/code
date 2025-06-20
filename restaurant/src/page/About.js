import React from 'react';
import { TypeAnimation } from 'react-type-animation';

const About = () => {
  return (
    <div className="w-full min-h-screen font-sans text-white bg-gradient-to-br from-[#0f2027] via-[#203a43] to-[#2c5364]">

      {/* Hero Section */}
      <section className="py-24 px-6 text-center relative z-10">
        <h1 className="text-5xl font-extrabold tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-500 drop-shadow-md">
          JB Internet
        </h1>
        <TypeAnimation
          sequence={[
            'Digitizing Every Document 📄',
            2000,
            'Online Services Made Simple 🌐',
            2000,
            'Secure & Fast Printing ⚡',
            2000,
            'Your Trusted Digital Partner 🤝',
            2000,
          ]}
          wrapper="span"
          speed={50}
          repeat={Infinity}
          className="text-xl mt-6 block text-cyan-200 font-medium"
        />
      </section>

      {/* Top Curve */}
      <div className="-mt-6 overflow-hidden">
        <svg className="w-full h-24 fill-[#203a43]" viewBox="0 0 1200 120">
          <path d="M0,0 C300,100 900,0 1200,100 L1200,0 L0,0 Z" />
        </svg>
      </div>

      {/* Owner Section */}
      <section className="relative backdrop-blur-lg bg-white/10 py-20 px-8 z-10">
        <div className="max-w-5xl mx-auto text-center space-y-8">
          <h2 className="text-3xl font-bold text-pink-400">👤 Owner & Vision</h2>
          <p className="text-lg text-gray-200 max-w-3xl mx-auto leading-relaxed">
            <strong className="text-white">Mr. Prasant Kumar Dalabehera</strong> is the founder of JB Internet. His mission is to transform local digital services
            into smart, tech-powered experiences for everyone. With a focus on speed, quality, and trust, JB Internet
            leads the future of printing, application processing, and digital support.
          </p>
        </div>
      </section>

      {/* Curve After Owner */}
      <div className="-mt-6 overflow-hidden">
        <svg className="w-full h-24 fill-purple-900" viewBox="0 0 1200 120">
          <path d="M0,0 C300,100 900,0 1200,100 L1200,0 L0,0 Z" />
        </svg>
      </div>

      {/* Services Section */}
      <section className="py-24 px-6 bg-gradient-to-r from-purple-800 to-indigo-900 relative z-10">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-cyan-300 mb-12 text-center">💡 Our Digital Services</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-10">
            {[
              { icon: '💳', text: 'PVC Card Printing' },
              { icon: '📝', text: 'Online Job Form Filling' },
              { icon: '🖨️', text: 'Color & B/W Printing' },
              { icon: '📤', text: 'Document Upload & Chat' },
              { icon: '🔐', text: 'Secure PDF Handling' },
              { icon: '⚙️', text: 'Custom Document Services' },
            ].map((item, i) => (
              <div
                key={i}
                className="bg-white/10 backdrop-blur-xl border border-white/10 rounded-3xl py-8 px-6 hover:scale-105 transition-all duration-300 text-center shadow-lg"
              >
                <div className="text-5xl mb-4">{item.icon}</div>
                <p className="text-lg font-semibold text-white">{item.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final Bottom Curve */}
      <div className="-mt-6 overflow-hidden">
        <svg className="w-full h-24 fill-[#2c5364] rotate-180" viewBox="0 0 1200 120">
          <path d="M0,0 C300,100 900,0 1200,100 L1200,0 L0,0 Z" />
        </svg>
      </div>

    </div>
  );
};

export default About;
