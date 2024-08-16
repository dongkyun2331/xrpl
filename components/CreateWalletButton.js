import { useState } from "react";

export default function CreateWalletButton({ onWalletCreated }) {
  const [loading, setLoading] = useState(false);

  const handleCreateWallet = async () => {
    setLoading(true);
    try {
      const res = await fetch(
        "https://forixrpl-server.duckdns.org:3001/api/createWallet",
        {
          method: "POST", // POST 요청 사용
          headers: {
            "Content-Type": "application/json",
          },
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
    <button
      onClick={handleCreateWallet}
      disabled={loading}
      style={{ float: "right" }}
    >
      {loading ? "Creating Wallet..." : "Create Wallet"}
    </button>
  );
}
