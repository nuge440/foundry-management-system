# SCP Dashboard — Department Buckets & Task Mapping (R2)

**Date:** February 23, 2026
**Based on:** 2025 JobBoss Routing Data (1,515 jobs)
**Purpose:** Define how routing-derived tasks group into departments with Active/Waiting buckets
**Revision:** R2 — incorporated answers to open questions, maximized routing-derived logic, consolidated conditional work centers

---

## How Buckets Work

Every active job gets a **task** derived from its JobBoss routing operations:
- **Active** = The job has an operation with status **Started** ("S") at this work center — work is happening now
- **Waiting** = The job's first **Open** ("O") operation is at this work center — it's queued up, not started yet

Each task belongs to exactly one **department**. The dashboard shows each department as a card with two counts:
- **Active count** — jobs currently being worked on in this department
- **Waiting count** — jobs queued up, next step is in this department

Some tasks are **manual overrides** — they don't come from routing but can be set by users on the dashboard. These still belong to a department and a bucket.

### Expedite Flag

**EXPEDITE is NOT a workflow step.** If a job has an EXPEDITE work center in its routing or "Expedite" in additional charges, the job row is displayed **bold with a red background** in whatever department it currently resides. This is a visual priority flag, not a department assignment.

---

## 1. Engineering

### Routing-Derived Tasks

| Work Center | Bucket Logic | Task Labels | 2025 Usage |
|---|---|---|---|
| ENG-PREP | Open → Waiting, Started → Active | Engineering Prep | 520 iCast |
| ENG-SIM | Open → Waiting, Started → Active | Solidification / Gating | 527 iCast + 17 prod |
| ENG-CAD | Open → Waiting, Started → Active | CAD | 528 iCast + 27 prod |
| ENG-PRGM | Open → Waiting, Started → Active | Programming | 450 iCast |
| ICAST REW | Open → Waiting, Started → Active | iCast Rework | 794 iCast |

### Job-Level Derived Tasks (no work center)

| Condition | Bucket Logic | Task Labels |
|---|---|---|
| Job is Active but has zero routing operations | Waiting | Awaiting Routing |
| Job Status = "Hold" in JobBoss | Waiting | On Hold |

---

## 2. Core Room

### Routing-Derived Tasks

| Work Center | Bucket Logic | Task Labels | 2025 Usage |
|---|---|---|---|
| CORE-VOX | Open → "Waiting on Core-Vox" (Waiting), Started → "Core-Vox" (Active) | Waiting on Core-Vox / Core-Vox | 1 iCast + some prod |

> **Note:** CORE-VOX is being added to all future job routings. It sits between ICAST and ICAST-ASSY in the routing sequence.

---

## 3. Mold / Pattern

### Routing-Derived Tasks

| Work Center | Bucket Logic | Task Labels | 2025 Usage |
|---|---|---|---|
| MOLD -LOOP | Open → Waiting, Started → Active | Mold -Loop | 528 prod + 21 iCast |
| HAAS - PAT | Open → Waiting, Started → Active | Pattern Machining | 1 iCast |

### Manual Override Tasks

| Task Label | Bucket | Notes |
|---|---|---|
| Waiting on Molds | Waiting | Manually set when waiting for mold availability. **Future:** consider adding a JobBoss routing step to derive this automatically |

---

## 4. Robot / iCast

### Routing-Derived Tasks

| Work Center | Bucket Logic | Task Labels | 2025 Usage |
|---|---|---|---|
| ICAST | Open → "Ready for Robot" (Waiting), Started → "Running on Robot" (Active) | Ready for Robot / Running on Robot | 687 iCast |
| ICAST-ASSY | Open + prev op complete or qty > 0 → "Waiting to be Assembled" (Waiting), Started → "Being Assembled" (Active), Act_Qty > 0 → "Assembled" (Active, overrides Started) | Waiting to be Assembled / Being Assembled / Assembled | 781 iCast |

---

## 5. Pouring / Melt

### Routing-Derived Tasks

| Work Center | Bucket Logic | Task Labels | 2025 Usage |
|---|---|---|---|
| MELT FE | Open → Waiting, Started → Active | Ready to Pour | 798 iCast + 528 prod |

---

## 6. Post-Pour / Finishing

### Routing-Derived Tasks

| Work Center | Bucket Logic | Task Labels | 2025 Usage |
|---|---|---|---|
| CLEAN | MELT FE Act_Qty > 0 AND CLEAN Open → "Cooling" (Waiting), Started → "Grinding Room" (Active) | Cooling / Grinding Room | 800 iCast + 531 prod |
| SHAKEOUT | Open → Waiting, Started → Active | Shakeout | 9 iCast + 169 prod |
| HEAT TREAT | Open → Waiting, Started → Active | Heat Treat | 552 iCast + 170 prod |
| STRAIGHT | Open → Waiting, Started → Active | Straightening | 6 iCast + 7 prod |
| BENCH | Open → Waiting, Started → Active | Bench Work | 3 iCast + 1 prod |
| DIE PEN | Open → Waiting, Started → Active | Dye Penetrant | 36 iCast + 126 prod |
| MPI | Open → Waiting, Started → Active | MPI Testing | 29 iCast |

---

## 7. Inspection / QC

### Routing-Derived Tasks

| Work Center | Bucket Logic | Task Labels | 2025 Usage |
|---|---|---|---|
| INSPECTION | Open → Waiting, Started → Active | Inspection | 799 iCast + 677 prod |
| ENG-INSP | Open → Waiting, Started → Active | Engineering Inspection | 798 iCast + 3 prod |
| LASER SCAN | Open → Waiting, Started → Active | Laser Scan | 551 iCast + 2 prod |
| CMM | Open → Waiting, Started → Active | CMM Measurement | 13 prod |

### Manual Override Tasks

| Task Label | Bucket | Notes |
|---|---|---|
| NDT Inspection | Active | Manually set for non-destructive testing |
| At Foundry For Sample | Waiting | Manually set when sample is at external foundry |

---

## 8. Machining

### Routing-Derived Tasks

| Work Center(s) | Bucket Logic | Task Labels | 2025 Usage |
|---|---|---|---|
| MACHINE, HAAS, INTEGREX, MAZAKH6800, MAZAK 500, MAZAK-UNAT | Open → Waiting, Started → Active | At Machine Shop | ~387 combined |

### Manual Override Tasks

| Task Label | Bucket | Notes |
|---|---|---|
| At STL Precision | Active | Manually set when outsourced to STL Precision |

---

## 9. Certs / Closeout

### Routing-Derived Tasks

| Work Center | Bucket Logic | Task Labels | 2025 Usage |
|---|---|---|---|
| CERT | Open → Waiting, Started → Active | Certs / Documentation | 742 iCast + 64 prod |

---

## 10. Shipping / Complete

### Routing-Derived Tasks

| Task Label | Bucket Logic | 2025 Usage |
|---|---|---|
| Complete | All operations have status Complete → Active | Derived |

### Manual Override Tasks

| Task Label | Bucket | Notes |
|---|---|---|
| Shipping | Active | Manually set when job is being shipped |
| SHIPPED | Active | Manually set when job has shipped |

---

## Complete Work Center → Task Mapping

Every work center from 2025 routing data and its corresponding task label:

| Work Center | Bucket Logic | Task Labels | Department |
|---|---|---|---|
| ENG-PREP | Open/Started | Engineering Prep | Engineering |
| ENG-SIM | Open/Started | Solidification / Gating | Engineering |
| ENG-CAD | Open/Started | CAD | Engineering |
| ENG-PRGM | Open/Started | Programming | Engineering |
| ICAST REW | Open/Started | iCast Rework | Engineering |
| CORE-VOX | Open → "Waiting on Core-Vox" (Waiting), Started → "Core-Vox" (Active) | Waiting on Core-Vox / Core-Vox | Core Room |
| MOLD -LOOP | Open/Started | Mold -Loop | Mold / Pattern |
| HAAS - PAT | Open/Started | Pattern Machining | Mold / Pattern |
| ICAST | Open → "Ready for Robot" (Waiting), Started → "Running on Robot" (Active) | Ready for Robot / Running on Robot | Robot / iCast |
| ICAST-ASSY | Open + prev complete/qty > 0 → "Waiting to be Assembled" (Waiting), Started → "Being Assembled" (Active), Act_Qty > 0 → "Assembled" (Active) | Waiting to be Assembled / Being Assembled / Assembled | Robot / iCast |
| MELT FE | Open/Started | Ready to Pour | Pouring / Melt |
| SHAKEOUT | Open/Started | Shakeout | Post-Pour / Finishing |
| CLEAN | MELT FE Act_Qty > 0 AND Open → "Cooling" (Waiting), Started → "Grinding Room" (Active) | Cooling / Grinding Room | Post-Pour / Finishing |
| HEAT TREAT | Open/Started | Heat Treat | Post-Pour / Finishing |
| STRAIGHT | Open/Started | Straightening | Post-Pour / Finishing |
| BENCH | Open/Started | Bench Work | Post-Pour / Finishing |
| DIE PEN | Open/Started | Dye Penetrant | Post-Pour / Finishing |
| MPI | Open/Started | MPI Testing | Post-Pour / Finishing |
| INSPECTION | Open/Started | Inspection | Inspection / QC |
| ENG-INSP | Open/Started | Engineering Inspection | Inspection / QC |
| LASER SCAN | Open/Started | Laser Scan | Inspection / QC |
| CMM | Open/Started | CMM Measurement | Inspection / QC |
| CERT | Open/Started | Certs / Documentation | Certs / Closeout |
| MACHINE | Open/Started | At Machine Shop | Machining |
| HAAS | Open/Started | At Machine Shop | Machining |
| INTEGREX | Open/Started | At Machine Shop | Machining |
| MAZAKH6800 | Open/Started | At Machine Shop | Machining |
| MAZAK 500 | Open/Started | At Machine Shop | Machining |
| MAZAK-UNAT | Open/Started | At Machine Shop | Machining |
| EXPEDITE | Any | **FLAG ONLY** — not a task | N/A (visual flag) |
| *(no work center)* | Active job, zero routing operations | Awaiting Routing | Engineering |
| *(no work center)* | Job Status = "Hold" | On Hold | Engineering |

---

## Changes from R1

| Change | Detail |
|---|---|
| ENG-CAD task label | Changed from "Waiting on CAD" to "CAD" |
| CLEAN derivation | Now routing-derived: Open → Cooling, Started → Grinding Room. Removed Cooling from Pouring/Melt manual overrides |
| ICAST-ASSY derivation | Fully routing-derived: Open → Waiting to be Assembled, Started → Being Assembled, Act_Qty > 0 → Assembled. Removed manual overrides |
| iCast Rework | Moved from Certs/Closeout to Engineering |
| Expedite | Removed as workflow step. Now a visual flag (bold/red row) |
| MOLD-LOOSE, MOLD-PM | Removed — not in active routing data |
| CORE-PALM | Removed — no work center mapping |
| Table format | Consolidated ICAST, ICAST-ASSY, CLEAN to one row per work center with conditional logic inline. Standardized all tables to Work Center → Bucket Logic → Task Labels → 2025 Usage |
| Awaiting Routing | Now derived: Active job with zero routing operations. Removed from manual overrides |
| Waiting on Sample / On Hold For Review | Replaced with single derived "On Hold" task from JobBoss Hold status |
| Waiting on Pattern | Removed — already covered by HAAS - PAT Open status |
| Cooling | Now derived: MELT FE Act_Qty > 0 AND CLEAN Open. Removed from Pouring/Melt manual overrides |
| CORE-VOX | Now conditional like ICAST: Open → "Waiting on Core-Vox", Started → "Core-Vox". Added to all future routings between ICAST and ICAST-ASSY. Removed manual override |

---

## Remaining Manual Overrides Summary

Only these tasks require manual user input:

| Task Label | Department | Bucket | Notes |
|---|---|---|---|
| Waiting on Molds | Mold / Pattern | Waiting | **Future:** add JobBoss routing to derive |
| NDT Inspection | Inspection / QC | Active | |
| At Foundry For Sample | Inspection / QC | Waiting | |
| At STL Precision | Machining | Active | |
| Shipping | Shipping / Complete | Active | |
| SHIPPED | Shipping / Complete | Active | |

**Total: 6 manual overrides** (down from 16 in R1)
