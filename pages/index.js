import { useState } from "react";
import CreateWalletButton from "../components/CreateWalletButton";
import WalletLogin from "../components/WalletLogin";
import Character from "../components/Character";
import FloatingButton from "../components/FloatingButton";
import NicknameModal from "../components/NicknameModal";

export default function Home() {
  const [wallet, setWallet] = useState(null);
  const [showCharacter, setShowCharacter] = useState(false);
  const [nickname, setNickname] = useState("");
  const [isNicknameModalOpen, setIsNicknameModalOpen] = useState(false);

  const handleWalletConnected = async (wallet) => {
    setWallet(wallet); // 지갑 연결 후 지갑 정보를 저장
    setShowCharacter(true); // 로그인 후 캐릭터 표시

    // 지갑 주소에 해당하는 닉네임을 서버에서 불러오기
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
      setNickname(""); // 닉네임이 없으면 빈 문자열로 설정
    }
  };

  const handleLogout = () => {
    setShowCharacter(false); // 로그아웃 시 캐릭터 숨기기
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
      {showCharacter && <Character nickname={nickname} />}
      {wallet && <FloatingButton onNicknameClick={handleNicknameClick} />}
      {isNicknameModalOpen && (
        <NicknameModal onClose={handleNicknameClose} wallet={wallet} />
      )}
    </div>
  );
}
