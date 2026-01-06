# Coding Standards for Covenant

## Core Principles

### 1. **NO AGGRESSIVE CONSOLIDATION**

Do NOT merge multiple slides into one or remove slides without:
- ✓ Adding tests that verify the behavior still works
- ✓ Checking all references to the slide ID in the codebase
- ✓ Running SlideValidator to confirm no broken links
- ✓ Documenting why the consolidation was necessary

**Why?** Recent consolidation broke the governance flow (removed `governance_intro` without updating event listeners). This caused the narrative to jump and text references to break.

### 2. **Slide Independence**

Each slide should be self-contained:
- One logical concept per slide
- If a slide does two things, split it into two slides
- Use the SlideRegistry to document relationships

```javascript
// BAD: Two concepts in one slide
SLIDES.push({
    id: "reputation_and_voting",  // ❌ Does too much
    // ... shows reputation AND explains voting
});

// GOOD: Split into two slides
SLIDES.push({
    id: "reputation_summary",
    // ... shows reputation
});
SLIDES.push({
    id: "governance_intro", 
    // ... explains voting
});
```

### 3. **Centralized Slide References**

Never hardcode slide IDs as strings in event listeners:

```javascript
// BAD: Hardcoded string
if (slideId === "governance_intro") {
    // ...
}

// GOOD: Constant + validation
var TARGET_SLIDE = "governance_intro";
if (SlideValidator.assertSlideExists(TARGET_SLIDE, "FileName.js")) {
    if (slideId === TARGET_SLIDE) {
        // ...
    }
}
```

### 4. **Global State Management**

Use `GameState` accessor instead of accessing `window` directly:

```javascript
// BAD: Direct window access
var rep = window.GAME_REPUTATION;
var gov = window.GAME_GOVERNANCE;

// GOOD: Use GameState
var rep = GameState.getReputation();
var gov = GameState.getGovernance();
```

### 5. **Slide Registry Updates**

When adding a new slide:
1. Create the slide in the appropriate file
2. Add it to `SlideRegistry.slides` with metadata
3. If it has navigation to another slide, add to `navigationHooks`
4. Run `SlideValidator.validate()` to confirm it works

```javascript
// In SlideRegistry.js
slides: {
    "my_new_slide": { 
        file: "X_Slides_Topic.js", 
        section: "topic" 
    }
},

navigationHooks: {
    "my_new_slide": "next_slide_id"  // Add if needed
}
```

## File Organization

```
js/
  core/
    SlideRegistry.js     ← Master list of all slides
    SlideValidator.js    ← Catches broken references
    GameState.js         ← Clean accessor for global state
    Slideshow.js         ← Navigation engine
    TextBox.js           ← UI components
    ...
  slides/
    0_Slides_Intro.js
    A_Slides_Governance.js
    ...                  ← Each file = one topic
  bitcoin/
    Bootstrap.js         ← Uses SlideValidator
    OnChainUI.js         ← Uses SlideValidator
    ...
```

## Refactoring Safely

### Before changing slides:
```bash
# 1. Run the validator
SlideValidator.validate()

# 2. Look for references
SlideValidator.findReferences("my_slide_id")

# 3. Check if it can be removed
SlideValidator.canRemoveSlide("my_slide_id")
```

### When renaming a slide:
1. Update SlideRegistry
2. Update all event listeners (search for old ID)
3. Update navigationHooks
4. Run SlideValidator.validate()

### When removing a slide:
1. Check references: `SlideValidator.findReferences("slide_id")`
2. Update all slides that point to it
3. Remove from SlideRegistry
4. Run SlideValidator.validate()

## Testing

Always run the test suite before consolidating:

```bash
# Test reputation system
open test-governance.html  # Click "Test Reputation Calculation"

# Test governance flow
open test-governance.html  # Click "Run Full Flow Test"

# Test slide navigation
SlideValidator.validate()
SlideValidator.hookIntoSlideshow()
```

## Common Mistakes

❌ **DON'T:**
- Hardcode slide IDs in multiple files
- Merge slides without checking references
- Remove a slide without validating navigation
- Access `window.GAME_REPUTATION` directly (use `GameState`)
- Assume consolidation is better without tests

✓ **DO:**
- Use SlideValidator when referencing slides
- Split complex slides into smaller ones
- Document why a slide exists (comment in file)
- Keep slides focused on one concept
- Run validation before committing

## Questions?

If unsure about a refactoring:
1. Run `SlideValidator.validate()`
2. Check `SlideRegistry.printStructure()`
3. Look for references: `SlideValidator.findReferences("slide_id")`
4. When in doubt, split instead of consolidate
