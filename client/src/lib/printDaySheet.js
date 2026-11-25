function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function printDaySheet({ title, note, stops }) {
  const rows = stops
    .map((stop, index) => {
      const lines = [stop.place, stop.address, stop.hours, stop.note].filter(Boolean);
      const details = lines.map((line) => `<span>${escapeHtml(line)}</span>`).join("");
      return `<li><strong>${index + 1}. ${escapeHtml(stop.title)}</strong>${details}</li>`;
    })
    .join("");
  const frame = document.createElement("iframe");
  frame.setAttribute("aria-hidden", "true");
  frame.style.cssText = "position:fixed;width:0;height:0;border:0";
  document.body.appendChild(frame);
  const doc = frame.contentDocument;
  if (!doc) {
    frame.remove();
    return;
  }
  doc.open();
  doc.write(`<!DOCTYPE html><html lang="ru"><head><meta charset="utf-8"><title>${escapeHtml(title)}</title>
<style>
  body { margin: 18mm 16mm; color: #14261c; font: 16px/1.45 Georgia, "Times New Roman", serif; }
  h1 { margin: 0 0 8px; font-size: 26px; }
  p { margin: 0 0 18px; }
  ol { margin: 0; padding: 0; list-style: none; }
  li { padding: 10px 0; border-top: 1px solid #c5decd; }
  strong { display: block; font-size: 18px; }
  span { display: block; }
</style></head><body>
<h1>${escapeHtml(title)}</h1>
${note ? `<p>${escapeHtml(note)}</p>` : ""}
<ol>${rows}</ol>
</body></html>`);
  doc.close();
  const win = frame.contentWindow;
  if (!win) {
    frame.remove();
    return;
  }
  win.focus();
  win.print();
  window.setTimeout(() => frame.remove(), 1500);
}
