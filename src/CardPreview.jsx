import React from "react";
import { animations } from "./cardThemes";

const animationClasses = {
  "wave-animation": "animate-wave",
  "glow-animation": "animate-glow",
  "flicker-animation": "animate-flicker",
};

function CardPreview({ cardHolder, cardNumber, bankName, networkName, expiry, theme, animation }) {
  return (
    <div className="w-full max-w-sm">
      {/* Live Card Preview */}
      <div
        className={`h-48 rounded-xl shadow-lg p-6 text-white flex flex-col justify-between`}
        style={{ background: theme, backgroundSize: "cover", backgroundPosition: "center" }}
      >
        {/* Bank Name & Network */}
        <div className="flex justify-between items-center text-sm">
          <span className="font-semibold">{bankName || "Bank Name"}</span>
          <span className="uppercase">{networkName || "Network"}</span>
        </div>

        {/* Card Number */}
        <div className="text-lg tracking-widest text-center">
          {cardNumber ? cardNumber.replace(/(.{4})/g, "$1 ") : "•••• •••• •••• ••••"}
        </div>

        {/* Cardholder Name & Expiry */}
        <div className="flex justify-between text-xs">
          <div>
            <p className="uppercase">Card Holder</p>
            <p className="text-sm font-semibold">{cardHolder || "Your Name"}</p>
          </div>
          <div>
            <p className="uppercase">Expires</p>
            <p className="text-sm font-semibold">{expiry || "MM/YY"}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CardPreview;
