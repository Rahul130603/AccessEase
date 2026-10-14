import React, { useEffect, useState } from 'react';
import { useAudit } from '../AssistAccess/src/accessibility/core/audit/AuditContext.jsx';
import { useA11ySettings, useAnnounce } from '../AssistAccess/src/accessibility/core/SettingsContext.jsx';
import { useConfirm } from '../AssistAccess/src/accessibility/core/confirm/ConfirmContext.jsx';
import { buildReportText } from '../AssistAccess/src/accessibility/core/audit/reportText.js';
import HeadingOutline from '../AssistAccess/src/accessibility/features/headings/HeadingOutline.jsx';

// Visitor-facing controls use the existing settings, audit and confirmation
// services. Developer examples remain in the source module, outside this UI.
function Toggle({label,checked,onChange}) {
  return <div className="team-row"><span style={{flex:1}}>{label}</span><button type="button" aria-label={label} aria-pressed={checked} onClick={()=>onChange(!checked)}>{checked?'On':'Off'}</button></div>;
}
function AuditControls({checks,description,outline=false,report=false}) {
  const audit=useAudit();
  const {settings,actions,strings}=useA11ySettings();
  const [showResults,setShowResults]=useState(false),[message,setMessage]=useState(''),[fallback,setFallback]=useState('');
  const findings=(audit?.findings||[]).filter(item=>!checks||checks.includes(item.checkId));
  const enabled=settings.reader.auditEnabled!==false;
  function check(){if(!enabled)actions.setReader('auditEnabled',true);audit?.rescan();setShowResults(true);setMessage('Page check requested. Results update below.');}
  async function copyReport(){const text=buildReportText(audit,strings,{url:location.href});try{await navigator.clipboard.writeText(text);setMessage('Report copied.');setFallback('');}catch{setFallback(text);setMessage('Select and copy the report below.');}}
  return <>{report&&<Toggle label="Check page accessibility" checked={enabled} onChange={on=>actions.setReader('auditEnabled',on)}/>}
    <div className="team-row"><button type="button" onClick={check}>Check page</button><button type="button" disabled={!audit?.ran} onClick={()=>setShowResults(on=>!on)}>{showResults?'Hide results':'View results'}</button>{report&&<button type="button" disabled={!audit?.ran} onClick={copyReport}>Copy report</button>}</div>
    {outline&&<HeadingOutline/>}
    <p role="status">{message}</p>
    {showResults&&<div className="consumer-results"><p>{audit?.ran?`${findings.length} items to review.`:'Checking page…'}</p>{audit?.ran&&findings.length===0&&<p>No issues detected in this check.</p>}<ul>{findings.map(item=><li key={item.id}><strong>{item.label}</strong><p>{item.message}</p><div className="team-row"><button type="button" onClick={()=>{if(!audit.jump(item.id,{focus:false}))setMessage('This item is no longer on the page. Check again.');}}>Show on page</button>{item.focusable&&<button type="button" onClick={()=>audit.jump(item.id,{focus:true})}>Move focus here</button>}</div></li>)}</ul></div>}
    {fallback&&<><label htmlFor="consumer-audit-report">Page report</label><textarea id="consumer-audit-report" readOnly rows={8} value={fallback}/></>}
  </>;
}
function Authentication(){
  const audit=useAudit(),{settings,actions}=useA11ySettings();
  const [requested,setRequested]=useState(0),[showResults,setShowResults]=useState(false);
  const enabled=settings.reader.auditEnabled!==false;
  useEffect(()=>{if(requested&&enabled)audit?.rescan();},[requested,enabled,audit?.rescan]);
  const findings=(audit?.findings||[]).filter(item=>item.checkId==='auth-fields');
  const count=audit?.counters?.authFields||0;
  const form=document.querySelector('form:has(input[type="password"]),form:has(input[autocomplete="one-time-code"])');
  function check(){if(!enabled)actions.setReader('auditEnabled',true);setRequested(value=>value+1);setShowResults(true);}
  function tryForm(){window.AccessEase?.close();form?.scrollIntoView({block:'center',behavior:'auto'});form?.querySelector('input:not([type="hidden"])')?.focus();}
  return <>
    <p>Checks login fields for password-manager support, autocomplete and paste restrictions.</p>
    <div className="team-row"><button type="button" onClick={check}>Check page</button>{requested>0&&<button type="button" onClick={()=>setShowResults(value=>!value)}>{showResults?'Hide results':'View results'}</button>}{form&&<button type="button" onClick={tryForm}>Try sign-in form</button>}</div>
    {showResults&&<div className="consumer-results"><p role="status">{!audit?.ran?'Checking login fields…':count===0?'No login or verification fields found on this page. Open a page with a sign-in form to test this check.':`${count} login or verification fields checked. ${findings.length} items to review.`}</p>
      {audit?.ran&&count>0&&findings.length===0&&<p>No supported autocomplete or inline paste-blocking issues detected. You can try pasting into the sign-in form.</p>}
      <ul>{findings.map(item=><li key={item.id}><strong>{item.label}</strong><p>{item.message}</p><button type="button" onClick={()=>{window.AccessEase?.close();audit.jump(item.id,{focus:true});}}>Show field</button></li>)}</ul>
    </div>}
  </>;
}
function FormLabels(){return <AuditControls checks={['form-label']} description="Check whether form fields have readable labels."/>;}
function Structure(){return <AuditControls checks={['headings','landmarks']} description="Choose a heading to find it on the page, or check the page structure." outline/>;}
function ScreenReader(){return <AuditControls description="Review page accessibility findings. This check reports issues; it does not repair the website." report/>;}
function Errors(){const {settings,actions}=useA11ySettings();return <><Toggle label="Announce form errors" checked={settings.forms.announceErrors===true} onChange={on=>actions.setForms('announceErrors',on)}/><AuditControls checks={['form-errors']} description="Check form error messages on this page."/></>;}
function Password(){const {settings,actions}=useA11ySettings();return <><Toggle label="Show / hide password control" checked={settings.forms.passwordToggle!==false} onChange={on=>actions.setForms('passwordToggle',on)}/></>;}
function Announcements(){
  const {settings,actions,strings}=useA11ySettings(),announce=useAnnounce();
  return <><label htmlFor="consumer-announcement-level">Announcement detail</label><select id="consumer-announcement-level" value={settings.reader.announceVerbosity} onChange={event=>actions.setReader('announceVerbosity',event.target.value)}><option value="minimal">Minimal</option><option value="standard">Standard</option><option value="verbose">Detailed</option></select><Toggle label="Announce navigation changes" checked={settings.reader.announceRouteChanges!==false} onChange={on=>actions.setReader('announceRouteChanges',on)}/><Toggle label="Highlight items when navigating" checked={settings.reader.highlightOnJump!==false} onChange={on=>actions.setReader('highlightOnJump',on)}/><button type="button" onClick={()=>announce(strings.status.previewMessage,{level:'critical',source:'preview'})}>Preview announcement</button></>;
}
function Confirmation(){
  const confirm=useConfirm(),announce=useAnnounce();const [result,setResult]=useState(''),[removed,setRemoved]=useState(false);
  async function preview(){
    const accepted=await confirm({title:'Delete sample item?',description:'This removes only the sample item below. You can restore it afterwards.',details:['Review the action before confirming.'],confirmLabel:'Delete sample item',cancelLabel:'Keep item',destructive:true});
    if(accepted)setRemoved(true);
    const message=accepted?'Sample item deleted. Restore it to test again.':'Cancelled. The sample item was kept.';
    setResult(message);announce(message,{level:'standard',source:'confirm-demo'});
  }
  return <>
    <p>Asks you to confirm before an important action. Try deleting this sample item.</p>
    {!removed?<><p><strong>Sample item</strong></p><button type="button" onClick={preview}>Preview confirmation</button></>:<button type="button" onClick={()=>{setRemoved(false);setResult('Sample item restored.');}}>Restore sample item</button>}
    {result&&<p role="status">{result}</p>}
  </>;
}
export const consumerPanels={auth:Authentication,'form-labels':FormLabels,headings:Structure,'screen-reader':ScreenReader,'error-messages':Errors,password:Password,announcements:Announcements,confirm:Confirmation};

