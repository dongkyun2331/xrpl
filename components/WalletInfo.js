// components/WalletInfo.js
export default function WalletInfo({ wallet, onClose }) {
  if (!wallet) return null;

  return (
    <div id="wallet-info">
      <p>
        <strong>Address:</strong> {wallet.address}
      </p>
      <p>
        <strong>Secret:</strong> {wallet.secret}
      </p>
      <p>
        <strong>Balance:</strong> {wallet.balance} XRP
      </p>
      <button onClick={onClose}>Close</button>
    </div>
  );
}
