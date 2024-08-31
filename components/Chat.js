import React, { useState, useEffect, useRef } from "react";

export default function Chat({ socket }) {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [height, setHeight] = useState(150);
  const isResizingRef = useRef(false);
  const startYRef = useRef(0);
  const startHeightRef = useRef(0);
  const messagesEndRef = useRef(null);
  const [qrCode, setQrCode] = useState(null);

  const url = "forixrpl-server.duckdns.org";

  useEffect(() => {
    if (socket) {
      socket.on("receiveMessage", (newMessage) => {
        setMessages((prevMessages) => [...prevMessages, newMessage]);
      });
    }

    return () => {
      if (socket) {
        socket.off("receiveMessage");
      }
    };
  }, [socket]);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const sendMessage = () => {
    if (message.trim() !== "") {
      socket.emit("sendMessage", message);
      setMessages((prevMessages) => [
        ...prevMessages,
        { user: "Me", text: message },
      ]);
      socket.emit("chatMessage", { message });
      handleXRPRequest(message);
      setMessage("");
    }
  };

  const handleXRPRequest = async (message) => {
    const regex = /(\w{25,34})\s+(\d+(\.\d{1,6})?)\s*xrp\s*보내줘/i;
    const match = message.match(regex);

    if (match) {
      const address = match[1];
      const amount = parseFloat(match[2]);

      try {
        const response = await fetch(`https://${url}:3001/api/sendXRP`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ address, amount }),
        });

        if (response.ok) {
          const result = await response.json();
          setQrCode(result.qrCode); // QR 코드를 저장하여 사용자에게 표시
          setMessages((prevMessages) => [
            ...prevMessages,
            {
              user: "System",
              text: `QR 코드를 사용하여 트랜잭션을 승인하세요`,
            },
          ]);
        } else {
          throw new Error("Failed to send XRP");
        }
      } catch (error) {
        setMessages((prevMessages) => [
          ...prevMessages,
          { user: "System", text: `Error sending XRP: ${error.message}` },
        ]);
      }
    }
  };

  const startResizing = (e) => {
    isResizingRef.current = true;
    startYRef.current = e.clientY;
    startHeightRef.current = height;
  };

  const resize = (e) => {
    if (isResizingRef.current) {
      const newHeight =
        startHeightRef.current - (e.clientY - startYRef.current);
      setHeight(Math.max(newHeight, 100)); // 최소 높이를 100px로 설정
    }
  };

  const stopResizing = () => {
    isResizingRef.current = false;
  };

  useEffect(() => {
    window.addEventListener("mousemove", resize);
    window.addEventListener("mouseup", stopResizing);

    return () => {
      window.removeEventListener("mousemove", resize);
      window.removeEventListener("mouseup", stopResizing);
    };
  }, []);

  return (
    <div className="chat-container" style={{ height: `${height}px` }}>
      <div className="resize-handle" onMouseDown={startResizing}></div>
      <div className="chat-messages">
        {messages.map(
          (msg, index) =>
            msg.user !== "Me" && (
              <div key={index} className="chat-message">
                <strong>{msg.user}: </strong>
                {msg.text}
              </div>
            )
        )}
        {qrCode && (
          <div className="qr-code">
            <img src={qrCode} alt="XUMM QR Code" />
          </div>
        )}
        <div ref={messagesEndRef} /> {/* 스크롤이 이동할 위치를 위한 빈 div */}
      </div>
      <div className="chat-input">
        <input
          type="text"
          placeholder="Type a message..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
        />
        <button onClick={sendMessage}>Send</button>
      </div>

      <style jsx>{`
        .chat-container {
          position: fixed;
          bottom: 0;
          left: 0;
          right: 0;
          background-color: rgba(241, 241, 241, 0.8);
          padding: 0 10px 10px 10px;
          border-top: 1px solid #ccc;
          display: flex;
          flex-direction: column;
        }
        .resize-handle {
          height: 5px;
          background-color: #ccc;
          cursor: ns-resize;
          margin-bottom: 5px;
        }
        .chat-messages {
          flex: 1;
          overflow-y: auto;
          margin-bottom: 10px;
        }
        .chat-message {
          margin-bottom: 5px;
        }
        .chat-input {
          display: flex;
        }
        .chat-input input {
          flex: 1;
          padding: 10px;
          font-size: 14px;
          border-radius: 5px;
          border: 1px solid #ccc;
          margin-right: 5px;
        }
        .chat-input button {
          padding: 10px 15px;
          font-size: 14px;
          color: white;
          background-color: #007bff;
          border: none;
          border-radius: 5px;
          cursor: pointer;
        }
        .chat-input button:hover {
          background-color: #0056b3;
        }
        .qr-code {
          text-align: center;
          margin-top: 10px;
        }
        .qr-code img {
          max-width: 100%;
          height: auto;
        }
      `}</style>
    </div>
  );
}
