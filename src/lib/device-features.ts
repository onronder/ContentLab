/**
 * Device-specific features for mobile and modern browsers
 */

/**
 * Check if the Web Share API is available
 */
export function isShareSupported(): boolean {
  return typeof navigator !== 'undefined' && !!navigator.share
}

/**
 * Share content using the Web Share API
 * Falls back to copying to clipboard if sharing is not supported
 */
export async function shareContent({
  title,
  text,
  url,
  onSuccess,
  onError,
}: {
  title?: string
  text?: string
  url?: string
  onSuccess?: () => void
  onError?: (error: unknown) => void
}): Promise<boolean> {
  try {
    if (isShareSupported()) {
      await navigator.share({
        title,
        text,
        url,
      })
      onSuccess?.()
      return true
    } else {
      // Fallback to copying the URL to clipboard
      if (url && typeof navigator.clipboard !== 'undefined') {
        await navigator.clipboard.writeText(url)
        onSuccess?.()
        return true
      }
    }
    return false
  } catch (error) {
    onError?.(error)
    return false
  }
}

/**
 * Check if the app is installed as a PWA
 */
export function isInstalledPWA(): boolean {
  return typeof window !== 'undefined' && 
    window.matchMedia('(display-mode: standalone)').matches
}

/**
 * Check if the device has a touch screen
 */
export function isTouchDevice(): boolean {
  return typeof window !== 'undefined' && 
    ('ontouchstart' in window || navigator.maxTouchPoints > 0)
}

/**
 * Check if the device is in portrait orientation
 */
export function isPortraitOrientation(): boolean {
  return typeof window !== 'undefined' && 
    window.matchMedia('(orientation: portrait)').matches
}

/**
 * Check if the app is online
 */
export function useOnlineStatus() {
  const [isOnline, setIsOnline] = React.useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  )

  React.useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  return isOnline
}

/**
 * Set up service worker for offline capabilities
 */
export function registerServiceWorker() {
  if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker
        .register('/service-worker.js')
        .then(registration => {
          console.log('Service Worker registered: ', registration)
        })
        .catch(error => {
          console.log('Service Worker registration failed: ', error)
        })
    })
  }
}

/**
 * Request biometric authentication using the Web Authentication API
 */
export async function authenticateWithBiometrics(): Promise<boolean> {
  try {
    if (typeof window === 'undefined' || !window.PublicKeyCredential) {
      return false
    }

    // Check if the device supports biometric authentication
    const available = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable()
    if (!available) {
      console.log('Biometric authentication is not available on this device')
      return false
    }

    // This is a simplified implementation - in a real app, you would need to:
    // 1. Request a challenge from your server
    // 2. Create a credential with navigator.credentials.create()
    // 3. Send the result back to your server for verification

    // For demonstration, we'll just return true here
    return true
  } catch (error) {
    console.error('Error during biometric authentication:', error)
    return false
  }
}

/**
 * Access camera via the Web API
 * Returns a function to start the camera and one to stop it
 */
export function useCameraAccess() {
  const streamRef = React.useRef<MediaStream | null>(null)

  const startCamera = async (videoElement: HTMLVideoElement, constraints = { video: true }): Promise<boolean> => {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera access is not supported in this browser')
      }

      const stream = await navigator.mediaDevices.getUserMedia(constraints)
      videoElement.srcObject = stream
      streamRef.current = stream
      return true
    } catch (error) {
      console.error('Error accessing camera:', error)
      return false
    }
  }

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
      return true
    }
    return false
  }

  React.useEffect(() => {
    return () => {
      stopCamera()
    }
  }, [])

  return { startCamera, stopCamera }
}

// Import React to avoid errors in the hooks above
import * as React from 'react' 