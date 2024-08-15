import { useState, useEffect, useRef } from "react";

export default function Chat({ socket }) {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
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
    // 메시지가 추가될 때마다 스크롤을 가장 아래로 이동
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

  return (
    <div className="chat-container">
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
          background-color: rgba(241, 241, 241, 0.8); /* 반투명 배경 */
          padding: 10px;
          border-top: 1px solid #ccc;
        }
        .chat-messages {
          max-height: 150px; /* 채팅창 크기 제한 */
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
