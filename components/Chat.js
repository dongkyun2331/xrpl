import { useState, useEffect, useRef } from "react";

export default function Chat({ socket }) {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [height, setHeight] = useState(150); // 초기 채팅창 높이 설정
  const isResizingRef = useRef(false);
  const startYRef = useRef(0);
  const startHeightRef = useRef(0);
  const messagesEndRef = useRef(null);

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
      setMessage("");
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
          padding: 0 10ox 10px 10px;
          border-top: 1px solid #ccc;
          display: flex;
          flex-direction: column;
        }
        .resize-handle {
          height: 1px;
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
      `}</style>
    </div>
  );
}
