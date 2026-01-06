/**
 * SLIDE REGISTRY
 * 
 * Central registry of all slides in the presentation.
 * Prevents broken slide IDs and documents the flow.
 * 
 * Run validate() to check for unreachable slides.
 */

var SlideRegistry = {
    
    // Define all slides with their metadata
    slides: {
        // INTRO
        "intro_title": { file: "0_Slides_Intro.js", section: "intro" },
        "what_is_trust": { file: "0_Slides_Intro.js", section: "intro" },
        "intro_button": { file: "0_Slides_Intro.js", section: "intro" },
        
        // WHY BITCOIN
        "why_this_works": { file: "0_Slides_Intro.js", section: "why_bitcoin" },
        
        // ONE-OFF (single game)
        "one_off": { file: "1_Slides_OneOff.js", section: "gameplay" },
        "one_off_results": { file: "1_Slides_OneOff.js", section: "gameplay" },
        
        // ITERATED (repeated games)
        "iterated_1": { file: "2_Slides_Iterated.js", section: "gameplay" },
        "iterated_2": { file: "2_Slides_Iterated.js", section: "gameplay" },
        
        // SANDBOX (full game with reputation)
        "sandbox_intro": { file: "3_Slides_Sandbox.js", section: "gameplay" },
        "sandbox_game": { file: "3_Slides_Sandbox.js", section: "gameplay" },
        "sandbox_results": { file: "3_Slides_Sandbox.js", section: "gameplay" },
        
        // REPUTATION REVEAL
        "reputation_summary": { file: "B_Slides_ReputationReveal.js", section: "reputation" },
        
        // GOVERNANCE FLOW
        "governance_intro": { file: "A_Slides_Governance.js", section: "governance" },
        "governance_connect": { file: "A_Slides_Governance.js", section: "governance" },
        "governance_voting": { file: "A_Slides_Governance.js", section: "governance" },
        "governance_summary": { file: "A_Slides_Governance.js", section: "governance" },
        
        // NOISE
        "noise_intro": { file: "6_Slides_Noise.js", section: "bonus" },
        "noise_1": { file: "6_Slides_Noise.js", section: "bonus" },
        "noise_2": { file: "6_Slides_Noise.js", section: "bonus" }
    },
    
    // Navigation hooks - slideId → next slideId
    navigationHooks: {
        "governance_intro": "governance_connect",
        "governance_connect": "governance_voting",
        "governance_voting": "governance_summary"
    },
    
    /**
     * Get slide metadata
     */
    getSlide: function(slideId) {
        return this.slides[slideId] || null;
    },
    
    /**
     * Check if slide exists
     */
    exists: function(slideId) {
        return slideId in this.slides;
    },
    
    /**
     * Get all slides in a section
     */
    getSection: function(section) {
        return Object.keys(this.slides).filter(id => 
            this.slides[id].section === section
        );
    },
    
    /**
     * Validate slide registry
     * Checks for:
     * - Duplicate IDs (shouldn't happen but worth checking)
     * - Referenced slides that don't exist
     */
    validate: function() {
        var errors = [];
        
        // Check for duplicates in slides object
        var ids = Object.keys(this.slides);
        var uniqueIds = new Set(ids);
        if (ids.length !== uniqueIds.size) {
            errors.push("ERROR: Duplicate slide IDs found");
        }
        
        // Check navigation hooks point to real slides
        Object.keys(this.navigationHooks).forEach(from => {
            var to = this.navigationHooks[from];
            if (!this.exists(to)) {
                errors.push(`ERROR: Navigation hook from "${from}" points to non-existent slide "${to}"`);
            }
            if (!this.exists(from)) {
                errors.push(`ERROR: Navigation hook references non-existent source slide "${from}"`);
            }
        });
        
        if (errors.length === 0) {
            console.log("[SlideRegistry] ✓ All slides valid (" + ids.length + " total)");
            return true;
        } else {
            console.error("[SlideRegistry] Validation failed:");
            errors.forEach(e => console.error("  " + e));
            return false;
        }
    },
    
    /**
     * Print all slides organized by section
     */
    printStructure: function() {
        var sections = {};
        Object.keys(this.slides).forEach(id => {
            var section = this.slides[id].section;
            if (!sections[section]) sections[section] = [];
            sections[section].push(id);
        });
        
        console.log("[SlideRegistry] Slide Structure:");
        Object.keys(sections).forEach(section => {
            console.log(`  ${section.toUpperCase()}:`);
            sections[section].forEach(id => {
                console.log(`    - ${id}`);
            });
        });
    }
};

// Validate on load
if (window.addEventListener) {
    window.addEventListener('load', function() {
        setTimeout(function() {
            SlideRegistry.validate();
        }, 500);
    });
}
