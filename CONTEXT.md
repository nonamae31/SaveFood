# SaveFood Domain Context

This document captures the ubiquitous language used in the SaveFood project to ensure consistency between technical implementation and domain concepts.

## Language

**Subscription Plan**:
A tier of service offered by the platform to stores, with a specific name, description, and monthly price (e.g., Basic, Premium).
_Avoid_: Gói cước (in code), Package, Tier.

**Store Subscription**:
The specific enrollment record of a store in a Subscription Plan, including start and end dates and its current status.
_Avoid_: User Subscription, Store Plan.
