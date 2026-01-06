/**
 * UX FEEDBACK SYSTEM
 * 
 * Provides visual feedback for user actions.
 * Makes interactions feel responsive and satisfying.
 */

var UXFeedback = {
    
    /**
     * Show loading spinner overlay
     * @param {string} message - What is loading?
     * @param {string} status - Optional status update
     */
    showLoading: function(message, status) {
        // Remove existing overlay
        this.hideLoading();
        
        var overlay = document.createElement("div");
        overlay.id = "ux-loading-overlay";
        overlay.className = "loading-overlay";
        
        var content = document.createElement("div");
        content.className = "loading-content";
        
        var h3 = document.createElement("h3");
        h3.textContent = message || "Loading...";
        content.appendChild(h3);
        
        var spinner = document.createElement("div");
        spinner.className = "loading-spinner";
        content.appendChild(spinner);
        
        if (status) {
            var p = document.createElement("p");
            p.textContent = status;
            content.appendChild(p);
        }
        
        overlay.appendChild(content);
        document.body.appendChild(overlay);
    },
    
    /**
     * Update loading status message
     */
    updateLoadingStatus: function(status) {
        var overlay = document.getElementById("ux-loading-overlay");
        if (overlay) {
            var p = overlay.querySelector(".loading-content p");
            if (p) {
                p.textContent = status;
            } else {
                p = document.createElement("p");
                p.textContent = status;
                overlay.querySelector(".loading-content").appendChild(p);
            }
        }
    },
    
    /**
     * Hide loading overlay
     */
    hideLoading: function() {
        var overlay = document.getElementById("ux-loading-overlay");
        if (overlay) {
            overlay.style.animation = "slideshow-fade-out 0.2s ease-out";
            setTimeout(function() {
                if (overlay.parentNode) {
                    overlay.parentNode.removeChild(overlay);
                }
            }, 200);
        }
    },
    
    /**
     * Show success message (toast)
     */
    showSuccess: function(message, duration) {
        this.showToast(message, "success-message", duration || 3000);
    },
    
    /**
     * Show error message (toast)
     */
    showError: function(message, duration) {
        this.showToast(message, "error-message", duration || 5000);
    },
    
    /**
     * Show status message (toast)
     */
    showStatus: function(message, duration) {
        this.showToast(message, "status-message", duration || 3000);
    },
    
    /**
     * Generic toast notification
     */
    showToast: function(message, className, duration) {
        var toast = document.createElement("div");
        toast.className = className + " ux-toast";
        toast.textContent = message;
        toast.style.position = "fixed";
        toast.style.bottom = "20px";
        toast.style.right = "20px";
        toast.style.maxWidth = "300px";
        toast.style.zIndex = "999";
        
        document.body.appendChild(toast);
        
        if (duration > 0) {
            setTimeout(function() {
                toast.style.animation = "slideshow-fade-out 0.3s ease-out forwards";
                setTimeout(function() {
                    if (toast.parentNode) {
                        toast.parentNode.removeChild(toast);
                    }
                }, 300);
            }, duration);
        }
    },
    
    /**
     * Button click feedback
     */
    buttonClick: function(buttonElement) {
        if (!buttonElement) return;
        buttonElement.classList.add("click-feedback");
        setTimeout(function() {
            buttonElement.classList.remove("click-feedback");
        }, 300);
    },
    
    /**
     * Vote submitted feedback
     */
    voteSubmitted: function(voteType) {
        // Play subtle audio if available
        this.playSound("vote");
        
        // Show success
        var tierEmoji = voteType === "yes" ? "✓" : (voteType === "no" ? "✗" : "∘");
        this.showSuccess(tierEmoji + " Vote recorded!");
    },
    
    /**
     * Wallet connected feedback
     */
    walletConnected: function(address) {
        this.playSound("success");
        var shortAddr = address.substring(0, 10) + "..." + address.substring(address.length - 6);
        this.showSuccess("✓ Wallet connected: " + shortAddr);
    },
    
    /**
     * Reputation tier revealed
     */
    tierRevealed: function(tier) {
        this.playSound("success");
        var emoji = tier === "WellAligned" ? "⭐" : (tier === "Neutral" ? "◆" : "▲");
        this.showSuccess(emoji + " You are " + tier);
    },
    
    /**
     * Play sound effect (if audio is enabled)
     */
    playSound: function(soundName) {
        // Check if sound is enabled
        var soundToggle = document.getElementById("sound");
        if (!soundToggle || soundToggle.getAttribute("sound") !== "on") {
            return;
        }
        
        // This would use Howler.js if sounds are set up
        // For now, we just log it
        console.log("[UXFeedback] Sound:", soundName);
    },
    
    /**
     * Smooth scroll to element
     */
    scrollTo: function(element, offset) {
        if (!element) return;
        offset = offset || 0;
        
        var targetY = element.getBoundingClientRect().top + window.scrollY + offset;
        window.scrollTo({
            top: targetY,
            behavior: "smooth"
        });
    },
    
    /**
     * Pulse animation on element
     */
    pulse: function(element) {
        if (!element) return;
        element.classList.add("tier-badge-pulse");
        setTimeout(function() {
            element.classList.remove("tier-badge-pulse");
        }, 1500);
    }
};

// Expose for debugging
if (window.console) {
    window._ux = UXFeedback;
}
