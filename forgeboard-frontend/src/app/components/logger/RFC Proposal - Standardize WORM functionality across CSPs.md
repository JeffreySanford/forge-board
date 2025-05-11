# RFC Proposal: Standardize WORM functionality across CSPs

## Overview

FedRAMP authorizes many Cloud Service Providers (CSPs), including AWS, Azure, and Google Cloud. Each CSP has its own implementation of WORM (Write Once, Read Many) functionality. As a starting point, let's use the GSA's CDM definition of WORM in FedRAMP:

> Write Once Read Many (WORM) storage, cannot be altered once data is written. Retainment period before deletion can be set, but data cannot be modified. Data cannot be deleted until the retainment period expires.

Currently, there are no standardized set of requirements for what a compliant WORM implementation looks like, and agencies have inconsistent expectations when it comes to WORM functionality. This RFC proposes that the PMO establish baseline requirements to standardize how FedRAMP CSPs implement WORM.

## Requirements

The WORM baseline requirements would apply to CSPs that offer WORM or WORM-like functionality. Generally, the requirements would focus on:

* How data is protected from modification once it's been written
* How CSPs implement retention periods and deletion
* What technical controls need to be in place to ensure WORM compliance
* What documentation CSPs need to provide about their WORM functionality

## Benefits

Standardization would benefit both CSPs and agencies by:

1. Providing clear expectations for CSPs implementing WORM functionality
2. Ensuring consistent security controls across different cloud environments
3. Simplifying the authorization process for CSPs with WORM features
4. Giving agencies confidence that WORM implementations meet a consistent standard regardless of provider

## Questions for Discussion

1. What specific technical requirements should be included in a WORM baseline?
2. Should there be different tiers or levels of WORM compliance?
3. How should FedRAMP verify and test WORM functionality during assessments?
4. What existing implementations or standards should be referenced when developing these requirements?

## Next Steps

Based on feedback from this discussion, we can draft a more detailed proposal for WORM standardization requirements that could be incorporated into FedRAMP guidance.