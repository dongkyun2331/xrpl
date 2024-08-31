import { useState } from "react";

export default function NicknameModal({ onClose, wallet }) {
  const [nickname, setNickname] = useState("");
  const [error, setError] = useState("");

  const address = "forixrpl-server.duckdns.org";

  const handleSave = async () => {
    setError(""); // 이전 오류 초기화
    try {
      const response = await fetch(`https://${address}:3001/api/saveNickname`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ nickname, address: wallet?.address }),
      });

      if (response.ok) {
        onClose(nickname); // 닉네임 저장 후 부모 컴포넌트에 닉네임 전달
      } else {
        const errorData = await response.json();
        setError(errorData.message); // 오류 메시지 설정
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
