import { useState } from "react";
import io from "socket.io-client";
import CreateWalletButton from "../components/CreateWalletButton";
import WalletLogin from "../components/WalletLogin";
import Character from "../components/Character";
import WalletInfo from "../components/WalletInfo";
import FloatingButton from "../components/FloatingButton";
import NicknameModal from "../components/NicknameModal";
import Chat from "../components/Chat";

// 소켓을 초기화합니다.
const socket = io("https://forixrpl-server.duckdns.org:3001");

export default function Home() {
  const [wallet, setWallet] = useState(null); // 지갑 정보 상태
  const [nickname, setNickname] = useState("");
  const [isNicknameModalOpen, setIsNicknameModalOpen] = useState(false);

  const handleWalletCreated = (newWallet) => {
    setWallet(newWallet); // 새 지갑 생성 시 지갑 정보 설정
  };

  const handleWalletConnected = (connectedWallet) => {
    setWallet(connectedWallet); // 기존 지갑 연결 시 지갑 정보 설정
  };

  const handleLogout = () => {
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
          <span style={{ marginLeft: "5px" }}>XRPL v1.0.7</span>
        </div>
        <div id="auth">
          {wallet ? (
            <WalletLogin wallet={wallet} onLogout={handleLogout} />
          ) : (
            <>
              <WalletLogin onWalletConnected={handleWalletConnected} />
              <CreateWalletButton onWalletCreated={handleWalletCreated} />
            </>
          )}
        </div>
      </div>
      {wallet && (
        <>
          <Character nickname={nickname} socket={socket} />
          <WalletInfo wallet={wallet} onClose={() => setWallet(null)} />
          <FloatingButton onNicknameClick={handleNicknameClick} />
          {isNicknameModalOpen && (
            <NicknameModal onClose={handleNicknameClose} wallet={wallet} />
          )}
          <Chat socket={socket} /> {/* 로그인 후 채팅 기능 표시 */}
        </>
      )}
    </div>
  );
}
