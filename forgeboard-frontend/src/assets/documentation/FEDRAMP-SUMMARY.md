# 📚 FedRAMP OSCAL Catalog Guide  
### Location, Purpose, Structure & Practical Examples  

---

## 🚀 Executive Overview  
The **FedRAMP catalog** is a machine‑readable listing of every NIST SP 800‑53 Rev 5 control that FedRAMP recognizes, enriched with FedRAMP‑specific metadata. Maintained in **OSCAL** (Open Security Controls Assessment Language) JSON, XML, and YAML, it lives in the **GSA/fedramp‑automation** GitHub repository and powers all FedRAMP baseline profiles (High, Moderate, Low, and LI‑SaaS). Using the catalog lets tools like ForgeBoard auto‑map evidence, calculate deltas when NIST updates, and export audit packages at the click of a button.  

---

## 1️⃣ Where to Find It  

| Resource | Contents | URL |  
|----------|----------|-----|  
| **GSA/fedramp‑automation** repo | `fedramp_catalog_rev5*.json/xml/yaml`, Baseline profiles, Resolved catalogs | github.com/GSA/fedramp‑automation citeturn0search0|  
| **FedRAMP OSCAL Baselines site** | Download links + diagrams of catalog→profile→SSP flow | automate.fedramp.gov (OSCAL‑based baselines) citeturn0search4|  
| **FedRAMP Rev‑5 Transition page** | Overview + links to catalog & profiles | fedramp.gov/rev5-transition citeturn0search3|  

Formats available: **JSON**, **XML**, **YAML** (lossless converters exist). citeturn0search6  

---

## 2️⃣ Purpose & Workflow  

```mermaid
flowchart LR
    CAT[FedRAMP Catalog] --> PROF[Baseline Profile<br/>(High, Mod, Low, LI‑SaaS)]
    PROF --> SSP[System Security Plan (OSCAL)]
    PROF --> COMP[Component Definition]
    SSP --> ASSESS[SAP / SAR]
```

* **Catalog:** canonical definitions of controls.  
* **Profile:** selects & tailors catalog controls into a baseline. citeturn0search4  
* **SSP / Component:** document how your system or component implements each selected control.  

The catalog is **never edited directly**; tailoring happens in profiles so lineage remains intact.  

---

## 3️⃣ Internal Structure (Catalog Sections)  

| Section | Description | Example Snippet |  
|---------|-------------|-----------------|  
| `metadata` | Document ID, version, last‑modified, OSCAL schema refs | `"title": "FedRAMP Rev5 Catalog"` |  
| `params` | Reusable parameters (like `{ac_2_personnel}`) that controls reference | `{"id":"fedramp.ac.2.personnel","label":"Authorized Personnel"}` |  
| `groups` | Logical buckets → **20 control families** (AC, AU, CM, etc.) | `"title":"Access Control Family"` |  
| `controls` | Individual control objects with statements, objectives, links | `{"id":"ac-2","title":"Account Management", ...}` |  

> **Tip:** each control can contain nested subcontrols (`ac-2.1`, `ac-2.2`) and call specific parameters to allow profile‑level overrides. citeturn0search5  

---

## 4️⃣ Control Family Examples  

| Family (ID) | Sample Control | Real‑World Check |  
|-------------|----------------|------------------|  
| **AC – Access Control** | **AC‑2** Account Management | SlimChain ledger ensures only authorized keys can commit events. |  
| **AU – Audit & Accountability** | **AU‑3** Content of Audit Records | ForgeBoard logs include timestamp, event type, subject ID, outcome. |  
| **SC – System & Communications** | **SC‑28** Protection of Information at Rest | Oracle TDE or SlimChain encryption satisfies this. |  

Each family appears as a `<group>` node inside the catalog.  

---

## 5️⃣ Baseline Profiles (Catalog Derivatives)  

| Baseline Profile | Control Count | Use Case | File |  
|------------------|---------------|----------|------|  
| **High** | 410 | High‑impact (e.g., health, law enforcement) | `fedramp_profile_high_rev5.json` citeturn0search1|  
| **Moderate** | 323 | Most SaaS / PaaS offerings | `fedramp_profile_moderate_rev5.json` |  
| **Low** | 156 | Public data websites | `fedramp_profile_low_rev5.json` |  
| **LI‑SaaS** | 125 | Tailored low‑impact SaaS | `fedramp_profile_lisaas_rev5.json` |  

Baseline profiles reference the catalog via `_ref` URIs and may **modify parameters** (e.g., set password length to 12). citeturn0search9  

---

## 6️⃣ Extended Artifacts  

FedRAMP automation repo also ships **resolved catalogs**—the output when a profile is merged with the master catalog, producing a self‑contained list of applicable controls. Useful for static scans. citeturn0search1  

Other OSCAL layers you’ll encounter:  

* **Component Definition:** machine‑readable “implementation statements” reusable across systems. citeturn0search10  
* **Assessment Assets:** SAP, SAR, POA&M templates in OSCAL. citeturn0search7  

---

## 7️⃣ Practical Usage Scenarios  

1. **ForgeBoard Evidence Mapping**  
   * Import catalog → generate DB schema with control IDs.  
   * Each SlimChain event references `control-id` & `objective-id`.  

2. **Change Diff** (Rev‑6 preview)  
   * Watch upstream catalog repo; run `oscal-diff` to flag added/removed controls.  

3. **Tailored Profile for True North 3PAO Services**  
   * Start from Moderate baseline → drop SC‑22 if not applicable → export `truenorth_profile_mod.json`.  

---

## 8️⃣ Key Takeaways  

* **Location:** GitHub `GSA/fedramp-automation` houses the authoritative catalogs & profiles.  
* **Purpose:** Provide machine‑readable, version‑controlled NIST 800‑53 control definitions enriched for FedRAMP.  
* **Structure:** metadata → params → groups → controls; 20 families inside groups.  
* **Categories:** Catalog vs Profile vs Resolved Catalog; plus auxiliary models (SSP, Component).  
* **Examples:** AC‑2, AU‑3, SC‑28; baseline control counts High–Low.  

**Master the catalog, and you master FedRAMP automation.** 🦅  
