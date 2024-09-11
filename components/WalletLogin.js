import React, { useState, useEffect } from "react";
import { Wallet, Client } from "xrpl";
import config from "@/pages/config";

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
  const [uuid, setUuid] = useState(null); // UUID 상태 추가

  const { ipAddress } = config;

  const openModal = () => {
    setModalVisible(true);
    setError(null);
  };

  const closeModal = () => {
    setModalVisible(false);
    setSecretKey("");
    setError(null);
  };

  const handleLogout = () => {
    setWalletInfo(null);
    setIsLoggedIn(false);
    if (onLogout) onLogout();

    // 페이지 새로고침
    window.location.reload();
  };

  const initiateXummLogin = async () => {
    try {
      const res = await fetch(`https://${ipAddress}:3001/api/xumm-login`, {
        method: "POST",
      });

      const data = await res.json();
      setQrCode(data.qrCode);
      setLoginUrl(data.loginUrl);
      setUuid(data.uuid); // UUID를 상태로 저장
    } catch (error) {
      console.error("Failed to initiate XUMM login:", error);
    }
  };

  // 주기적으로 로그인 상태를 확인하는 useEffect
  useEffect(() => {
    if (uuid) {
      const interval = setInterval(() => {
        checkXummLoginStatus(uuid);
      }, 3000); // 3초마다 상태 확인

      return () => clearInterval(interval); // 컴포넌트 언마운트 시 정리
    }
  }, [uuid]);

  const checkXummLoginStatus = async (uuid) => {
    try {
      const res = await fetch(
        `https://${ipAddress}:3001/api/xumm-callback?uuid=${uuid}`
      );
      const data = await res.json();

      if (data.success) {
        const walletInfo = await fetchAccountInfo(data.walletAddress); // XRP 잔액 조회

        setWalletAddress(data.walletAddress);
        setIsLoggedIn(true);
        setWalletInfo(walletInfo); // 지갑 정보 업데이트
        onWalletConnected(walletInfo);
        closeModal();
      } else {
        console.error(data.message);
      }
    } catch (error) {
      console.error("Failed to check login status:", error);
    }
  };

  const fetchAccountInfo = async (address) => {
    try {
      const serverUrl =
        network === "testnet"
          ? "wss://s.altnet.rippletest.net:51233"
          : network === "devnet"
          ? "wss://s.devnet.rippletest.net:51233"
          : "wss://s1.ripple.com";

      const client = new Client(serverUrl, {
        connectionTimeout: 10000,
      });
      await client.connect();

      const response = await client.request({
        command: "account_info",
        account: address,
        ledger_index: "validated",
      });

      client.disconnect();

      if (response.result.account_data) {
        return {
          address,
          balance: response.result.account_data.Balance / 1000000, // XRP 단위로 변환
          network,
        };
      } else {
        throw new Error("Account not found or not activated.");
      }
    } catch (error) {
      console.error("Failed to fetch account info:", error);
      return null;
    }
  };

  const handleCopyAddress = async () => {
    try {
      await navigator.clipboard.writeText(walletInfo.address);
      alert("Wallet address copied to clipboard!");
    } catch (error) {
      console.error("Failed to copy address:", error);
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
              <p onClick={handleCopyAddress} style={{ cursor: "pointer" }}>
                Wallet Address: {walletInfo?.address}
              </p>
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
