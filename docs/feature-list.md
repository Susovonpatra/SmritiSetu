# SmritiSetu Feature List & Capabilities Matrix

SmritiSetu is a comprehensive cognitive gaming, reminiscence, and clinical monitoring platform designed for elderly dementia and Mild Cognitive Impairment (MCI) patients in India's North Eastern Region (NER) and rural communities.

---

## 1. Feature Matrix by Domain

| Feature Category | Capability | Patient Portal | Caretaker Hub | ASHA Worker | 2G Phone |
| :--- | :--- | :---: | :---: | :---: | :---: |
| **Cognitive Games** | Biographical Memory Recall | ✅ | 📊 Analytics | — | 📞 Audio Qs |
| | PatternTrace™ Working Memory | ✅ | 📊 Analytics | — | — |
| | Match the Shapes & Tremor Tracking | ✅ | 📊 Analytics | — | — |
| | Daily Routine ADL Sequencing | ✅ | 📊 Analytics | — | 📞 Routine Qs |
| **Biomarker Monitoring** | Reaction Latency (ms) | — | ✅ | — | ✅ |
| | Motor Tremor Jitter (px) | — | ✅ | — | — |
| | 7-Day Cognitive Drift Tracking | — | ✅ (Alert $\ge 35\%$) | — | ✅ |
| | Perseveration & Omission Errors | — | ✅ | — | — |
| **Caregiver Tools** | Biographical Question CMS | — | ✅ | — | — |
| | Daily Care Schedule Routine | ✅ | ✅ | — | — |
| | Patient Password / Security Control | — | ✅ | — | — |
| | Clinical PDF Report Export | — | ✅ | ✅ | — |
| **Public Health** | Offline Door-to-Door Field Triage | — | — | ✅ | — |
| | eSanjeevani Teleconsultation | — | ✅ | ✅ | — |
| | DPDP Act Granular Consent | — | ✅ | ✅ | — |
| | ABHA ID Medical Record Linkage | — | ✅ | ✅ | — |
| **Accessibility** | WCAG AAA & High-Contrast Visuals | ✅ | ✅ | ✅ | N/A |
| | Native Speech Synthesis (0.88x speed) | ✅ | — | — | 📞 IVR Audio |
| | 4 Regional Dialects (Odia, Assamese, etc.)| ✅ | ✅ | ✅ | ✅ |

---

## 2. Clinical & Dementia-Centric Design Pillars

### Zero Timer Stress & Non-Punitive Feedback
- **No Countdown Clocks**: Eliminates time pressure that triggers agitation and cognitive freeze in dementia patients.
- **Supportive Error Normalization**: When an incorrect option or pattern is entered, the UI softly highlights the correct answer in gentle green with spoken affirmation (*"Here it is — let's remember this together"*).
- **Graceful Session Exit ("Take a Rest")**: Patients can end their cognitive practice at any time via an unhurried, reassuring pause button without penalty.

### WCAG AAA Geriatric Visual Accessibility
- **High-Contrast Palette**: Exceeds 7:1 contrast ratios for aging retinas and low-luminance screens.
- **Enlarged Touch Targets**: Every interactive element is a minimum of 48px × 48px (with main cards reaching 64px to 80px) to accommodate motor tremors and unsteady fingers.
- **Tactile Drag Feedback**: Interactive rubber-band SVG connectors and snap-to-target animations provide immediate sensory confirmation.

### Soothing Auditory Guidance
- **Geriatric Acoustic Pacing**: Web Audio SpeechSynthesis calibrated at an unhurried `0.88x` speaking rate with gentle pitch.
- **Dialect Localization**: Natural pronunciation in Odia (`or-IN`), Assamese (`as-IN`), Gujarati (`gu-IN`), and Indian English (`en-IN`).
- **Calming Chimes**: Low-frequency pentatonic chimes replace harsh alert buzzers.

---

## 3. Cognitive Gaming Suite

### 1. Biographical & Relational Memory Recognition
- **Goal**: Preserves core family relationships and autobiographical anchoring.
- **Features**:
  - 4 randomized touch cards presenting family members, spouse names, or home milestones.
  - Relational memory ring taxonomy:
    - **Tier 1 (Core)**: Lifelong spouse, primary home, self-identity.
    - **Tier 2 (Child)**: Eldest daughter, son's career, close caregiving children.
    - **Tier 3 (Sibling)**: Childhood siblings, ancestral village roots.
    - **Tier 4 (Extended)**: Extended relatives and nostalgic memories.
  - Cognitive fatigue monitoring comparing Question 1–3 accuracy against Question 7+.
  - Confusion matrix detecting recurrent confabulations or mistaken identities.

### 2. PatternTrace™ Visuospatial Working Memory
- **Goal**: Assesses visuospatial memory span and fine motor initiation.
- **Features**:
  - Interactive 3×3 matrix with demonstration preview and user recall phase.
  - **Dynamic 2-Up / 2-Down Staircase**: Difficulty escalates after 2 flawless trials and decreases after 2 failed trials.
  - **Standard 5-Trial Battery**: Structured round indicator (`[● ● ○ ○ ○] Trial 2 of 5`).
  - **Session Ending Screen**:
    - Working Memory Composite Score (0–100 scale combining sequence accuracy, level achieved, latency, and perseveration penalty).
    - Sequence recall vs spatial recall breakdown.
    - Peak level reached and reaction speed.
    - Instant caretaker synchronization badge.
    - Actions: Play Again, View Clinical Report, or Take a Rest.
  - **Perseveration Detection**: Identifies when a patient repeats an earlier target pattern instead of the active trial.

### 3. Match the Shapes (Geometric Discrimination & Tremor Tracking)
- **Goal**: Discriminates geometric figures and tracks motor path stability.
- **Features**:
  - **20 Clinical Vector Shapes Across 3 Tiers**:
    - Tier 1: Circle, Square, Equilateral Triangle, Rectangle, Oval.
    - Tier 2: Right Triangle, Diamond, Trapezoid, Pentagon, Hexagon, Star, Crescent, Cross, Heart, Teardrop.
    - Tier 3: Octagon, Parallelogram, Chevron, Semicircle, Clover.
  - **Adaptive Hint Escalation**:
    1. Level 0: Pure independent placement.
    2. Level 1: Gentle auditory instruction prompt.
    3. Level 2: Pulsing outline halo around correct target slot.
    4. Level 3: Soft magnetic snap pull.
  - **Independence Score Calculation**: Measures the percentage of shapes placed with zero hint assistance.
  - **Motor Path Jitter Metric**: Quantifies hand tremor along the drag path ($\text{Jitter} = \sqrt{\Delta x^2 + \Delta y^2}$).

### 4. Daily Routine Sequencer (Activities of Daily Living - ADL)
- **Goal**: Reinforces temporal orientation and chronological execution of daily living habits.
- **Features**:
  - Step-by-step card ordering for morning tea, morning hydration, medication, gardening, and rest.
  - Synchronized with the caretaker's daily schedule routine.

---

## 4. Clinical Telemetry & Biomarker Drift Engine

### Objective Cognitive Biomarkers
- **Motor Initiation Latency (ms)**: Measured from prompt/demo completion to the patient's first screen contact.
- **Total Execution Duration (ms)**: Time taken to complete the full sequence or shape drag.
- **Motor Tremor Jitter (px)**: Continuous sampling of pointer deviation during drag interactions.
- **Sequence vs Spatial Accuracy**: Differentiates whether errors are due to memory order failure or spatial disorientation.
- **Perseverative Slips**: Flags involuntary recurrence of previous responses.

### 7-Day Cognitive Drift Detection
- **Mathematical Formula**:
  $$\text{Cognitive Drift \%} = \left(\frac{\text{Mean Latency}_{\text{7-day}} - \text{Baseline Latency}}{\text{Baseline Latency}}\right) \times 100$$
- **Clinical Action Threshold**:
  - $< 35\%$: Geriatric baseline stability.
  - $\ge 35\%$: Triggers a prominent amber/rose clinical review warning with recommendation for medical consultation.

---

## 5. Caretaker Clinical Hub & Management

### Unified Analytics Dashboard
- **Comprehensive Multi-Game Timeline**:
  - Toggle between Accuracy (%) and Speed (seconds).
  - Plotted against healthy clinical reference lines (70% target zone).
- **Game 1 Analytics**: Relational tier decay bars, cognitive fatigue drop percentage, and recurring identity confusion logs.
- **Game 2 Analytics**: Adaptive staircase AreaChart, working memory composite score, clinical status badges, and full trial-by-trial logs.
- **Game 3 Analytics**: Independence scores, solve times, per-shape difficulty rankings, and confusion pair matrix.
- **Cross-Tab Realtime Reactivity**: Leverages `BroadcastChannel` and `storage` events to update instantly when a game completes in another tab.

### Biographical Question CMS
- **Family Question Authoring**: Add, edit, delete, and reorder family memories.
- **Smart Distractor Suggestions**: Automatically suggests plausible distractors from the family profile.
- **Tier Assignment**: Assigns questions to Core, Child, Sibling, or Extended relationship tiers.

### Patient Security & Credential Control
- **Caretaker Master Password**: Controls patient portal access credentials.
- **One-Click Share Credentials**: Formats caretaker email, patient password, and portal URL for easy sharing with visiting relatives or attendants.

---

## 6. Offline-First Dual Persistence & Resiliency

- **Primary IndexedDB (Dexie.js)**: All games, trials, questions, and telemetry are stored locally first. Works completely without internet connection.
- **LocalStorage Dual-Write Backup**: Automatic fallback backup (`smriti_patterntrace_trials_backup`, `smriti_biographical_trials_backup`) ensuring zero data loss even in private browsing or constrained environments.
- **Automated Queue Synchronization**: `useSyncEngine` monitors browser connectivity and pushes accumulated offline batches to FastAPI / Supabase PostgreSQL upon reconnect.
- **Resilient Patient Lookup**: Lenient type tolerance (Number, String, UUID) ensures trials are never lost due to schema or authentication type mismatches.

---

## 7. Public Health & Rural Telephony Integrations

### ASHA Door-to-Door Field Screening Mode
- Designed for rural Accredited Social Health Activists (ASHA workers) visiting village households.
- **Triage Classification**:
  - `Green (Stable)`: Cognitive responses within normal baseline.
  - `Amber (Review Needed)`: Mild memory variation or response slowing.
  - `Red (Clinical Alert)`: Severe confusion, motor drift, or perseveration.
- Fully operational offline with village name, patient age, and qualitative triage notes.

### 2G Feature Phone IVR Simulator
- Provides accessibility for rural elders who lack touchscreens or internet connectivity.
- Simulated DTMF keypad with realistic telephony audio tones.
- Automated voice prompts evaluating orientation (Morning vs Evening) and basic memory recall.
- Direct telemetry integration with the central clinic database.

### eSanjeevani Teleconsultation & PDF Clinical Dossier
- Integrates directly with the Government of India's national telemedicine system.
- One-click export of clinical dossiers aligned with ICMR-NARI and MoCA guidelines.
- Pre-populates ABHA ID, 7-day cognitive drift metrics, and motor tremor indices for medical officers.

### DPDP Act 2023 Compliance
- Digital Personal Data Protection Act compliance with granular consent switches:
  - Telemetry Collection Consent
  - Voice Storage & Biometric Consent
  - ABHA Linkage Consent
- Every consent transaction is stamped with a client-generated SHA-256 cryptographic session signature.

---

## 8. Localization & Indian Regional Dialects

- **Supported Languages**:
  1. **Odia (ଓଡ଼ିଆ)**: Full translation and speech synthesis for Odisha.
  2. **Assamese (অসমীয়া)**: Full translation and speech synthesis for Assam and North East.
  3. **Gujarati (ગુજરાતી)**: Full translation and speech synthesis for Gujarat.
  4. **English**: Indian English terminology and prompts.
- **IP-Based Auto-Detection**: Automatically detects visitor region upon first launch while allowing manual toggling via the top navigation bar.
