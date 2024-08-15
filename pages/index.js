import { useState, useEffect } from "react";
import io from "socket.io-client";
import CreateWalletButton from "../components/CreateWalletButton";
import WalletLogin from "../components/WalletLogin";
import Character from "../components/Character";
import FloatingButton from "../components/FloatingButton";
import NicknameModal from "../components/NicknameModal";

// 소켓을 초기화합니다. 이 변수는 컴포넌트가 마운트될 때 초기화됩니다.
const socket = io("http://localhost:3001");

export default function Home() {
  const [wallet, setWallet] = useState(null);
  const [showCharacter, setShowCharacter] = useState(false);
  const [nickname, setNickname] = useState("");
  const [isNicknameModalOpen, setIsNicknameModalOpen] = useState(false);

  useEffect(() => {
    // 컴포넌트가 마운트되었을 때만 소켓 연결을 유지하기 위해 소켓을 설정합니다.
    if (socket) {
      socket.connect();

      // 컴포넌트가 언마운트되면 소켓 연결을 끊습니다.
      return () => {
        socket.disconnect();
      };
    }
  }, []);

  const handleWalletConnected = async (wallet) => {
    setWallet(wallet);
    setShowCharacter(true);

    const response = await fetch("/api/getNickname", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ address: wallet.address }),
    });

    if (response.ok) {
      const data = await response.json();
      setNickname(data.nickname);
    } else {
      setNickname("");
    }
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
        <div id="title">XRPL</div>
        <div id="auth">
          <WalletLogin
            onWalletConnected={handleWalletConnected}
            onLogout={handleLogout}
          />
          {!wallet && <CreateWalletButton onWalletCreated={setWallet} />}
        </div>
      </div>
      {showCharacter && <Character nickname={nickname} socket={socket} />}
      {wallet && <FloatingButton onNicknameClick={handleNicknameClick} />}
      {isNicknameModalOpen && (
        <NicknameModal onClose={handleNicknameClose} wallet={wallet} />
      )}
    </div>
  );
}
