import React from "react";

export default function WalletInfo({ wallet, onClose }) {
  if (!wallet) return null;

  const handleCopySecret = () => {
    navigator.clipboard
      .writeText(wallet.secret)
      .then(() => {
        alert("Secret key copied to clipboard!");
      })
      .catch((err) => {
        alert("Failed to copy secret key");
      });
  };

  return (
    <div id="wallet-info">
      <p>"Please save your secret key."</p>
      <p>
        <strong>Address:</strong> {wallet.address}
      </p>
      <p>
        <strong>Secret:</strong> {wallet.secret}
        <button onClick={handleCopySecret} style={{ marginLeft: "10px" }}>
          Copy Secret
        </button>
      </p>
      <p>
        <strong>Balance:</strong> {wallet.balance} XRP
      </p>
      <button onClick={onClose}>Close</button> {/* 닫기 버튼 */}
    </div>
  );
}
