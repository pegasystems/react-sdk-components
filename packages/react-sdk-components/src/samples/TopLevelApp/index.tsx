import AppSelector from '../AppSelector';

const TopLevelApp = () => {
  return (
    <div>
      <AppSelector />
    </div>
  );
};

document.addEventListener('SdkLoggedOut', () => {
  const thePegaRoot = document.getElementById('pega-root');
  if (thePegaRoot) {
    // Clear any prior Pega content within pega root
    thePegaRoot.innerHTML = '';
    const theLogoutMsgDiv = document.createElement('div');
    theLogoutMsgDiv.setAttribute('style', 'margin: 5px;');
    theLogoutMsgDiv.innerHTML = `You are logged out. Refresh the page to log in again.`;
    thePegaRoot.appendChild(theLogoutMsgDiv);
  }
  window.location.href = `${window.location.origin}/portal`;
  sessionStorage.removeItem('logined');
  sessionStorage.removeItem('redirected');
  sessionStorage.removeItem('rsdk_portalName');
});

export default TopLevelApp;
