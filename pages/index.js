// pages/index.js
import { useState, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import path from "path";
import fs from "fs";
import io from "socket.io-client";
// import CreateWalletButton from "../components/CreateWalletButton";
import WalletLogin from "../components/WalletLogin";
import Character from "../components/Character";
import WalletInfo from "../components/WalletInfo";
import FloatingButton from "../components/FloatingButton";
import NicknameModal from "../components/NicknameModal";
import Chat from "../components/Chat";
import config from "./config";

const { ipAddress } = config;

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

export default function Home({ markdown }) {
  const socket = useSocket(`https://${ipAddress}:3001`);
  const [wallet, setWallet] = useState(null);
  const [nickname, setNickname] = useState("");
  const [isNicknameModalOpen, setIsNicknameModalOpen] = useState(false);
  const [showWalletInfo, setShowWalletInfo] = useState(false);
  const [showReadme, setShowReadme] = useState(true);

  const handleWalletCreated = (newWallet) => {
    setWallet(newWallet);
    setShowWalletInfo(true);
    setShowReadme(false); // 지갑 생성 후 "README" 숨김
  };

  const handleWalletConnected = async (connectedWallet) => {
    setWallet(connectedWallet);
    setShowReadme(false); // 지갑 연결 후 "README" 숨김

    try {
      const response = await fetch(
        `https://${ipAddress}:3001/api/getNickname`,
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
        setNickname(data.nickname);
      } else {
        setNickname("");
      }
    } catch (error) {
      console.error("Error fetching nickname:", error);
    }
  };

  const handleLogout = () => {
    setWallet(null);
    setNickname("");
    setShowWalletInfo(false);
    setShowReadme(true); // 로그아웃 시 "README" 다시 표시
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
          <span style={{ marginLeft: "5px" }}>XRPL</span>
        </div>
        <div id="auth">
          {wallet ? (
            <WalletLogin wallet={wallet} onLogout={handleLogout} />
          ) : (
            <>
              <WalletLogin onWalletConnected={handleWalletConnected} />
              <button onClick={handleNicknameClick}>Set Nickname</button>
              {isNicknameModalOpen && (
                <NicknameModal onClose={handleNicknameClose} wallet={wallet} />
              )}
            </>
          )}
        </div>
      </div>
      {showReadme && markdown && (
        <div
          className="markdown-container"
          style={{ overflowY: "scroll", height: "80vh" }}
        >
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{markdown}</ReactMarkdown>
        </div>
      )}
      {wallet && (
        <>
          <Character nickname={nickname} socket={socket} />
          {showWalletInfo && (
            <WalletInfo
              wallet={wallet}
              onClose={() => {
                setShowWalletInfo(false);
                setWallet(null);
                setNickname("");
              }}
            />
          )}
          <FloatingButton onNicknameClick={handleNicknameClick} />
          <Chat socket={socket} /> {/* 로그인 후 채팅 기능 표시 */}
        </>
      )}
      <style jsx>{`
        .markdown-container {
          padding: 20px;
          background-color: #f8f8f8;
          border-radius: 10px;
          margin: 20px;
          max-width: 800px;
          margin-left: auto;
          margin-right: auto;
        }
        .markdown-container h1,
        .markdown-container h2,
        .markdown-container h3 {
          margin-top: 20px;
        }
        .markdown-container p {
          margin: 10px 0;
        }
        .markdown-container ul {
          list-style-type: disc;
          margin-left: 20px;
        }
        .markdown-container code {
          background-color: #eaeaea;
          padding: 2px 4px;
          border-radius: 4px;
        }
        .markdown-container pre {
          background-color: #333;
          color: #fff;
          padding: 10px;
          border-radius: 10px;
          overflow-x: auto;
        }
      `}</style>
    </div>
  );
}

export async function getStaticProps() {
  const filePath = path.join(process.cwd(), "README.md");
  const markdown = fs.readFileSync(filePath, "utf8");

  return {
    props: {
      markdown,
    },
  };
}
