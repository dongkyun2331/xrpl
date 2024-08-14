// components/CreateWalletButton.js
import { useState } from "react";

export default function CreateWalletButton({ onWalletCreated }) {
  const [loading, setLoading] = useState(false);

  const handleCreateWallet = async () => {
    setLoading(true);
    const res = await fetch("/api/createWallet");
    const data = await res.json();
    onWalletCreated(data); // 지갑 생성 후 부모 컴포넌트에 결과 전달
    setLoading(false);
  };

  return (
    <button onClick={handleCreateWallet} disabled={loading}>
      {loading ? "Creating Wallet..." : "Create Wallet"}
    </button>
  );
}
