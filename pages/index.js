import { useState, useEffect } from "react";
import io from "socket.io-client";
import CreateWalletButton from "../components/CreateWalletButton";
import WalletLogin from "../components/WalletLogin";
import Character from "../components/Character";
import FloatingButton from "../components/FloatingButton";
import NicknameModal from "../components/NicknameModal";
import Chat from "../components/Chat";

// 소켓을 초기화합니다.
const socket = io("https://forixrpl-server.duckdns.org:3001");

export default function Home() {
  const [wallet, setWallet] = useState(null);
  const [showCharacter, setShowCharacter] = useState(false);
  const [nickname, setNickname] = useState("");
  const [isNicknameModalOpen, setIsNicknameModalOpen] = useState(false);

  useEffect(() => {
    if (socket) {
      socket.connect();

      return () => {
        socket.disconnect();
      };
    }
  }, []);

  const handleWalletCreated = (newWallet) => {
    setWallet(newWallet);
    setShowCharacter(true);
  };

  const handleLogout = () => {
    setShowCharacter(false);
    setWallet(null);
    setNickname("");
  };

  const handleNicknameClick = () => {
    setIsNicknameModalOpen(true);
  };

  const handleNicknameClose = (newNickname) => {
    if (newNickname) {
      setNickname(newNickname);
    }
    setIsNicknameModalOpen(false);
  };

  return (
    <div>
      <div id="header">
        <div style={{ display: "flex" }}>
          <div id="title">FORI</div>
          <span style={{ marginLeft: "5px" }}>XRPL v1.0.0</span>
        </div>
        <div id="auth">
          <WalletLogin
            onWalletConnected={handleWalletCreated}
            onLogout={handleLogout}
          />
          {!wallet && (
            <CreateWalletButton onWalletCreated={handleWalletCreated} />
          )}
        </div>
      </div>
      {showCharacter && <Character nickname={nickname} socket={socket} />}
      {wallet && <FloatingButton onNicknameClick={handleNicknameClick} />}
      {isNicknameModalOpen && (
        <NicknameModal onClose={handleNicknameClose} wallet={wallet} />
      )}
      {wallet && <Chat socket={socket} />} {/* 로그인 후 채팅 기능 표시 */}
    </div>
  );
}
