import { useState, useEffect } from "react";
import io from "socket.io-client";
import CreateWalletButton from "../components/CreateWalletButton";
import WalletLogin from "../components/WalletLogin";
import Character from "../components/Character";
import WalletInfo from "../components/WalletInfo";
import FloatingButton from "../components/FloatingButton";
import NicknameModal from "../components/NicknameModal";
import Chat from "../components/Chat";

// 소켓을 초기화합니다.
const useSocket = (url) => {
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    const socketInstance = io(url, {
      reconnection: true,
      reconnectionAttempts: Infinity, // 무한 재연결 시도
      reconnectionDelay: 1000, // 재연결 시도 간격 (1초)
      reconnectionDelayMax: 5000, // 최대 재연결 간격 (5초)
      timeout: 20000, // 연결 타임아웃 (20초)
      transports: ["websocket"], // WebSocket을 우선 사용
    });

    socketInstance.on("connect", () => {
      console.log("Connected to server");
    });

    socketInstance.on("disconnect", (reason) => {
      console.log("Disconnected from server:", reason);
      if (reason === "io server disconnect") {
        // 서버 측에서 연결을 끊었을 경우 클라이언트에서 재연결 시도
        socketInstance.connect();
      }
    });

    socketInstance.on("reconnect_attempt", (attempt) => {
      console.log(`Reconnect attempt ${attempt}`);
    });

    socketInstance.on("reconnect_error", (error) => {
      console.error("Reconnect error:", error);
    });

    socketInstance.on("reconnect_failed", () => {
      console.error("Failed to reconnect to server");
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
  }, [url]);

  return socket;
};

export default function Home() {
  const socket = useSocket("https://forixrpl-server.duckdns.org:3001");
  const [wallet, setWallet] = useState(null); // 지갑 정보 상태
  const [nickname, setNickname] = useState("");
  const [isNicknameModalOpen, setIsNicknameModalOpen] = useState(false);
  const [showWalletInfo, setShowWalletInfo] = useState(false); // WalletInfo 표시 여부

  const handleWalletCreated = (newWallet) => {
    setWallet(newWallet); // 새 지갑 생성 시 지갑 정보 설정
    setShowWalletInfo(true); // 지갑 생성 후 WalletInfo 표시
  };

  const handleWalletConnected = async (connectedWallet) => {
    setWallet(connectedWallet); // 기존 지갑 연결 시 지갑 정보 설정

    // 로그인 시 닉네임 불러오기
    try {
      const response = await fetch(
        "https://forixrpl-server.duckdns.org:3001/api/getNickname",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ address: connectedWallet.address }),
        }
      );

      if (response.ok) {
        const data = await response.json();
        setNickname(data.nickname); // 닉네임 설정
      } else {
        setNickname(""); // 닉네임 없음
      }
    } catch (error) {
      console.error("Error fetching nickname:", error);
    }
  };

  const handleLogout = () => {
    setWallet(null);
    setNickname("");
    setShowWalletInfo(false); // 로그아웃 시 WalletInfo 숨김
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
          <span style={{ marginLeft: "5px" }}>XRPL v1.0.14</span>
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
          {showWalletInfo && (
            <WalletInfo
              wallet={wallet}
              onClose={() => setShowWalletInfo(false)}
            />
          )}
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
