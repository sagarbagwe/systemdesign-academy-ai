import type { TechnologyPlan, Topic, WorkedAnswer } from "./problems/types";

export type TrackId = "foundations" | "distributed" | "advanced" | "ai";
export type Level = "Beginner" | "Intermediate" | "Advanced";
export type Lesson = {
  id: string;
  track: TrackId;
  title: string;
  minutes: number;
  summary: string;
  principles: string[];
  example: string;
  exercise: string;
  quiz: { question: string; options: string[]; correct: number; explanation: string };
  source: { label: string; url: string };
};

export const tracks = [
  { id: "foundations", title: "System Design Foundations", level: "Beginner", description: "Build a mental model for designing reliable systems at scale.", icon: "layers", color: "purple" },
  { id: "distributed", title: "Distributed Systems", level: "Intermediate", description: "Follow writes across queues, caches, replicas and services.", icon: "network", color: "blue" },
  { id: "advanced", title: "Reliability & Scale", level: "Advanced", description: "Design for overload, failure and controlled recovery.", icon: "activity", color: "green" },
  { id: "ai", title: "Modern AI Systems", level: "Advanced", description: "Design retrieval, inference, and evaluation workflows.", icon: "sparkles", color: "orange" },
] as const;

export const lessons: Lesson[] = [
  {
    id: "requirements", track: "foundations", title: "Requirements & constraints", minutes: 12,
    summary: "Turn an open-ended prompt into an architecture brief.",
    principles: [
      "Start with actors and the actions that matter. A URL shortener needs a way to create a link and resolve it. Analytics can wait if it does not affect the core request path.",
      "Translate quality goals into observable constraints. If redirection should feel instant, propose a percentile latency target measured at a named boundary. Specify how stale a read can be.",
      "Write down scope and assumptions before choosing components. When interviewers add a constraint, explain which earlier assumption you changed.",
    ],
    example: "For a file upload service, a 2 GB limit affects the upload protocol. A project-level visibility rule affects authorization on reads and finalization.",
    exercise: "Write two functional requirements, two measurable quality constraints, and one explicit scope decision for an event booking app.",
    quiz: { question: "Which requirement is easiest to verify?", options: ["Uploads should feel fast", "The system should be globally scalable", "95% of upload initiation requests respond within 300 ms", "The design should use a cache"], correct: 2, explanation: "The target specifies an operation, a threshold, and a percentile. Record the measurement boundary and load profile too." },
    source: { label: "Google SRE · Service Level Objectives", url: "https://sre.google/sre-book/service-level-objectives/" },
  },
  {
    id: "capacity", track: "foundations", title: "Capacity estimation", minutes: 18,
    summary: "Estimate throughput and storage from first principles.",
    principles: [
      "Convert the business workload into independent read and write rates. One million requests per day is about 12 requests per second on average.",
      "Name and justify the peak-to-average ratio. A small global service may have steadier traffic than an event-driven service with a synchronized release.",
      "Estimate storage from rows or events multiplied by payload width and retention. Account separately for indexes, replication, backups and transfer.",
    ],
    example: "A service storing 100,000 records per day at 400 bytes for 30 days holds about 1.2 GB of payload before storage overhead.",
    exercise: "Estimate peak reads and monthly retained payload for 2.4 million daily reads, 30,000 writes, 800 bytes per write, and a 10× read peak.",
    quiz: { question: "What is the average rate of 864,000 requests per day?", options: ["1 request/s", "10 requests/s", "100 requests/s", "1,000 requests/s"], correct: 1, explanation: "Divide requests by 86,400 seconds per day. Apply a peak factor only when estimating peak load." },
    source: { label: "Google SRE · Handling Overload", url: "https://sre.google/sre-book/handling-overload/" },
  },
  {
    id: "retries", track: "foundations", title: "APIs & idempotent retries", minutes: 20,
    summary: "Keep a lost response from creating a duplicate write.",
    principles: [
      "When a client times out, it can lose the result of a write that already committed. A retry needs an operation identifier that remains stable across attempts.",
      "Scope the idempotency key to the authenticated actor and operation. Store a fingerprint of the normalized request and the original response. Reject a reused key whose meaning changed.",
      "Commit the operation and its durable result together. Give the business operation its own invariant, such as unique seat ownership. Different requests can have different keys and still contend for the same resource.",
    ],
    example: "The hold API reserves a seat and saves the response in one transaction. A retry after the network drops replays the original hold ID and expiry.",
    exercise: "Draw the first request, its committed write, a lost response, and a replay. Identify how the client looks up the current hold if the original response is stale.",
    quiz: { question: "What should a retry with the same key and a different payload do?", options: ["Retry the old write", "Create a second write", "Reject the request as a conflict", "Extend the original hold"], correct: 2, explanation: "A scoped key identifies a specific requested operation. A different payload conflicts with that contract." },
    source: { label: "AWS Builders’ Library · Making retries safe", url: "https://aws.amazon.com/builders-library/making-retries-safe-with-idempotent-APIs/" },
  },
  {
    id: "data-model", track: "foundations", title: "Data modeling & indexes", minutes: 16,
    summary: "Design a schema around access patterns and invariants.",
    principles: [
      "List requests before choosing primary keys. Recent orders for a buyer and all orders by status usually need different indexes.",
      "Make invariants durable with constraints. A unique seat and workshop key creates a database-enforced boundary for confirmed ownership.",
      "An index saves work on some reads and adds space and write work. Use a representative query plan to check that the intended index supports filtering and ordering.",
    ],
    example: "An index on (learner_id, submitted_at) supports recent attempts for one learner and a bounded scan by submission time.",
    exercise: "Choose indexes for looking up a short code, listing links owned by an account, and deleting expired links in batches.",
    quiz: { question: "Which index fits recent attempts for one learner?", options: ["(score)", "(learner_id, submitted_at)", "(status, score)", "(case_title)"], correct: 1, explanation: "The leading learner key supports lookup by account and the next key supports time ordering." },
    source: { label: "PostgreSQL · Indexes", url: "https://www.postgresql.org/docs/current/indexes.html" },
  },
  {
    id: "caching", track: "foundations", title: "Caching & invalidation", minutes: 18,
    summary: "Reduce repeat work and define the cost of stale data.",
    principles: [
      "In cache-aside, the service checks a cache, reads the authority on a miss, and populates the cache for subsequent readers.",
      "A time to live bounds normal staleness. If many entries expire together, coalesce requests for the same key and spread expiry with jitter.",
      "State what happens when the cache is slow or gone. Limit fallback work so a cache incident does not become a database incident.",
    ],
    example: "A short-link service can cache code-to-destination mappings. If deleted links must stop resolving quickly, use explicit invalidation with a bounded TTL.",
    exercise: "At 1,000 reads/s, compare database load at 95% and 70% cache hit rates, then design protection for full cache loss.",
    quiz: { question: "At 1,000 requests/s and a 95% cache hit rate, how many requests normally miss?", options: ["5", "50", "95", "950"], correct: 1, explanation: "The miss rate is 5%, so about 50 requests/s reach the fallback path." },
    source: { label: "Meta Engineering · Scaling memcache", url: "https://engineering.fb.com/2013/04/15/core-infra/scaling-memcache-at-facebook/" },
  },
  {
    id: "load-balancing", track: "foundations", title: "Load balancing & overload", minutes: 14,
    summary: "Spread work across healthy resources and bound queue growth.",
    principles: [
      "A load balancer routes requests across eligible endpoints. Health checks and connection draining determine how routing behaves when an instance leaves or returns.",
      "Round robin treats endpoints similarly. Least outstanding work can be useful when request duration varies, provided the balancing signal is fresh enough.",
      "Protect dependencies by limiting concurrency and queue length. A clear retry-after response beats an unbounded wait when the system is saturated.",
    ],
    example: "A worker queue prevents an upload API from blocking on video transcoding. A max queue age and retry policy prevent old jobs from growing without bound.",
    exercise: "An API loses half its fleet. Specify how you would detect overload, limit admission, and recover without a retry storm.",
    quiz: { question: "Which signal best indicates that an async worker backlog is harming timeliness?", options: ["Total jobs ever processed", "Oldest ready job age", "Number of endpoint names", "Average request body size"], correct: 1, explanation: "Time waiting in the queue directly measures threatened processing deadlines." },
    source: { label: "Google SRE · Load Balancing in the Datacenter", url: "https://sre.google/sre-book/load-balancing-datacenter/" },
  },
  {
    id: "consistency", track: "distributed", title: "Consistency & replication", minutes: 19,
    summary: "Define what readers observe after a write or a failover.",
    principles: [
      "State the required read guarantee for each operation. A customer checking their last payment may need read-your-writes while aggregate counts can tolerate staleness.",
      "Asynchronous replicas lag behind the primary under ordinary operation. Promotion can lose acknowledged writes unless the failover policy accounts for replica progress.",
      "A fence identifies the current writer. Use it where old leaders could still reach a shared resource after leadership changes.",
    ],
    example: "A booking service can serve a read-only seat map from a stale copy while confirming reservations at the authoritative writer.",
    exercise: "Explain what a client sees after a primary commits and fails before one replica receives the write.",
    quiz: { question: "What can happen when a replica is promoted before it receives an acknowledged write?", options: ["The write is always reconstructed", "The acknowledged write can disappear", "Reads block globally forever", "The client gets a new ID automatically"], correct: 1, explanation: "The new primary may have an older history. Failover strategy and acknowledgment rules must match the durability promise." },
    source: { label: "PostgreSQL · High Availability", url: "https://www.postgresql.org/docs/current/high-availability.html" },
  },
  {
    id: "messaging", track: "distributed", title: "Queues & delivery semantics", minutes: 20,
    summary: "Move work off the request path and handle redelivery.",
    principles: [
      "A durable queue decouples producer and consumer rates. Track lag, capacity, and the oldest eligible item.",
      "With at-least-once delivery, the consumer can receive a message again after a crash. Deduplicate using a business event ID at the system making the side effect.",
      "Use an outbox to persist business data and intent in one database transaction. Delivery still follows the consumer and provider semantics.",
    ],
    example: "A notification relay restarts after sending a message. It repeats the same event ID, and a provider with idempotent sends can suppress a duplicate.",
    exercise: "Mark each crash point from database commit through provider send. Determine what is retried and which system owns deduplication.",
    quiz: { question: "What does a transactional outbox make atomic?", options: ["Database write and recorded message intent", "Database write and external email delivery", "Producer and all consumer clocks", "Queue delivery and user notification display"], correct: 0, explanation: "The outbox places the business update and intent in one transaction. The relay is a separate delivery process." },
    source: { label: "Apache Kafka · Design", url: "https://kafka.apache.org/design/" },
  },
  {
    id: "slo", track: "advanced", title: "SLOs & recovery", minutes: 18,
    summary: "Measure the user-visible result and plan for recovery.",
    principles: [
      "A service level indicator measures a user-visible behavior. An objective sets a target over a specific period.",
      "A recovery time objective describes acceptable downtime. A recovery point objective describes tolerable data loss. Test them with an actual restore.",
      "Use error budget consumption and dependency health to decide when rollout needs to slow. Keep the owner and escalation path visible.",
    ],
    example: "A design tool can still serve saved diagrams while its queued evaluation is down. Separate availability objectives reflect the two user experiences.",
    exercise: "Specify an SLI, SLO, RTO and RPO for a reservation API, then describe a restore drill.",
    quiz: { question: "Which goal describes the maximum age of data lost in a recovery?", options: ["RTO", "RPO", "p95 latency", "Throughput"], correct: 1, explanation: "The recovery point objective addresses data loss. The recovery time objective addresses how long recovery takes." },
    source: { label: "Google SRE · Service Level Objectives", url: "https://sre.google/sre-book/service-level-objectives/" },
  },
  {
    id: "retrieval", track: "ai", title: "Retrieval & answer evaluation", minutes: 23,
    summary: "Ground answers in authorized evidence and measure their usefulness.",
    principles: [
      "Retrieval-augmented generation supplies selected material to the model at answer time. Keep index revisions and source IDs so citations stay traceable.",
      "Enforce content permissions before the model sees results. Measure retrieval quality and answer grounding separately.",
      "Know when to abstain. Return a useful fallback if authorized evidence is missing or inference exceeds the time budget.",
    ],
    example: "An internal support assistant filters to the learner's organization and answers with excerpts from the current policy version.",
    exercise: "Create a dataset of ten questions containing unanswerable, outdated, and cross-tenant cases. Define expected retrieval and answer behavior.",
    quiz: { question: "Where should tenant permission filtering happen?", options: ["Before context reaches the model", "After the model drafts the final answer", "Only in the UI", "After logging the full prompt"], correct: 0, explanation: "Filtering before retrieval results become model context prevents the model from receiving another tenant's evidence." },
    source: { label: "Lewis et al. · Retrieval-Augmented Generation (2020)", url: "https://arxiv.org/abs/2005.11401" },
  },
];

export type Case = {
  id: string; title: string; level: Level; time: number; icon: string; color: string;
  summary: string; scenario: string; requirements: readonly string[]; concepts: readonly string[];
  terms: string[][]; retry: string; lessonId: string; project?: string[];
  topic: Topic; aliases: readonly string[]; answer: WorkedAnswer; technology: TechnologyPlan;
};

export const starterCases: Omit<Case, "topic" | "aliases" | "answer" | "technology">[] = [
  {
    id: "url-shortener", title: "Design a URL Shortener", level: "Beginner", time: 25, icon: "link", color: "purple",
    summary: "Build a high-read service for short links and fast redirects.",
    scenario: "A conference platform lets teams share short links to talks, handouts, and registration pages. Popular talks can send a burst of readers to one link.",
    requirements: ["Create an opaque short code for a destination URL.", "Resolve 1 million daily redirects and 20,000 daily link creations.", "Keep redirects fast during a popular talk and honor link expiry."],
    concepts: ["Identifiers", "Caching", "Read-heavy systems"],
    terms: [["redirect", "create"], ["unique", "expires"], ["database", "cache"], ["reads/s", "cache miss"], ["collision", "stale", "ttl"]],
    retry: "A conference organizer revokes a viral link. Readers should stop following it within five seconds, including during a cache outage.",
    lessonId: "caching",
    project: ["Implement create and resolve endpoints with PostgreSQL and a unique short-code constraint.", "Add expiry and test reads after an administrator revokes a link.", "Compare database load during a popular-link spike before and after adding a cache."],
  },
  {
    id: "rate-limiter", title: "Design a Rate Limiter", level: "Intermediate", time: 30, icon: "gauge", color: "green",
    summary: "Protect a public API while keeping traffic fair across tenants.",
    scenario: "An API serves several thousand tenant applications. Sales wants each tenant to get a predictable throughput limit with short bursts.",
    requirements: ["Enforce a per-tenant rate across multiple gateway nodes.", "Return retry guidance when limits are exceeded.", "Define behavior when the shared counter system is degraded."],
    concepts: ["Token bucket", "Atomic updates", "Backpressure"],
    terms: [["tenant", "burst"], ["retry-after", "key"], ["gateway", "redis"], ["atomic", "failover"], ["fail open", "fail closed", "fair"]],
    retry: "An enterprise tenant doubles its traffic while one counter shard is unavailable. Preserve fairness for other tenants.",
    lessonId: "load-balancing",
  },
  {
    id: "workshop-seats", title: "Design a Seat Reservation System", level: "Advanced", time: 40, icon: "ticket", color: "orange",
    summary: "Reserve the last seat exactly once through bursts and retries.",
    scenario: "A training marketplace opens enrollment for popular workshops. A learner holds a named seat for five minutes, then confirms or releases it.",
    requirements: ["Allow at most one active claim per seat.", "Support retries after a lost response without duplicated side effects.", "Handle an opening burst of 300 hold attempts per second."],
    concepts: ["Transactions", "Idempotency", "Outbox"],
    terms: [["hold", "expire"], ["unique", "idempotency"], ["transaction", "outbox"], ["lock", "burst"], ["stale", "pending", "failover"]],
    retry: "Race a confirmation against hold expiry and a replacement hold. Explain which write wins and how a stale release is rejected.",
    lessonId: "retries",
    project: ["Create seats, holds, reservations and request-result tables.", "Race dozens of clients on one named seat and record exactly one winning claim.", "Inject a response loss after commit and replay the same operation key.", "Race expiry and confirmation, then test duplicate notifications."],
  },
  {
    id: "messaging", title: "Design Group Messaging", level: "Intermediate", time: 35, icon: "messages", color: "blue",
    summary: "Deliver ordered messages to online and offline members.",
    scenario: "Neighborhood groups share messages from multiple devices. Members expect new messages quickly and can be offline for days.",
    requirements: ["Persist group messages and synchronize offline devices.", "Describe ordering within a conversation and client deduplication.", "Separate membership checks from fan-out and push delivery."],
    concepts: ["WebSockets", "Ordering", "Fan-out"],
    terms: [["group", "offline"], ["sequence", "cursor"], ["websocket", "queue"], ["shard", "backpressure"], ["ordering", "replay", "loss"]],
    retry: "A group grows to 100,000 members, but only 3% are online. Revisit write amplification and delivery latency.",
    lessonId: "messaging",
  },
  {
    id: "notification", title: "Design a Notification Service", level: "Intermediate", time: 30, icon: "bell", color: "orange",
    summary: "Coordinate email, push, and in-app delivery without a retry storm.",
    scenario: "A scheduling product sends reminders by each user's preferred channel. A provider can fail temporarily or accept a request and lose the acknowledgement.",
    requirements: ["Schedule and cancel reminders.", "Honor user preferences and suppress duplicate sends where supported.", "Recover from provider failure without losing pending work."],
    concepts: ["Queues", "Outbox", "Retries"],
    terms: [["cancel", "schedule"], ["preference", "idempotency"], ["queue", "worker"], ["backoff", "dead letter"], ["duplicate", "latency", "retry"]],
    retry: "The push provider slows down for ten minutes. Keep email and in-app delivery healthy during and after recovery.",
    lessonId: "messaging",
    project: ["Schedule reminders in PostgreSQL and claim due jobs with leases.", "Implement a fake provider that can accept a message and lose its response. Persist delivery attempts.", "Add bounded retries and inspect oldest eligible job age during provider failure."],
  },
  {
    id: "video", title: "Design a Video Upload Pipeline", level: "Intermediate", time: 35, icon: "video", color: "blue",
    summary: "Accept large files, transcode them asynchronously, and publish variants.",
    scenario: "Instructors upload course videos on slow networks. Viewers watch from mobile and desktop devices.",
    requirements: ["Support resumable uploads for videos up to 2 GB.", "Transcode videos into trackable output variants.", "Restrict playback to users with lesson access."],
    concepts: ["Object storage", "Async jobs", "CDN"],
    terms: [["resumable", "playback"], ["signed", "multipart"], ["object storage", "worker"], ["queue", "cdn"], ["retry", "cost", "permission"]],
    retry: "Ten thousand instructors upload after a deadline extension. Protect API availability while processing the backlog.",
    lessonId: "load-balancing",
  },
  {
    id: "dispatch", title: "Design Courier Dispatch", level: "Advanced", time: 40, icon: "route", color: "green",
    summary: "Match couriers in real time while preserving assignment ownership.",
    scenario: "A marketplace assigns nearby couriers to pickups. Mobile clients transmit location updates and can go offline without notice.",
    requirements: ["Accept recent location updates and find available couriers nearby.", "Reserve one courier per pickup at a time.", "Recover from a rejected or expired offer."],
    concepts: ["Spatial indexing", "Leases", "Streaming"],
    terms: [["nearby", "location"], ["lease", "timestamp"], ["geospatial", "partition"], ["hotspot", "timeout"], ["fencing", "stale", "fair"]],
    retry: "One downtown cell sees 20 times the normal traffic and delayed location updates. Explain degraded matching.",
    lessonId: "consistency",
  },
  {
    id: "support-rag", title: "Design a Support Assistant", level: "Advanced", time: 40, icon: "sparkles", color: "purple",
    summary: "Retrieve scoped support documents and generate cited answers.",
    scenario: "Small companies import support policies and ask natural-language questions. Answers need current, tenant-authorized sources.",
    requirements: ["Ingest and version articles, then retrieve suitable evidence.", "Prevent cross-tenant retrieval.", "Define abstention, quality measurement, and a per-query spend budget."],
    concepts: ["Retrieval", "Tenant isolation", "Evaluation"],
    terms: [["tenant", "citations"], ["version", "metadata"], ["embedding", "retrieval"], ["latency", "budget"], ["abstain", "grounding", "fallback"]],
    retry: "Some articles contradict newer policy. Define how you detect stale evidence, measure the issue, and fall back safely.",
    lessonId: "retrieval",
  },
];
