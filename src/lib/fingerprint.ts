// Browser fingerprinting utility
// Generates a unique identifier for each browser/computer

export function generateBrowserFingerprint(): string {
    // Collect browser characteristics
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')

    let canvasFingerprint = ''
    if (ctx) {
        ctx.textBaseline = 'top'
        ctx.font = '14px Arial'
        ctx.fillText('Browser fingerprint', 2, 2)
        canvasFingerprint = canvas.toDataURL()
    }

    const fingerprint = {
        userAgent: navigator.userAgent,
        language: navigator.language,
        platform: navigator.platform,
        screenResolution: `${screen.width}x${screen.height}`,
        colorDepth: screen.colorDepth,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        canvas: canvasFingerprint.substring(0, 100), // First 100 chars
        hardwareConcurrency: navigator.hardwareConcurrency || 0,
        deviceMemory: (navigator as any).deviceMemory || 0,
    }

    // Create a hash from the fingerprint
    const fingerprintString = JSON.stringify(fingerprint)
    return hashString(fingerprintString)
}

// Simple hash function
function hashString(str: string): string {
    let hash = 0
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i)
        hash = ((hash << 5) - hash) + char
        hash = hash & hash // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36)
}

// Store fingerprint in localStorage for consistency
export function getBrowserFingerprint(): string {
    const stored = localStorage.getItem('browser-fingerprint')
    if (stored) {
        return stored
    }

    const fingerprint = generateBrowserFingerprint()
    localStorage.setItem('browser-fingerprint', fingerprint)
    return fingerprint
}
