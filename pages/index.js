import { useState } from "react";
import CreateWalletButton from "../components/CreateWalletButton";
import WalletInfo from "../components/WalletInfo";
import WalletLogin from "../components/WalletLogin";
import Character from "../components/Character";

export default function Home() {
  const [wallet, setWallet] = useState(null);
  const [showCharacter, setShowCharacter] = useState(false);

  const handleWalletConnected = (wallet) => {
    setWallet(wallet); // 지갑 연결 후 지갑 정보를 저장
    setWallet(null); // 지갑 정보를 초기화하여 화면에서 제거
    setShowCharacter(true); // 로그인 후 캐릭터 표시
  };

  const handleWalletClose = () => {
    setWallet(null); // 지갑 정보를 초기화하여 화면에서 제거
    setShowCharacter(false); // 캐릭터 숨기기
  };

  return (
    <div>
      <div id="header">
        <div id="title">XRPL</div>
        <div id="auth">
          <WalletLogin onWalletConnected={handleWalletConnected} />
          <CreateWalletButton onWalletCreated={setWallet} />
        </div>
      </div>
      <WalletInfo wallet={wallet} onClose={handleWalletClose} />
      {showCharacter && <Character />}
    </div>
  );
}
