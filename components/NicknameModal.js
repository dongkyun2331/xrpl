import { useState } from "react";

export default function NicknameModal({ onClose, wallet }) {
  const [nickname, setNickname] = useState("");
  const [error, setError] = useState("");

  const handleSave = async () => {
    try {
      // 서버의 전체 URL을 사용하여 API 요청을 보냅니다.
      const response = await fetch(
        "https://forixrpl-server.duckdns.org:3001/api/getNickname",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ nickname, address: wallet?.address }),
        }
      );

      if (response.ok) {
        onClose(nickname);
      } else {
        const errorData = await response.json();
        setError(errorData.message);
      }
    } catch (error) {
      console.error("Error saving nickname:", error);
      setError("An unexpected error occurred.");
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
