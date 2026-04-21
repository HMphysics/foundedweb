// Download helpers (JSON + PNG via html-to-image).
import { toPng } from "html-to-image";

function triggerDownload(filename, dataUrl) {
  const a = document.createElement("a");
  a.href = dataUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

export function downloadJSON(filename, obj) {
  const blob = new Blob([JSON.stringify(obj, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  triggerDownload(filename, url);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export async function exportPNG(ref, name, bg = "#0B0F10") {
  if (!ref?.current) return;
  try {
    const dataUrl = await toPng(ref.current, {
      backgroundColor: bg,
      pixelRatio: 2,
      cacheBust: true,
    });
    triggerDownload(`${name}.png`, dataUrl);
  } catch (e) {
    console.error("PNG export failed", e);
  }
}
