import { useState, useRef } from "react";

export default function FloatingButton({ onNicknameClick }) {
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState({ top: 110, left: 10 });
  const [dragging, setDragging] = useState(false);
  const positionRef = useRef(position);

  const toggleMenu = () => setIsOpen(!isOpen);

  const handleMouseDown = (e) => {
    setDragging(true);
    positionRef.current = {
      x: e.clientX - position.left,
      y: e.clientY - position.top,
    };
  };

  const handleMouseMove = (e) => {
    if (dragging) {
      setPosition({
        top: e.clientY - positionRef.current.y,
        left: e.clientX - positionRef.current.x,
      });
    }
  };

  const handleMouseUp = () => {
    setDragging(false);
  };

  return (
    <div
      className="floating-container"
      style={{ top: position.top, left: position.left, position: "fixed" }}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
    >
      <button
        className="floating-button"
        onClick={toggleMenu}
        onMouseDown={handleMouseDown}
      >
        +
      </button>
      {isOpen && (
        <div className="floating-menu">
          <button onClick={onNicknameClick}>Set Nickname</button>
        </div>
      )}
      <style jsx>{`
        .floating-container {
          position: fixed;
          z-index: 1000;
        }
        .floating-button {
          width: 50px;
          height: 50px;
          border-radius: 50%;
          background-color: #007bff;
          color: white;
          border: none;
          font-size: 24px;
          cursor: pointer;
        }
        .floating-menu {
          margin-top: 10px;
        }
        .floating-menu button {
          display: block;
          padding: 10px;
          font-size: 16px;
          color: white;
          background-color: #007bff;
          border: none;
          border-radius: 5px;
          cursor: pointer;
        }
        .floating-menu button:hover {
          background-color: #0056b3;
        }
      `}</style>
    </div>
  );
}
