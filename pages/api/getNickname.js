import fs from "fs";
import path from "path";

const filePath = path.resolve("./nicknames.json");

export default function handler(req, res) {
  if (req.method === "POST") {
    const { address } = req.body;

    let nicknames = {};

    if (fs.existsSync(filePath)) {
      try {
        const fileData = fs.readFileSync(filePath, "utf-8");
        if (fileData) {
          nicknames = JSON.parse(fileData);
        }
      } catch (error) {
        return res
          .status(500)
          .json({ message: "Failed to read nicknames file" });
      }
    }

    const nickname = nicknames[address];

    if (nickname) {
      res.status(200).json({ nickname });
    } else {
      res.status(404).json({ message: "Nickname not found" });
    }
  } else {
    res.status(405).json({ message: "Method not allowed" });
  }
}
