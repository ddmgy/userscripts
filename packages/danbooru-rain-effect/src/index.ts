const DRE_CSS = `
.rain { position: absolute; overflow: hidden; left: 0; width: 100%; height: 100%; pointer-events: none; }
.rain.layer-1 { z-index: 4; opacity: 0.4; }
.rain.layer-2 { z-index: 3; opacity: 1; }
.rain.layer-3 { z-index: 2; opacity: 0.8; }
.rain.layer-4 { z-index: 1; opacity: 0.5; }
.drop { position: absolute; bottom: 100%; height: 200px; pointer-events: none; filter: blur(1px); animation: drop 1s linear infinite; }
@keyframes drop { 0% { transform: translateY(0vh); } 75% { transform: translateY(90vh); } 100% { transform: translateY(90vh); } }
.layer-1 .drop { width: 7px; }
.layer-2 .drop { width: 3px; }
.layer-3 .drop { width: 3px; }
.layer-4 .drop { width: 1px; }
.stem { width: 100%; height: 100%; background: linear-gradient(to bottom, rgba(255, 255, 255, 0), rgba(255, 255, 255, 0.25)); animation: stem 1s linear infinite; }
@keyframes stem { 0% { opacity: 1; } 65% { opacity: 1; } 75% { opacity: 0; } 100% { opacity: 0; } }
`;

function drop(left: number, bottom: number, anim: number): string {
  const delay = `${anim / 100}s`;
  const duration = `${0.2 + (anim / 100)}s`;
  return `<div class="drop" style="left: ${left}%; bottom: ${bottom}%; animation-delay: ${delay}; animation-duration: ${duration};"><div class="stem" style="animation-delay: ${delay}; animation-duration: ${duration};"></div></div>`;
}

function weightedRandom<T>(options: Array<{item: T, weight: number}>): T {
  var i: number;
  var weights = [options[0].weight];

  for (i = 1; i < options.length; i++) {
    weights[i] = options[i].weight + weights[i - 1];
  }

  const random = Math.random() * weights[weights.length - 1];

  for (i = 0; i < weights.length; i++) {
    if (weights[i] > random) {
      break;
    }
  }

  return options[i].item;
}

function rand(min: number, max: number): number {
  return (Math.floor(Math.random() * (max - min + 1) + min));
}

function initialize() {
  GM_addStyle(DRE_CSS);
  for (var i = 4; i > 0; i--) {
    $("section.image-container").prepend(`<div class="rain layer-${i}"></div>`);
  }

  var increment = 0;
  while (increment < 100) {
    const anim = rand(30, 55);
    const short = rand(2, 4);
    increment += short;
    const layer = weightedRandom([
      { item: 1, weight: 5 },
      { item: 2, weight: 40 },
      { item: 3, weight: 30 },
      { item: 4, weight: 25 },
    ]);
    $(`.layer-${layer}`).append(drop(layer % 2 == 0 ? increment : 100 - increment, 100 + short + short - 1, anim));
  }
}

$(initialize);
