import { useState } from "react";
import config from "@/pages/config";

export default function NicknameModal({ onClose, wallet }) {
  const [nickname, setNickname] = useState("");
  const [walletAddress, setWalletAddress] = useState(wallet?.address || ""); // 지갑 주소 상태 추가
  const [error, setError] = useState("");

  const { ipAddress } = config;

  const handleSave = async () => {
    setError(""); // 이전 오류 초기화
    try {
      const response = await fetch(
        `https://${ipAddress}:3001/api/saveNickname`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ nickname, address: walletAddress }), // 지갑 주소 전송
        }
      );

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
        <input
          type="text"
          value={nickname}
          onChange={(e) => setNickname(e.target.value)}
          placeholder="Enter your nickname"
        />
        <input
          type="text"
          value={walletAddress}
          onChange={(e) => setWalletAddress(e.target.value)} // 지갑 주소 입력 필드 추가
          placeholder="Enter your Address"
        />
        <div>
          <button onClick={handleSave}>Save</button>
          {error && <p className="error">{error}</p>}
          <button onClick={() => onClose()}>Cancel</button>
        </div>
      </div>
    </div>
  );
}
