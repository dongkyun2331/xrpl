import mysql from "mysql2/promise";
import dotenv from "dotenv";

// .env 파일 로드 (로컬 개발 환경에서 필요할 때 사용)
dotenv.config();

// MySQL 데이터베이스 연결 설정
const dbConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
};

export default async function handler(req, res) {
  if (req.method === "POST") {
    const { nickname, address } = req.body;

    if (!nickname && !address) {
      return res
        .status(400)
        .json({ message: "Nickname and address are required" });
    }

    try {
      // MySQL 데이터베이스에 연결
      const connection = await mysql.createConnection(dbConfig);

      if (address && !nickname) {
        // 닉네임 조회
        const [rows] = await connection.execute(
          "SELECT nickname FROM nicknames WHERE address = ?",
          [address]
        );

        if (rows.length > 0) {
          await connection.end();
          return res.status(200).json({ nickname: rows[0].nickname });
        } else {
          await connection.end();
          return res.status(404).json({ message: "Nickname not found" });
        }
      } else if (nickname && address) {
        // 닉네임 중복 검사
        const [rows] = await connection.execute(
          "SELECT nickname FROM nicknames WHERE nickname = ?",
          [nickname]
        );

        if (rows.length > 0) {
          await connection.end();
          return res.status(400).json({ message: "Nickname already exists" });
        }

        // 닉네임 저장
        await connection.execute(
          "INSERT INTO nicknames (address, nickname) VALUES (?, ?)",
          [address, nickname]
        );

        await connection.end();
        return res.status(200).json({ message: "Nickname saved successfully" });
      }
    } catch (error) {
      console.error("Database error:", error); // 오류 로그 출력
      return res
        .status(500)
        .json({ message: "Database error", error: error.message });
    }
  } else {
    return res.status(405).json({ message: "Method not allowed" });
  }
}
