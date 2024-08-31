import React from "react";

export default function NPCharacter({ x, y, nickname }) {
  const characterStyle = {
    position: "absolute",
    top: y,
    left: x,
    transform: "translate(-50%, -50%)",
  };

  return (
    <div style={characterStyle}>
      <svg width="50" height="80" viewBox="0 0 50 80">
        {/* Head */}
        <circle cx="25" cy="20" r="15" fill="#FFD700" />
        {/* Eyes */}
        <circle cx="18" cy="18" r="3" fill="#000" />
        <circle cx="32" cy="18" r="3" fill="#000" />
        {/* Body */}
        <rect x="15" y="35" width="20" height="30" fill="#1E90FF" />
        {/* Arms */}
        <line x1="5" y1="40" x2="15" y2="50" stroke="#1E90FF" strokeWidth="5" />
        <line
          x1="45"
          y1="40"
          x2="35"
          y2="50"
          stroke="#1E90FF"
          strokeWidth="5"
        />
        {/* Legs */}
        <line x1="20" y1="65" x2="15" y2="75" stroke="#000" strokeWidth="5" />
        <line x1="30" y1="65" x2="35" y2="75" stroke="#000" strokeWidth="5" />
      </svg>
      {nickname && (
        <div
          style={{
            textAlign: "center",
            marginTop: "-10px",
            color: "#000",
            fontSize: "12px",
          }}
        >
          {nickname}
        </div>
      )}
    </div>
  );
}
