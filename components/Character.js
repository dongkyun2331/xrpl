import { useState, useEffect, useRef } from "react";

export default function Character({ nickname, socket }) {
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const [direction, setDirection] = useState("down");
  const [isWalking, setIsWalking] = useState(false);
  const [step, setStep] = useState(0);
  const [players, setPlayers] = useState({});
  const walkIntervalRef = useRef(null);
  const characterSize = 50; // 캐릭터 크기
  const headerHeight = 100; // 헤더 높이 (header 영역을 넘지 못하게 하기 위함)

  useEffect(() => {
    // 초기 중앙 위치 설정
    const centerX = window.innerWidth / 2 - characterSize / 2;
    const centerY = window.innerHeight / 2 - characterSize / 2;
    setPosition({ top: Math.max(centerY, headerHeight), left: centerX });

    if (socket) {
      // 서버에서 현재 플레이어 정보 수신
      socket.on("currentPlayers", (players) => {
        setPlayers(players);
      });

      // 새로운 플레이어가 들어왔을 때
      socket.on("newPlayer", (players) => {
        setPlayers(players);
      });

      // 다른 플레이어가 움직였을 때
      socket.on("playerMoved", (player) => {
        setPlayers((prev) => ({
          ...prev,
          [player.id]: { ...player, isWalking: true },
        }));
        setTimeout(() => {
          setPlayers((prev) => ({
            ...prev,
            [player.id]: { ...player, isWalking: false },
          }));
        }, 200); // 잠시 후 걷기 동작 해제
      });

      // 플레이어가 나갔을 때
      socket.on("playerDisconnected", (playerId) => {
        setPlayers((prev) => {
          const newPlayers = { ...prev };
          delete newPlayers[playerId];
          return newPlayers;
        });
      });

      // 채팅 메시지를 받을 때
      socket.on("chatMessage", ({ playerId, message }) => {
        setPlayers((prev) => {
          if (prev[playerId]) {
            return {
              ...prev,
              [playerId]: {
                ...prev[playerId],
                bubbleMessage: message,
              },
            };
          }
          return prev;
        });

        setTimeout(() => {
          setPlayers((prev) => {
            if (prev[playerId]) {
              return {
                ...prev,
                [playerId]: {
                  ...prev[playerId],
                  bubbleMessage: "", // 말풍선 메시지 삭제
                },
              };
            }
            return prev;
          });
        }, 3000); // 3초 후 말풍선 사라짐
      });

      // 로그인 시 캐릭터와 닉네임을 바로 보여줍니다.
      socket.emit("setNickname", nickname);
      socket.emit("move", {
        x: centerX,
        y: Math.max(centerY, headerHeight),
        direction: "down",
      });
    }

    return () => {
      if (socket) {
        socket.off("currentPlayers");
        socket.off("newPlayer");
        socket.off("playerMoved");
        socket.off("playerDisconnected");
        socket.off("chatMessage");
      }
    };
  }, [socket, nickname]);

  const moveCharacter = (key, forceMove = false) => {
    let newDirection = direction;
    let newPosition = { ...position };

    switch (key) {
      case "ArrowUp":
        newDirection = "up";
        if (forceMove || newDirection === direction) {
          newPosition.top = Math.max(
            position.top - characterSize,
            headerHeight
          );
        }
        break;
      case "ArrowDown":
        newDirection = "down";
        if (forceMove || newDirection === direction) {
          newPosition.top = Math.min(
            position.top + characterSize,
            window.innerHeight - characterSize
          );
        }
        break;
      case "ArrowLeft":
        newDirection = "left";
        if (forceMove || newDirection === direction) {
          newPosition.left = Math.max(position.left - characterSize, 0);
        }
        break;
      case "ArrowRight":
        newDirection = "right";
        if (forceMove || newDirection === direction) {
          newPosition.left = Math.min(
            position.left + characterSize,
            window.innerWidth - characterSize
          );
        }
        break;
      default:
        return;
    }

    setDirection(newDirection);
    if (forceMove || newDirection === direction) {
      setPosition(newPosition);
      setIsWalking(true); // 현재 플레이어가 걷는 상태로 설정

      if (socket) {
        socket.emit("move", {
          x: newPosition.left,
          y: newPosition.top,
          direction: newDirection,
        });
      }
    }
  };

  useEffect(() => {
    const startWalking = (key) => {
      if (walkIntervalRef.current) clearInterval(walkIntervalRef.current);

      moveCharacter(key, true); // 첫 움직임: 방향 전환 및 이동
      walkIntervalRef.current = setInterval(
        () => moveCharacter(key, true),
        100
      ); // 계속 움직이기
    };

    const handleKeyDown = (event) => {
      if (event.repeat) return;
      setIsWalking(true);

      // 첫 키 입력에서 방향만 전환하고, 필요시 이동
      moveCharacter(event.key, false);
      setStep((prev) => (prev + 1) % 4);

      // 일정 시간 후에 계속 이동
      startWalking(event.key);
    };

    const handleKeyUp = () => {
      setIsWalking(false);
      setStep(0);
      if (walkIntervalRef.current) {
        clearInterval(walkIntervalRef.current);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      if (walkIntervalRef.current) {
        clearInterval(walkIntervalRef.current);
      }
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [position, direction]);

  const getArmLegTransform = (limb, step, isWalking) => {
    const movement = isWalking
      ? {
          arm: [-10, 10, -10, 10], // 팔의 움직임 각도
          leg: [10, -10, 10, -10], // 다리의 움직임 각도
        }
      : { arm: [0, 0, 0, 0], leg: [0, 0, 0, 0] }; // 움직이지 않을 때
    return movement[limb][step];
  };

  const renderCharacter = (player) => {
    const armTransform = `rotate(${getArmLegTransform(
      "arm",
      step,
      player.isWalking
    )} 14 24)`;
    const legTransform = `rotate(${getArmLegTransform(
      "leg",
      step,
      player.isWalking
    )} 20 50)`;

    const characterStyle = {
      position: "absolute",
      top: player.y,
      left: player.x,
    };

    const renderDirection = () => {
      switch (player.direction) {
        case "up":
          return (
            <>
              <circle cx="25" cy="15" r="10" fill="#FFD700" />
              <rect x="18" y="25" width="14" height="20" fill="#1E90FF" />
              <rect
                x="10"
                y="25"
                width="8"
                height="4"
                fill="#1E90FF"
                transform={armTransform}
              />
              <rect
                x="32"
                y="25"
                width="8"
                height="4"
                fill="#1E90FF"
                transform={armTransform}
              />
              <rect
                x="18"
                y="45"
                width="5"
                height="10"
                fill="#000"
                transform={legTransform}
              />
              <rect
                x="27"
                y="45"
                width="5"
                height="10"
                fill="#000"
                transform={legTransform}
              />
            </>
          );
        case "down":
          return (
            <>
              <circle cx="25" cy="15" r="10" fill="#FFD700" />
              <circle cx="20" cy="18" r="2" fill="#000" />
              <circle cx="30" cy="18" r="2" fill="#000" />
              <rect x="18" y="25" width="14" height="20" fill="#1E90FF" />
              <rect
                x="10"
                y="25"
                width="8"
                height="4"
                fill="#1E90FF"
                transform={armTransform}
              />
              <rect
                x="32"
                y="25"
                width="8"
                height="4"
                fill="#1E90FF"
                transform={armTransform}
              />
              <rect
                x="18"
                y="45"
                width="5"
                height="10"
                fill="#000"
                transform={legTransform}
              />
              <rect
                x="27"
                y="45"
                width="5"
                height="10"
                fill="#000"
                transform={legTransform}
              />
            </>
          );
        case "left":
          return (
            <>
              <circle cx="25" cy="15" r="10" fill="#FFD700" />
              <circle cx="20" cy="15" r="2" fill="#000" />
              <rect x="18" y="25" width="14" height="20" fill="#1E90FF" />
              <rect
                x="10"
                y="25"
                width="8"
                height="4"
                fill="#1E90FF"
                transform={armTransform}
              />
              <rect
                x="32"
                y="25"
                width="8"
                height="4"
                fill="#1E90FF"
                transform={armTransform}
              />
              <rect
                x="18"
                y="45"
                width="5"
                height="10"
                fill="#000"
                transform={legTransform}
              />
              <rect
                x="27"
                y="45"
                width="5"
                height="10"
                fill="#000"
                transform={legTransform}
              />
            </>
          );
        case "right":
          return (
            <>
              <circle cx="25" cy="15" r="10" fill="#FFD700" />
              <circle cx="30" cy="15" r="2" fill="#000" />
              <rect x="18" y="25" width="14" height="20" fill="#1E90FF" />
              <rect
                x="10"
                y="25"
                width="8"
                height="4"
                fill="#1E90FF"
                transform={armTransform}
              />
              <rect
                x="32"
                y="25"
                width="8"
                height="4"
                fill="#1E90FF"
                transform={armTransform}
              />
              <rect
                x="18"
                y="45"
                width="5"
                height="10"
                fill="#000"
                transform={legTransform}
              />
              <rect
                x="27"
                y="45"
                width="5"
                height="10"
                fill="#000"
                transform={legTransform}
              />
            </>
          );
        default:
          return null;
      }
    };

    return (
      <div style={characterStyle} key={player.id}>
        <svg width="50" height="50" viewBox="0 0 50 50">
          {renderDirection()}
        </svg>
        {player.bubbleMessage && (
          <div
            style={{
              position: "absolute",
              bottom: "100%",
              left: "50%",
              transform: "translateX(-50%)",
              backgroundColor: "rgba(255, 255, 255, 0.8)",
              padding: "5px 10px",
              borderRadius: "10px",
              marginBottom: "5px",
              fontSize: "12px",
              minWidth: "150px",
              textAlign: "center",
              whiteSpace: "normal", // 텍스트가 줄바꿈 되도록 설정
              wordBreak: "break-word", // 단어가 너무 길 경우 줄바꿈
            }}
          >
            {player.bubbleMessage}
          </div>
        )}
        {player.nickname && (
          <div
            style={{
              textAlign: "center",
              marginTop: "-10px",
              color: "#000",
            }}
          >
            {player.nickname}
          </div>
        )}
      </div>
    );
  };

  return <div>{Object.values(players).map(renderCharacter)}</div>;
}
