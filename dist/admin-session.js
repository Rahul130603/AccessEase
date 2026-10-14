const reloaded=performance.getEntriesByType?.('navigation')?.[0]?.type==='reload';
if(reloaded&&(location.pathname!=='/'||location.search||location.hash)){
  location.replace('/');
}else{
  if(reloaded){
    history.scrollRestoration='manual';
    window.addEventListener('pageshow',()=>window.scrollTo(0,0),{once:true});
  }
  const adminLink=document.createElement('a');
  adminLink.href='/admin';
  adminLink.textContent='Admin workspace';
  adminLink.className='admin-workspace-link';
  document.querySelector('header')?.append(adminLink);
  async function refreshSession(){
    try{
      const response=await fetch('/api/auth/session',{cache:'no-store',credentials:'same-origin'});
      if(response.status===401){location.replace('/login');return;}
      if(!response.ok)throw new Error('Session check unavailable.');
      const account=await response.json();
      adminLink.textContent=account.role==='admin'?'Admin workspace':'My workspace';
    }catch{/* Server requests still enforce authentication. */}
  }
  window.addEventListener('pageshow',refreshSession);
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)refreshSession();});
  refreshSession();
}
