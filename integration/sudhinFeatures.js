// Adapted from origin/Sudhin: applyLiveCaptions and applySimplifiedNav in
// dist/accessibility-widget.js. Shares the unified widget lifecycle instead of
// mounting Sudhin's separate launcher. Captions always come from real cue data.
export function createSudhinFeatures({host,root}) {
  const cleanup=[], videos=new Map(), tabStops=new Set();
  let observer, frame, style;
  const outside=node=>node instanceof Element&&!host.contains(node)&&!node.closest('[data-accessease-navigation]');
  function listen(node,event,handler){node.addEventListener(event,handler);cleanup.push(()=>node.removeEventListener(event,handler));}
  function attachVideo(video){
    if(videos.has(video)||!outside(video))return;
    const bar=document.createElement('div');bar.className='sudhin-live-caption';bar.hidden=true;
    bar.setAttribute('aria-label','Live video captions');root.append(bar);
    const modes=new Map(), fullscreenModes=new Map(), handlers=[];
    function trackMode(track){
      if(!['captions','subtitles'].includes(track.kind)||modes.has(track))return;
      modes.set(track,{before:track.mode,changed:track.mode==='disabled'});
      if(track.mode==='disabled')track.mode='hidden';
      track.addEventListener('cuechange',update);handlers.push(()=>track.removeEventListener('cuechange',update));
    }
    function update(){
      Array.from(video.textTracks||[]).forEach(trackMode);
      const fullscreenElement=document.fullscreenElement||document.webkitFullscreenElement;
      const fullscreen=fullscreenElement===video||fullscreenElement?.contains?.(video)||video.webkitDisplayingFullscreen;
      for(const track of modes.keys()){
        if(fullscreen){
          if(track.mode!=='showing'&&!fullscreenModes.has(track)){
            fullscreenModes.set(track,track.mode);
            track.mode='showing';
          }
        }else if(fullscreenModes.has(track)){
          if(track.mode==='showing')track.mode=fullscreenModes.get(track);
          fullscreenModes.delete(track);
        }
      }
      let text='';
      for(const track of modes.keys()){
        const cues=Array.from(track.activeCues||[]);
        if(cues.length){text=cues.map(cue=>cue.text||'').join(' ');break;}
      }
      if(!text&&video.dataset.captions){
        try{const cues=JSON.parse(video.dataset.captions);if(Array.isArray(cues))text=cues.filter(cue=>Number.isFinite(cue.start)&&Number.isFinite(cue.end)&&video.currentTime>=cue.start&&video.currentTime<cue.end).map(cue=>typeof cue.text==='string'?cue.text:'').join(' ');}catch{/* Invalid timed captions are not spoken content. */}
      }
      const rect=video.getBoundingClientRect();
      bar.hidden=fullscreen||video.paused||video.ended||!text||rect.bottom<0||rect.top>innerHeight||rect.width===0;
      if(bar.textContent!==text)bar.textContent=text;
      Object.assign(bar.style,{left:Math.max(8,rect.left+12)+'px',top:Math.max(8,Math.min(innerHeight-70,rect.bottom-85))+'px',maxWidth:Math.max(100,Math.min(rect.width-24,innerWidth-24))+'px'});
    }
    ['timeupdate','play','pause','ended','loadedmetadata'].forEach(event=>{video.addEventListener(event,update);handlers.push(()=>video.removeEventListener(event,update));});
    ['fullscreenchange','webkitfullscreenchange'].forEach(event=>{document.addEventListener(event,update);handlers.push(()=>document.removeEventListener(event,update));});
    ['webkitbeginfullscreen','webkitendfullscreen'].forEach(event=>{video.addEventListener(event,update);handlers.push(()=>video.removeEventListener(event,update));});
    video.textTracks?.addEventListener('addtrack',update);handlers.push(()=>video.textTracks?.removeEventListener('addtrack',update));
    const resize=()=>update();listen(window,'resize',resize);listen(window,'scroll',resize);
    videos.set(video,()=>{handlers.forEach(fn=>fn());fullscreenModes.forEach((before,track)=>{if(track.mode==='showing')track.mode=before;});modes.forEach(({before,changed},track)=>{if(changed&&track.mode==='hidden')track.mode=before;});bar.remove();});update();
  }
  function refreshNavigation(){
    document.querySelectorAll('main,[role="main"],main h1,main h2,[role="main"] h1,[role="main"] h2').forEach(node=>{
      if(!outside(node)||!node.getClientRects().length||node.hasAttribute('tabindex'))return;
      node.setAttribute('tabindex','0');node.classList.add('sudhin-tab-stop');tabStops.add(node);
    });
  }
  function apply(settings){
    style=document.createElement('style');style.textContent='.sudhin-live-caption{position:fixed;pointer-events:none;z-index:2147483646;padding:8px 12px;border-radius:5px;background:#111e;color:#fff;font:16px/1.5 Arial,sans-serif;white-space:pre-line}';root.append(style);
    if(settings.simplifiedNav){
      const pageStyle=document.createElement('style');pageStyle.textContent='.sudhin-tab-stop:focus-visible{outline:3px solid #2563eb;outline-offset:5px}';document.head.append(pageStyle);cleanup.push(()=>pageStyle.remove());
      refreshNavigation();
    }
    function scan(){
      if(settings.liveCaptions)document.querySelectorAll('video').forEach(attachVideo);
      for(const [video,dispose] of videos)if(!video.isConnected){dispose();videos.delete(video);}
      if(settings.simplifiedNav)refreshNavigation();
    }
    scan();
    observer=new MutationObserver(mutations=>{
      if(!mutations.some(change=>Array.from(change.addedNodes).some(outside)||Array.from(change.removedNodes).some(node=>node instanceof Element)))return;
      cancelAnimationFrame(frame);frame=requestAnimationFrame(scan);
    });observer.observe(document.body,{childList:true,subtree:true});
  }
  return {apply,destroy(){observer?.disconnect();cancelAnimationFrame(frame);cleanup.forEach(fn=>fn());videos.forEach(dispose=>dispose());tabStops.forEach(node=>{node.removeAttribute('tabindex');node.classList.remove('sudhin-tab-stop');});style?.remove();}};
}
