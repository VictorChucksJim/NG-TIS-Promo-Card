// card-renderer.js
// NICEGENE Tech Insight Series personalised promotional card renderer.

const CardRenderer = (() => {
  const COLORS = {
    bg: "#0B1740",
    white: "#F5F7FF",
    muted: "#9FB0DA",
    cyan: "#2FE4E4",
    line: "rgba(255,255,255,0.16)"
  };

  function formatDate(config) {
    if (config.eventDateDisplay) return config.eventDateDisplay.toUpperCase();
    const d = new Date((config.eventDate || "") + "T00:00:00");
    if (isNaN(d)) return config.eventDate || "";
    return d.toLocaleDateString("en-GB", {
      day: "numeric",
      month: "long",
      year: "numeric"
    }).toUpperCase();
  }

  function wrapText(ctx, text, maxWidth) {
    const words = text.split(" ");
    const lines = [];
    let line = "";
    for (const word of words) {
      const test = line ? line + " " + word : word;
      if (ctx.measureText(test).width > maxWidth && line) {
        lines.push(line);
        line = word;
      } else {
        line = test;
      }
    }
    if (line) lines.push(line);
    return lines;
  }

  function fitText(ctx, text, maxWidth, weight, baseSize, minSize) {
    let size = baseSize;
    let lines = [text];
    while (size >= minSize) {
      ctx.font = `${weight} ${size}px Poppins, sans-serif`;
      lines = wrapText(ctx, text, maxWidth);
      const widest = Math.max(...lines.map(l => ctx.measureText(l).width));
      if (widest <= maxWidth) break;
      size -= 2;
    }
    return { lines, size };
  }

  function centerText(ctx, text, cx, cy) {
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(text, cx, cy);
  }

  function roundedRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  let badgeImgPromise = null;
  function loadBadge(src) {
    if (!badgeImgPromise) {
      badgeImgPromise = new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = src;
      });
    }
    return badgeImgPromise;
  }

  async function render(canvas, config, participant, photoCanvas) {
    const w = config.cardWidth;
    canvas.width = w;
    canvas.height = 10;
    const ctx = canvas.getContext("2d");

    const badge = await loadBadge(config.badgeSrc);
    const badgeW = 400;
    const badgeH = badgeW * (badge.height / badge.width);

    const dividerY = 56 + badgeH + 36;
    const labelY = dividerY + 46;

    const themeFit = fitText(ctx, (config.eventTheme || "").toUpperCase(), 900, 700, 50, 32);
    const themeLines = themeFit.lines;
    const themeLineH = themeFit.size * 1.28;
    const themeTop = labelY + 60;
    const themeBottom = themeTop + (themeLines.length - 1) * themeLineH + themeLineH / 2;

    const metaY = themeBottom + 46;
    const photoCy = metaY + 210;
    const photoSize = 380;

    const nameFit = fitText(ctx, participant.name || "", 900, 700, 46, 28);
    const nameLines = nameFit.lines;
    const nameLineH = nameFit.size * 1.2;
    const nameTop = photoCy + photoSize / 2 + 70;
    const nameBottom = nameTop + (nameLines.length - 1) * nameLineH + nameLineH / 2;

    // Participant role/organisation are intentionally omitted from the
    // public-facing card. The participant's name is the only personal text.
    const qrSize = 160;
    const qrTop = nameBottom + 100;
    const qrLabelY = qrTop + qrSize + 46;
    const contentBottom = qrLabelY + 40;
    const footerHeight = 90;
    const h = Math.round(contentBottom + footerHeight);

    canvas.height = h;
    ctx.fillStyle = COLORS.bg;
    ctx.fillRect(0, 0, w, h);

    ctx.drawImage(badge, 64, 56, badgeW, badgeH);

    ctx.textAlign = "right";
    ctx.textBaseline = "top";
    ctx.font = "700 30px Poppins, sans-serif";
    const [codeWord, codeNum] = (config.eventCode || "").split(" ");
    ctx.fillStyle = COLORS.white;
    ctx.fillText(codeWord || "", w - 64, 56);
    ctx.fillStyle = COLORS.cyan;
    ctx.fillText(codeNum || "", w - 64, 96);

    ctx.strokeStyle = COLORS.line;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(64, dividerY);
    ctx.lineTo(w - 64, dividerY);
    ctx.stroke();

    ctx.font = "500 26px Poppins, sans-serif";
    ctx.fillStyle = COLORS.cyan;
    centerText(ctx, "I ' M   A T T E N D I N G", w / 2, labelY);

    ctx.font = `700 ${themeFit.size}px Poppins, sans-serif`;
    ctx.fillStyle = COLORS.white;
    themeLines.forEach((l, i) => centerText(ctx, l, w / 2, themeTop + i * themeLineH));

    ctx.font = "500 26px Poppins, sans-serif";
    ctx.fillStyle = COLORS.muted;
    const metaText = `${formatDate(config)}   ·   ${config.eventTimeDisplay || ""}`;
    centerText(ctx, metaText, w / 2, metaY);

    if (photoCanvas) {
      ctx.save();
      ctx.beginPath();
      ctx.arc(w / 2, photoCy, photoSize / 2, 0, Math.PI * 2);
      ctx.closePath();
      ctx.clip();
      ctx.drawImage(photoCanvas, w / 2 - photoSize / 2, photoCy - photoSize / 2, photoSize, photoSize);
      ctx.restore();

      ctx.beginPath();
      ctx.arc(w / 2, photoCy, photoSize / 2 + 3, 0, Math.PI * 2);
      ctx.lineWidth = 6;
      ctx.strokeStyle = COLORS.cyan;
      ctx.stroke();
    }

    ctx.font = `700 ${nameFit.size}px Poppins, sans-serif`;
    ctx.fillStyle = COLORS.white;
    nameLines.forEach((l, i) => centerText(ctx, l, w / 2, nameTop + i * nameLineH));

    if (window.QRious && config.registrationUrl) {
      const qrCanvas = document.createElement("canvas");
      new QRious({
        element: qrCanvas,
        value: config.registrationUrl,
        size: qrSize,
        background: COLORS.white,
        foreground: COLORS.bg,
        level: "M"
      });
      ctx.fillStyle = COLORS.white;
      roundedRect(ctx, w / 2 - qrSize / 2 - 14, qrTop - 14, qrSize + 28, qrSize + 28, 16);
      ctx.fill();
      ctx.drawImage(qrCanvas, w / 2 - qrSize / 2, qrTop, qrSize, qrSize);

      ctx.font = "500 22px Poppins, sans-serif";
      ctx.fillStyle = COLORS.muted;
      centerText(ctx, "SCAN TO REGISTER", w / 2, qrTop + qrSize + 46);
    }

    const footerTop = h - footerHeight;
    ctx.strokeStyle = COLORS.line;
    ctx.beginPath();
    ctx.moveTo(0, footerTop);
    ctx.lineTo(w, footerTop);
    ctx.stroke();

    ctx.font = "500 22px Poppins, sans-serif";
    ctx.fillStyle = COLORS.white;
    const footerY = footerTop + 45;
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.fillText(config.phone || "", 50, footerY);
    centerText(ctx, config.website || "", w / 2, footerY);
    ctx.textAlign = "right";
    ctx.fillText(config.email || "", w - 50, footerY);

    return canvas;
  }

  return { render };
})();
