# RELAY AI — Voice Services & Accessibility (WCAG 2.2 AA) Audit

**Audited Date:** October 31, 2026  
**Audited Components:** `src/components/voice/VoiceController.tsx`, `app/services/voice_service.py`, `FloatingAssistant.tsx`, `LiveWorkspace.tsx`

---

## 1. Half-Duplex Turn-Taking Contract Verification

The voice architecture implements a strict turn-taking state machine:

```
[ IDLE ]
   |
   | User clicks microphone
   v
[ RECORDING ] (Active stream capture; visual REC indicator & pulse)
   |
   | User clicks stop / send
   v
[ TRANSCRIBING ] (Audio submitted to POST /api/voice/transcribe; stream tracks closed)
   |
   | Transcript delivered to query console / input bar
   v
[ PIPELINE PROCESSING ] (Normal A1 -> A2 -> Validation -> Decision execution)
   |
   | Response received
   v
[ PLAYING AUDIO ] (Microphone remains fully halted/muted; speech synthesizes via POST /api/voice/speech)
   |
   | Audio onended / user clicks Stop
   v
[ IDLE ] (Microphone remains OFF until explicit user reactivation)
```

### Safety Rules Audited & Passed
1. **No Microphone / Speaker Feedback:** The browser audio stream is completely aborted before TTS audio playback starts.
2. **No Auto-Re-Arm:** After audio finishes playing, the microphone remains deactivated. The user must explicitly press the microphone button to initiate a new recording.
3. **Audio File Validation:** `POST /api/voice/speech` generates valid 16-bit mono 16000 Hz Microsoft PCM WAVE audio streams verified by `wave.open`.

---

## 2. Accessibility (WCAG 2.2 AA) Audit

| Principle | Check Item | Observed Status | Evidence / Notes |
| :--- | :--- | :---: | :--- |
| **Perceivable** | Color Contrast | **PASS** | Text contrast on `#F5F7FB` (Light) and `#0B1320` (Dark) exceeds 4.5:1 for normal text and 7:1 for headers. |
| **Perceivable** | Non-Color Indicators | **PASS** | Status badges include both text tags (`CHECK PASSED`, `ESCALATE`) and distinct icons (`CheckCircle2`, `AlertTriangle`). |
| **Perceivable** | Screen-Reader Labels | **PASS** | Interactive buttons feature descriptive `aria-label` attributes (e.g. `"Toggle voice recording"`, `"Set dark theme"`). |
| **Operable** | Keyboard Navigation | **PASS** | All interactive controls, preset chips, and modal close buttons are accessible via Tab, Enter, and Space keys. |
| **Operable** | Focus Visibility | **PASS** | Form inputs and buttons feature focus rings (`focus:border-[#456BFA]`). |
| **Operable** | Voice is Optional | **PASS** | 100% of customer workflows can be completed via keyboard and text input alone. Voice is purely additive. |
| **Understandable**| Error Messages | **PASS** | Clear, actionable validation error text (e.g. `"String should have at least 1 character"`). |
| **Robust** | Semantic HTML | **PASS** | Proper usage of `<header>`, `<main>`, `<aside>`, `<nav>`, `<button>`, `<form>`, `<textarea>`. |

### Improvement Opportunity
- Dynamic execution trace cards currently lack `aria-live="polite"` region announcements for screen-reader users when new orchestrator results arrive asynchronously.

