# InterviewAI — Complete Product, Architecture & Anti-Cheat Security Documentation

> **Project Name**: InterviewAI  
> **Repository Location**: `C:\Users\abhin\.gemini\antigravity\scratch\interviewai`  
> **Local Server URL**: `http://localhost:3000`  
> **Demo Account**: `abhineet@interviewai.com` | Password: `password123`  
> **Environment**: Node.js v25.5.0, Next.js 14.2.20 (App Router), Java 24.0.2, SQLite with Prisma ORM

---

## 1. Executive Summary & Product Vision

**InterviewAI** is an enterprise-grade placement preparation and AI interview platform combining the capabilities of **LeetCode**, **HackerRank**, an **Interactive AI Avatar Interviewer**, and an **ATS Resume Scanner** with an **Enterprise Anti-Cheating & Proctoring Engine**.

---

## 2. Anti-Cheat Security Architecture: Root-Cause Fixes & Capabilities

### Root Causes Identified and Fixed:
1. **Camera Standby Bug Fixed**: The `<video>` element was previously conditionally rendered only after permission state flipped, causing `videoRef.current` to be null during stream assignment. Fixed: video element is permanently mounted and attached immediately to the media stream.
2. **Pre-Interview Security Gate**: Replaced fake `setTimeout` placeholders with a real `PreInterviewSecurityGate` in both Mock Mode and Real AI Avatar Simulation. The interview literally cannot start until camera stream, microphone sensitivity, face centering, and fullscreen lockdown are verified.
3. **External AI Tools (ChatGPT) / Window Focus Loss Solved**:
   - When focus is lost or ChatGPT is activated in another window/screen, an **impenetrable full-screen occlusion modal** (`fixed inset-0 z-[999] bg-slate-950/98 backdrop-blur-3xl`) instantly blocks the entire page.
   - All interview questions and code editor text are completely obscured so the candidate cannot look at the question while viewing ChatGPT or an external browser window.
   - 3 Strikes policy: If focus is lost or fullscreen is exited 3 times, the session is formally **SUSPENDED / TERMINATED**.
4. **Fullscreen Lockdown**: Fullscreen is enforced before entering the interview, and exiting triggers immediate screen freezing and strike penalty.
5. **Dynamic Integrity Scoring**: Integrity score directly reflects recorded events with escalating repeat multipliers rather than inflated static values.

---

## 3. Real-World Cheating Scenarios & Testing Matrix

| Scenario / Attack Vector | Detection Mechanism | Immediate Action Taken | Technical Limitations & Boundary |
|---|---|---|---|
| **1. Opening ChatGPT in separate window** | `window.onblur` focus listener | Fullscreen opaque occlusion freeze (`bg-slate-950`). Questions obscured. -10 pts deduction + Strike 1. | Browser cannot close other OS processes; it completely blocks viewing questions while outside. |
| **2. Switching tabs / Minimizing** | `document.visibilitychange` API | Immediate screen freeze modal. Timer paused. -8 pts deduction + Strike recorded. | Fully detected by browser API. |
| **3. Exiting Fullscreen** | `document.fullscreenchange` API | Immediate screen freeze with 12s countdown. -10 pts deduction. 3 exits = Session Suspended. | Fully enforced via HTML5 Fullscreen API. |
| **4. Camera Standby / Permission Denial** | Pre-Interview Security Gate (`getUserMedia`) | Interview start button strictly disabled. Clear troubleshooting steps & retry button shown. | Hardware level check via MediaStream track state. |
| **5. Leaving Camera Field of View** | Computer Vision centroid skin mass < 160 px | Warnings flash after >3.5s missing. -8 pts deducted for prolonged absence. | Subject to extreme lighting changes; verified in pre-gate. |
| **6. Looking Down at Phone in Lap** | Computer Vision centroid Y > 75 & bottom mass > 65% | Flags `LOOKING_DOWN_PHONE`. -10 pts deducted for sustained downward tilt (>3s). | Computer vision heuristic; cannot physically see under the desk. |
| **7. Looking Away at Second Screen** | Centroid X displacement < 45 or > 115 px | Flags `LOOKING_AWAY`. -4 pts deducted for sustained side gaze (>2.5s). | Reliably detects sustained off-screen gaze. |
| **8. External Helper / Whispering** | Web Audio API RMS voice band analysis (300Hz-3400Hz) | Flags `SECONDARY_VOICE_DETECTED` when candidate is not answering. -8 pts deducted. | Cannot separate two overlapping voices with 100% certainty on a single mic. |
| **9. Copying Questions / Pasting Code** | `oncopy`, `onpaste`, CSS `select-none`, Monaco options | Context menu suppressed, text copy blocked, clipboard paste flagged (-5 pts). | Client-side DOM event interception. |
| **10. Developer Tools / Inspecting** | Keyboard event listener on `F12`, `Ctrl+Shift+I/J/C`, `Ctrl+U` | Key combination blocked (`preventDefault`). -15 pts critical penalty logged. | Cannot detect DevTools if opened prior to browser launch. |

---

## 4. Key Directories & Routes

- `src/components/proctoring/PreInterviewSecurityGate.tsx` - Biometric hardware & fullscreen gate.
- `src/components/proctoring/SecureProctoringSuite.tsx` - Real-time proctoring HUD, canvas vision, focus occlusion modal.
- `src/lib/proctoring-engine.ts` - Computer vision math, audio RMS, weighted scoring engine.
- `src/app/mock-interview/page.tsx` - Mock Interview with gate + proctoring + diagnostic report.
- `src/app/ai-avatar/page.tsx` - 100-Minute AI Avatar Simulation with gate + proctoring + diagnostic report.
- `src/lib/code-runner.ts` - Real native Java 24 compilation & sandboxed execution.
