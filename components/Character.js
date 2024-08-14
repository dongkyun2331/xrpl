import { useState, useEffect, useRef } from "react";

export default function Character({ nickname }) {
  const [position, setPosition] = useState({ top: 50, left: 50 });
  const [direction, setDirection] = useState("down");
  const [isWalking, setIsWalking] = useState(false);
  const [step, setStep] = useState(0);
  const walkIntervalRef = useRef(null);

  const characterSize = 50; // 캐릭터 크기

  const moveCharacter = (key) => {
    switch (key) {
      case "ArrowUp":
        if (direction === "up") {
          setPosition((prev) => ({
            ...prev,
            top: Math.max(prev.top - characterSize, 0),
          }));
        } else {
          setDirection("up");
        }
        break;
      case "ArrowDown":
        if (direction === "down") {
          setPosition((prev) => ({
            ...prev,
            top: Math.min(
              prev.top + characterSize,
              window.innerHeight - characterSize
            ),
          }));
        } else {
          setDirection("down");
        }
        break;
      case "ArrowLeft":
        if (direction === "left") {
          setPosition((prev) => ({
            ...prev,
            left: Math.max(prev.left - characterSize, 0),
          }));
        } else {
          setDirection("left");
        }
        break;
      case "ArrowRight":
        if (direction === "right") {
          setPosition((prev) => ({
            ...prev,
            left: Math.min(
              prev.left + characterSize,
              window.innerWidth - characterSize
            ),
          }));
        } else {
          setDirection("right");
        }
        break;
      default:
        break;
    }
  };

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.repeat) return;
      setIsWalking(true);
      moveCharacter(event.key);
      setStep((prev) => (prev + 1) % 4);
    };

    const handleKeyUp = () => {
      setIsWalking(false);
      setStep(0);
      if (walkIntervalRef.current) {
        clearInterval(walkIntervalRef.current);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      if (walkIntervalRef.current) {
        clearInterval(walkIntervalRef.current);
      }
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [direction]);

  const getArmLegTransform = (limb, step) => {
    const movement = {
      arm: [-10, 10, -10, 10], // 팔의 움직임 각도
      leg: [10, -10, 10, -10], // 다리의 움직임 각도
    };
    return movement[limb][step];
  };

  const renderCharacter = () => {
    const armTransform = isWalking
      ? `rotate(${getArmLegTransform("arm", step)} 14 24)`
      : "";
    const legTransform = isWalking
      ? `rotate(${getArmLegTransform("leg", step)} 20 50)`
      : "";

    switch (direction) {
      case "up":
        return (
          <>
            <circle cx="25" cy="15" r="10" fill="#FFD700" />
            <rect x="18" y="25" width="14" height="20" fill="#1E90FF" />
            <rect
              x="10"
              y="25"
              width="8"
              height="4"
              fill="#1E90FF"
              transform={armTransform}
            />
            <rect
              x="32"
              y="25"
              width="8"
              height="4"
              fill="#1E90FF"
              transform={armTransform}
            />
            <rect
              x="18"
              y="45"
              width="5"
              height="10"
              fill="#000"
              transform={legTransform}
            />
            <rect
              x="27"
              y="45"
              width="5"
              height="10"
              fill="#000"
              transform={legTransform}
            />
          </>
        );
      case "down":
        return (
          <>
            <circle cx="25" cy="15" r="10" fill="#FFD700" />
            <circle cx="20" cy="18" r="2" fill="#000" />
            <circle cx="30" cy="18" r="2" fill="#000" />
            <rect x="18" y="25" width="14" height="20" fill="#1E90FF" />
            <rect
              x="10"
              y="25"
              width="8"
              height="4"
              fill="#1E90FF"
              transform={armTransform}
            />
            <rect
              x="32"
              y="25"
              width="8"
              height="4"
              fill="#1E90FF"
              transform={armTransform}
            />
            <rect
              x="18"
              y="45"
              width="5"
              height="10"
              fill="#000"
              transform={legTransform}
            />
            <rect
              x="27"
              y="45"
              width="5"
              height="10"
              fill="#000"
              transform={legTransform}
            />
          </>
        );
      case "left":
        return (
          <>
            <circle cx="25" cy="15" r="10" fill="#FFD700" />
            <circle cx="20" cy="15" r="2" fill="#000" />
            <rect x="18" y="25" width="14" height="20" fill="#1E90FF" />
            <rect
              x="10"
              y="25"
              width="8"
              height="4"
              fill="#1E90FF"
              transform={armTransform}
            />
            <rect
              x="32"
              y="25"
              width="8"
              height="4"
              fill="#1E90FF"
              transform={armTransform}
            />
            <rect
              x="18"
              y="45"
              width="5"
              height="10"
              fill="#000"
              transform={legTransform}
            />
            <rect
              x="27"
              y="45"
              width="5"
              height="10"
              fill="#000"
              transform={legTransform}
            />
          </>
        );
      case "right":
        return (
          <>
            <circle cx="25" cy="15" r="10" fill="#FFD700" />
            <circle cx="30" cy="15" r="2" fill="#000" />
            <rect x="18" y="25" width="14" height="20" fill="#1E90FF" />
            <rect
              x="10"
              y="25"
              width="8"
              height="4"
              fill="#1E90FF"
              transform={armTransform}
            />
            <rect
              x="32"
              y="25"
              width="8"
              height="4"
              fill="#1E90FF"
              transform={armTransform}
            />
            <rect
              x="18"
              y="45"
              width="5"
              height="10"
              fill="#000"
              transform={legTransform}
            />
            <rect
              x="27"
              y="45"
              width="5"
              height="10"
              fill="#000"
              transform={legTransform}
            />
          </>
        );
      default:
        return null;
    }
  };

  return (
    <div
      style={{ position: "absolute", top: position.top, left: position.left }}
    >
      <svg width="50" height="50" viewBox="0 0 50 50">
        {renderCharacter()}
      </svg>
      {nickname && (
        <div style={{ textAlign: "center", marginTop: "-10px", color: "#000" }}>
          {nickname}
        </div>
      )}
    </div>
  );
}
