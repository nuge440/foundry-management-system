# Form Fields Documentation

This document lists all form fields organized by their respective tabs in the application.

---

## Job Tab

The main job entry/edit form contains the following fields:

| Field | Type | Options/Format |
|-------|------|----------------|
| Status | Dropdown | New, In Progress, Solidification/Casting, CAD Work, Waiting on CAM, Completed |
| Task/Location | Text | - |
| Company | Dropdown | ABB, AGCO, CAT, EATON, General Electric |
| Customer | Text | - |
| Part Number | Text | - |
| Job Number | Text | - |
| Description | Textarea | - |
| Part Type | Text | - |
| Casting Type | Text | - |
| Sand Mold Size | Text | Cope/Cheek/Drag format |
| Material | Dropdown | Populated from materials database |
| Pour Weight | Text | - |
| Owner | Text | - |
| Quantity Needed | Number | - |
| Molds Needed | Number | - |
| Certs | Dropdown | Yes, No |
| Custom Chills Ordered | Text | - |
| Cores Ordered | Date | - |
| Promised Date | Date | - |
| Heat Treat | Text | - |
| Assembly Code | Text | - |
| Est Assembly Time | Text | - |
| Model Approved Date | Date | - |
| Notes | Textarea | - |
| Inform Melt | Dropdown | Yes, No |
| Molds Split Off | Text | - |
| Attachments | File Upload | - |

---

## Design Tab

The design information form contains the following fields:

| Field | Type | Options/Format |
|-------|------|----------------|
| Solidification | Text | - |
| Solidification Quality | Dropdown | Nova, Magma |
| Sprues | Text | - |
| Basin Size | Dropdown | Small, Large, Double |
| Gating System | Text | - |

---

## Assembly Tab

The assembly information form contains the following fields:

| Field | Type | Options/Format |
|-------|------|----------------|
| Mold Size | Text | - |
| Paint | Text | - |
| Robot Time Cope | Text | - |
| Robot Time Drag | Text | - |
| MPI Certified | Text | - |
| Assembly Notes | Text | - |
| Core Boxes | Text | - |
| Special Tooling | Text | - |

---

## Cleaning Room Tab

The cleaning room information form contains the following fields:

| Field | Type | Options/Format |
|-------|------|----------------|
| Clean Time | Text | - |
| Mold Rating | Text | - |
| Pouring Pictures | Text | - |
| Casting Pictures | Text | - |
| Core Assembly | Text | - |
| Core Cost | Text | - |
| Mold Assembly | Text | - |
| Casting Weight (lbs) | Text | - |
| Pour Point | Text | - |
| Assembly | Text | - |
| Additional Notes | Textarea | - |

---

## Pouring Tab

The pouring instructions form contains the following fields:

### Job Selection (Required First)

| Field | Type | Options/Format |
|-------|------|----------------|
| Select Job | Dropdown | List of available jobs (Job Number - Company - Part Number) |

### Text Input Fields

| Field | Type | Options/Format |
|-------|------|----------------|
| Pour Temp Min | Text | e.g., 2700 |
| Pour Temp Max | Text | e.g., 2850 |
| Tap Out Temp | Text | e.g., 2900 |
| Pour Uphill Step | Text | Step details |
| Vacuum Time | Text | e.g., 30 minutes |
| Test Bar Type | Text | - |
| Tilt Step Direction | Text | e.g., Left, Right, Forward |

### Checkbox Options

| Field | Type | Default |
|-------|------|---------|
| Pour Uphill | Checkbox | Unchecked |
| Vacuum Vents | Checkbox | Unchecked |
| Hot Top | Checkbox | Unchecked |
| Knock Off Risers | Checkbox | Unchecked |
| Degas In Ladle | Checkbox | Unchecked |
| Charpy Required | Checkbox | Unchecked |
| Build Wall | Checkbox | Unchecked |
| Needs Borescope | Checkbox | Unchecked |
