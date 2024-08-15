import { useState } from "react";

export default function NicknameModal({ onClose, wallet }) {
  const [nickname, setNickname] = useState("");
  const [error, setError] = useState("");

  const handleSave = async () => {
    const response = await fetch("/api/getNickname", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ nickname, address: wallet?.address }),
    });

    const data = await response.json();

    if (response.status === 200) {
      onClose(nickname);
    } else {
      setError(data.message);
    }
  };

  return (
    <div className="modal">
      <div className="modal-content">
        <h2>Set Nickname</h2>
        <input
          type="text"
          value={nickname}
          onChange={(e) => setNickname(e.target.value)}
          placeholder="Enter your nickname"
        />
        <button onClick={handleSave}>Save</button>
        {error && <p className="error">{error}</p>}
        <button onClick={() => onClose()}>Cancel</button>
      </div>
    </div>
  );
}
