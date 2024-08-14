import { Wallet, Client } from "xrpl";

export default async function handler(req, res) {
  const client = new Client("wss://s.altnet.rippletest.net:51233", {
    connectionTimeout: 10000,
  });

  try {
    await client.connect();

    const wallet = Wallet.generate();
    const response = await client.fundWallet(wallet);

    res.status(200).json({
      address: wallet.classicAddress,
      secret: wallet.seed,
      balance: response.balance,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  } finally {
    client.disconnect();
  }
}
