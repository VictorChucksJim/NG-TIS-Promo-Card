// card-renderer.js
// Minimalist, functional card layout — plain text and flat colour blocks,
// no decorative gradients/pills. Verified against a PIL prototype before
// being ported here, to catch spacing/overlap issues before they ever
// reached the browser.
//
// Colours and the logo badge come from NICEGENE's own event graphics
// (Tech Insight Series ad creatives + certificate template): navy
// background, cyan accent, the official "NICEGENE / TECH INSIGHT SERIES"
// lockup.

const CardRenderer = (() => {

  const COLORS = {
    bg: "#0B1740",
    white: "#F5F7FF",
    muted: "#9FB0DA",
    cyan: "#2FE4E4",
    line: "rgba(255,255,255,0.16)"
  };

  function formatDate(iso) {
    const d = new Date(iso + "T00:00:00");
    if (isNaN(d)) return iso;
    return d.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" }).toUpperCase();
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

  /**
   * Wraps text to maxWidth at the given weight/base size, then shrinks the
   * font in 2px steps (down to minSize) if any single word is still too
   * wide to fit — e.g. a long unhyphenated name. Prevents both the theme
   * headline and the participant's name from ever running off the card,
   * regardless of length.
   */
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

  /**
   * @param {HTMLCanvasElement} canvas
   * @param {Object} config - event config (badgeSrc, eventCode, eventTheme,
   *   eventDate, eventTimeDisplay, registrationUrl, phone, website, email,
   *   cardWidth, cardHeight)
   * @param {Object} participant - { name, organisation, role }
   * @param {HTMLCanvasElement} photoCanvas - square cropped photo
   */
  async function render(canvas, config, participant, photoCanvas) {
    const w = config.cardWidth;

    // Card height adapts to content: a long event theme wraps to more
    // lines, so we measure everything first and size the canvas to fit,
    // rather than risk the footer overlapping a tall headline. Width is
    // fixed (keeps the card a consistent shareable shape); height flexes.
    canvas.width = w;
    canvas.height = 10; // temporary — just enough to get a 2D context for measuring
    const ctx = canvas.getContext("2d");

    // --- Logo badge, top-left (measured now, drawn later) ---
    const badge = await loadBadge(config.badgeSrc);
    const badgeW = 400;
    const badgeH = badgeW * (badge.height / badge.width);

    const dividerY = 56 + badgeH + 36;
    const labelY = dividerY + 46;

    // Theme headline: wraps, and shrinks first if any word is unusually long.
    const themeFit = fitText(ctx, (config.eventTheme || "").toUpperCase(), 900, 700, 50, 32);
    const themeLines = themeFit.lines;
    const themeLineH = themeFit.size * 1.28;
    const themeTop = labelY + 60;
    const themeBottom = themeTop + (themeLines.length - 1) * themeLineH + themeLineH / 2;

    const metaY = themeBottom + 46;
    const photoCy = metaY + 210;
    const photoSize = 380;

    // Name: wraps, and shrinks if a single long name would otherwise run
    // off the card (this was a real bug caught during testing).
    const nameFit = fitText(ctx, participant.name || "", 900, 700, 46, 28);
    const nameLines = nameFit.lines;
    const nameLineH = nameFit.size * 1.2;
    const nameTop = photoCy + photoSize / 2 + 70;
    const nameBottom = nameTop + (nameLines.length - 1) * nameLineH + nameLineH / 2;

    const roleOrgParts = [participant.role, participant.organisation].filter(Boolean);
    const roleY = roleOrgParts.length ? nameBottom + 40 : nameBottom;
    const qrSize = 160;
    const qrTop = roleY + 100;
    const qrLabelY = qrTop + qrSize + 46;
    const contentBottom = qrLabelY + 40;
    const footerHeight = 90;
    const h = Math.round(contentBottom + footerHeight);

    // Now that we know the real height, size the canvas and draw for real.
    canvas.height = h;

    ctx.fillStyle = COLORS.bg;
    ctx.fillRect(0, 0, w, h);

    ctx.drawImage(badge, 64, 56, badgeW, badgeH);

    // --- Event code tag, top-right (plain text, no pill) ---
    ctx.textAlign = "right";
    ctx.textBaseline = "top";
    ctx.font = "700 30px Poppins, sans-serif";
    const [codeWord, codeNum] = (config.eventCode || "").split(" ");
    ctx.fillStyle = COLORS.white;
    ctx.fillText(codeWord || "", w - 64, 56);
    ctx.fillStyle = COLORS.cyan;
    ctx.fillText(codeNum || "", w - 64, 96);

    // --- Divider ---
    ctx.strokeStyle = COLORS.line;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(64, dividerY);
    ctx.lineTo(w - 64, dividerY);
    ctx.stroke();

    // --- "I'M ATTENDING" label ---
    ctx.font = "500 26px Poppins, sans-serif";
    ctx.fillStyle = COLORS.cyan;
    centerText(ctx, "I ' M   A T T E N D I N G", w / 2, labelY);

    // --- Theme headline ---
    ctx.font = `700 ${themeFit.size}px Poppins, sans-serif`;
    ctx.fillStyle = COLORS.white;
    themeLines.forEach((l, i) => centerText(ctx, l, w / 2, themeTop + i * themeLineH));

    // --- Date / time, single line ---
    ctx.font = "500 26px Poppins, sans-serif";
    ctx.fillStyle = COLORS.muted;
    const metaText = `${formatDate(config.eventDate)}   \u00b7   ${config.eventTimeDisplay}`;
    centerText(ctx, metaText, w / 2, metaY);

    // --- Photo ---
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

    // --- Name / role ---
    ctx.font = `700 ${nameFit.size}px Poppins, sans-serif`;
    ctx.fillStyle = COLORS.white;
    nameLines.forEach((l, i) => centerText(ctx, l, w / 2, nameTop + i * nameLineH));

    if (roleOrgParts.length) {
      ctx.font = "400 28px Poppins, sans-serif";
      ctx.fillStyle = COLORS.muted;
      centerText(ctx, roleOrgParts.join(" \u00b7 "), w / 2, roleY);
    }

    // --- QR code ---
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

    // --- Footer contact line ---
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
