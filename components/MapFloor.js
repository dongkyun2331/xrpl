import React, { useState, useEffect } from "react";
import NPCharacter from "./NPCharacter"; // NPC 캐릭터 컴포넌트 임포트

export default function MapFloor({
  players,
  setTargetPosition,
  characterSize,
  headerHeight,
  renderCharacter,
}) {
  const [npc, setNpc] = useState({
    id: "npc-1",
    x: 200,
    y: 200,
    nickname: "NPC",
    isWalking: false,
  });

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
      <NPCharacter x={npc.x} y={npc.y} nickname={npc.nickname} />
    </div>
  );
}
