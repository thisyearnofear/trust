/**
 * SLIDE VALIDATOR
 * 
 * Catches broken slide references before they cause runtime errors.
 * Call validate() to check:
 * - All referenced slides exist
 * - No circular navigation loops
 * - Event listeners reference real slides
 */

var SlideValidator = {
    
    /**
     * Check if a slide ID is valid
     */
    isValidSlideId: function(slideId) {
        if (!slideId) return false;
        if (typeof slideId !== 'string') return false;
        return SlideRegistry.exists(slideId);
    },
    
    /**
     * Validate a slide reference before using it
     * @param {string} slideId - The slide to check
     * @param {string} context - Where the reference came from (for error message)
     * @return {boolean} - true if valid
     */
    assertSlideExists: function(slideId, context) {
        if (!this.isValidSlideId(slideId)) {
            console.error(`[SlideValidator] Invalid slide reference in ${context}: "${slideId}"`);
            console.error(`[SlideValidator] Valid slides are:`, Object.keys(SlideRegistry.slides));
            return false;
        }
        return true;
    },
    
    /**
     * Hook into slideshow navigation to catch errors
     */
    hookIntoSlideshow: function() {
        var self = this;
        
        if (!window.Slideshow) {
            console.warn("[SlideValidator] Slideshow not loaded yet");
            return;
        }
        
        // Hook into slide change events
        if (window.subscribe) {
            window.subscribe("slideshow/slideChange", function(slideId) {
                if (!self.isValidSlideId(slideId)) {
                    console.error(`[SlideValidator] ⚠️  Slide "${slideId}" not in registry!`);
                    console.log("[SlideValidator] Available slides:", Object.keys(SlideRegistry.slides));
                }
            });
        }
    },
    
    /**
     * Find all references to a specific slide in the code
     * (useful for refactoring)
     */
    findReferences: function(slideId) {
        var hooks = SlideRegistry.navigationHooks;
        var refs = [];
        
        Object.keys(hooks).forEach(from => {
            if (hooks[from] === slideId) {
                refs.push({ type: "navigationHook", from: from, to: slideId });
            }
        });
        
        return refs;
    },
    
    /**
     * Check if removing a slide would break navigation
     */
    canRemoveSlide: function(slideId) {
        var refs = this.findReferences(slideId);
        if (refs.length > 0) {
            console.warn(`[SlideValidator] Cannot remove "${slideId}" - it's referenced by:`, refs);
            return false;
        }
        return true;
    },
    
    /**
     * Full validation
     */
    validate: function() {
        console.log("[SlideValidator] Running validation...\n");
        
        var errors = [];
        var warnings = [];
        
        // 1. Check SlideRegistry
        if (!SlideRegistry.validate()) {
            errors.push("SlideRegistry validation failed");
        }
        
        // 2. Check for string hardcoding in known files
        // (This would require reading the files, so we log a reminder)
        warnings.push("REMINDER: Check for hardcoded slide IDs in:");
        warnings.push("  - js/bitcoin/Bootstrap.js");
        warnings.push("  - js/bitcoin/OnChainUI.js");
        warnings.push("  Use SlideValidator.assertSlideExists() to validate them");
        
        // 3. Report
        if (errors.length > 0) {
            console.error("[SlideValidator] ERRORS:");
            errors.forEach(e => console.error("  ✗ " + e));
            return false;
        }
        
        if (warnings.length > 0) {
            console.warn("[SlideValidator] WARNINGS:");
            warnings.forEach(w => console.warn("  ⚠️  " + w));
        }
        
        console.log("[SlideValidator] ✓ Validation passed");
        return true;
    }
};

// Auto-validate on load
if (window.addEventListener) {
    window.addEventListener('load', function() {
        setTimeout(function() {
            SlideValidator.validate();
            SlideValidator.hookIntoSlideshow();
        }, 1000);
    });
}
