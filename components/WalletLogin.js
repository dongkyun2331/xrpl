import React, { useState } from "react";
import { Wallet, Client } from "xrpl";

export default function WalletLogin({ onWalletConnected, onLogout, onLogin }) {
  const [modalVisible, setModalVisible] = useState(false);
  const [secretKey, setSecretKey] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [network, setNetwork] = useState("Testnet");
  const [walletInfo, setWalletInfo] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const [loginUrl, setLoginUrl] = useState(null);
  const [qrCode, setQrCode] = useState(null);
  const [walletAddress, setWalletAddress] = useState(null);

  const address = "forixrpl-server.duckdns.org";

  const openModal = () => {
    setModalVisible(true);
    setError(null);
  };

  const closeModal = () => {
    setModalVisible(false);
    setSecretKey("");
    setError(null);
  };

  const handleConnectWallet = async () => {
    setLoading(true);
    setError(null);

    try {
      const wallet = Wallet.fromSeed(secretKey);

      const serverUrl =
        network === "testnet"
          ? "wss://s.altnet.rippletest.net:51233"
          : network === "devnet"
          ? "wss://s.devnet.rippletest.net:51233"
          : "wss://s1.ripple.com"; // Devnet 추가

      const client = new Client(serverUrl, {
        connectionTimeout: 10000,
      });
      await client.connect();

      const response = await client.request({
        command: "account_info",
        account: wallet.classicAddress,
        ledger_index: "validated",
      });

      if (response.result.account_data) {
        const connectedWallet = {
          address: wallet.classicAddress,
          balance: response.result.account_data.Balance / 1000000, // XRP 단위로 변환
          secret: secretKey,
          network, // 선택한 네트워크 정보 추가
        };

        setWalletInfo(connectedWallet); // 지갑 정보 상태에 저장
        setIsLoggedIn(true); // 로그인 상태 변경
        onWalletConnected(connectedWallet);
        closeModal();
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
    setWalletInfo(null); // 지갑 정보 초기화
    setIsLoggedIn(false); // 로그아웃 상태로 전환
    if (onLogout) onLogout();
  };

  const initiateXummLogin = async () => {
    try {
      const res = await fetch(`https://${address}:3001/api/xumm-login`, {
        method: "POST",
      });

      const data = await res.json();
      setQrCode(data.qrCode);
      setLoginUrl(data.loginUrl);
    } catch (error) {
      console.error("Failed to initiate XUMM login:", error);
    }
  };

  const checkXummLoginStatus = async (uuid) => {
    try {
      const res = await fetch(
        `https://${address}:3001/api/xumm-callback?uuid=${uuid}`
      );
      const data = await res.json();

      if (data.success) {
        setWalletAddress(data.walletAddress);
        setIsLoggedIn(true);
        onLogin(data.walletAddress);
      } else {
        console.error(data.message);
      }
    } catch (error) {
      console.error("Failed to check login status:", error);
    }
  };

  return (
    <div>
      {!isLoggedIn ? (
        <div>
          <button onClick={openModal}>Connect Wallet</button>
        </div>
      ) : (
        <div style={{ display: "flex", gap: "10px" }}>
          {walletInfo ? (
            <>
              <p>Wallet Address: {walletInfo?.address}</p>
              <p>Balance: {walletInfo?.balance} XRP</p>
            </>
          ) : (
            <p>Logged in with wallet: {walletAddress}</p>
          )}
          <button onClick={handleLogout}>Logout</button>
        </div>
      )}

      {modalVisible && !isLoggedIn && (
        <div className="modal">
          <div className="modal-content">
            <button onClick={closeModal} style={{ marginBottom: "20px" }}>
              X
            </button>

            <div style={{ marginBottom: "20px" }}>
              <select
                value={network}
                onChange={(e) => setNetwork(e.target.value)}
                disabled={loading}
              >
                <option value="testnet">Testnet</option>
                <option value="devnet">Devnet</option>
                <option value="mainnet">Mainnet</option>
              </select>
            </div>

            <div style={{ marginBottom: "20px" }}>
              <input
                type="text"
                placeholder="Enter Secret Key"
                value={secretKey}
                onChange={(e) => setSecretKey(e.target.value)}
                disabled={loading}
                style={{
                  width: "94%",
                  padding: "10px",
                  marginBottom: "10px",
                }}
              />
              <button
                onClick={handleConnectWallet}
                disabled={loading || !secretKey}
                style={{
                  width: "100%",
                  padding: "10px",
                  backgroundColor: "#4CAF50",
                  color: "white",
                  border: "none",
                  cursor: "pointer",
                }}
              >
                {loading ? "Connecting..." : "Connect Wallet"}
              </button>
              <button onClick={initiateXummLogin}>Login with XUMM</button>
              {qrCode && <img src={qrCode} alt="XUMM QR Code" />}
              {loginUrl && (
                <div>
                  <a href={loginUrl} target="_blank" rel="noopener noreferrer">
                    Or click here to login
                  </a>
                </div>
              )}
            </div>

            {error && (
              <p style={{ color: "red", marginTop: "10px" }}>{error}</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
