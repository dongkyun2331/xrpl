import { useState } from "react";

export default function FloatingButton({ onNicknameClick }) {
  const [isOpen, setIsOpen] = useState(false);

  const toggleMenu = () => setIsOpen(!isOpen);

  return (
    <div className="floating-container">
      <button className="floating-button" onClick={toggleMenu}>
        +
      </button>
      {isOpen && (
        <div className="floating-menu">
          <button onClick={onNicknameClick}>Set Nickname</button>
        </div>
      )}
    </div>
  );
}
