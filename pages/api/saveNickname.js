import fs from "fs";
import path from "path";

const filePath = path.resolve("./nicknames.json");

export default function handler(req, res) {
  if (req.method === "POST") {
    const { nickname, address } = req.body;

    let nicknames = {};

    // 파일이 존재하고, 내용이 유효한 JSON 형식인지 확인
    if (fs.existsSync(filePath)) {
      try {
        const fileData = fs.readFileSync(filePath, "utf-8");
        if (fileData) {
          nicknames = JSON.parse(fileData);
        }
      } catch (error) {
        return res
          .status(500)
          .json({ message: "Failed to read or parse existing nicknames file" });
      }
    }

    if (Object.values(nicknames).includes(nickname)) {
      return res.status(400).json({ message: "Nickname already exists" });
    }

    nicknames[address] = nickname;

    try {
      fs.writeFileSync(filePath, JSON.stringify(nicknames, null, 2));
      res.status(200).json({ message: "Nickname saved successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to save nickname" });
    }
  } else {
    res.status(405).json({ message: "Method not allowed" });
  }
}
