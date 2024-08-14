// pages/api/getBalance.js
import { Client } from "xrpl";

export default async function handler(req, res) {
  const client = new Client("wss://s.altnet.rippletest.net:51233"); // Testnet 서버에 연결
  await client.connect();

  const walletAddress = "rPUT_YOUR_ADDRESS_HERE"; // 조회할 XRP 지갑 주소
  const response = await client.request({
    command: "account_info",
    account: walletAddress,
    ledger_index: "validated",
  });

  client.disconnect();

  res.status(200).json({ balance: response.result.account_data.Balance });
}
