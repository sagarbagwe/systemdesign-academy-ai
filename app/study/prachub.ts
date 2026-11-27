import type { StudyTopic } from "./types";

export const pracHubFoundations = "https://prachub.com/learning/foundations-of-system-design";
export const pracHubCasebook = "https://prachub.com/learning/system-design-interview-casebook";

export const pracHubTopics: StudyTopic[] = [
  {
    id: "runtime-resources", title: "Runtime Resources and Observability", group: "concepts", practice: "metrics-alerting",
    summary: "Connect queueing, CPU, memory, and connection limits to what users experience.",
    method: "Choose one user operation. Measure its latency, traffic and error rate, then look at saturation across the resources it uses. Compare CPU usage, run-queue length, memory pressure, connection pool wait time, and downstream latency before adding capacity. Sample a trace to see where the request spent its time.",
    tradeoff: "Detailed traces and per-tenant metrics help diagnose outliers, but too many distinct labels raise storage costs. Aggregate normal traffic and retain representative or slow traces.",
    say: "I measure end-to-end latency first, then use a trace to find where requests wait. If app workers spend their time waiting for database connections, adding workers can make the queue longer.",
    diagram: [
      ["API replicas", "Metrics collector", "Record latency and saturation", "async"],
      ["API replicas", "Trace store", "Retain sampled request spans", "async"],
      ["Metrics collector", "Alerting rules", "Evaluate user error budget", "async"],
    ],
  },
  {
    id: "time-and-ordering", title: "Time, Ordering, and Coordination", group: "concepts", practice: "distributed-lock",
    summary: "Choose an ordering scope and make stale writers safe under retries.",
    method: "Name which operations need an order. For per-order changes, attach a monotonically increasing version assigned by the owning writer. Use wall-clock time for display and a single trusted clock for lease expiry. Store the highest accepted version or fence at the sink so a delayed worker cannot overwrite a newer result.",
    tradeoff: "A global order can simplify reasoning, but puts unrelated traffic behind the same coordinator. A partition-local order scales independently and leaves cross-partition ordering to explicit business rules.",
    say: "I only need to order updates to the same order ID. Each write checks the previous version. If a worker wakes up after its lease expires, the sink rejects the stale fence.",
    diagram: [
      ["Worker", "Lease coordinator", "Acquire increasing fence"],
      ["Worker", "State store", "Write with fence and expected version"],
      ["State store", "Conflict response", "Reject older fence", "reject"],
    ],
  },
  {
    id: "trust-boundaries", title: "Service Trust and Access Control", group: "concepts", practice: "review-policy-service",
    summary: "Authenticate callers, enforce permissions on each resource, and handle changes in access.",
    method: "Draw the boundary where user input becomes an authenticated request. Pass a verified caller or service identity to the backend. Check tenant membership and object-level permissions where data is read or changed. Give background jobs scoped identities and recheck permissions before issuing a download grant. Log the policy revision and decision for sensitive operations.",
    tradeoff: "Caching permission decisions improves read latency. Short lifetimes or version checks bound how long revoked access can survive. Sensitive writes may warrant checking the authoritative policy on every call.",
    say: "The gateway verifies the token. The resource service decides if this caller can read this object. I tie grants to a scope and expiry so a leaked or revoked token has a bounded lifetime.",
    diagram: [
      ["Client", "API gateway", "Send authenticated request"],
      ["API gateway", "Resource service", "Pass verified identity"],
      ["Resource service", "Policy store", "Check object and tenant access"],
      ["Resource service", "403 response", "Deny unauthorized request", "reject"],
    ],
  },
  {
    id: "system-design-scope", title: "System Boundaries and Deployment Choices", group: "concepts", practice: "deployment-pipeline",
    summary: "Define the smallest useful system and explain when to split it.",
    method: "Write the actors, entry points, external dependencies and owned state on the board. Start with modules in one deployable service if they share a transaction and operating needs. Split a boundary when throughput, release cadence, team ownership or failure isolation calls for it. Then choose an API or event contract and decide which service owns each record.",
    tradeoff: "Independent deployment can isolate failures and allow separate scaling. It adds network calls, versioning and failure-handling work. Demonstrate the benefit with a specific traffic or reliability constraint.",
    say: "I’ll start with one service and a module for each responsibility. If background work competes with API latency, I can put it in a separate worker and keep the same data ownership.",
    diagram: [
      ["Client", "Application API", "Send request"],
      ["Application API", "Primary database", "Commit state and outbox"],
      ["Primary database", "Background worker", "Pick up committed work", "async"],
    ],
  },
];

export const pracHubStudyMap = [
  { name: "Interview scope and practice", summary: "Clarify requirements, draw boundaries and choose a deployment shape.", href: "#study-topic/system-design-scope" },
  { name: "System qualities and estimation", summary: "Estimate load, storage and throughput before choosing a scaling plan.", href: "#study-topic/numbers-to-know" },
  { name: "Runtime resources and monitoring", summary: "Diagnose waiting time, saturation and error-budget burn.", href: "#study-topic/runtime-resources" },
  { name: "Networks, DNS, protocols and API formats", summary: "Trace name resolution, transport and request contracts.", href: "#study-topic/networking-essentials" },
  { name: "Traffic routing and load balancing", summary: "Use health checks and connection draining to balance application requests.", href: "#answer/load-balancer" },
  { name: "Time, ordering and coordination", summary: "Use versions, ordering scopes and leases to recover from delays.", href: "#study-topic/time-and-ordering" },
  { name: "Availability, recovery and failure drills", summary: "Estimate recovery time and enforce a single writer during failover.", href: "#answer/regional-recovery" },
  { name: "Databases, replication and partitioning", summary: "Choose keys and relocate partitions while preserving data visibility.", href: "#study-topic/sharding" },
  { name: "Security, trust and permissions", summary: "Place authentication and object authorization checks at the right boundaries.", href: "#study-topic/trust-boundaries" },
  { name: "CDNs, identifiers and distributed caches", summary: "Choose cache keys, expiration and routing for popular objects.", href: "#answer/distributed-cache" },
  { name: "Messaging, rate limits and blob delivery", summary: "Separate traffic admission, asynchronous work and large transfers.", href: "#study-topic/handling-large-blobs" },
  { name: "Search, logging, jobs and counters", summary: "Build derived views from durable inputs and track their freshness.", href: "#answer/distributed-cron" },
  { name: "Video and community platforms", summary: "Balance playback latency, CDN traffic and community interaction.", href: "#answer/video" },
  { name: "Maps, nearby search, ride sharing and delivery", summary: "Separate spatial candidate selection from exclusive assignment.", href: "#answer/ride-hailing" },
  { name: "Feeds, photo sharing and redirects", summary: "Pick a read model and explain cache and write amplification.", href: "#answer/social-feed" },
  { name: "Crawling, typeahead, messaging and collaboration", summary: "Use checkpoints, versions and offsets for incremental work.", href: "#answer/collaborative-docs" },
  { name: "Deployment, payments and coding platforms", summary: "Use state transitions and recoverable jobs to publish outcomes safely.", href: "#answer/deployment-pipeline" },
  { name: "AI systems and ML infrastructure", summary: "Handle model capacity, batching and request admission.", href: "#answer/llm-inference" },
  { name: "Real systems, failure cases and final review", summary: "Explain how a production system scales and rehearse a failure of its main dependency.", href: "#study/cases" },
] as const;
