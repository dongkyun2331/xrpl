import { useState } from "react";
import config from "@/pages/config";

export default function CreateWalletButton({ onWalletCreated }) {
  const [loading, setLoading] = useState(false);
  const [network, setNetwork] = useState("Testnet");

  const { ipAddress } = config;

  const handleCreateWallet = async () => {
    setLoading(true);
    try {
      const res = await fetch(`https://${ipAddress}:3001/api/createWallet`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ network }), // 선택된 네트워크를 서버로 보냄
      });

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
        <option value="testnet">Testnet</option>
        <option value="devnet">Devnet</option>
        <option value="mainnet">Mainnet</option>
      </select>
      <button onClick={handleCreateWallet} disabled={loading}>
        {loading ? "Creating Wallet..." : "Create Wallet"}
      </button>
    </div>
  );
}
