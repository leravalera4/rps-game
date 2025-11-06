/**
 * Mobile Wallet Deeplink Utilities
 * Creates deeplinks to open dApp in wallet apps' built-in browsers
 */

// Get current page URL for deeplinks
const getCurrentUrl = () => {
  if (typeof window === 'undefined') return 'https://localhost:3000'
  return window.location.href
}

// Create deeplink URLs for different wallet apps
export const createWalletDeeplinks = () => {
  const currentUrl = getCurrentUrl()
  const encodedUrl = encodeURIComponent(currentUrl)
  
  return {
    phantom: `https://phantom.app/browse/${encodedUrl}?ref=deeplink`,
    solflare: `https://solflare.com/browse/${encodedUrl}?ref=deeplink`,
    // Alternative universal deeplink approach
    phantomDeeplink: `phantom://browse/${encodedUrl}`,
    solflareDeeplink: `solflare://browse/${encodedUrl}`,
  }
}

// Show mobile deeplink modal
export const showMobileWalletModal = () => {
  if (typeof window === 'undefined') return
  
  const links = createWalletDeeplinks()
  
  const modal = document.createElement('div')
  modal.innerHTML = `
    <div style="
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0,0,0,0.8);
      z-index: 50000;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
    ">
      <div style="
        background: white;
        border-radius: 16px;
        padding: 24px;
        max-width: 400px;
        width: 100%;
        box-shadow: 0 20px 40px rgba(0,0,0,0.3);
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      ">
        <div style="display: flex; align-items: center; margin-bottom: 20px;">
          <h3 style="margin: 0; color: #1f2937; font-size: 18px; font-weight: 600;">Connect Wallet</h3>
          <button onclick="this.parentElement.parentElement.parentElement.parentElement.remove()" style="
            background: none;
            border: none;
            font-size: 24px;
            cursor: pointer;
            margin-left: auto;
            padding: 4px;
            color: #6b7280;
          ">×</button>
        </div>
        
        <p style="color: #6b7280; margin-bottom: 20px; font-size: 14px; line-height: 1.5;">
          To connect your wallet on mobile, open this page in your wallet app's browser:
        </p>
        
        <div style="display: grid; gap: 12px;">
          <a href="${links.phantom}" style="
            display: flex;
            align-items: center;
            padding: 16px;
            border: 2px solid #e5e7eb;
            border-radius: 12px;
            text-decoration: none;
            color: #1f2937;
            background: #f9fafb;
            transition: all 0.2s;
          " onmouseover="this.style.borderColor='#8b5cf6'; this.style.background='#f3f4f6';" 
             onmouseout="this.style.borderColor='#e5e7eb'; this.style.background='#f9fafb';">
            <div style="
              width: 40px;
              height: 40px;
              border-radius: 8px;
              background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
              display: flex;
              align-items: center;
              justify-content: center;
              margin-right: 12px;
              font-size: 20px;
            ">👻</div>
            <div>
              <div style="font-weight: 600; font-size: 16px;">Phantom</div>
              <div style="font-size: 12px; color: #6b7280;">Open in Phantom browser</div>
            </div>
          </a>
          
          <a href="${links.solflare}" style="
            display: flex;
            align-items: center;
            padding: 16px;
            border: 2px solid #e5e7eb;
            border-radius: 12px;
            text-decoration: none;
            color: #1f2937;
            background: #f9fafb;
            transition: all 0.2s;
          " onmouseover="this.style.borderColor='#f97316'; this.style.background='#f3f4f6';" 
             onmouseout="this.style.borderColor='#e5e7eb'; this.style.background='#f9fafb';">
            <div style="
              width: 40px;
              height: 40px;
              border-radius: 8px;
              background: linear-gradient(135deg, #f97316 0%, #ea580c 100%);
              display: flex;
              align-items: center;
              justify-content: center;
              margin-right: 12px;
              font-size: 20px;
            ">🔥</div>
            <div>
              <div style="font-weight: 600; font-size: 16px;">Solflare</div>
              <div style="font-size: 12px; color: #6b7280;">Open in Solflare browser</div>
            </div>
          </a>
        </div>
        
        <div style="
          margin-top: 20px;
          padding: 16px;
          background: #eff6ff;
          border-radius: 8px;
          border-left: 4px solid #3b82f6;
        ">
          <div style="font-size: 13px; color: #1e40af; line-height: 1.4;">
            💡 <strong>Tip:</strong> If the links don't work, manually copy this URL and paste it in your wallet app's browser.
          </div>
        </div>
      </div>
    </div>
  `
  
  document.body.appendChild(modal)
  
  // Auto-remove after 30 seconds
  setTimeout(() => {
    if (modal.parentElement) {
      modal.remove()
    }
  }, 30000)
}

// Mobile wallet detection utility (includes test mode)
export const isMobileDevice = () => {
  if (typeof window === 'undefined') return false
  
  // Check if in test mode first
  if (typeof localStorage !== 'undefined' && localStorage.getItem('force-mobile-mode') === 'true') {
    return true
  }
  
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
}

// Check if user is in a wallet's in-app browser
export const isInWalletBrowser = () => {
  if (typeof window === 'undefined') return false
  const userAgent = navigator.userAgent.toLowerCase()
  return /phantom|solflare|coinbase/i.test(userAgent)
}