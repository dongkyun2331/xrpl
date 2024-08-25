import React, { useState } from "react";
import { Wallet, Client } from "xrpl";
import WalletConnect from "@walletconnect/client";
import QRCodeModal from "@walletconnect/qrcode-modal";

export default function WalletLogin({ onWalletConnected, onLogout }) {
  const [modalVisible, setModalVisible] = useState(false);
  const [secretKey, setSecretKey] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [network, setNetwork] = useState("mainnet"); // 네트워크 선택 상태 추가
  const [walletInfo, setWalletInfo] = useState(null); // 지갑 정보 상태
  const [isLoggedIn, setIsLoggedIn] = useState(false); // 로그인 상태 관리

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
          : "wss://s1.ripple.com";

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

  const handleSafePalLogin = async () => {
    const connector = new WalletConnect({
      bridge: "https://bridge.walletconnect.org",
      qrcodeModal: QRCodeModal,
    });

    if (!connector.connected) {
      await connector.createSession();
    }

    connector.on("connect", (error, payload) => {
      if (error) {
        setError("Failed to connect to SafePal: " + error.message);
        return;
      }

      const { accounts } = payload.params[0];
      const address = accounts[0];

      setWalletInfo({ address, network }); // 지갑 정보 상태에 저장
      setIsLoggedIn(true); // 로그인 상태 변경
      onWalletConnected({ address, network });
      closeModal();
    });

    connector.on("session_update", (error, payload) => {
      if (error) {
        setError("Failed to update session: " + error.message);
        return;
      }

      const { accounts } = payload.params[0];
      console.log(accounts);
    });

    connector.on("disconnect", (error, payload) => {
      if (error) {
        setError("Disconnected: " + error.message);
      } else {
        console.log("Disconnected");
      }
    });
  };

  const handleLogout = () => {
    setWalletInfo(null); // 지갑 정보 초기화
    setIsLoggedIn(false); // 로그아웃 상태로 전환
    if (onLogout) onLogout();
  };

  return (
    <div>
      {!isLoggedIn ? (
        <button onClick={openModal}>Connect Wallet</button>
      ) : (
        <div style={{ display: "flex", gap: "10px" }}>
          <p>Wallet Address: {walletInfo?.address}</p>
          <p>Balance: {walletInfo?.balance} XRP</p>
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
                <option value="mainnet">Mainnet</option>
                <option value="testnet">Testnet</option>
              </select>
            </div>

            <div style={{ marginBottom: "20px" }}>
              <input
                type="text"
                placeholder="Enter Secret Key"
                value={secretKey}
                onChange={(e) => setSecretKey(e.target.value)}
                disabled={loading}
                style={{ width: "94%", padding: "10px", marginBottom: "10px" }}
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
            </div>

            <div style={{ textAlign: "center", marginBottom: "20px" }}>or</div>

            <button
              onClick={handleSafePalLogin}
              style={{
                width: "100%",
                padding: "10px",
                backgroundColor: "#007bff",
                color: "white",
                border: "none",
                cursor: "pointer",
              }}
            >
              Login with SafePal
            </button>

            {error && (
              <p style={{ color: "red", marginTop: "10px" }}>{error}</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
