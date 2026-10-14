(() => {
  'use strict';
  const groups=[
    ['reading','Reading & appearance',[
      ['Text Size','Increase and decrease the size. Compare the heading, story, bold text and form labels. Reset should restore the original size.'],
      ['High Contrast Mode','Enable this theme. Compare text and backgrounds in the story and color sample.'],
      ['Dark Mode','Enable the dark theme. The page changes while the settings panel remains readable.'],
      ['Light Mode','Enable the light theme, then compare with Dark Mode and Default.'],
      ['Grayscale Mode','Turn it on. Ocean, Forest, Berry, images and video should lose their color.'],
      ['Color Blindness Support','Choose each palette. Compare the labels and color sample; images and video retain their original colors.'],
      ['Text Spacing','Try Comfortable, Wide and Custom. Watch letter spacing, word gaps, line height and paragraph gaps.'],
      ['Text Magnifier','Enable it, close the panel and move over the story. Compare the enlarged text and try the zoom levels.'],
      ['Highlight Links','Turn it on. Compare Reading, Watch, Write and the links inside the story.'],
      ['Dyslexia-Friendly Font','Enable it. Compare letter shapes in the story, headings and bold text.'],
      ['Reading Guide','Enable it and move over the story. A horizontal guide follows your reading position. Try its height control.'],
      ['Reading Mask','Enable it and move over the story. A clear reading band remains between shaded areas. Try its size and dismiss controls.'],
      ['Text-to-Speech','Highlight a story sentence and enable speech. Only your selection should be read. Browser speech support is required.'],
      ['Adjustable Reading Speed','Select slower or faster speed, then highlight and read the same sentence again.'],
      ['Text Alignment','Choose Left, Center, Right or Justify. Compare headings, paragraphs, bold text, labels and buttons. Original restores alignment.'],
      ['Simplified Text Mode','Enable it. Check clearer wording in headings, paragraphs, links, labels and the footer across the page. Formatting and controls stay usable. Turn off to restore the original words.'],
      ['Paragraph Highlighting','Turn it on and hover over one story paragraph. Only the paragraph under the pointer is highlighted.']]],
    ['keyboard','Keyboard & navigation',[
      ['Keyboard Navigation','Enable it. Use Tab and arrow keys across page text and controls. Image artwork is skipped. Use native keys and Tab in fields, selects and video.'],
      ['Visible Keyboard Focus','Turn it on and press Tab repeatedly. The currently focused item gets a stronger outline; every section does not get outlined together.'],
      ['Skip to Main Content','Enable it, close the panel and return to the start of keyboard order. Focus the skip link and activate it: focus moves past the header to main.'],
      ['Large Click Targets','Compare the compact Watch, Write and Save bookmark targets with this setting off/on. The clickable area grows.'],
      ['Voice Commands','Allow the microphone and wait for ready. Say “scroll down”, “scroll up”, “click Save bookmark”, or “open settings”. Recognition depends on the browser service.'],
      ['Switch Device Support','Enable it. Space steps through controls and Enter activates them. Text fields, selects and media keep native keys; use Tab to leave them.'],
      ['Sticky Keys Compatibility','Enable it and close the panel. Press Ctrl, release, Alt, release, then A. The accessibility panel opens. This does not turn on OS Sticky Keys.'],
      ['Simplify Navigation','Enable it and close the panel. Use Tab to move through the main content and section headings. Turn it off to restore the original tab order.']]],
    ['media','Media & notifications',[
      ['Closed Captions','Turn on CC, close the panel and play all three clips. Compare captions for speech, silence and mixed sections. Turn CC off to hide them.'],
      ['Live Captions','Enable it and play a clip. Available timed captions appear over the video. Videos without caption data do not gain automatic speech transcription.'],
      ['Audio Transcripts','Enable it. Supplied tracks from the three clips become readable transcript text inside the setting. Missing transcripts are not invented.'],
      ['Visual Notifications','Enable it. Click Save sample notes in Forms. A visible non-flashing toast accompanies the page status update.']]],
    ['tools','Reading tools & time',[
      ['Content Summary','Enable it. Read the extracted sentences and compare them with the page paragraphs. No new facts should appear.'],
      ['Reading Progress','Enable it, close the panel and scroll from the top to the footer. The progress indicator increases toward 100%.'],
      ['Distraction-Free Mode','Turn it on and compare the Optional Sidebar in Reading. That sidebar disappears while the story remains.'],
      ['Step-by-Step Guide','Enable it. Use Previous/Next in the floating guide to move between this page’s headings.'],
      ['Extend Session Time','Request 5 more minutes here to start or extend the timer in Motion & Time. The local countdown increases; no real server session is changed.']]],
    ['motion','Motion & sensory controls',[
      ['Reduce Motion','Start the motion examples, then enable Reduce Motion. Repeated movement stops and transitions finish immediately.'],
      ['Pause Animations','Start the motion examples, then enable Pause Animations to hold them at the current frame.'],
      ['Stop Auto-Playing Media','Start the muted autoplay sample, then enable this setting to pause it.'],
      ['Flashing Content Protection','Start the blinking button in Motion & Time. Enable Flashing Content Protection to pause it; turn protection off to resume.'],
      ['Brightness, contrast and saturation','Enable visual adjustments. Move each slider and compare the color sample. The panel remains readable. Reset restores the filters.']]],
    ['audit','Page audits & announcements',[
      ['Screen reader compatibility','Run the page scan. Expand the incomplete audit samples first to include known missing-alt and missing-label findings. Compare scan results after closing the samples.'],
      ['Image alternative text','Find the hiker and dog photo in Structure & Image Audits. Turn Image alternative text on to show its description; turn it off to hide it.'],
      ['Accessible form labels','Compare the labeled sign-in and comment fields with the opt-in placeholder-only audit sample. The scan should flag the unnamed control.'],
      ['Accessible headings and landmarks','Inspect the heading outline and main/navigation landmarks. Use an outline item to move to its page heading.'],
      ['Screen reader status announcements','Change the verbosity, then click Save sample notes. Compare the announcement log and listen with a screen reader.']]],
    ['forms','Forms & interaction',[
      ['Accessible error messages','Submit the sample sign-in empty. Corrective error text is associated with each field and focus moves to the first invalid field. Fill sample values and submit again.'],
      ['Show and hide password','Type a sample password. Toggle Show/Hide on the field; the value stays intact. Change the toolbar password-toggle preference and compare the field.'],
      ['Accessible authentication','Use the sample sign-in with paste or password-manager-style entry. Try its alternative sign-in link and recovery buttons. They show a demo result and send nothing.'],
      ['Confirmation before important actions','Click Delete sample report. Try Keep report, Tab and Escape. Confirm removal, then use Restore sample report.']]],
    ['preferences','Preferences & profiles',[
      ['Saved Preferences','Change settings, export preferences, reset, then import that JSON. Your preferences return without including form values or automatically starting the microphone.'],
      ['Accessibility Profiles','Try Comfortable reading, Reduced motion and Enhanced contrast. Save a custom profile, change settings, then reload your profile. The shared Reset restores defaults.']]],
  ];
  let number=0;
  const guide=document.getElementById('setting-guide');
  document.getElementById('demo-form-root').replaceChildren();
  document.getElementById('session-clock').setAttribute('role','timer');
  document.getElementById('session-clock').setAttribute('aria-live','off');
  for(const [id,title,items] of groups){
    const group=document.createElement('details');group.className='guide-group';group.id=`guide-${id}`;
    const heading=document.createElement('summary');heading.textContent=title;
    const count=document.createElement('small');count.textContent=`${items.length} settings`;heading.append(count);group.append(heading);
    const list=document.createElement('ol');list.className='guide-list';
    for(const [name,instruction] of items){const item=document.createElement('li');item.dataset.guideSetting=name;const label=document.createElement('strong');label.textContent=`${++number}. ${name}`;const text=document.createElement('p');text.textContent=instruction;const button=document.createElement('button');button.textContent='Open this setting';button.setAttribute('aria-label',`Open ${name} setting`);button.addEventListener('click',()=>openSetting(name));item.append(label,text,button);list.append(item);}
    group.append(list);guide.append(group);
  }
  function openSetting(name=''){
    const api=window.AccessEase;if(!api)return;
    api.open();const input=api.root.querySelector('#team-search');if(input){input.value=name;input.dispatchEvent(new Event('input',{bubbles:true}));}
    const card=[...api.root.querySelectorAll('.team-card')].find(el=>el.querySelector('summary span:nth-child(2)')?.textContent===name);
    if(card)card.open=true;
  }
  document.querySelectorAll('[data-open-widget]').forEach(button=>button.addEventListener('click',()=>openSetting()));
  document.getElementById('compact-save').addEventListener('click',()=>{document.getElementById('bookmark-status').textContent=`Bookmark saved for this visit at ${new Date().toLocaleTimeString()}.`;});
  const flashingButton=document.getElementById('flashing-test-button');
  flashingButton.addEventListener('click',()=>{
    const running=flashingButton.classList.toggle('is-blinking');
    flashingButton.setAttribute('aria-pressed',String(running));
    flashingButton.textContent=running?'Stop blinking':'Start blinking';
  });
  const marker=document.getElementById('motion-marker');
  const motionExamples=document.getElementById('motion-examples');
  document.getElementById('start-animation-examples').addEventListener('click',()=>{
    motionExamples.classList.add('examples-running');
    marker.classList.add('running');
    document.getElementById('motion-demo-status').textContent='Examples started. If they stay still, check Pause Animations, Reduce Motion or your device motion preference.';
  });
  document.getElementById('stop-animation-examples').addEventListener('click',()=>{
    motionExamples.classList.remove('examples-running');
    marker.classList.remove('running');
    document.getElementById('motion-demo-status').textContent='Examples stopped. Start animations to compare again.';
  });
  document.getElementById('open-motion-settings').addEventListener('click',()=>openSetting('Pause Animations'));
  document.getElementById('toggle-motion-message').addEventListener('click',event=>{
    const expanded=event.currentTarget.getAttribute('aria-expanded')!=='true';
    event.currentTarget.setAttribute('aria-expanded',String(expanded));
    event.currentTarget.textContent=expanded?'Hide message':'Show message';
    const message=document.getElementById('motion-message');
    message.inert=!expanded;
    message.classList.toggle('revealed',expanded);
  });
  document.getElementById('start-motion').addEventListener('click',()=>marker.classList.add('running'));
  document.getElementById('stop-motion').addEventListener('click',()=>marker.classList.remove('running'));
  document.getElementById('start-autoplay').addEventListener('click',async()=>{const video=document.getElementById('autoplay-sample');video.autoplay=true;try{await video.play();document.getElementById('autoplay-status').textContent='Muted looping sample started.';}catch{document.getElementById('autoplay-status').textContent='Playback could not start. Use the player’s Play button.';}});
  const fixture=document.getElementById('audit-fixtures'),fixtureContent=document.getElementById('audit-fixture-content');
  fixture.addEventListener('toggle',()=>{fixtureContent.replaceChildren();if(fixture.open){const image=document.createElement('img');image.src='sample-landscape.svg';image.className='sample-image';const input=document.createElement('input');input.placeholder='Intentionally missing a label';input.autocomplete='off';fixtureContent.append(image,input);}});
  let deadline=0;
  const timerKey='accessease.demo.sessionDeadline';
  try{const saved=Number(sessionStorage.getItem(timerKey));if(Number.isFinite(saved)&&saved>Date.now())deadline=saved;}catch{}
  function saveDeadline(){try{deadline?sessionStorage.setItem(timerKey,String(deadline)):sessionStorage.removeItem(timerKey);}catch{}}
  const clock=document.getElementById('session-clock'),sessionStatus=document.getElementById('session-status');
  function showClock(){if(!deadline){clock.textContent='Not started';return;}const seconds=Math.max(0,Math.ceil((deadline-Date.now())/1000));clock.textContent=`${Math.floor(seconds/60)}:${String(seconds%60).padStart(2,'0')}`;if(seconds===0){deadline=0;sessionStatus.textContent='Demo time ended. Start another demo whenever you want.';}}
  document.getElementById('start-session').addEventListener('click',()=>{deadline=Date.now()+120000;saveDeadline();sessionStatus.textContent='The local 2-minute demo is running.';showClock();});
  document.getElementById('reset-session').addEventListener('click',()=>{deadline=0;saveDeadline();sessionStatus.textContent='The timer is stopped.';showClock();});
  let interval;
  function resumeClock(){clearInterval(interval);showClock();interval=setInterval(showClock,1000);}
  resumeClock();if(deadline)sessionStatus.textContent='Your local demo timer is running.';
  window.addEventListener('pagehide',()=>{clearInterval(interval);saveDeadline();});window.addEventListener('pageshow',resumeClock);
  window.AccessEaseConfig={...window.AccessEaseConfig,extendSession:async({minutes=5}={})=>{if(!Number.isFinite(minutes)||minutes<=0)return false;const running=deadline>Date.now();deadline=Math.max(deadline,Date.now())+minutes*60000;saveDeadline();resumeClock();sessionStatus.textContent=running?`Added ${minutes} minutes to this local demo.`:`Started a ${minutes}-minute local demo.`;return {extended:true};}};
  window.AccessEaseSimpleText={'A little curiosity goes a long way':'Small questions help you learn.','Your next small step':'What will you do next?','Make room for a good idea.':'Try a new idea.','More than just a color':'Colors with clear labels'};
})();

