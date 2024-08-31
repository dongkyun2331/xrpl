import React, { useState, useEffect, useRef } from "react";

export default function MapFloor({
  socket,
  players,
  setTargetPosition,
  characterSize,
  headerHeight,
  renderCharacter,
}) {
  const handleMouseClick = (event) => {
    if (event.target.id === "map-floor") {
      const x = event.clientX - characterSize / 2;
      const y = Math.max(event.clientY - characterSize / 2, headerHeight);
      setTargetPosition({ top: y, left: x });
    }
  };

  useEffect(() => {
    window.addEventListener("click", handleMouseClick);

    return () => {
      window.removeEventListener("click", handleMouseClick);
    };
  }, []);

  return (
    <div
      id="map-floor"
      style={{
        position: "relative",
        width: "100%",
        height: "100vh",
        backgroundColor: "#e0e0e0",
      }}
    >
      {Object.values(players).map(renderCharacter)}
    </div>
  );
}
