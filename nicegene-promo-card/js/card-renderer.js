// card-renderer.js
// NICEGENE Tech Insight Series personalised promotional-card renderer.
// Fixed visual template; only participant name and photo are dynamic.

const CardRenderer = (() => {
  const C = {
    navy: "#061535", navy2: "#0A285B", blue: "#0870C8",
    cyan: "#36E6EA", gold: "#F5C65A", gold2: "#D99A24",
    white: "#F8FBFF", muted: "#AFC2E8"
  };

  function roundedRect(ctx,x,y,w,h,r){ctx.beginPath();ctx.moveTo(x+r,y);ctx.arcTo(x+w,y,x+w,y+h,r);ctx.arcTo(x+w,y+h,x,y+h,r);ctx.arcTo(x,y+h,x,y,r);ctx.arcTo(x,y,x+w,y,r);ctx.closePath();}
  function wrapText(ctx,text,maxWidth){const lines=[];let line="";for(const word of String(text||"").split(/\s+/)){const test=line?`${line} ${word}`:word;if(ctx.measureText(test).width>maxWidth&&line){lines.push(line);line=word;}else line=test;}if(line)lines.push(line);return lines;}
  function fitText(ctx,text,maxWidth,weight,base,min){let size=base,lines=[text];while(size>=min){ctx.font=`${weight} ${size}px Poppins, sans-serif`;lines=wrapText(ctx,text,maxWidth);if(Math.max(...lines.map(x=>ctx.measureText(x).width))<=maxWidth)break;size-=2;}return{lines,size};}
  function centerText(ctx,text,x,y){ctx.textAlign="center";ctx.textBaseline="middle";ctx.fillText(text,x,y);}
  function formatDate(config){return(config.eventDateDisplay||"10–11 OCTOBER 2026").toUpperCase();}

  let badgePromise=null;
  function loadBadge(src){if(!badgePromise)badgePromise=new Promise((resolve,reject)=>{const img=new Image();img.onload=()=>resolve(img);img.onerror=reject;img.src=src;});return badgePromise;}

  function drawBackground(ctx,w,h){
    const bg=ctx.createLinearGradient(0,0,w,h);bg.addColorStop(0,C.navy);bg.addColorStop(.48,C.navy2);bg.addColorStop(1,C.blue);ctx.fillStyle=bg;ctx.fillRect(0,0,w,h);
    const glow=ctx.createRadialGradient(w*.82,h*.24,10,w*.82,h*.24,560);glow.addColorStop(0,"rgba(54,230,234,.22)");glow.addColorStop(.55,"rgba(54,230,234,.06)");glow.addColorStop(1,"rgba(54,230,234,0)");ctx.fillStyle=glow;ctx.fillRect(0,0,w,h);
    ctx.save();ctx.globalAlpha=.045;ctx.strokeStyle=C.cyan;ctx.lineWidth=1;for(let x=-h;x<w+h;x+=52){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x+h*.34,h);ctx.stroke();}ctx.restore();
    ctx.save();ctx.globalAlpha=.09;ctx.strokeStyle=C.cyan;ctx.lineWidth=3;ctx.beginPath();ctx.arc(w*.5,h*.83,610,Math.PI*1.02,Math.PI*1.92);ctx.stroke();ctx.restore();
  }

  function drawFadedMarketScene(ctx){
    ctx.save();ctx.globalAlpha=.10;
    const buildings=[[770,560,72,560],[850,480,82,640],[940,370,64,750],[1015,500,55,620],[1070,300,48,820]];
    buildings.forEach(([x,y,bw,bh],i)=>{const g=ctx.createLinearGradient(x,y,x,y+bh);g.addColorStop(0,"#8EDCFF");g.addColorStop(1,"rgba(30,100,180,0)");ctx.fillStyle=g;ctx.fillRect(x,y,bw,bh);ctx.fillStyle="#DDF7FF";for(let wy=y+30;wy<y+bh-20;wy+=44)for(let wx=x+13;wx<x+bw-8;wx+=23)if((wx+wy+i)%3!==0)ctx.fillRect(wx,wy,6,10);});
    ctx.globalAlpha=.12;ctx.strokeStyle=C.gold;ctx.lineWidth=11;ctx.lineJoin="round";ctx.beginPath();ctx.moveTo(690,1220);ctx.lineTo(770,1150);ctx.lineTo(825,1175);ctx.lineTo(885,1040);ctx.lineTo(940,1070);ctx.lineTo(1030,900);ctx.stroke();ctx.beginPath();ctx.moveTo(1002,900);ctx.lineTo(1030,900);ctx.lineTo(1027,930);ctx.stroke();ctx.restore();
  }

  function drawRibbon(ctx,w,h){ctx.save();const g=ctx.createLinearGradient(0,h-470,390,h-220);g.addColorStop(0,C.cyan);g.addColorStop(.5,C.gold);g.addColorStop(1,"#FFE29A");ctx.globalAlpha=.60;ctx.fillStyle=g;ctx.beginPath();ctx.moveTo(0,h-470);ctx.lineTo(390,h-245);ctx.lineTo(0,h-330);ctx.closePath();ctx.fill();ctx.restore();}

  async function render(canvas,config,participant,photoCanvas){
    const w=Number(config.cardWidth)||1080,h=Number(config.cardHeight)||1536;canvas.width=w;canvas.height=h;const ctx=canvas.getContext("2d");
    drawBackground(ctx,w,h);drawFadedMarketScene(ctx);drawRibbon(ctx,w,h);

    // Draw the existing logo without the visible white source-edge border.
    const badge=await loadBadge(config.badgeSrc);const badgeW=335,badgeH=badgeW*(badge.height/badge.width),crop=4;ctx.drawImage(badge,crop,crop,badge.width-crop*2,badge.height-crop*2,68,54,badgeW,badgeH);

    roundedRect(ctx,860,54,145,145,22);ctx.fillStyle="rgba(5,22,53,.62)";ctx.fill();ctx.strokeStyle=C.gold;ctx.lineWidth=2;ctx.stroke();ctx.fillStyle=C.white;ctx.font="700 28px Poppins, sans-serif";centerText(ctx,"NTIS",932,91);ctx.fillStyle=C.cyan;ctx.font="700 43px Poppins, sans-serif";centerText(ctx,"002",932,138);ctx.fillStyle=C.gold;ctx.fillRect(905,171,55,5);
    ctx.fillStyle=C.white;ctx.font="400 25px Poppins, sans-serif";ctx.textAlign="right";ctx.textBaseline="top";["Ideas.","Insights.","Real-World","Impact."].forEach((t,i)=>ctx.fillText(t,1005,250+i*36));

    // Main event copy is centred, with controlled line spacing.
    const cx=w/2;ctx.fillStyle=C.cyan;ctx.font="600 27px Poppins, sans-serif";centerText(ctx,"I'M ATTENDING",cx,342);
    const raw=config.eventTheme||"Wealth Creation: Exploring the Capital Market for Sustainable Wealth",colon=raw.indexOf(":");
    const lead=colon>=0?raw.slice(0,colon+1).toUpperCase():raw.toUpperCase(),rest=colon>=0?raw.slice(colon+1).trim():"";
    const leadFit=fitText(ctx,lead,920,700,66,44);ctx.fillStyle=C.gold;ctx.font=`700 ${leadFit.size}px Poppins, sans-serif`;centerText(ctx,leadFit.lines[0],cx,405);
    const restFit=fitText(ctx,rest,900,600,48,32);ctx.fillStyle=C.white;ctx.font=`600 ${restFit.size}px Poppins, sans-serif`;restFit.lines.forEach((line,i)=>centerText(ctx,line,cx,478+i*restFit.size*1.16));

    // Left event details and right edition details balance the central composition.
    ctx.strokeStyle=C.gold;ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(82,645);ctx.lineTo(165,645);ctx.stroke();
    ctx.fillStyle=C.white;ctx.font="700 30px Poppins, sans-serif";ctx.textAlign="left";ctx.textBaseline="top";ctx.fillText(formatDate(config),82,680);ctx.fillStyle=C.cyan;ctx.font="600 31px Poppins, sans-serif";ctx.fillText(config.eventTimeDisplay||"8:00 PM",82,728);ctx.fillStyle=C.muted;ctx.font="400 22px Poppins, sans-serif";ctx.fillText("WAT",82,770);
    ctx.strokeStyle=C.gold;ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(830,645);ctx.lineTo(913,645);ctx.stroke();ctx.fillStyle=C.gold;ctx.font="700 22px Poppins, sans-serif";ctx.textAlign="center";ctx.fillText("SECOND EDITION",871,680);ctx.fillStyle=C.muted;ctx.font="400 19px Poppins, sans-serif";ctx.fillText("NICEGENE TECH INSIGHT SERIES",871,716);

    // Participant portrait and name are centered.
    const photoX=cx,photoY=850,photoSize=390;
    if(photoCanvas){ctx.save();ctx.beginPath();ctx.arc(photoX,photoY,photoSize/2,0,Math.PI*2);ctx.clip();ctx.drawImage(photoCanvas,photoX-photoSize/2,photoY-photoSize/2,photoSize,photoSize);ctx.restore();const ring=ctx.createLinearGradient(photoX-210,photoY-210,photoX+210,photoY+210);ring.addColorStop(0,C.cyan);ring.addColorStop(.5,C.white);ring.addColorStop(1,C.gold);ctx.beginPath();ctx.arc(photoX,photoY,photoSize/2+8,0,Math.PI*2);ctx.lineWidth=8;ctx.strokeStyle=ring;ctx.stroke();}
    const nameFit=fitText(ctx,participant.name||"",700,700,58,34);ctx.fillStyle=C.white;ctx.font=`700 ${nameFit.size}px Poppins, sans-serif`;nameFit.lines.forEach((line,i)=>centerText(ctx,line,photoX,1080+i*nameFit.size*1.08));

    // Side supporting messages sit outside the centered QR area.
    ctx.fillStyle=C.cyan;ctx.font="700 20px Poppins, sans-serif";ctx.textAlign="left";ctx.textBaseline="top";ctx.fillText("PRACTICAL INSIGHTS",66,1110);ctx.fillStyle=C.white;ctx.font="500 21px Poppins, sans-serif";["for smarter","investment","decisions."].forEach((t,i)=>ctx.fillText(t,66,1150+i*31));
    ctx.fillStyle=C.cyan;ctx.font="700 20px Poppins, sans-serif";ctx.textAlign="right";ctx.fillText("LEARN. CONNECT. GROW.",1014,1110);ctx.fillStyle=C.white;ctx.font="500 21px Poppins, sans-serif";ctx.fillText("Be part of the conversation.",1014,1150);

    // QR remains centered and unchanged as the registration destination.
    const qrSize=190,qrTop=1140,qrX=cx-qrSize/2;
    if(window.QRious&&config.registrationUrl){const qr=document.createElement("canvas");new QRious({element:qr,value:config.registrationUrl,size:qrSize,background:"#FFFFFF",foreground:C.navy,level:"M"});roundedRect(ctx,qrX-18,qrTop-18,qrSize+36,qrSize+36,20);ctx.fillStyle=C.white;ctx.fill();ctx.drawImage(qr,qrX,qrTop,qrSize,qrSize);}

    roundedRect(ctx,335,1360,410,72,36);const cta=ctx.createLinearGradient(335,1360,745,1432);cta.addColorStop(0,C.gold);cta.addColorStop(1,"#FFE39A");ctx.fillStyle=cta;ctx.fill();ctx.fillStyle=C.navy;ctx.font="700 34px Poppins, sans-serif";centerText(ctx,"REGISTER NOW",cx,1391);ctx.font="600 17px Poppins, sans-serif";centerText(ctx,"FOR NTIS 002",cx,1418);
    ctx.fillStyle=C.white;ctx.font="400 21px Poppins, sans-serif";centerText(ctx,"Scan the QR code to register",cx,1453);

    const footerTop=h-66;ctx.fillStyle="rgba(3,15,40,.90)";ctx.fillRect(0,footerTop,w,66);ctx.strokeStyle="rgba(54,230,234,.4)";ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(0,footerTop);ctx.lineTo(w,footerTop);ctx.stroke();ctx.fillStyle=C.white;ctx.font="500 18px Poppins, sans-serif";ctx.textBaseline="middle";ctx.textAlign="left";ctx.fillText(config.website||"www.nicegeneco.com.ng",40,footerTop+33);centerText(ctx,"LEARN  |  CONNECT  |  GROW",cx,footerTop+33);ctx.textAlign="right";ctx.fillText(config.email||"info@nicegeneco.com.ng",1040,footerTop+33);
    return canvas;
  }
  return {render};
})();
