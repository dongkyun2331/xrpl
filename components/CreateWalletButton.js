import { useState } from "react";

export default function CreateWalletButton({ onWalletCreated }) {
  const [loading, setLoading] = useState(false);
  const [network, setNetwork] = useState("mainnet"); // 기본값을 메인넷으로 설정

  const handleCreateWallet = async () => {
    setLoading(true);
    try {
      const res = await fetch(
        "https://forixrpl-server.duckdns.org:3001/api/createWallet",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ network }), // 선택된 네트워크를 서버로 보냄
        }
      );

      if (!res.ok) {
        throw new Error("Failed to create wallet");
      }

      const data = await res.json();
      onWalletCreated(data); // 지갑 생성 후 부모 컴포넌트에 결과 전달
    } catch (error) {
      console.error("Error creating wallet:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ float: "right" }}>
      <select
        value={network}
        onChange={(e) => setNetwork(e.target.value)}
        disabled={loading}
      >
        <option value="mainnet">Mainnet</option>
        <option value="testnet">Testnet</option>
      </select>
      <button onClick={handleCreateWallet} disabled={loading}>
        {loading ? "Creating Wallet..." : "Create Wallet"}
      </button>
    </div>
  );
}
