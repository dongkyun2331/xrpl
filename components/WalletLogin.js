import React, { useState } from "react";
import { Wallet, Client } from "xrpl";
import WalletConnect from "@walletconnect/client";
import QRCodeModal from "@walletconnect/qrcode-modal";

export default function WalletLogin({ onWalletConnected, onLogout }) {
  const [modalVisible, setModalVisible] = useState(false);
  const [secretKey, setSecretKey] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const openModal = () => setModalVisible(true);
  const closeModal = () => {
    setModalVisible(false);
    setError(null); // 모달을 닫을 때 에러를 초기화
  };

  const handleConnectWallet = async () => {
    setLoading(true);
    setError(null);

    try {
      const wallet = Wallet.fromSeed(secretKey);

      const client = new Client("wss://s1.ripple.com", {
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
          balance: response.result.account_data.Balance,
          secret: secretKey,
        };

        onWalletConnected(connectedWallet);
        closeModal(); // 로그인 성공 시 모달 닫기
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
      bridge: "https://bridge.walletconnect.org", // Required
      qrcodeModal: QRCodeModal,
    });

    // Check if connection is already established
    if (!connector.connected) {
      // create new session
      await connector.createSession();
    }

    connector.on("connect", (error, payload) => {
      if (error) {
        setError("Failed to connect to SafePal: " + error.message);
        return;
      }

      const { accounts } = payload.params[0];
      const address = accounts[0];

      // Here you can use the address to interact with the XRP Ledger
      // and authenticate the user. For example:
      onWalletConnected({ address });
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
    setSecretKey("");
    if (onLogout) onLogout();
  };

  return (
    <div>
      <button onClick={openModal}>Connect Wallet</button>

      {modalVisible && (
        <div className="modal">
          <div className="modal-content">
            <span className="close" onClick={closeModal}>
              &times;
            </span>
            <h2>Login with Wallet</h2>

            <div style={{ marginBottom: "20px" }}>
              <input
                type="text"
                placeholder="Enter Secret Key"
                value={secretKey}
                onChange={(e) => setSecretKey(e.target.value)}
                disabled={loading}
                style={{ width: "100%", padding: "10px", marginBottom: "10px" }}
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
