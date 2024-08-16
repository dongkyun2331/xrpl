import { useState } from "react";
import { Wallet, Client } from "xrpl";

export default function WalletLogin({ onWalletConnected, onLogout }) {
  const [secretKey, setSecretKey] = useState("");
  const [walletAddress, setWalletAddress] = useState(null);
  const [walletBalance, setWalletBalance] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleConnectWallet = async () => {
    setLoading(true);
    setError(null);

    try {
      // 시크릿 키로 지갑 생성
      const wallet = Wallet.fromSeed(secretKey);

      // XRP Ledger 서버에 연결
      const client = new Client("wss://s.altnet.rippletest.net:51233", {
        connectionTimeout: 10000, // 타임아웃 시간을 10초로 설정
      });
      await client.connect();

      // 지갑 정보 가져오기
      const response = await client.request({
        command: "account_info",
        account: wallet.classicAddress,
        ledger_index: "validated",
      });

      setWalletAddress(wallet.classicAddress);
      setWalletBalance(response.result.account_data.Balance);

      // 닉네임 조회
      const nicknameResponse = await fetch(
        "https://forixrpl-server.duckdns.org:3001/api/getNickname",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ address: wallet.classicAddress }),
        }
      );

      let nickname = "";
      if (nicknameResponse.ok) {
        const data = await nicknameResponse.json();
        nickname = data.nickname;
      }

      onWalletConnected({
        address: wallet.classicAddress,
        balance: response.result.account_data.Balance,
        secret: secretKey,
        nickname, // 닉네임을 전달합니다.
      });

      client.disconnect();
    } catch (err) {
      setError("Failed to connect to wallet: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    setWalletAddress(null);
    setWalletBalance(null);
    setSecretKey("");
    if (onLogout) onLogout();
  };

  return (
    <div>
      {!walletAddress ? (
        <div>
          <input
            type="text"
            placeholder="Enter Secret Key"
            value={secretKey}
            onChange={(e) => setSecretKey(e.target.value)}
          />
          <button onClick={handleConnectWallet} disabled={loading}>
            {loading ? "Connecting..." : "Connect Wallet"}
          </button>
          {error && <p style={{ color: "red" }}>{error}</p>}
        </div>
      ) : (
        <div style={{ display: "flex" }}>
          <div style={{ padding: "10px 15px" }}>Address: {walletAddress}</div>
          <div style={{ padding: "10px 15px" }}>
            Balance: {walletBalance} XRP
          </div>
          <button onClick={handleLogout}>Logout</button>
        </div>
      )}
    </div>
  );
}
