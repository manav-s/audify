import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const Welcome = () => {
  const navigate = useNavigate();
  const [animationActive, setAnimationActive] = useState(false);

  const handleAudifyClick = () => {
    setAnimationActive(true);
    setTimeout(() => {
      navigate("/home");
    }, 2000); // Adjust the delay time as needed for the animation
  };

  return (
    <div className="bg-black min-h-screen flex flex-col items-center justify-center">
      <button
        className={`text-8xl font-extrabold mb-4 text-white transition-opacity duration-1000 ${
          animationActive ? "animate-bounce" : ""
        }`}
        onClick={handleAudifyClick}
      >
        Audify
      </button>
      <p className={`text-lg ${animationActive ? "animate-fade-black" : "text-white animate-pulse"}`}>
        Click Audify to get started
      </p>
    </div>
  );
};

export default Welcome;
