let parameters = {
  c_left: 0.6, c_right: 0.4, temp_c: 25,
  water_permeable: true, solute_permeable: false, reset: 0
};
let particles = [];
let waterShift = 0;
let previousReset = -1;
let lastSentFrame = 0;

const LEFT = { x: 50, w: 270 };
const RIGHT = { x: 440, w: 270 };
const TOP = 65, BOTTOM = 365, BASE_HEIGHT = 170;
const MAX_SHIFT = 70, PRESSURE_PER_PIXEL = 20;

function setup() {
  const canvas = createCanvas(760, 440);
  canvas.parent("osmosis-canvas");
  frameRate(30);
  resetSimulation();
}
function draw() {
  background(245, 248, 250);

  updateSimulation();
  updateParticles();

  drawChambers();
  drawConnectingChannel();
  drawParticles();
  drawMembrane();

  drawStatus();

  sendStateToShiny();
}
function resetSimulation() {
  waterShift = 0;
  createParticles();
}
function createParticles() {
  particles = [];
  const maxC = Math.max(parameters.c_left, parameters.c_right, 0.01);
  const count = 100;
  const nLeft = Math.round(count * parameters.c_left / maxC);
  const nRight = Math.round(count * parameters.c_right / maxC);
  for (let i = 0; i < nLeft; i++) particles.push(makeParticle("left"));
  for (let i = 0; i < nRight; i++) particles.push(makeParticle("right"));
}
function waterTop(side) {
  const h = side === "left" ? BASE_HEIGHT + waterShift : BASE_HEIGHT - waterShift;
  return BOTTOM - h;
}
function makeParticle(side) {
  const box = side === "left" ? LEFT : RIGHT, r = random(4, 6);
  return {
    side, r, x: random(box.x + 12, box.x + box.w - 12),
    y: random(waterTop(side) + r + 2, BOTTOM - r - 2),
    vx: random(-0.5, 0.5), vy: random(-0.5, 0.5)
  };
}
function getState() {
  const hLeft = BASE_HEIGHT + waterShift;
  const hRight = BASE_HEIGHT - waterShift;

  const totalParticles = particles.length;
  const leftParticles = particles.filter(p => p.side === "left").length;
  const rightParticles = particles.filter(p => p.side === "right").length;

  const totalConcentration = parameters.c_left + parameters.c_right;

  let cLeft;
  let cRight;

  if (totalParticles > 0) {
    cLeft =
      (leftParticles / totalParticles) *
      totalConcentration * BASE_HEIGHT / hLeft;

    cRight =
      (rightParticles / totalParticles) *
      totalConcentration * BASE_HEIGHT / hRight;
  } else {
    cLeft = parameters.c_left * BASE_HEIGHT / hLeft;
    cRight = parameters.c_right * BASE_HEIGHT / hRight;
  }

  const tempK = parameters.temp_c + 273.15;

  const psiSLeft = -8.314 * cLeft * tempK;
  const psiSRight = -8.314 * cRight * tempK;

  const pressureLeft = waterShift * PRESSURE_PER_PIXEL;
  const pressureRight = -waterShift * PRESSURE_PER_PIXEL;

  const psiLeft = psiSLeft + pressureLeft;
  const psiRight = psiSRight + pressureRight;

  return {
    hLeft, hRight,
    cLeft, cRight,
    psiSLeft, psiSRight,
    pressureLeft, pressureRight,
    psiLeft, psiRight,
    deltaPsi: psiLeft - psiRight
  };
}
function updateSimulation() {
  if (!parameters.water_permeable) return;

  const delta = getState().deltaPsi;

  if (Math.abs(delta) < 0.1) return;

  // Water stroomt van een hogere naar een lagere waterpotentiaal.
  waterShift -= constrain(delta * 0.00008, -0.15, 0.15);

  waterShift = constrain(waterShift, -MAX_SHIFT, MAX_SHIFT);
}
function updateParticles() {
  const targetSpeed = 0.6 + (parameters.temp_c / 50) * 3.0;

  for (const p of particles) {
    let angle = Math.atan2(p.vy, p.vx);
    angle += random(-0.12, 0.12);

    p.vx = Math.cos(angle) * targetSpeed;
    p.vy = Math.sin(angle) * targetSpeed;

    const oldX = p.x;

    p.x += p.vx;
    p.y += p.vy;

    const inChannelY =
      p.y > 255 + p.r &&
      p.y < 310 - p.r;

    // Als opgeloste stoffen niet permeabel zijn,
    // blijven de deeltjes in hun eigen compartiment.
    if (!parameters.solute_permeable) {
      const box = p.side === "left" ? LEFT : RIGHT;

      const minX = box.x + p.r + 3;
      const maxX = box.x + box.w - p.r - 3;

      if (p.x < minX) {
        p.x = minX;
        p.vx = Math.abs(p.vx);
      }

      if (p.x > maxX) {
        p.x = maxX;
        p.vx = -Math.abs(p.vx);
      }
    } else {
      // Deeltjes mogen alleen door de opening in het kanaal.
      if (p.side === "left" && p.x > 320 && !inChannelY) {
        p.x = 320;
        p.vx = -Math.abs(p.vx);
      }

      if (p.side === "right" && p.x < 440 && !inChannelY) {
        p.x = 440;
        p.vx = Math.abs(p.vx);
      }

      // In het kanaal blijven de deeltjes binnen de watergang.
      if (p.x >= 320 && p.x <= 440 && inChannelY) {
        p.y = constrain(p.y, 255 + p.r, 310 - p.r);

        // Pas de kant aan zodra het deeltje het membraan passeert.
        if (oldX < 380 && p.x >= 380) {
          p.side = "right";
        } else if (oldX >= 380 && p.x < 380) {
          p.side = "left";
        }
      }

      // Houd de deeltjes binnen de buitenwanden van de compartimenten.
      if (p.x < LEFT.x + p.r + 3) {
        p.x = LEFT.x + p.r + 3;
        p.vx = Math.abs(p.vx);
      }

      if (p.x > RIGHT.x + RIGHT.w - p.r - 3) {
        p.x = RIGHT.x + RIGHT.w - p.r - 3;
        p.vx = -Math.abs(p.vx);
      }
    }

    // Buiten het kanaal botsen de deeltjes tegen het wateroppervlak.
    const inChannel =
      parameters.solute_permeable &&
      p.x >= 320 && p.x <= 440 &&
      inChannelY;

    if (!inChannel) {
      const top = waterTop(p.side) + p.r + 2;

      if (p.y < top) {
        p.y = top;
        p.vy = Math.abs(p.vy);
      }
    }

    // Bodem van het compartiment
    if (p.y > BOTTOM - p.r - 2) {
      p.y = BOTTOM - p.r - 2;
      p.vy = -Math.abs(p.vy);
    }
  }
}
function drawChambers() {
  const s = getState();

  noStroke();
  fill(255);
  rect(LEFT.x, TOP, LEFT.w, BOTTOM - TOP, 8);
  rect(RIGHT.x, TOP, RIGHT.w, BOTTOM - TOP, 8);

  fill(190, 222, 239);
  rect(LEFT.x, BOTTOM - s.hLeft, LEFT.w, s.hLeft);
  rect(RIGHT.x, BOTTOM - s.hRight, RIGHT.w, s.hRight);

  noFill();
  stroke(100, 125, 140);
  strokeWeight(2);
  rect(LEFT.x, TOP, LEFT.w, BOTTOM - TOP, 8);
  rect(RIGHT.x, TOP, RIGHT.w, BOTTOM - TOP, 8);

  noStroke();
  fill(40, 55, 65);
  textAlign(CENTER);
  textSize(15);

  text("Compartiment A", 185, 45);
  text("Compartiment B", 575, 45);

  textSize(11);

  text(
    "Start: " + parameters.c_left.toFixed(2) +
    " | Nu: " + s.cLeft.toFixed(2) + " mol/L",
    185, 390
  );

  text(
    "Start: " + parameters.c_right.toFixed(2) +
    " | Nu: " + s.cRight.toFixed(2) + " mol/L",
    575, 390
  );
}
function drawConnectingChannel() {
  const yTop = 255;
  const yBottom = 310;

  // Het kanaal loopt bewust een stukje de compartimenten in.
  // Daardoor ontstaat één doorlopende waterverbinding.
  noStroke();
  fill(190, 222, 239);

  beginShape();
  vertex(300, yTop + 12);
  bezierVertex(300, yTop, 310, yTop, 325, yTop);
  vertex(435, yTop);
  bezierVertex(450, yTop, 460, yTop, 460, yTop + 12);
  vertex(460, yBottom - 12);
  bezierVertex(460, yBottom, 450, yBottom, 435, yBottom);
  vertex(325, yBottom);
  bezierVertex(310, yBottom, 300, yBottom, 300, yBottom - 12);
  endShape(CLOSE);


  // Bewegingspijlen in het water
  const delta = getState().deltaPsi;

  if (
    !parameters.water_permeable ||
    parameters.solute_permeable ||
    Math.abs(delta) < 0.5
    ) return;

  const direction = delta > 0 ? 1 : -1;
  const phase = (frameCount * 1.2) % 24;

  stroke(25, 100, 145);
  strokeWeight(2.5);

  for (let i = 0; i < 4; i++) {
    const px = 325 + i * 32 + direction * phase;

    if (px < 315 || px > 445) continue;

    line(
      px - direction * 5, 282,
      px + direction * 5, 282
    );

    line(
      px + direction * 5, 282,
      px, 277
    );

    line(
      px + direction * 5, 282,
      px, 287
    );
  }
}
function drawParticles() {
  noStroke(); fill(220, 133, 78);
  for (const p of particles) circle(p.x, p.y, p.r * 2);
}
function drawMembrane() {
  stroke(55, 100, 125);
  strokeWeight(6);

  // Membraan boven en onder het kanaal
  line(380, TOP, 380, 255);
  line(380, 313, 380, BOTTOM);

  // Membraan in het kanaal: onderbroken door poriën
  strokeWeight(4);

  for (let y = 263; y < 310; y += 10) {
    line(380, y, 380, y + 5);
  }

  noStroke();
  fill(50, 75, 90);
  textAlign(CENTER);
  textSize(11);
  text("Selectief membraan", 380, 420);
}

function drawStatus() {
  const s = getState();
  noStroke(); fill(248, 250, 251); rect(0, 0, width, 25);
  fill(45, 60, 70); textAlign(LEFT); textSize(12);
  let status;
  if (!parameters.water_permeable) status = "Water kan niet door het membraan";
  else if (parameters.solute_permeable) status = "Beide stoffen kunnen passeren";
  else if (Math.abs(s.deltaPsi) < 0.5) status = "Waterpotentialen vrijwel gelijk";
  else status = s.deltaPsi > 0 ? "Ψw A > Ψw B" : "Ψw B > Ψw A";
  text(status, 16, 17);
}
function sendStateToShiny() {
  if (!window.Shiny || frameCount - lastSentFrame < 6) return;
  lastSentFrame = frameCount;
  const s = getState();
  Shiny.setInputValue("live_state", {
    c_left: s.cLeft, c_right: s.cRight,
    psi_s_left: s.psiSLeft, psi_s_right: s.psiSRight,
    pressure_left: s.pressureLeft, pressure_right: s.pressureRight,
    psi_left: s.psiLeft, psi_right: s.psiRight,
    delta_psi: s.deltaPsi, water_shift: waterShift
  }, { priority: "event" });
}
if (window.Shiny) {
  Shiny.addCustomMessageHandler("osmosis_parameters", function(message) {
    const old = parameters;
    const changed = old.c_left !== message.c_left || old.c_right !== message.c_right ||
      old.temp_c !== message.temp_c || old.water_permeable !== message.water_permeable ||
      old.solute_permeable !== message.solute_permeable || old.reset !== message.reset;
    parameters = { ...parameters, ...message };
    if (changed) resetSimulation();
  });
}
