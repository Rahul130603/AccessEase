let stream=null,audio=null,meterTimer=null,recognizer=null,peak=0;
const output=document.querySelector('#log');
function log(text){output.textContent+=`\n${new Date().toLocaleTimeString()} ${text}`;}
async function stop(){
  clearInterval(meterTimer);meterTimer=null;
  stream?.getTracks().forEach(track=>track.stop());stream=null;
  if(audio){await audio.close();audio=null;}
  if(recognizer){recognizer.abort();recognizer=null;}
}
document.querySelector('#stop').onclick=()=>{stop();speechSynthesis.cancel();log('Stopped.');};
document.querySelector('#meter').onclick=async()=>{
  await stop();peak=0;output.textContent='Microphone signal test';
  try{
    stream=await navigator.mediaDevices.getUserMedia({audio:true});
    const track=stream.getAudioTracks()[0];document.querySelector('#device').textContent=`Input: ${track.label}; enabled=${track.enabled}; muted=${track.muted}; state=${track.readyState}`;
    const devices=await navigator.mediaDevices.enumerateDevices();log('Available microphones: '+devices.filter(d=>d.kind==='audioinput').map(d=>d.label).join(' | '));
    audio=new AudioContext();await audio.resume();const analyser=audio.createAnalyser();analyser.fftSize=2048;audio.createMediaStreamSource(stream).connect(analyser);const data=new Float32Array(analyser.fftSize);
    log('Mic opened. Say close settings or use Play test command.');
    meterTimer=setInterval(()=>{analyser.getFloatTimeDomainData(data);const rms=Math.sqrt(data.reduce((sum,n)=>sum+n*n,0)/data.length);peak=Math.max(peak,rms);document.querySelector('#level').value=Math.min(100,rms*500);document.querySelector('#signal').textContent=`Signal RMS: ${rms.toFixed(5)}; peak RMS: ${peak.toFixed(5)}; ${peak>0.005?'Sound detected':'No clear sound yet'}`;},200);
  }catch(error){log(`${error.name}: ${error.message}`);}
};
document.querySelector('#speech').onclick=async()=>{
  await stop();output.textContent='Native Chrome speech test (no widget callbacks)';
  log(navigator.userAgent);
  const API=window.SpeechRecognition||window.webkitSpeechRecognition;
  if(!API){log('No speech recognition API');return;}
  const session=new API();recognizer=session;session.continuous=true;session.interimResults=true;session.lang=document.querySelector('#lang').value;
  document.querySelector('#device').textContent=`Recognition language: ${session.lang}`;
  for(const name of ['start','audiostart','soundstart','speechstart','speechend','soundend','audioend','end','nomatch'])session.addEventListener(name,()=>log(name));
  session.onerror=event=>log(`ERROR: ${event.error} ${event.message||''}`);
  session.onresult=event=>{for(let i=event.resultIndex;i<event.results.length;i++)log(`${event.results[i].isFinal?'FINAL':'INTERIM'}: ${event.results[i][0].transcript}`);};
  try{
    stream=await navigator.mediaDevices.getUserMedia({audio:true});
    const devices=await navigator.mediaDevices.enumerateDevices();log('Inputs: '+devices.filter(d=>d.kind==='audioinput').map(d=>d.label).join(' | '));
    const physical=devices.find(d=>d.kind==='audioinput'&&!['default','communications'].includes(d.deviceId)&&!/virtual|hitpaw|cable|loopback|stereo mix/i.test(d.label));
    if(physical){stream.getTracks().forEach(t=>t.stop());stream=await navigator.mediaDevices.getUserMedia({audio:{deviceId:{exact:physical.deviceId}}});}
    const track=stream.getAudioTracks()[0];log('Using '+track.label+' '+track.readyState);
    session.start(track);log('Recognition requested with audio track.');
  }catch(error){log(`${error.name}: ${error.message}`);}
};
document.querySelector('#play').onclick=()=>{const utterance=new SpeechSynthesisUtterance('close settings');utterance.lang='en-US';utterance.rate=0.8;utterance.volume=1;speechSynthesis.speak(utterance);log('Playing synthetic close settings through the speakers.');};
window.addEventListener('pagehide',()=>{stream?.getTracks().forEach(track=>track.stop());recognizer?.abort();speechSynthesis.cancel();});
