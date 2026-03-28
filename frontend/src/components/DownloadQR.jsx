export default function DownloadQR({ qrCode, fileName = "student-qr.png" }) {
  const download = () => {
    if (!qrCode) return;

    const link = document.createElement("a");
    link.href = qrCode;
    link.download = fileName;
    link.click();
  };

  return (
    <button
      type="button"
      onClick={download}
      disabled={!qrCode}
      className="rounded-full border border-cyan-200 bg-card px-4 py-2 text-sm font-semibold text-cyan-700 transition hover:border-cyan-300 hover:bg-cyan-50 disabled:cursor-not-allowed disabled:border-slate-200 disabled:text-slate-400"
    >
      Download QR
    </button>
  );
}
