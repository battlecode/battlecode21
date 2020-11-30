// This script is loaded by speedscope in the iframe shown in the game area when the Profiler tab is visible
// It listens for messages passed via window.postMessage

import { ProfilerFile } from 'battlecode-playback/out/match';

function applyCSS(css: string): void {
  const style = document.createElement('style');
  style.innerHTML = css;
  document.head.appendChild(style);
}

function load(file: ProfilerFile, robot: number): void {
  const frames = file.frames.map(frame => ({ name: frame }));
  const profiles = file.profiles.map(profile => ({
    type: 'evented',
    name: profile.name,
    unit: 'none',
    startValue: profile.events[0].at,
    endValue: profile.events[profile.events.length - 1].at,
    events: profile.events,
  }));

  const data = {
    $schema: 'https://www.speedscope.app/file-format-schema.json',
    activeProfileIndex: robot,
    shared: {
      frames,
    },
    profiles,
  };

  console.log(data);

  (window as any).speedscope.loadFileFromBase64('data.json', btoa(JSON.stringify(data)));
}

window.addEventListener('message', event => {
  const data = event.data;

  switch (data.type) {
    case 'apply-css':
      applyCSS(data.payload);
      break;
    case 'load':
      load(data.payload.file, data.payload.robot);
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
