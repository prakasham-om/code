import React from 'react';

const services = [
  "PVC Card Printing (Aadhar, PAN, DL, etc.)",
  "Online Job Applications",
  "Resume/Biodata Creation",
  "Color & B/W Printing",
  "Xerox & Scanning",
  "Form Filling & Govt Services",
  "Lamination & Spiral Binding"
];

const Services = () => {
  return (
    <section id="services" className="py-16 bg-white">
      <div className="max-w-6xl mx-auto px-6 text-center">
        <h3 className="text-3xl font-bold text-blue-700 mb-8">Our Services</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map((service, idx) => (
            <div key={idx} className="bg-slate-50 rounded-xl p-6 shadow hover:shadow-lg transition">
              <p className="text-lg font-medium text-gray-800">{service}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Services;
