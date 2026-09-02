---
name: mermaid-skill
description: >-
  Author Mermaid diagrams as .mmd text files with fully automatic layout.
  USE THIS SKILL when user mentions diagram, flowchart, sequence diagram, class
  diagram, ER diagram, state machine, architecture, git graph, mindmap, gantt,
  pie, 画图, 架构图, 流程图, 时序图, 思维导图. PROACTIVELY USE when explaining
  ANY system with 3+ components, API flows, authentication sequences, class
  hierarchies, database schemas, or state machines. Supports 17+ diagram types.
  This skill only WRITES the .mmd source; for SVG/ASCII rendering use the
  beautiful-mermaid skill.
homepage: https://github.com/Agents365-ai/creating-mermaid-diagrams
version: 1.2.0
---

# Mermaid Diagrams

Author Mermaid diagrams as `.mmd` text files. **This skill writes the source only** — no rendering, no export.

**Key advantage:** Text-based syntax with **fully automatic layout** — no x/y coordinates needed. The `.mmd` file is versionable, embeds in Markdown, and can be rendered later by any Mermaid renderer.

## When to use / when NOT to use

**Use this skill for:** diagrams-as-code with automatic layout (flowchart, sequence, class, state, ER, gantt, mindmap, architecture, …) — text source that lives in git and embeds in Markdown.

**Do NOT use it — route elsewhere — for:**

- Rendering `.mmd` to **SVG or ASCII/Unicode** → use the **beautiful-mermaid** skill.
- Pixel-precise placement, custom layout, branded icons, or heavy styling → **drawio**.
- A hand-drawn / sketchy aesthetic → **excalidraw** or **tldraw**.
- Strict, conventional UML notation → **plantuml**.

## Workflow

1. **Pick diagram type** — choose from the table below
2. **Generate** — write the `.mmd` file to disk
3. **Review with the user** — apply minimal `.mmd` edits per request (change a label, add/remove a node, swap `TD`↔`LR`, wrap in a `subgraph`, …)
4. **Report** — tell the user the `.mmd` file path(s)

> If the user then wants an image or terminal output, hand the `.mmd` to the **beautiful-mermaid** skill.

## Diagram Types

| Type | Keyword | Use for |
| ------ | --------- | --------- |
| Flowchart | `flowchart TD/LR` | processes, pipelines, decisions |
| Sequence | `sequenceDiagram` | API calls, message passing |
| Class | `classDiagram` | OOP models, data structures |
| ER | `erDiagram` | database schemas |
| State | `stateDiagram-v2` | state machines, lifecycle |
| Gantt | `gantt` | project timelines |
| Pie | `pie` | proportions |
| Git Graph | `gitGraph` | branch strategies |
| C4 Context | `C4Context` | high-level system context |
| Architecture | `architecture-beta` | cloud / CI/CD service layouts |
| Mind Map | `mindmap` | topic breakdowns |
| User Journey | `journey` | user-experience flows |
| Use Case | `usecase-beta` | actor–system interactions (UML) |
| Cynefin | `cynefin-beta` | sense-making / complexity domains |
| Event Modeling | `eventmodeling` | event-driven system timelines |
| Tree View | `treeView-beta` | file / directory hierarchies |
| Wardley Maps | `wardley-beta` | business strategy / value chains |

## Syntax Reference

**Flowchart**: See [reference/FLOWCHART.md](reference/FLOWCHART.md)
**Sequence**: See [reference/SEQUENCE.md](reference/SEQUENCE.md)
**Class & ER**: See [reference/CLASS-ER.md](reference/CLASS-ER.md)
**Architecture**: See [reference/ARCHITECTURE.md](reference/ARCHITECTURE.md)
**Use Case**: See [reference/USECASE.md](reference/USECASE.md)
**Other types**: See [reference/OTHER-TYPES.md](reference/OTHER-TYPES.md)

## Examples

### Example 1: API Authentication Flow

**User prompt:**
> Create a sequence diagram for JWT authentication

**Generated `.mmd`:**

```mermaid
sequenceDiagram
  participant C as Client
  participant G as API Gateway
  participant A as Auth Service
  participant D as Database

  C->>G: POST /login {email, password}
  G->>A: validate(credentials)
  A->>D: SELECT user WHERE email=?
  D-->>A: user record
  A-->>A: verify password hash
  A-->>G: 200 OK + JWT token
  G-->>C: {token: "eyJhbG..."}
```

**Output file:** `auth-flow.mmd`

---

### Example 2: Microservices Architecture

**User prompt:**
> Draw an e-commerce microservices architecture

**Generated `.mmd`:**

```mermaid
flowchart TD
  subgraph Clients
    M[Mobile App]
    W[Web App]
  end

  GW[API Gateway]

  subgraph Services
    US[User Service]
    OS[Order Service]
    PS[Product Service]
    PAY[Payment Service]
  end

  subgraph Data
    UDB[(User DB)]
    ODB[(Order DB)]
    PDB[(Product DB)]
    REDIS[(Redis Cache)]
  end

  M & W --> GW
  GW --> US & OS & PS & PAY
  US --> UDB
  OS --> ODB
  PS --> PDB
  PAY --> REDIS
```

**Output file:** `ecommerce-arch.mmd`

---

### Example 3: Order State Machine

**User prompt:**
> Show order lifecycle states

**Generated `.mmd`:**

```mermaid
stateDiagram-v2
  [*] --> Pending : order created
  Pending --> Confirmed : payment success
  Pending --> Cancelled : timeout/cancel
  Confirmed --> Shipped : dispatched
  Shipped --> Delivered : received
  Delivered --> [*]
  Cancelled --> [*]
```

**Output file:** `order-states.mmd`

---

### Example 4: Cloud Architecture

**User prompt:**
> Draw a simple service architecture for an API

**Generated `.mmd`:**

```mermaid
architecture-beta
  group api(cloud)[API]

  service gateway(internet)[Gateway] in api
  service db(database)[Database] in api
  service cache(disk)[Cache] in api

  gateway:R --> L:db
  gateway:B --> T:cache
```

**Output file:** `api-architecture.mmd`
