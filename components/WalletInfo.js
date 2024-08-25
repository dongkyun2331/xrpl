export default function WalletInfo({ wallet, onClose }) {
  if (!wallet) return null;

  return (
    <div id="wallet-info">
      <p>"Please save your secret key."</p>
      <p>
        <strong>Address:</strong> {wallet.address}
      </p>
      <p>
        <strong>Secret:</strong> {wallet.secret}
      </p>
      <p>
        <strong>Balance:</strong> {wallet.balance} XRP
      </p>
      <button onClick={onClose}>Close</button> {/* 닫기 버튼 */}
    </div>
  );
}
