import mysql from "mysql2/promise";
import dotenv from "dotenv";

// .env 파일 로드 (일반적으로 Next.js는 자동으로 .env를 로드하므로 필요하지 않을 수 있음)
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

    if (!nickname || !address) {
      return res
        .status(400)
        .json({ message: "Nickname and address are required" });
    }

    try {
      // MySQL 데이터베이스에 연결
      const connection = await mysql.createConnection(dbConfig);

      // 닉네임 조회
      if (!nickname) {
        const [rows] = await connection.execute(
          "SELECT nickname FROM nicknames WHERE address = ?",
          [address]
        );

        if (rows.length > 0) {
          res.status(200).json({ nickname: rows[0].nickname });
        } else {
          res.status(404).json({ message: "Nickname not found" });
        }
      } else {
        // 닉네임 중복 검사
        const [rows] = await connection.execute(
          "SELECT nickname FROM nicknames WHERE nickname = ?",
          [nickname]
        );

        if (rows.length > 0) {
          return res.status(400).json({ message: "Nickname already exists" });
        }

        // 닉네임 저장
        await connection.execute(
          "INSERT INTO nicknames (address, nickname) VALUES (?, ?)",
          [address, nickname]
        );

        res.status(200).json({ message: "Nickname saved successfully" });
      }

      // 연결 종료
      await connection.end();
    } catch (error) {
      res.status(500).json({ message: "Database error", error: error.message });
    }
  } else {
    res.status(405).json({ message: "Method not allowed" });
  }
}
