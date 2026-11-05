# Merge offline note edits — outcome: done (local commit; no remote, no PR)

Spec: `spec.yaml` (risk: edge). Approval was automatic (smoke test, Recommended option chosen).

## What the builder did
Added `src/merge.mjs` (`merge(local, remote)`) and `test/merge.test.mjs`. Newest `updatedAt` wins per id. Ties: delete beats edit, then larger text, then larger canonical JSON. Tombstones are kept, inputs are not mutated. `node --test`: 4/4 pass.

## Findings
| id | source | round | severity | claim | status |
|----|--------|-------|----------|-------|--------|
| f-1 | reviewer-1 | 1 | minor | cmp inconsistent for missing/NaN/mixed-type updatedAt | wontfix (outside spec input shape) |
| f-2 | reviewer-1 | 1 | minor | id `__proto__` dropped | wontfix (minor) |

## Verification
| flow | result | evidence |
|------|--------|----------|
| commutative | pass | 200k random fuzz triples, commutative and associative |
| delete-vs-edit | pass | newer wins both ways, tie goes to delete, rule documented in file header |

## Usage
| agent | tokens | ms |
|-------|--------|----|
| builder-1 | 37858 | 32856 |
| reviewer-1 | 9156 | 16062 |
| verifier-commutative | 9863 | 28484 |
| verifier-delete-vs-edit | 10103 | 28565 |
| **total** | 67080 | |

## Remaining risks
Malformed entries (missing or non-comparable `updatedAt`) and the `__proto__` id are unhandled (f-1, f-2).
