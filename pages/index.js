import { useState } from "react";
import CreateWalletButton from "../components/CreateWalletButton";
import WalletInfo from "../components/WalletInfo";

export default function Home() {
  const [wallet, setWallet] = useState(null);

  const handleWalletClose = () => {
    setWallet(null); // 지갑 정보를 초기화하여 화면에서 제거
  };

  return (
    <div>
      <div id="header">
        <button id="title">XRPL</button>
        <CreateWalletButton onWalletCreated={setWallet} />
      </div>
      <WalletInfo wallet={wallet} onClose={handleWalletClose} />
    </div>
  );
}
