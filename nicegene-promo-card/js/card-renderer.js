// card-renderer.js
// Production NICEGENE TIS promotional-card renderer.
// The visual template is fixed; only participant name and photo change.
// Decorative capital-market imagery is drawn in-canvas, so the app remains
// self-contained and generates the finished artwork automatically.

const CardRenderer = (() => {
  const COLORS = {
    navy: "#061535",
    navy2: "#0A285B",
    blue: "#0D5FC2",
    cyan: "#36E6EA",
    gold: "#F5C65A",
    gold2: "#D99A24",
    white: "#F8FBFF",
    muted: "#AFC2E8",
    line: "rgba(255,255,255,0.16)"
  };

  function roundedRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  function wrapText(ctx, text, maxWidth) {
    const words = text.split(/\s+/);
    const lines = [];
    let line = "";
    for (const word of words) {
      const test = line ? `${line} ${word}` : word;
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

  function centerText(ctx, text, x, y) {
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(text, x, y);
  }

  function formatDate(config) {
    if (config.eventDateDisplay) return config.eventDateDisplay.toUpperCase();
    const d = new Date(`${config.eventDate || ""}T00:00:00`);
    if (isNaN(d)) return config.eventDate || "";
    return d.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" }).toUpperCase();
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

  function drawBackground(ctx, w, h) {
    const bg = ctx.createLinearGradient(0, 0, w, h);
    bg.addColorStop(0, COLORS.navy);
    bg.addColorStop(0.48, COLORS.navy2);
    bg.addColorStop(1, "#0870C8");
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, w, h);

    const glow = ctx.createRadialGradient(w * 0.88, h * 0.22, 20, w * 0.88, h * 0.22, 520);
    glow.addColorStop(0, "rgba(54,230,234,0.34)");
    glow.addColorStop(0.55, "rgba(54,230,234,0.08)");
    glow.addColorStop(1, "rgba(54,230,234,0)");
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, w, h);

    ctx.save();
    ctx.globalAlpha = 0.07;
    ctx.strokeStyle = COLORS.cyan;
    ctx.lineWidth = 1;
    for (let x = -h; x < w + h; x += 46) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x + h * 0.34, h);
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawMarketScene(ctx) {
    ctx.save();
    ctx.globalAlpha = 0.26;

    const buildings = [
      [690, 570, 82, 610], [780, 500, 70, 680], [858, 390, 88, 790],
      [956, 455, 64, 725], [1026, 330, 54, 850]
    ];
    buildings.forEach(([x, y, bw, bh], i) => {
      const g = ctx.createLinearGradient(x, y, x, y + bh);
      g.addColorStop(0, "rgba(120,205,255,0.9)");
      g.addColorStop(1, "rgba(20,75,150,0.08)");
      ctx.fillStyle = g;
      ctx.fillRect(x, y, bw, bh);
      ctx.fillStyle = "rgba(220,245,255,0.34)";
      for (let wy = y + 28; wy < y + bh - 15; wy += 42) {
        for (let wx = x + 14; wx < x + bw - 10; wx += 24) {
          if ((wx + wy + i) % 3 !== 0) ctx.fillRect(wx, wy, 7, 12);
        }
      }
    });

    const bars = [70, 110, 155, 205, 260, 330];
    const baseY = 1220;
    bars.forEach((bar, i) => {
      const x = 690 + i * 48;
      const y = baseY - bar;
      const grad = ctx.createLinearGradient(0, y, 0, baseY);
      grad.addColorStop(0, "rgba(54,230,234,0.8)");
      grad.addColorStop(1, "rgba(54,230,234,0.08)");
      ctx.fillStyle = grad;
      ctx.fillRect(x, y, 30, bar);
    });

    ctx.strokeStyle = "rgba(245,198,90,0.95)";
    ctx.lineWidth = 13;
    ctx.lineJoin = "round";
    ctx.beginPath();
    ctx.moveTo(680, 1200);
    ctx.lineTo(760, 1130);
    ctx.lineTo(815, 1160);
    ctx.lineTo(880, 1010);
    ctx.lineTo(935, 1045);
    ctx.lineTo(1030, 875);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(1000, 875);
    ctx.lineTo(1030, 875);
    ctx.lineTo(1028, 907);
    ctx.stroke();

    for (let i = 0; i < 4; i++) {
      const y = 1190 - i * 24;
      ctx.fillStyle = i % 2 ? COLORS.gold2 : COLORS.gold;
      ctx.beginPath();
      ctx.ellipse(935, y, 64, 19, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "rgba(255,245,190,0.55)";
      ctx.lineWidth = 2;
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawRibbon(ctx, w, h) {
    ctx.save();
    const g = ctx.createLinearGradient(0, 0, w, 0);
    g.addColorStop(0, COLORS.gold2);
    g.addColorStop(0.5, COLORS.gold);
    g.addColorStop(1, "#FFE29A");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(0, h - 440);
    ctx.lineTo(430, h - 185);
    ctx.lineTo(0, h - 285);
    ctx.closePath();
    ctx.fill();

    ctx.globalAlpha = 0.55;
    ctx.fillStyle = COLORS.cyan;
    ctx.beginPath();
    ctx.moveTo(0, h - 470);
    ctx.lineTo(385, h - 245);
    ctx.lineTo(0, h - 355);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  async function render(canvas, config, participant, photoCanvas) {
    const w = Number(config.cardWidth) || 1080;
    const h = Number(config.cardHeight) || 1536;
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");

    drawBackground(ctx, w, h);
    drawMarketScene(ctx);
    drawRibbon(ctx, w, h);

    const badge = await loadBadge(config.badgeSrc);
    const badgeW = 335;
    const badgeH = badgeW * (badge.height / badge.width);
    ctx.drawImage(badge, 68, 54, badgeW, badgeH);

    roundedRect(ctx, 860, 54, 145, 145, 22);
    ctx.fillStyle = "rgba(5,22,53,0.64)";
    ctx.fill();
    ctx.strokeStyle = COLORS.gold;
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = COLORS.white;
    ctx.font = "700 28px Poppins, sans-serif";
    centerText(ctx, "NTIS", 932, 91);
    ctx.fillStyle = COLORS.cyan;
    ctx.font = "700 43px Poppins, sans-serif";
    centerText(ctx, "002", 932, 138);
    ctx.fillStyle = COLORS.gold;
    ctx.fillRect(905, 171, 55, 5);

    ctx.fillStyle = COLORS.white;
    ctx.font = "400 25px Poppins, sans-serif";
    ctx.textAlign = "right";
    ctx.textBaseline = "top";
    ["Ideas.", "Insights.", "Real-World", "Impact."].forEach((t, i) => {
      ctx.fillText(t, 1005, 250 + i * 36);
    });

    ctx.fillStyle = COLORS.cyan;
    ctx.font = "600 27px Poppins, sans-serif";
    ctx.textAlign = "left";
    ctx.fillText("I'M ATTENDING", 82, 360);

    const rawTheme = config.eventTheme || "";
    const colon = rawTheme.indexOf(":");
    const lead = colon >= 0 ? rawTheme.slice(0, colon + 1).toUpperCase() : rawTheme.toUpperCase();
    const rest = colon >= 0 ? rawTheme.slice(colon + 1).trim() : "";

    ctx.fillStyle = COLORS.gold;
    const leadFit = fitText(ctx, lead, 900, 700, 70, 46);
    ctx.font = `700 ${leadFit.size}px Poppins, sans-serif`;
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    ctx.fillText(leadFit.lines[0], 80, 410);

    ctx.fillStyle = COLORS.white;
    const restFit = fitText(ctx, rest, 880, 600, 50, 34);
    ctx.font = `600 ${restFit.size}px Poppins, sans-serif`;
    restFit.lines.forEach((line, i) => ctx.fillText(line, 82, 500 + i * (restFit.size * 1.18)));

    const detailsY = 650;
    ctx.strokeStyle = COLORS.gold;
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(82, detailsY);
    ctx.lineTo(165, detailsY);
    ctx.stroke();

    ctx.fillStyle = COLORS.white;
    ctx.font = "700 31px Poppins, sans-serif";
    ctx.fillText(formatDate(config), 82, detailsY + 35);
    ctx.fillStyle = COLORS.cyan;
    ctx.font = "600 31px Poppins, sans-serif";
    ctx.fillText(config.eventTimeDisplay || "8:00 PM", 82, detailsY + 83);
    ctx.fillStyle = COLORS.muted;
    ctx.font = "400 23px Poppins, sans-serif";
    ctx.fillText("WAT", 82, detailsY + 123);

    const photoX = 625;
    const photoY = 805;
    const photoSize = 390;
    if (photoCanvas) {
      ctx.save();
      ctx.beginPath();
      ctx.arc(photoX, photoY, photoSize / 2, 0, Math.PI * 2);
      ctx.clip();
      ctx.drawImage(photoCanvas, photoX - photoSize / 2, photoY - photoSize / 2, photoSize, photoSize);
      ctx.restore();

      const ring = ctx.createLinearGradient(photoX - 200, photoY - 200, photoX + 200, photoY + 200);
      ring.addColorStop(0, COLORS.cyan);
      ring.addColorStop(0.5, COLORS.white);
      ring.addColorStop(1, COLORS.gold);
      ctx.beginPath();
      ctx.arc(photoX, photoY, photoSize / 2 + 8, 0, Math.PI * 2);
      ctx.lineWidth = 8;
      ctx.strokeStyle = ring;
      ctx.stroke();
    }

    const nameFit = fitText(ctx, participant.name || "", 620, 700, 58, 36);
    ctx.fillStyle = COLORS.white;
    ctx.font = `700 ${nameFit.size}px Poppins, sans-serif`;
    nameFit.lines.forEach((line, i) => centerText(ctx, line, photoX, 1040 + i * nameFit.size * 1.12));

    const qrSize = 190;
    const qrTop = 1140;
    const qrX = 118;
    if (window.QRious && config.registrationUrl) {
      const qrCanvas = document.createElement("canvas");
      new QRious({
        element: qrCanvas,
        value: config.registrationUrl,
        size: qrSize,
        background: "#FFFFFF",
        foreground: COLORS.navy,
        level: "M"
      });
      roundedRect(ctx, qrX - 18, qrTop - 18, qrSize + 36, qrSize + 36, 20);
      ctx.fillStyle = COLORS.white;
      ctx.fill();
      ctx.drawImage(qrCanvas, qrX, qrTop, qrSize, qrSize);
    }

    // Prominent, clean CTA replacing the handwritten treatment.
    ctx.fillStyle = COLORS.gold;
    ctx.font = "700 43px Poppins, sans-serif";
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    ctx.fillText("REGISTER", 370, 1165);
    ctx.fillStyle = COLORS.white;
    ctx.font = "600 30px Poppins, sans-serif";
    ctx.fillText("FOR NTIS 002", 370, 1218);
    ctx.fillStyle = COLORS.muted;
    ctx.font = "400 23px Poppins, sans-serif";
    ctx.fillText("Scan the QR code to register", 370, 1270);

    ctx.fillStyle = "rgba(248,251,255,0.72)";
    ctx.font = "500 19px Poppins, sans-serif";
    ctx.textAlign = "right";
    ["CAPITAL MARKETS", "INVESTMENT", "INNOVATION", "SUSTAINABILITY"].forEach((t, i) => {
      ctx.fillText(t, 1000, 1110 + i * 32);
    });

    const footerTop = h - 82;
    ctx.fillStyle = "rgba(3,15,40,0.88)";
    ctx.fillRect(0, footerTop, w, 82);
    ctx.strokeStyle = "rgba(54,230,234,0.35)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, footerTop);
    ctx.lineTo(w, footerTop);
    ctx.stroke();

    ctx.fillStyle = COLORS.white;
    ctx.font = "500 19px Poppins, sans-serif";
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.fillText(config.website || "www.nicegeneco.com.ng", 42, footerTop + 41);
    centerText(ctx, "LEARN  |  CONNECT  |  GROW", w / 2, footerTop + 41);
    ctx.fillStyle = COLORS.white;
    ctx.textAlign = "right";
    ctx.fillText(config.email || "info@nicegeneco.com.ng", w - 42, footerTop + 41);

    return canvas;
  }

  return { render };
})();
