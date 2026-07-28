import "./styles.css";

import {
  decomposeFloat,
  errorCurve,
  fastInverseSqrt,
  toBinary,
  toHex,
} from "./math.js";

const $ = (selector, scope = document) => scope.querySelector(selector);
const $$ = (selector, scope = document) => [...scope.querySelectorAll(selector)];

const numberInput = $("#number-input");
const numberRange = $("#number-range");
const chart = $("#error-chart");
const curve = errorCurve();
let currentValue = 42;

function formatNumber(value, digits = 8) {
  if (Math.abs(value) >= 100000 || Math.abs(value) < 0.0001) {
    return value.toExponential(6);
  }
  return Number(value.toPrecision(digits)).toString();
}

function bitMarkup(binary) {
  return [...binary]
    .map((bit, index) => {
      const type = index === 0 ? "sign" : index < 9 ? "exponent" : "mantissa";
      return `<span class="bit ${type}">${bit}</span>`;
    })
    .join("");
}

function updateLab(value, source = "input") {
  const safeValue = Math.min(1_000_000, Math.max(0.000001, Number(value) || 1));
  const result = fastInverseSqrt(safeValue);
  const parts = decomposeFloat(result.number);
  currentValue = result.number;

  if (source !== "number") numberInput.value = formatNumber(result.number, 7);
  if (source !== "range") numberRange.value = Math.log10(result.number);

  $("#true-result").textContent = formatNumber(result.truth);
  $("#initial-result").textContent = formatNumber(result.initial);
  $("#refined-result").textContent = formatNumber(result.refined);
  $("#initial-error").textContent = `${(result.initialError * 100).toFixed(4)}% ERROR`;
  $("#refined-error").textContent = `${(result.refinedError * 100).toFixed(5)}% ERROR`;

  $("#input-hex").textContent = toHex(result.inputBits);
  $("#magic-hex").textContent = toHex(result.magicBits);
  $("#input-bits").innerHTML = bitMarkup(toBinary(result.inputBits));
  $("#magic-bits").innerHTML = bitMarkup(toBinary(result.magicBits));
  $("#input-sign").textContent = parts.sign;
  $("#input-exponent").textContent =
    `${parts.exponentRaw} (${parts.exponentUnbiased >= 0 ? "+" : ""}${parts.exponentUnbiased})`;
  $("#input-mantissa").textContent =
    `0x${(result.inputBits & 0x7fffff).toString(16).padStart(6, "0")}`;

  $$(".presets button").forEach((button) => {
    button.classList.toggle(
      "active",
      Math.abs(Number(button.dataset.value) - result.number) < Number.EPSILON,
    );
  });

  drawChart();
}

function drawChart() {
  const context = chart.getContext("2d");
  const rect = chart.getBoundingClientRect();
  const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
  chart.width = Math.max(1, Math.round(rect.width * pixelRatio));
  chart.height = Math.max(1, Math.round(rect.height * pixelRatio));
  context.scale(pixelRatio, pixelRatio);

  const width = rect.width;
  const height = rect.height;
  const padding = { top: 24, right: 18, bottom: 30, left: 44 };
  const plotWidth = width - padding.left - padding.right;
  const plotHeight = height - padding.top - padding.bottom;
  const minLogError = -7;
  const maxLogError = -1;
  const x = (exponent) => padding.left + ((exponent + 6) / 12) * plotWidth;
  const y = (error) => {
    const logError = Math.max(minLogError, Math.log10(Math.max(error, 1e-7)));
    return padding.top + ((maxLogError - logError) / (maxLogError - minLogError)) * plotHeight;
  };

  context.clearRect(0, 0, width, height);
  context.font = "10px ui-monospace, SFMono-Regular, Consolas, monospace";
  context.textAlign = "right";
  context.fillStyle = "rgba(232, 232, 223, .42)";
  context.strokeStyle = "rgba(232, 232, 223, .11)";
  context.lineWidth = 1;

  for (let exponent = -1; exponent >= -7; exponent -= 2) {
    const yPos = y(10 ** exponent);
    context.beginPath();
    context.moveTo(padding.left, yPos);
    context.lineTo(width - padding.right, yPos);
    context.stroke();
    context.fillText(`10^${exponent}`, padding.left - 8, yPos + 3);
  }

  context.textAlign = "center";
  for (const exponent of [-6, -3, 0, 3, 6]) {
    const xPos = x(exponent);
    context.beginPath();
    context.moveTo(xPos, padding.top);
    context.lineTo(xPos, height - padding.bottom);
    context.stroke();
    context.fillText(`10^${exponent}`, xPos, height - 9);
  }

  function plot(key, color, lineWidth) {
    context.beginPath();
    curve.forEach((point, index) => {
      const xPos = x(point.exponent);
      const yPos = y(point[key]);
      if (index === 0) context.moveTo(xPos, yPos);
      else context.lineTo(xPos, yPos);
    });
    context.strokeStyle = color;
    context.lineWidth = lineWidth;
    context.stroke();
  }

  plot("initialError", "#ff6b35", 1.5);
  plot("refinedError", "#e4ff57", 2);

  const currentExponent = Math.log10(currentValue);
  const markerX = x(currentExponent);
  context.beginPath();
  context.moveTo(markerX, padding.top);
  context.lineTo(markerX, height - padding.bottom);
  context.strokeStyle = "rgba(255,255,255,.72)";
  context.setLineDash([4, 5]);
  context.stroke();
  context.setLineDash([]);

  const current = fastInverseSqrt(currentValue);
  for (const [error, color] of [
    [current.initialError, "#ff6b35"],
    [current.refinedError, "#e4ff57"],
  ]) {
    context.beginPath();
    context.arc(markerX, y(error), 4, 0, Math.PI * 2);
    context.fillStyle = color;
    context.fill();
    context.strokeStyle = "#08090b";
    context.lineWidth = 2;
    context.stroke();
  }
}

numberInput.addEventListener("input", () => updateLab(numberInput.value, "number"));
numberRange.addEventListener("input", () => {
  updateLab(10 ** Number(numberRange.value), "range");
});

$$(".presets button").forEach((button) => {
  button.addEventListener("click", () => updateLab(Number(button.dataset.value)));
});

const stageContent = {
  bits: {
    label: "MOVE 01 · BIT REINTERPRETATION",
    className: "bit-sculpture",
    markup:
      '<span class="bit-sign">0</span><span class="bit-exponent">01111111</span><span class="bit-mantissa">00000000000000000000000</span>',
  },
  magic: {
    label: "MOVE 02 · INTEGER APPROXIMATION",
    className: "equation-sculpture",
    markup:
      '<span>5f3759df</span><i>−</i><span>( bits » 1 )</span><b>≈</b><span>−½ log₂(x)</span>',
  },
  guess: {
    label: "MOVE 03 · BACK TO FLOAT",
    className: "guess-sculpture",
    markup:
      '<span class="ghost-number">0.153</span><span class="target-number">1 / √x</span><i></i>',
  },
  newton: {
    label: "MOVE 04 · NEWTON–RAPHSON",
    className: "newton-sculpture",
    markup:
      '<span>y</span><i>←</i><span>y ( 1.5 − 0.5xy² )</span><b>✓</b>',
  },
};

function setStoryStage(stage) {
  const content = stageContent[stage];
  const visual = $("#story-display-visual");

  $$(".story-step").forEach((button) => {
    button.classList.toggle("active", button.dataset.stage === stage);
  });
  $$("[data-code-stage]").forEach((line) => {
    line.classList.toggle("active", line.dataset.codeStage === stage);
  });

  $("#story-display-label").textContent = content.label;
  visual.className = content.className;
  visual.innerHTML = content.markup;
}

$$(".story-step").forEach((button) => {
  button.addEventListener("click", () => setStoryStage(button.dataset.stage));
});

$("#copy-code").addEventListener("click", async (event) => {
  const code = $(".code-vault code").innerText;
  await navigator.clipboard.writeText(code);
  event.currentTarget.textContent = "Copied";
  window.setTimeout(() => {
    event.currentTarget.textContent = "Copy";
  }, 1400);
});

const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) entry.target.classList.add("visible");
    });
  },
  { threshold: 0.12 },
);

$$(".reveal").forEach((element) => observer.observe(element));

window.addEventListener(
  "scroll",
  () => {
    const scrollable = document.documentElement.scrollHeight - window.innerHeight;
    const ratio = scrollable > 0 ? window.scrollY / scrollable : 0;
    $(".page-progress span").style.transform = `scaleX(${ratio})`;
    $(".site-header").classList.toggle("scrolled", window.scrollY > 48);
  },
  { passive: true },
);

const chartResizeObserver = new ResizeObserver(drawChart);
chartResizeObserver.observe(chart);

setStoryStage("bits");
updateLab(42);
