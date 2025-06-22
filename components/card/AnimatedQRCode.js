// components/AnimatedQRCode.js
"use client";

import React from "react";
import QRCode from "react-qr-code";
import { motion } from "framer-motion"; // Assuming you might want to re-add motion later

const AnimatedQRCode = ({ url }) => {
  return (
    // This outer div is for padding, background, and shadow
    <div className="max-sm:p-3 p-5 bg-white rounded-lg inline-block">
      {/* This inner div controls the actual size of the QR code */}
      <div className="max-sm:w-22 w-40 max-sm:h-22 h-40"> {/* Example: 128px by 128px */}
        <QRCode
          value={url}
          size={256} // It's a good practice to set a base size
          style={{ height: "auto", maxWidth: "100%", width: "100%" }}
        />
      </div>
    </div>
  );
};

export default AnimatedQRCode;