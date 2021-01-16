// This script is loaded by speedscope in the iframe shown in the game area when the Profiler tab is visible
// It listens for messages passed via window.postMessage

function applyCSS(css: string): void {
  const style = document.createElement('style');
  style.innerHTML = css;
  document.head.appendChild(style);
}

function load(data: any): void {
  (window as any).speedscope.loadFileFromBase64('data.json', btoa(JSON.stringify(data)));
}

window.addEventListener('message', event => {
  const data = event.data;

  switch (data.type) {
    case 'apply-css':
      applyCSS(data.payload);
      break;
    case 'load':
      load(data.payload);
      break;
  }
});

// Make sure the "flamegraph" link on the homepage opens in a new tab instead of inside the iframe itself
document.addEventListener('click', event => {
  const target = event.target as HTMLElement;
  if (target.tagName === 'A'
    && target.getAttribute('href') === 'http://www.brendangregg.com/FlameGraphs/cpuflamegraphs.html') {
    window.open('http://www.brendangregg.com/FlameGraphs/cpuflamegraphs.html', '_blank');
    event.preventDefault();
  }
});
