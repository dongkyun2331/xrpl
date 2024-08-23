import { useState } from "react";
import { Wallet, Client } from "xrpl";

export default function WalletLogin({ onWalletConnected, wallet, onLogout }) {
  const [secretKey, setSecretKey] = useState(wallet ? wallet.secret : "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleConnectWallet = async () => {
    setLoading(true);
    setError(null);

    try {
      const wallet = Wallet.fromSeed(secretKey);

      const client = new Client("wss://s1.ripple.com", {
        connectionTimeout: 10000,
      });
      await client.connect();

      // 계정이 활성화되었는지 확인
      const response = await client.request({
        command: "account_info",
        account: wallet.classicAddress,
        ledger_index: "validated",
      });

      if (response.result.account_data) {
        const connectedWallet = {
          address: wallet.classicAddress,
          balance: response.result.account_data.Balance,
          secret: secretKey,
        };

        onWalletConnected(connectedWallet); // 부모 컴포넌트에 연결된 지갑 정보 전달
        setError(null); // 로그인 성공 시 에러 메시지 제거
      } else {
        throw new Error("Account not found or not activated.");
      }

      client.disconnect();
    } catch (err) {
      setError("Failed to connect to wallet: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    setSecretKey("");
    if (onLogout) onLogout();
  };

  return (
    <div style={{ display: "flex", alignItems: "center" }}>
      {wallet ? (
        <>
          <div style={{ padding: "10px 15px" }}>Address: {wallet.address}</div>
          <div style={{ padding: "10px 15px" }}>
            Balance: {wallet.balance} XRP
          </div>
          <button onClick={handleLogout} disabled={loading}>
            Logout
          </button>
        </>
      ) : (
        <>
          <input
            type="text"
            placeholder="Enter Secret Key"
            value={secretKey}
            onChange={(e) => setSecretKey(e.target.value)}
            disabled={loading}
          />
          <button
            onClick={handleConnectWallet}
            disabled={loading || !secretKey}
          >
            {loading ? "Connecting..." : "Connect Wallet"}
          </button>
        </>
      )}
      {error && <p style={{ color: "red" }}>{error}</p>}
    </div>
  );
}
