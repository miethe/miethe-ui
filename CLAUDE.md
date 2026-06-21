# MietheUiStandaloneMie — CLAUDE.md

> Project context, pre-wired to the agentic launchpad's canonical model. Authored by the
> Agentic Operator's T4 scaffolder (`op new`). Edit freely — the seams below are the contract.

## The canonical model (verbatim — do not paraphrase)

> Intent defines the destination. Task trees define the path. Agent postures define the cognitive style. SkillMeat stores the reusable stacks. CCDash proves what works. MeatyWiki remembers why. The control plane routes the next move.

Repo punchline: *"the friction is almost never inside a tool. It is in the seams between
them."* This project closes seams; it does not add tools for their own sake.

## The five subsystems this project plugs into

| Subsystem | Layer | What it holds for MietheUiStandaloneMie |
|---|---|---|
| **research-foundry (`rf`)** | L1/L9 — evidence | Bounded research passes → source cards + claim ledger |
| **Agent Review Council (`arc`)** | L9 — governance | Council review → scorecard before anything ships |
| **MeatyWiki** | L6 — AgentKB | The living "why" — durable notes, decisions, namespace |
| **SkillMeat** | L4 — reusable stacks | Versioned skills/agents deployed as the `agentic-baseline` bundle |
| **IntentTree (`itt`)** | L2 — task trees | Typed work tree: Pillar→WorkArea→WorkPackage→AtomicTask→Step |

The **control plane** (L8 — the Operator, `op`) routes idea → subsystem by **route × tier**.

## Operator entry points

```
op "<idea>"                 classify (route × tier) + run to the first gate
op capture "<idea>"         force a T0 Ideas capture
op research|council|knowledge|artifact|tasks "<text>"   force a route
op new "<idea>" [--tier N]  the tiered "new thing" scaffolder
op status|show|list <run>   read run records (never calls a model)
op approve|reject <run>     resolve the pending gate
op doctor                   probe subsystem availability
```

## This project's route into the loop

Declare the canonical loop slice this project owns: **capture → plan → run → verify →
writeback**. Implement capture → triage → verify → writeback **before** advanced swarm
adapters. Writeback targets: `meatywiki, skillmeat, ccdash` (edit to taste).

## KEEP principles (verbatim — carry these forward)

- Markdown/YAML is the source of truth (readable without a DB); files canonical, DBs derived.
- Work begins with intent, not prompts.
- Every material claim is auditable (supported / labeled-inference / labeled-speculation / unresolved).
- Cheap/free models extract; expensive models synthesize.
- The swarm is disposable; the evidence bundle is durable.
- Governance is a runtime gate, not a memo.
- CCDash proves which workflows work — emit telemetry from day one.
- Local-by-default, loopback-only; no LLM on the render/navigation path (LLM fires on capture, opt-in).

## The standing escalation trigger ("stop and confirm")

> *"This decision would change UX, change behavior beyond documented scope, increase
> per-operation LLM cost, or violate the host repo's existing conventions."*

When any of these is true: **stop and confirm with the human before proceeding.** Encode it as
the execution packet's `approval_policy: human_review_before_merge` and
`require_human_approval_for: [production_deploy, destructive_changes, external_send]`.

## Agent waves shipped with this project

Postures available to delegate to (from the launchpad inventory): **architects** (Architect),
**pm** (Strategist/Operator), **ai** (Implementer/Researcher), **research** (Researcher),
**tech-writers** (Editor/Synthesizer). Subagent front-matter: `name`, `description`, `tools`,
`permission_mode`, `model`; body = role + numbered hard rules.

## Quality gates + worktree preflight

- `python3 -m pytest -q` must pass; a hanging test is worse than a failing one.
- Worktree preflight: assert resolved tool paths (`which pytest && pytest --version`).
- Incremental writes = checkpointing. Central commit discipline at wave boundaries.
- An adversarial read-only review pass after "all green" is worth one more delegate.
