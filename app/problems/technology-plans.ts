import { eventTicketsTechnology } from "./event-tickets";
import type { TechnologyPlan } from "./types";

export const technologyPlans: Record<string, TechnologyPlan> = {
  "ai-chat": {
    storage: {
      technology: "PostgreSQL and short-lived Redis stream buffers",
      reason: "Keep conversations and generation receipts in SQL. Retain recent token chunks only for reconnect.",
    },
    routing: {
      technology: "AWS Application Load Balancer (L7)",
      reason: "Balance conversation requests across replicas and keep streaming connections out of the inference worker pool.",
    },
    support: {
      technology: "Token admission and SSE",
      reason: "Reserve a token budget before scheduling inference and account for canceled and incomplete runs.",
    },
    ingress: ["Send user turn"],
  },
  "rag-ingestion": {
    storage: {
      technology: "S3 and PostgreSQL with a vector index",
      reason: "Persist original documents, versioned chunks, authorization, tombstones and index checkpoints.",
    },
    routing: {
      technology: "AWS Application Load Balancer (L7)",
      reason: "Balance document-control operations. Route parsing and embedding to independent worker queues.",
    },
    support: {
      technology: "SQS ingestion jobs and scoped index publication",
      reason: "Retry by document revision and enforce permission changes before returning retrieved content.",
    },
    ingress: ["Upload or delete"],
  },
  "vector-search": {
    storage: {
      technology: "Qdrant or Elasticsearch vector index",
      reason: "Store tenant-scoped embeddings, metadata and tombstones. Compare approximate retrieval recall with an exact baseline.",
    },
    routing: {
      technology: "AWS Application Load Balancer (L7)",
      reason: "Balance query requests before the tenant router selects eligible index shards.",
    },
    support: {
      technology: "HNSW with bounded exact reranking",
      reason: "Keep latency and memory bounded and adapt candidate count to selective filters.",
    },
    ingress: ["Query or upsert"],
  },
  "recommendations": {
    storage: {
      technology: "PostgreSQL product authority and a vector index",
      reason: "Keep availability in the product system and embeddings in a versioned candidate index.",
    },
    routing: {
      technology: "AWS Application Load Balancer (L7)",
      reason: "Spread home-feed reads across stateless ranking workers and cap work per request.",
    },
    support: {
      technology: "Redis online features and Kafka exposure events",
      reason: "Keep scoring inputs fresh and log model version and exposures for experiments.",
    },
    ingress: ["Request home feed"],
  },
  "agent-orchestrator": {
    storage: {
      technology: "PostgreSQL",
      reason: "Persist every workflow state transition, tool receipt, approval, and resource reservation.",
    },
    routing: {
      technology: "AWS Application Load Balancer (L7)",
      reason: "Balance run and status APIs. Worker pools claim typed, authorized steps independently.",
    },
    support: {
      technology: "Temporal and scoped tool workers",
      reason: "Resume durable workflows and enforce external-action approval in application code.",
    },
    ingress: ["Start workflow"],
  },
  "llm-inference": {
    storage: {
      technology: "PostgreSQL model metadata and GPU-local KV cache",
      reason: "Version deployed models durably and track short-lived context blocks on their owning workers.",
    },
    routing: {
      technology: "Inference scheduler and model-aware routing",
      reason: "Admit work by token count and accelerator memory, then place it on compatible workers.",
    },
    support: {
      technology: "vLLM-style continuous batching",
      reason: "Control first-token delay while sharing decode capacity across active requests.",
    },
  },
  "feature-store": {
    storage: {
      technology: "Redis online store and partitioned Parquet history",
      reason: "Serve fresh features by entity and feature version, and reproduce point-in-time training joins from immutable history.",
    },
    routing: {
      technology: "Separate serving and training paths",
      reason: "Batch online feature lookups behind service replicas while offline jobs read snapshots.",
    },
    support: {
      technology: "Kafka and shared feature transformations",
      reason: "Keep online and offline definitions aligned and track per-feature freshness and version.",
    },
  },
  "ml-training": {
    storage: {
      technology: "S3 dataset and artifact storage, PostgreSQL registry metadata",
      reason: "Pin dataset and code manifests and store immutable checkpoints and model artifacts by version.",
    },
    routing: {
      technology: "Resource-aware training scheduler",
      reason: "Assign accelerator capacity and isolate incompatible jobs and unstable runs.",
    },
    support: {
      technology: "Kubernetes batch jobs and model registry gates",
      reason: "Resume only compatible checkpoints and promote models with verified evaluation results.",
    },
  },
  "model-evaluation": {
    storage: {
      technology: "PostgreSQL and S3",
      reason: "Persist dataset versions, run metadata and scores in SQL and keep large outputs as content-addressed artifacts.",
    },
    routing: {
      technology: "Queued evaluation workers",
      reason: "Limit concurrent model calls and separate generation and scoring work.",
    },
    support: {
      technology: "Versioned reviewers and release gates",
      reason: "Report metrics by cohort and calibrate automated grading against reviewed examples.",
    },
  },
  "speech-transcription": {
    storage: {
      technology: "S3 transcripts and PostgreSQL session metadata",
      reason: "Persist final segments with timestamps and scope retention separately from ephemeral audio windows.",
    },
    routing: {
      technology: "Streaming gateways and regional speech workers",
      reason: "Keep each audio session ordered and route work according to accelerator capacity.",
    },
    support: {
      technology: "Short replay buffers and revisioned captions",
      reason: "Reconcile reconnects and preserve explicit gaps when audio frames are missing.",
    },
  },
  "multimodal-search": {
    storage: {
      technology: "OpenSearch and a vector index",
      reason: "Index catalog keywords and compatible image and text embeddings by product revision.",
    },
    routing: {
      technology: "AWS Application Load Balancer (L7)",
      reason: "Balance query APIs and route expensive image encoding to a bounded inference pool.",
    },
    support: {
      technology: "Hybrid retrieval and exact attribute reranking",
      reason: "Combine lexical and visual candidates, then filter stock and exact variants before return.",
    },
    ingress: ["Text or image query"],
  },
  "semantic-cache": {
    storage: {
      technology: "Redis with vector search",
      reason: "Store short-lived answer entries by tenant, permissions, policy version and relevant exact fields.",
    },
    routing: {
      technology: "Scoped lookup service replicas",
      reason: "Choose a compatible cache scope before searching and route misses to the model.",
    },
    support: {
      technology: "Freshness tags and similarity evaluation",
      reason: "Invalidate answers on source changes and measure false hits before expanding reuse.",
    },
  },
  "ecommerce-store": {
    storage: {
      technology: "PostgreSQL and OpenSearch",
      reason: "Persist offers, carts, orders and inventory in SQL; use OpenSearch for a rebuildable catalog projection.",
    },
    routing: {
      technology: "AWS Application Load Balancer (L7)",
      reason: "Separate browse and checkout target groups so browsing spikes do not consume transactional capacity.",
    },
    support: {
      technology: "Saga coordinator and outbox",
      reason: "Record seller-specific fulfillment and recover pending reservations or payment effects.",
    },
    ingress: ["Browse or search", "Place order"],
  },
  "checkout": {
    storage: {
      technology: "PostgreSQL",
      reason: "Store immutable quoted totals and caller receipts. Commit pending and confirmed orders transactionally.",
    },
    routing: {
      technology: "AWS Application Load Balancer (L7)",
      reason: "Balance quotation and confirmation across separate stateless service targets.",
    },
    support: {
      technology: "Payment processor and durable workflow state",
      reason: "Use a stable provider operation ID and keep timeouts pending until reconciled.",
    },
    ingress: ["Price cart", "Confirm quote"],
  },
  "inventory": {
    storage: {
      technology: "PostgreSQL",
      reason: "Use a conditional stock update and reserve, confirm and release under the same authority per SKU and location.",
    },
    routing: {
      technology: "AWS Application Load Balancer (L7)",
      reason: "Spread API traffic, shard by location and SKU, and bound concurrency on hot stock rows.",
    },
    support: {
      technology: "Transactional outbox and expiry worker",
      reason: "Release only the matching active hold and reconcile against warehouse counts.",
    },
    ingress: ["Reserve or confirm"],
  },
  "payments": {
    storage: {
      technology: "PostgreSQL",
      reason: "Persist intent, transition, provider receipt and business reference. Keep balanced ledger postings durable.",
    },
    routing: {
      technology: "AWS Application Load Balancer (L7)",
      reason: "Route merchant operations and provider callbacks to independently scaled service pools.",
    },
    support: {
      technology: "Processor idempotency and reconciliation workers",
      reason: "Resolve ambiguous authorizations, captures and refunds by the provider's operation ID.",
    },
    ingress: ["Create, capture, refund"],
  },
  "payment-ledger": {
    storage: {
      technology: "PostgreSQL",
      reason: "Enforce one immutable transaction per business reference and commit postings with any balance guard.",
    },
    routing: {
      technology: "Internal application load balancer",
      reason: "Spread incoming ledger calls across replicas while routing each write to an authoritative account shard.",
    },
    support: {
      technology: "Journal replay and reporting projections",
      reason: "Produce read-friendly history from the same durable postings and reconcile projections.",
    },
  },
  "fraud-review": {
    storage: {
      technology: "PostgreSQL decisions and Redis feature cache",
      reason: "Record exact decision and model version in SQL and serve recent features inside a bounded scoring deadline.",
    },
    routing: {
      technology: "AWS Application Load Balancer (L7)",
      reason: "Spread synchronous risk requests across a dedicated replica pool with class-specific timeouts.",
    },
    support: {
      technology: "SQS review queue",
      reason: "Route uncertain decisions without blocking other transactions and persist reviewer outcomes.",
    },
    ingress: ["Evaluate within deadline"],
  },
  "order-tracking": {
    storage: {
      technology: "PostgreSQL and a shipment read projection",
      reason: "Retain deduplicated tracking events and current projected states by order and shipment.",
    },
    routing: {
      technology: "AWS Application Load Balancer (L7)",
      reason: "Balance incoming callbacks and isolate reader capacity for status pages.",
    },
    support: {
      technology: "Kafka status events",
      reason: "Normalize out-of-order provider updates and notify customers only on meaningful changes.",
    },
    ingress: ["Send signed update"],
  },
  "promotion-engine": {
    storage: {
      technology: "PostgreSQL",
      reason: "Keep rule versions, quotes, and redemption ledger in SQL with unique campaign and customer claims.",
    },
    routing: {
      technology: "AWS Application Load Balancer (L7)",
      reason: "Distribute quote calculations and separately budget the write-heavy redemption endpoint.",
    },
    support: {
      technology: "Local immutable rule cache",
      reason: "Keep rule evaluation fast and reserve scarce coupon uses at the durable authority.",
    },
    ingress: ["Quote cart"],
  },
  "auctions": {
    storage: {
      technology: "PostgreSQL or a per-auction sequenced log",
      reason: "Commit bid order, clock guards and final winner under one authority per auction.",
    },
    routing: {
      technology: "AWS Application Load Balancer (L7)",
      reason: "Balance bid ingress and route commands by auction ID behind the API.",
    },
    support: {
      technology: "WebSocket updates and outbox",
      reason: "Broadcast accepted bids asynchronously and retain a snapshot for reconnect.",
    },
    ingress: ["Submit timed bid"],
  },
  "grocery-delivery": {
    storage: {
      technology: "PostgreSQL",
      reason: "Keep site-level stock and delivery slot ledgers authoritative, with expiring holds and audited adjustments.",
    },
    routing: {
      technology: "AWS Application Load Balancer (L7)",
      reason: "Route slot discovery and orders to separate service pools and shard fulfillment by site.",
    },
    support: {
      technology: "SQS picking queue",
      reason: "Dispatch confirmed orders to the warehouse and track substitutions durably.",
    },
    ingress: ["Find delivery window", "Confirm cart and slot"],
  },
  "fulfillment-routing": {
    storage: {
      technology: "PostgreSQL per site",
      reason: "Reserve inventory at the owning site. Use a separate availability projection for optimization input.",
    },
    routing: {
      technology: "Planner worker pools and site-aware routing",
      reason: "Select sites and revalidate a proposed allocation in the writer for each relevant location.",
    },
    support: {
      technology: "Bounded allocation optimizer",
      reason: "Prune candidate sites early and fall back to a feasible slower plan when optimization stalls.",
    },
  },
  "matching-engine": {
    storage: {
      technology: "Replicated command log and in-memory book",
      reason: "Replay a durable per-instrument command sequence into a deterministic order book.",
    },
    routing: {
      technology: "Instrument-aware gateways",
      reason: "Route each instrument to one sequencer and use read-only market-feed replicas for visibility.",
    },
    support: {
      technology: "Recovered snapshots and fenced sequencers",
      reason: "Preserve price-time order and enable precise feed resynchronization after failover.",
    },
  },
  "local-delivery": {
    storage: {
      technology: "PostgreSQL inventory and orders",
      reason: "Keep local stock and expiring reservations under one per-site authority. Persist order state and payment receipts durably.",
    },
    routing: {
      technology: "AWS Application Load Balancer (L7)",
      reason: "Balance stateless order calls and route them to fulfillment sites based on the address.",
    },
    support: {
      technology: "Redis catalogue cache and SQS dispatch",
      reason: "Serve nearby browse results cheaply and queue confirmed orders for pickup.",
    },
    ingress: ["Place order"],
  },
  "dating-matches": {
    storage: {
      technology: "PostgreSQL and a geospatial discovery index",
      reason: "Serialize reciprocal likes by unordered pair and enforce a unique match. Use a separate read index for eligible candidates.",
    },
    routing: {
      technology: "AWS Application Load Balancer (L7)",
      reason: "Send discovery and swipe requests to independently scaled service pools.",
    },
    support: {
      technology: "Transactional outbox and notification queue",
      reason: "Commit one match alert with the match and apply current blocks on reads.",
    },
    ingress: ["Swipe right", "Get eligible candidates"],
  },
  "live-comments": {
    storage: {
      technology: "Cassandra or ScyllaDB room log",
      reason: "Store ordered room comments and moderation updates in bounded room partitions for replay.",
    },
    routing: {
      technology: "AWS Application Load Balancer (L7) and WebSocket gateways",
      reason: "Spread comment writes across replicas and fan live batches out over separate socket connections.",
    },
    support: {
      technology: "Kafka keyed by room",
      reason: "Stream accepted events and give slow clients a cursor for catch-up.",
    },
    ingress: ["Submit comment", "Resume from cursor"],
  },
  "video-top-k": {
    storage: {
      technology: "Kafka view log and a durable bucket-count store",
      reason: "Retain accepted events for deduplication and persist counts by video and time bucket.",
    },
    routing: {
      technology: "Partitioned stream processor keyed by video",
      reason: "Process each video's counts together, then merge shard-local candidates into a global result.",
    },
    support: {
      technology: "Flink and Redis rank cache",
      reason: "Use event-time windows and serve a versioned top-K snapshot efficiently.",
    },
  },
  "web-crawler": {
    storage: {
      technology: "PostgreSQL crawl frontiers and S3 pages",
      reason: "Store host rules and pending crawl work by due time. Keep fetched page revisions in immutable object storage.",
    },
    routing: {
      technology: "Per-host scheduler and bounded workers",
      reason: "Lease an eligible host and cap concurrent requests and retries against that origin.",
    },
    support: {
      technology: "Normalized URLs and checksum deduplication",
      reason: "Avoid revisiting equivalent pages and bound unproductive link discovery.",
    },
  },
  "ad-click-aggregation": {
    storage: {
      technology: "Kafka click log and ClickHouse aggregate store",
      reason: "Keep accepted click IDs durably for replay, and store revisioned counts by campaign and time window.",
    },
    routing: {
      technology: "AWS Application Load Balancer (L7)",
      reason: "Balance click ingestion while routing each campaign key to the stream processing layer.",
    },
    support: {
      technology: "Flink event-time aggregation",
      reason: "Deduplicate before counting and distinguish provisional and finalized reports.",
    },
    ingress: ["Receive click"],
  },
  "social-post-search": {
    storage: {
      technology: "PostgreSQL post authority and OpenSearch",
      reason: "Keep permissions and post revisions authoritative, and publish a rebuildable inverted index for candidate retrieval.",
    },
    routing: {
      technology: "AWS Application Load Balancer (L7)",
      reason: "Spread query traffic across stateless search brokers with bounded shard fan-out.",
    },
    support: {
      technology: "Kafka indexing events and live ACL checks",
      reason: "Apply deletion or visibility changes before returning snippets, even if search results lag.",
    },
    ingress: ["Search term"],
  },
  "fitness-activities": {
    storage: {
      technology: "S3 tracks and PostgreSQL with PostGIS",
      reason: "Store raw routes as immutable objects and keep privacy, activities and segment geometry in SQL.",
    },
    routing: {
      technology: "AWS Application Load Balancer (L7)",
      reason: "Balance upload-control and results APIs. Transfer long route files directly to storage.",
    },
    support: {
      technology: "SQS segment analysis jobs",
      reason: "Compute and version eligible attempts without delaying the upload response.",
    },
    ingress: ["Upload workout"],
  },
  "price-tracking": {
    storage: {
      technology: "TimescaleDB observations and PostgreSQL watch state",
      reason: "Index offers and observations by variant and time. Preserve one record per threshold crossing.",
    },
    routing: {
      technology: "Per-source poll scheduler",
      reason: "Cap provider fetch rate independently of history queries and notification capacity.",
    },
    support: {
      technology: "SQS notifications and bounded retries",
      reason: "Back off missing feeds and avoid re-alerting for the same below-target price.",
    },
  },
  "stock-brokerage": {
    storage: {
      technology: "PostgreSQL order and journal tables",
      reason: "Commit positions and buying-power reservations atomically with deduplicated execution IDs.",
    },
    routing: {
      technology: "AWS Application Load Balancer (L7)",
      reason: "Spread authenticated order calls while keeping account state at one durable authority.",
    },
    support: {
      technology: "Venue router and reconciliation workers",
      reason: "Use stable route IDs and verify ambiguous fills or cancellations before updating balances.",
    },
    ingress: ["Submit order"],
  },
  "online-chess": {
    storage: {
      technology: "PostgreSQL move log and fast in-memory board state",
      reason: "Commit each accepted move and clock revision before broadcasting it. Recover the board by replay.",
    },
    routing: {
      technology: "WebSocket ingress and game-ID routing",
      reason: "Balance player connections at the edge and assign each game to one fenced authority.",
    },
    support: {
      technology: "Redis matchmaking queues and snapshot replay",
      reason: "Match by skill and time control, then restore authoritative game state on reconnect.",
    },
  },
  "flash-sale": {
    storage: {
      technology: "PostgreSQL inventory and order authority",
      reason: "Serialize claim, confirmation and expiry with scoped idempotency and a guarded active-hold ID.",
    },
    routing: {
      technology: "AWS Application Load Balancer (L7)",
      reason: "Admit shoppers through a waiting room before routing to healthy checkout replicas at the writer's drain rate.",
    },
    support: {
      technology: "CloudFront and Redis queue status",
      reason: "Keep event discovery cheap and expose queue positions without increasing writes against stock.",
    },
    ingress: ["Admit bounded traffic"],
  },
  "key-value-store": {
    storage: {
      technology: "RocksDB on replicated storage nodes",
      reason: "Use an LSM engine for local writes and share a replicated version log for durability and repair.",
    },
    routing: {
      technology: "Partition router",
      reason: "Hash the key to a partition, and route strict and quorum operations to the right replicas.",
    },
    support: {
      technology: "Replica repair and tombstones",
      reason: "Retain deletions long enough to repair older replicas without restoring removed values.",
    },
  },
  "database-sharding": {
    storage: {
      technology: "PostgreSQL shards",
      reason: "Keep related order mutations local to a tenant or customer shard with a versioned directory.",
    },
    routing: {
      technology: "Shard-aware routing service",
      reason: "Resolve the current owning shard for each tenant and reject stale routing during cutover.",
    },
    support: {
      technology: "Debezium and verification jobs",
      reason: "Copy a baseline and replay committed changes before switching authoritative ownership.",
    },
  },
  "multi-region-database": {
    storage: {
      technology: "CockroachDB-style consensus partitions",
      reason: "Use a quorum-backed replicated log and define which reads may use follower snapshots.",
    },
    routing: {
      technology: "Regional service routing and partition leadership",
      reason: "Send strict requests to a current leader or use a database read protocol. Route permitted stale reads locally.",
    },
    support: {
      technology: "Writer fencing and failure drills",
      reason: "Test quorum loss and regional recovery against the durability promise.",
    },
  },
  "object-storage": {
    storage: {
      technology: "S3-compatible object storage and a replicated SQL metadata store",
      reason: "Separate immutable chunks from the committed object manifest and ordered bucket keys.",
    },
    routing: {
      technology: "AWS Application Load Balancer (L7)",
      reason: "Balance metadata and signing calls, then let clients communicate with the storage data path as needed.",
    },
    support: {
      technology: "Checksum scrubbing and erasure coding",
      reason: "Verify chunks during reads and rebuild lost redundancy without exposing incomplete manifests.",
    },
    ingress: ["PUT, GET or LIST"],
  },
  "cloud-drive-sync": {
    storage: {
      technology: "PostgreSQL and S3",
      reason: "Keep file revisions, directories and tombstones in SQL; store content-addressed chunks in S3.",
    },
    routing: {
      technology: "AWS Application Load Balancer (L7)",
      reason: "Spread metadata and synchronization requests. Upload missing chunks directly to storage.",
    },
    support: {
      technology: "Versioned change stream",
      reason: "Keep durable cursors and preserve file conflict copies when edits cannot merge.",
    },
    ingress: ["Commit base revision"],
  },
  "autocomplete": {
    storage: {
      technology: "OpenSearch or immutable prefix FSTs",
      reason: "Materialize bounded candidates by prefix and locale from a versioned catalog snapshot.",
    },
    routing: {
      technology: "AWS Application Load Balancer (L7)",
      reason: "Spread suggestion queries to stateless replicas and apply client debounce and tenant limits.",
    },
    support: {
      technology: "Redis prefix cache and deletion filter",
      reason: "Cache common prefixes while filtering recently removed suggestions on every response.",
    },
    ingress: ["Prefix + locale"],
  },
  "search-engine": {
    storage: {
      technology: "OpenSearch and S3",
      reason: "Serve distributed inverted indexes from OpenSearch and keep original crawl content in cheaper immutable storage.",
    },
    routing: {
      technology: "AWS Application Load Balancer (L7)",
      reason: "Balance query traffic across brokers. Crawl workers use per-host budgets and independent queues.",
    },
    support: {
      technology: "Versioned index segments",
      reason: "Publish rebuilt segments atomically and apply removal tombstones at query time.",
    },
    ingress: ["Keyword search"],
  },
  "log-search": {
    storage: {
      technology: "OpenSearch and S3",
      reason: "Use search segments for recent log queries and cheaper compressed archives for older data.",
    },
    routing: {
      technology: "AWS Application Load Balancer (L7)",
      reason: "Separate ingest and search target groups so a broad query cannot throttle incoming logs.",
    },
    support: {
      technology: "Kafka and partitioned indexes",
      reason: "Buffer ingest bursts and enforce tenant limits on reads, writes and retention.",
    },
    ingress: ["Batch log events"],
  },
  "nearby-search": {
    storage: {
      technology: "PostgreSQL with PostGIS",
      reason: "Start with indexed geography points and metadata, then apply exact distance and visible-place filters.",
    },
    routing: {
      technology: "AWS Application Load Balancer (L7)",
      reason: "Balance viewport queries across stateless replicas and cap candidate work in dense cells.",
    },
    support: {
      technology: "H3 cell index and Redis cache",
      reason: "Preselect nearby candidates at higher scale and cache common map cells within a defined freshness window.",
    },
    ingress: ["Center, radius, filter"],
  },
  "content-deduplication": {
    storage: {
      technology: "PostgreSQL and S3",
      reason: "Index scoped hashes and committed manifests in PostgreSQL and keep immutable verified chunks in S3.",
    },
    routing: {
      technology: "AWS Application Load Balancer (L7)",
      reason: "Balance hash lookup and manifest requests, with signed direct uploads for chunks.",
    },
    support: {
      technology: "Mark-and-sweep cleanup",
      reason: "Check committed and in-progress references before deleting an unreferenced chunk.",
    },
    ingress: ["Check scoped hashes"],
  },
  "time-series-db": {
    storage: {
      technology: "ClickHouse or a dedicated time-series store",
      reason: "Partition recent samples by series and time and persist downsampled tiers for long ranges.",
    },
    routing: {
      technology: "Series-hash ingest routing",
      reason: "Route points from one series to its owning partition and isolate query capacity from write bursts.",
    },
    support: {
      technology: "Durable write-ahead log and compact blocks",
      reason: "Replicate before acknowledgment and compact late points within a stated window.",
    },
  },
  "distributed-filesystem": {
    storage: {
      technology: "Replicated namespace metadata and block servers",
      reason: "Keep inode state and committed append length behind a replicated namespace leader. Store bytes on block nodes.",
    },
    routing: {
      technology: "Namespace routing and rack-aware placement",
      reason: "Clients fetch eligible block locations and transfer bytes directly to storage nodes.",
    },
    support: {
      technology: "Checksums, fenced append leases and repair jobs",
      reason: "Prevent stale writers and rebuild missing replicas across independent fault domains.",
    },
  },
  "event-streaming": {
    storage: {
      technology: "Kafka brokers with persistent volumes",
      reason: "Replicate partition logs and keep committed offsets durable. Use retention long enough for agreed replay needs.",
    },
    routing: {
      technology: "Kafka partition leaders",
      reason: "Choose a message key that matches the ordering boundary and route producers to the current partition leader.",
    },
    support: {
      technology: "Consumer groups and cautious commits",
      reason: "Apply idempotent effects before offset commit and track lag by partition.",
    },
  },
  "job-queue": {
    storage: {
      technology: "PostgreSQL job and result tables",
      reason: "Record durable job state, retry schedule and lease epoch. Index pending jobs by due time, then scale hot queues separately.",
    },
    routing: {
      technology: "Competing worker pools with leases",
      reason: "Workers claim work at their available concurrency and acknowledge with the current lease.",
    },
    support: {
      technology: "SQS and a dead-letter queue",
      reason: "Use durable transport when needed and bound retry time before quarantining exhausted attempts.",
    },
  },
  "distributed-cron": {
    storage: {
      technology: "PostgreSQL",
      reason: "Keep schedules, next-due indexes, unique occurrences and dispatch intents in one transactional store.",
    },
    routing: {
      technology: "Schedule-ID shards with leases",
      reason: "Each scheduler owns a subset of recurring schedules and writes occurrence records before dispatch.",
    },
    support: {
      technology: "SQS and transactional outbox",
      reason: "Queue due jobs and replay a committed occurrence without scheduling a second logical run.",
    },
  },
  "distributed-lock": {
    storage: {
      technology: "etcd",
      reason: "Use a replicated compare-and-set store for owners and monotonically increasing fencing tokens.",
    },
    routing: {
      technology: "Lease client routes to the consensus service",
      reason: "Acquire and renew through the consistent authority, and carry the granted token to the protected sink.",
    },
    support: {
      technology: "Fencing check at the protected resource",
      reason: "Reject writes with an older token, even if the old worker still believes its lease is valid.",
    },
  },
  "distributed-transaction": {
    storage: {
      technology: "PostgreSQL workflow and service-owned databases",
      reason: "Persist durable saga state and receipts so a workflow can resume at the right step.",
    },
    routing: {
      technology: "Temporal worker task queues",
      reason: "Assign workflow activity work to appropriately bounded worker pools.",
    },
    support: {
      technology: "Transactional outbox and stable operation IDs",
      reason: "Retry known steps safely and reconcile uncertain provider outcomes before compensating.",
    },
  },
  "distributed-tracing": {
    storage: {
      technology: "ClickHouse and object storage",
      reason: "Partition searchable trace summaries by time and retain compressed raw spans separately.",
    },
    routing: {
      technology: "OpenTelemetry collector tier",
      reason: "Load share agents across collectors and route spans with the same trace ID to the same tail sampler.",
    },
    support: {
      technology: "OpenTelemetry and tail sampling",
      reason: "Favor error and slow traces under bounded buffers and record dropped spans.",
    },
  },
  "metrics-alerting": {
    storage: {
      technology: "Prometheus-compatible time-series store",
      reason: "Keep sample and label indexes for window queries and enforce cardinality budgets.",
    },
    routing: {
      technology: "Discovery and sharded scrape collectors",
      reason: "Assign each target to collectors by shard. Route incident notifications independently of ingestion.",
    },
    support: {
      technology: "Alertmanager",
      reason: "Group, deduplicate and route alert state changes, including checks for missing telemetry.",
    },
  },
  "log-ingestion": {
    storage: {
      technology: "OpenSearch and S3",
      reason: "Index recent searchable fields in OpenSearch and archive compressed logs in S3.",
    },
    routing: {
      technology: "AWS Application Load Balancer (L7)",
      reason: "Accept batches through healthy ingest replicas with bounded body sizes and per-tenant quotas.",
    },
    support: {
      technology: "Kafka",
      reason: "Buffer durable accepted batches between ingest and slower search or archive sinks.",
    },
    ingress: ["Send bounded batch"],
  },
  "deployment-pipeline": {
    storage: {
      technology: "PostgreSQL and OCI registry",
      reason: "Persist build and deploy state with an immutable image digest, and store artifacts in the registry.",
    },
    routing: {
      technology: "Queue-backed build runners",
      reason: "Allocate isolated runners per job and fence simultaneous deploys to the same service.",
    },
    support: {
      technology: "Canary controller and metrics gates",
      reason: "Promote the same digest after health checks and keep a schema-compatible rollback candidate.",
    },
  },
  "backup-restore": {
    storage: {
      technology: "PostgreSQL physical backups and S3",
      reason: "Store encrypted base snapshots and archived WAL with checksums, timeline, and retention metadata.",
    },
    routing: {
      technology: "Dedicated restore worker pool",
      reason: "Run large restore jobs and verification away from production database capacity.",
    },
    support: {
      technology: "WAL replay and restore drills",
      reason: "Verify actual recovery time and recoverable data-loss limits using representative deployments.",
    },
  },
  "regional-recovery": {
    storage: {
      technology: "PostgreSQL primary with cross-region replica",
      reason: "Choose synchronous or asynchronous replication according to the data-loss objective and record the last verified checkpoint.",
    },
    routing: {
      technology: "Route 53 health-aware failover",
      reason: "Switch ingress after verifying the new writer and fencing the old one.",
    },
    support: {
      technology: "Writer leases and staged re-admission",
      reason: "Keep a read-only mode available and restore traffic after validating committed state.",
    },
  },
  "config-rollout": {
    storage: {
      technology: "PostgreSQL and immutable config objects",
      reason: "Audit revisions in SQL and distribute content-addressed snapshots with schema versions.",
    },
    routing: {
      technology: "CDN and fleet configuration watches",
      reason: "Serve large immutable snapshots cheaply while workers observe small version updates.",
    },
    support: {
      technology: "Canary controller and last-known-good snapshot",
      reason: "Validate locally, measure acknowledgments, and roll back by changing the desired version.",
    },
  },
  "pastebin": {
    storage: {
      technology: "PostgreSQL and S3",
      reason: "Keep IDs, access and expiry in PostgreSQL. Store larger immutable bodies in S3 and expire orphan objects.",
    },
    routing: {
      technology: "AWS Application Load Balancer (L7)",
      reason: "Distribute create and read calls across stateless Paste API instances.",
    },
    support: {
      technology: "CloudFront",
      reason: "Cache public immutable content subject to the promised expiry and deletion rules.",
    },
    ingress: ["Create or read"],
  },
  "file-upload": {
    storage: {
      technology: "PostgreSQL and S3 Multipart Upload",
      reason: "Store sessions and owners transactionally. Upload parts directly to S3 and verify the completed object.",
    },
    routing: {
      technology: "AWS Application Load Balancer (L7)",
      reason: "Balance short control requests while signed part uploads use the S3 data path.",
    },
    support: {
      technology: "SQS",
      reason: "Validate finalized files asynchronously and keep retries scoped to the upload session.",
    },
    ingress: ["Start or complete"],
  },
  "parking-lot": {
    storage: {
      technology: "PostgreSQL",
      reason: "Store space status and ticket ownership together. Reserve with a conditional update or row lock.",
    },
    routing: {
      technology: "Allocation service replicas",
      reason: "Route gates to the local site's allocation API, with retries keyed by the gate request ID.",
    },
    support: {
      technology: "Read-only display projection",
      reason: "Publish floor totals without making the display authoritative for assigning a space.",
    },
  },
  "vending-machine": {
    storage: {
      technology: "SQLite",
      reason: "Persist the sale and dispense intent locally before actuating hardware. An embedded store keeps recovery possible while the device is offline.",
    },
    routing: {
      technology: "Device-local event loop",
      reason: "Serialize button events and hardware responses through one machine controller.",
    },
    support: {
      technology: "Payment terminal and sensor receipt",
      reason: "Authorize before dispensing and reconcile a missing sensor event before repeating the command.",
    },
  },
  "library-lending": {
    storage: {
      technology: "PostgreSQL",
      reason: "Keep catalog copies, active loans, and hold assignment together. Enforce one active loan per copy.",
    },
    routing: {
      technology: "AWS Application Load Balancer (L7)",
      reason: "Distribute catalog and lending requests to separate target groups for branch traffic.",
    },
    support: {
      technology: "PostgreSQL full-text search",
      reason: "Start with an indexed catalog query and add a search cluster when ranking requirements outgrow it.",
    },
    ingress: ["Search title", "Checkout or return"],
  },
  "meeting-rooms": {
    storage: {
      technology: "PostgreSQL",
      reason: "Use a time range exclusion constraint for overlapping confirmed bookings in a room. Treat availability reads as advisory.",
    },
    routing: {
      technology: "AWS Application Load Balancer (L7)",
      reason: "Route browsing and reservation requests to healthy service replicas.",
    },
    support: {
      technology: "Transactional outbox and SQS",
      reason: "Notify calendars asynchronously after a booking or cancellation commits.",
    },
    ingress: ["Browse or reserve"],
  },
  "online-judge": {
    storage: {
      technology: "PostgreSQL and S3",
      reason: "Persist submission and verdict state in PostgreSQL and keep large immutable artifacts in S3.",
    },
    routing: {
      technology: "AWS Application Load Balancer (L7)",
      reason: "Spread submission and status requests across API replicas. Runners pull jobs from a separate queue.",
    },
    support: {
      technology: "Isolated containers and SQS",
      reason: "Use resource-limited fresh execution environments, and fence retries so only the current run publishes a verdict.",
    },
    ingress: ["Submit source"],
  },
  "live-polls": {
    storage: {
      technology: "PostgreSQL",
      reason: "Give (poll_id, voter_id) a unique key and record choice changes before projecting totals.",
    },
    routing: {
      technology: "AWS Application Load Balancer (L7)",
      reason: "Balance incoming votes. Serve much heavier results traffic from a separate read projection.",
    },
    support: {
      technology: "Redis and batched event processing",
      reason: "Keep a recent totals snapshot and stream versions instead of broadcasting every raw vote.",
    },
    ingress: ["Cast vote"],
  },
  "spreadsheet-engine": {
    storage: {
      technology: "In-memory dependency graph",
      reason: "Keep cell values and dependency edges in memory, with a versioned document snapshot if persistence is needed.",
    },
    routing: {
      technology: "Per-sheet calculation worker",
      reason: "Process edits in revision order and schedule affected cells as one bounded unit.",
    },
    support: {
      technology: "Topological order and snapshot versions",
      reason: "Detect cycles before evaluation and discard results produced against an older sheet revision.",
    },
  },
  "thread-pool": {
    storage: {
      technology: "Bounded in-memory queue",
      reason: "Keep pending tasks and futures in process. Choose a durable queue when work must survive a restart.",
    },
    routing: {
      technology: "Fixed worker threads",
      reason: "Each worker claims work from the bounded queue. Pick a rejection or backpressure policy at admission.",
    },
    support: {
      technology: "Java ExecutorService and Future",
      reason: "Expose cancellation and graceful shutdown using standard concurrency primitives.",
    },
  },
  "connection-pool": {
    storage: {
      technology: "In-memory lease table and PostgreSQL",
      reason: "Pool handles are process-local. The application data remains in PostgreSQL; reset session state before returning a handle.",
    },
    routing: {
      technology: "HikariCP connection pool",
      reason: "Bound connections, grant a lease to one caller at a time, and time out acquisition.",
    },
    support: {
      technology: "Connection validation with retry backoff",
      reason: "Replace broken connections gradually so failover does not trigger simultaneous reconnection.",
    },
  },
  "feature-flags": {
    storage: {
      technology: "PostgreSQL",
      reason: "Keep audited flag revisions and environment pointers as immutable records with a version check.",
    },
    routing: {
      technology: "CDN in front of the configuration endpoint",
      reason: "Distribute immutable snapshots to instances, which evaluate targeting locally.",
    },
    support: {
      technology: "ETag polling or versioned watches",
      reason: "Allow rapid rollback while preserving each SDK's last validated rules.",
    },
  },
  "ride-hailing": {
    storage: {
      technology: "PostgreSQL trip state and Redis GEO position index",
      reason: "Keep assignment and trip transitions durable, and hold only current recent positions in a rebuildable index.",
    },
    routing: {
      technology: "AWS Application Load Balancer (L7)",
      reason: "Isolate location writes from rider trip APIs. Dispatch by service area and route the trip by ID.",
    },
    support: {
      technology: "Kafka location stream",
      reason: "Discard stale positions and offer a leased driver based on fresh candidate data.",
    },
    ingress: ["Location update", "Request ride"],
  },
  "maps-routing": {
    storage: {
      technology: "S3 tile objects and a versioned road graph store",
      reason: "Keep static tile assets cacheable and load a versioned graph with current travel weights in routing workers.",
    },
    routing: {
      technology: "CloudFront and AWS Application Load Balancer (L7)",
      reason: "Serve tiles at the edge and balance dynamic route requests to healthy route solvers.",
    },
    support: {
      technology: "Redis live travel weights",
      reason: "Refresh speeds without rebuilding maps, and fall back to baseline weights when live samples are stale.",
    },
    ingress: ["Request directions"],
  },
  "food-delivery": {
    storage: {
      technology: "PostgreSQL",
      reason: "Keep menus, orders, payment receipts and dispatch status versioned and durable.",
    },
    routing: {
      technology: "AWS Application Load Balancer (L7)",
      reason: "Balance checkout APIs and isolate courier status and location traffic in separate pools.",
    },
    support: {
      technology: "Temporal workflow and Kafka projections",
      reason: "Recover partial kitchen, payment and delivery outcomes while serving customer tracking asynchronously.",
    },
    ingress: ["Quote and order"],
  },
  "eta-service": {
    storage: {
      technology: "ClickHouse telemetry plus Redis recent segment speeds",
      reason: "Store historical observations for evaluation and keep a fast per-segment read model for live predictions.",
    },
    routing: {
      technology: "AWS Application Load Balancer (L7)",
      reason: "Balance online prediction calls independently from telemetry ingestion workers.",
    },
    support: {
      technology: "Kafka and windowed stream processing",
      reason: "Map-match fresh points, aggregate speeds and fall back to historical values when observations are sparse.",
    },
    ingress: ["Request prediction"],
  },
  "location-sharing": {
    storage: {
      technology: "PostgreSQL share grants and Redis latest positions",
      reason: "Persist revocable grants and short-lived last positions separately.",
    },
    routing: {
      technology: "WebSocket gateway and AWS Network Load Balancer (L4)",
      reason: "Distribute ongoing connections and authorize each watch against current sharing state.",
    },
    support: {
      technology: "Session-scoped fan-out",
      reason: "Notify authorized viewers only and close their subscriptions on revocation or expiry.",
    },
    ingress: ["Publish position"],
  },
  "leaderboard": {
    storage: {
      technology: "Redis sorted sets and a durable score event log",
      reason: "Use per-season rank indexes for fast lookup and a replayable log for corrections and final snapshots.",
    },
    routing: {
      technology: "AWS Application Load Balancer (L7)",
      reason: "Balance score and ranking requests across independent pools keyed by board and season.",
    },
    support: {
      technology: "Kafka score events",
      reason: "Deduplicate updates and rebuild rank views by event ID and revision.",
    },
    ingress: ["Submit score event", "Read top K or rank"],
  },
  "transit-tracking": {
    storage: {
      technology: "PostgreSQL timetables and Redis stop predictions",
      reason: "Store scheduled trip metadata and keep a short-lived projection for busy stop views.",
    },
    routing: {
      technology: "AWS Application Load Balancer (L7)",
      reason: "Balance vehicle ingestion independently of cached rider reads.",
    },
    support: {
      technology: "Kafka position stream",
      reason: "Recompute affected stop estimates and mark schedule fallback when live observations are stale.",
    },
    ingress: ["Send position"],
  },
  "live-class-attendance": {
    storage: {
      technology: "PostgreSQL interval and report tables",
      reason: "Record class sessions and report revisions. Merge overlapping device intervals per learner.",
    },
    routing: {
      technology: "WebRTC provider and connection gateways",
      reason: "Use connection leases for active sessions and keep reporting off the live classroom path.",
    },
    support: {
      technology: "Kafka attendance events",
      reason: "Capture durable join or leave evidence and handle missing end events with expiry.",
    },
  },
  "iot-telemetry": {
    storage: {
      technology: "TimescaleDB or ClickHouse",
      reason: "Partition sensor readings by series and time, while storing device enrollment and credentials separately.",
    },
    routing: {
      technology: "MQTT broker cluster",
      reason: "Load share device sessions and enforce per-device limits on reconnect and replay.",
    },
    support: {
      technology: "Kafka and event-time windows",
      reason: "Protect live alerts while asynchronously ingesting bounded historical batches.",
    },
  },
  "matchmaking": {
    storage: {
      technology: "PostgreSQL durable tickets with Redis waiting queues",
      reason: "Preserve ticket state and leases durably, and keep fast region-and-skill indexes as projections.",
    },
    routing: {
      technology: "AWS Application Load Balancer (L7)",
      reason: "Balance ticket APIs and assign matching workers per region and game mode.",
    },
    support: {
      technology: "Fenced game-server allocation",
      reason: "Reserve a party once and return expired tickets to the queue without losing wait age.",
    },
    ingress: ["Queue or cancel"],
  },
  "geofence-events": {
    storage: {
      technology: "PostgreSQL with PostGIS",
      reason: "Store versioned fence geometry and per-vehicle boundary state, with a spatial index for candidates.",
    },
    routing: {
      technology: "Kafka partitioning by vehicle",
      reason: "Route ordered vehicle observations to stateful evaluators and process late samples within a watermark.",
    },
    support: {
      technology: "Transactional outbox for alerts",
      reason: "Persist the transition with a stable ID and avoid repeated notifications near a boundary.",
    },
  },
  "fleet-operations": {
    storage: {
      technology: "PostgreSQL fleet metadata and ClickHouse history",
      reason: "Store ownership durably and keep append-heavy vehicle observations in a time-bounded analytics store.",
    },
    routing: {
      technology: "AWS Application Load Balancer (L7)",
      reason: "Balance dashboard snapshots independently from ingestion and scope streams by operator and viewport.",
    },
    support: {
      technology: "Redis latest-state view and Kafka",
      reason: "Project current status for quick map updates and mark stale vehicles explicitly.",
    },
    ingress: ["View bounded map"],
  },
  "social-feed": {
    storage: {
      technology: "PostgreSQL for posts and follows, Redis for timeline pointers",
      reason: "Store durable relationships and content in SQL and cache an ordered, rebuildable timeline per viewer.",
    },
    routing: {
      technology: "AWS Application Load Balancer (L7)",
      reason: "Route writes to the posts pool and read-heavy requests to feed ranker replicas.",
    },
    support: {
      technology: "Kafka hybrid fan-out",
      reason: "Push ordinary creator updates asynchronously and pull popular accounts at read time.",
    },
    ingress: ["Publish post", "Request page"],
  },
  "photo-sharing": {
    storage: {
      technology: "PostgreSQL and S3",
      reason: "Store ownership and visibility in SQL and original and derived photo objects in S3.",
    },
    routing: {
      technology: "AWS Application Load Balancer (L7) and CloudFront",
      reason: "Balance API traffic. Serve authorized media variants from the CDN using short-lived URLs.",
    },
    support: {
      technology: "SQS image jobs",
      reason: "Deduplicate transforms per original and version and enforce a bounded worker queue.",
    },
    ingress: ["Request signed upload", "Check visibility"],
  },
  "social-graph": {
    storage: {
      technology: "PostgreSQL and Cassandra adjacency tables",
      reason: "Manage authoritative blocks and edges with transactional writes. Materialize large read-heavy adjacency sets by profile.",
    },
    routing: {
      technology: "AWS Application Load Balancer (L7)",
      reason: "Spread profile calls across graph services that route each adjacency query by profile ID.",
    },
    support: {
      technology: "Kafka reverse-edge updates",
      reason: "Track projection lag and check current blocks independently on sensitive reads.",
    },
    ingress: ["Follow, block, list"],
  },
  "news-aggregation": {
    storage: {
      technology: "PostgreSQL and OpenSearch",
      reason: "Store canonical source and article metadata in SQL and publish searchable topic ranks in OpenSearch.",
    },
    routing: {
      technology: "Per-origin fetch scheduler and API read replicas",
      reason: "Limit polling work by publisher and keep reader requests independent from the crawl queue.",
    },
    support: {
      technology: "Redis topic snapshots",
      reason: "Cache ranked pages with expiry and apply removals before responding.",
    },
  },
  "live-video": {
    storage: {
      technology: "S3 segment origin and PostgreSQL stream metadata",
      reason: "Keep rolling segments in object storage and persist stream status and owner separately.",
    },
    routing: {
      technology: "Regional ingest edge and CDN",
      reason: "Route broadcasters to a healthy ingest location and serve viewers from regional caches.",
    },
    support: {
      technology: "FFmpeg encoders and HLS packager",
      reason: "Create aligned bitrate variants and retain a bounded reconnect buffer with producer fencing.",
    },
  },
  "video-on-demand": {
    storage: {
      technology: "S3 and PostgreSQL",
      reason: "Store films and their versioned byte ranges in S3. Keep rights, entitlement references, and playback progress in SQL.",
    },
    routing: {
      technology: "CloudFront and AWS Application Load Balancer (L7)",
      reason: "Use edge caches for segments and balance authorization and manifest requests across playback services.",
    },
    support: {
      technology: "Offline encoding and signed playback",
      reason: "Precompute common renditions and issue bounded, rights-scoped access.",
    },
    ingress: ["Request stream"],
  },
  "comment-threads": {
    storage: {
      technology: "PostgreSQL or a sharded SQL store",
      reason: "Index child pages by thread and parent. Keep tombstones and moderation state authoritative.",
    },
    routing: {
      technology: "AWS Application Load Balancer (L7)",
      reason: "Spread comment reads and writes across API replicas and bound work for hot threads.",
    },
    support: {
      technology: "Redis page cache and Kafka projections",
      reason: "Maintain ranked pages asynchronously and check visibility before returning cached results.",
    },
    ingress: ["Add or list comments"],
  },
  "reaction-counter": {
    storage: {
      technology: "PostgreSQL reaction records and Redis counter projections",
      reason: "Enforce one reaction per viewer and post in SQL. Cache sharded counts derived from committed changes.",
    },
    routing: {
      technology: "AWS Application Load Balancer (L7)",
      reason: "Balance stateless reaction requests and throttle extreme activity by viewer or post.",
    },
    support: {
      technology: "Kafka and deduplicated delta workers",
      reason: "Apply each revision once and rebuild drifting totals from authoritative records.",
    },
    ingress: ["Set or clear reaction"],
  },
  "presence": {
    storage: {
      technology: "Redis TTL leases",
      reason: "Keep per-device presence with a short expiry. Use durable account state for visibility rules.",
    },
    routing: {
      technology: "AWS Network Load Balancer (L4)",
      reason: "Route long-lived device connections to gateways and restore leases on reconnect.",
    },
    support: {
      technology: "Subscription fan-out",
      reason: "Publish state transitions instead of every heartbeat and apply current contact visibility to delivery.",
    },
    ingress: ["Heartbeat"],
  },
  "typing-indicators": {
    storage: {
      technology: "Ephemeral gateway state and Redis Pub/Sub",
      reason: "Retain only a short-lived indicator or client expiry timer. Broadcast best-effort changes to room subscribers.",
    },
    routing: {
      technology: "AWS Network Load Balancer (L4)",
      reason: "Distribute WebSocket connections while keeping message traffic on its own budget.",
    },
    support: {
      technology: "Debounce and expiry",
      reason: "Throttle typing events and drop them under load without delaying durable chat.",
    },
    ingress: ["Debounced start or stop"],
  },
  "collaborative-docs": {
    storage: {
      technology: "PostgreSQL operation log and S3 snapshots",
      reason: "Commit ordered edits by document and keep compacted snapshots for quick reconnect.",
    },
    routing: {
      technology: "WebSocket ingress and document routing",
      reason: "Balance connections at the edge and route a document's operations to its current coordinator.",
    },
    support: {
      technology: "CRDT operations or server-ordered OT",
      reason: "Choose merge rules explicitly and enforce revocation on live sessions.",
    },
  },
  "shared-albums": {
    storage: {
      technology: "PostgreSQL and S3",
      reason: "Store membership, invite expiry, and album items in SQL, and keep uploaded files and thumbnails in S3.",
    },
    routing: {
      technology: "AWS Application Load Balancer (L7)",
      reason: "Balance album operations across replicas. Serve scoped media URLs separately through a CDN.",
    },
    support: {
      technology: "SQS thumbnail jobs",
      reason: "Process uploads after validation and keep removal and revocation independent from image jobs.",
    },
    ingress: ["Invite, upload or list"],
  },
  "url-shortener": {
    storage: {
      technology: "PostgreSQL",
      reason: "Keep the short code under a unique primary key and store the destination, expiry, and owner in one authoritative row.",
    },
    routing: {
      technology: "AWS Application Load Balancer (L7)",
      reason: "Route /links to the creation pool and /r/{code} to redirect replicas. Scale the much busier redirect pool separately.",
    },
    support: {
      technology: "Redis cache",
      reason: "Use short TTLs and explicit invalidation so a revocation takes effect within the promised window.",
    },
    ingress: ["Create short link", "Resolve code"],
  },
  "rate-limiter": {
    storage: {
      technology: "Redis Cluster",
      reason: "Store balance and last-refill timestamp in one key per tenant and policy. A Redis Lua script updates them atomically. Store policy definitions separately in PostgreSQL.",
    },
    routing: {
      technology: "AWS Application Load Balancer (L7)",
      reason: "Distribute HTTPS to healthy gateway replicas. Every gateway hashes the same tenant-and-route key to the same Redis bucket.",
    },
    support: {
      technology: "Gateway-local policy cache",
      reason: "Keep burst and refill settings close to the request path. Refresh by policy version and use bounded fallback if Redis is unavailable.",
    },
    ingress: ["HTTP request"],
  },
  "workshop-seats": {
    storage: {
      technology: "PostgreSQL",
      reason: "A row lock on the workshop seat plus a unique reservation claim protects concurrent hold, expiry and confirmation.",
    },
    routing: {
      technology: "AWS Application Load Balancer (L7)",
      reason: "Spread authenticated requests across reservation replicas while preserving one database authority for each workshop.",
    },
    support: {
      technology: "SQS and transactional outbox",
      reason: "Publish confirmation jobs after the reservation commits and deduplicate deliveries by event ID.",
    },
    ingress: ["Hold or confirm"],
  },
  "messaging": {
    storage: {
      technology: "ScyllaDB and PostgreSQL",
      reason: "Store messages in bounded conversation partitions ordered by sequence. Keep authoritative membership with transactional updates in PostgreSQL.",
    },
    routing: {
      technology: "AWS Network Load Balancer (L4)",
      reason: "Distribute long-lived connections to socket gateways. Authenticated clients reconnect and fetch missed messages by cursor.",
    },
    support: {
      technology: "Kafka",
      reason: "Publish durable message events for online delivery and offline push without waiting for each recipient.",
    },
    ingress: ["Send message"],
  },
  "notification": {
    storage: {
      technology: "PostgreSQL",
      reason: "Persist due times, cancellations and the outbox in one commit. Index reminders by next due timestamp.",
    },
    routing: {
      technology: "AWS Application Load Balancer (L7)",
      reason: "Route create and cancel calls to stateless healthy replicas. Channel workers pull independently from their own queues.",
    },
    support: {
      technology: "Separate SQS queues",
      reason: "Give email and push independent retry and concurrency budgets so a slow provider cannot block other deliveries.",
    },
    ingress: ["Schedule or cancel"],
  },
  "video": {
    storage: {
      technology: "S3 and PostgreSQL",
      reason: "Store multi-gigabyte video bytes in S3. Save upload ownership, checksums and rendition state in PostgreSQL.",
    },
    routing: {
      technology: "AWS Application Load Balancer (L7)",
      reason: "Balance upload-control calls across the API. Clients send file bytes to S3 and fetch viewing segments from CloudFront.",
    },
    support: {
      technology: "SQS and CloudFront",
      reason: "Queue each rendition independently and use the CDN to serve common segments close to viewers.",
    },
    ingress: ["Request signed parts"],
  },
  "dispatch": {
    storage: {
      technology: "PostgreSQL and Redis GEO",
      reason: "Keep assignment ownership and lease fencing in PostgreSQL. Serve recent positions from short-lived geographical indexes in Redis.",
    },
    routing: {
      technology: "AWS Application Load Balancer (L7)",
      reason: "Separate location ingest and pickup requests into two healthy replica pools. Dispatch shards are organized by service area.",
    },
    support: {
      technology: "Kafka",
      reason: "Replay location events and pickup notifications independently. Skip old samples when building the live spatial view.",
    },
    ingress: ["Location update", "Request pickup"],
  },
  "support-rag": {
    storage: {
      technology: "PostgreSQL with pgvector",
      reason: "Version documents and store permission metadata with embeddings. At moderate volume, filter by tenant and retrieve neighbors from the same data service.",
    },
    routing: {
      technology: "AWS Application Load Balancer (L7)",
      reason: "Balance query requests across retrieval API replicas. Run article indexing in an independent worker pool.",
    },
    support: {
      technology: "OpenAI API and asynchronous ingestion",
      reason: "Bound context and check returned citation IDs against authorized chunks. Indexing jobs retry by article revision.",
    },
    ingress: ["Question + account"],
  },
  "api-gateway": {
    storage: {
      technology: "PostgreSQL for versioned route policy",
      reason: "Keep durable route configuration separate from per-request data and cache a validated snapshot in each gateway.",
    },
    routing: {
      technology: "AWS Application Load Balancer (L7)",
      reason: "Spread connections across gateway replicas. Each gateway checks identity, route policy, and upstream deadlines.",
    },
    support: {
      technology: "Envoy and local policy snapshots",
      reason: "Bound request concurrency and retain the last good snapshot during a bad rollout.",
    },
    ingress: ["HTTPS request"],
  },
  "cdn": {
    storage: {
      technology: "S3 origin and edge object caches",
      reason: "Store a versioned canonical object in S3. Cache safe public bytes close to viewers.",
    },
    routing: {
      technology: "DNS or anycast edge routing",
      reason: "Send viewers to a healthy edge region and use an origin shield to coalesce misses.",
    },
    support: {
      technology: "CloudFront-style regional shield",
      reason: "Limit duplicate origin fetches and propagate purges by cache key.",
    },
  },
  "distributed-cache": {
    storage: {
      technology: "Redis Cluster or Memcached shards",
      reason: "Use in-memory partitions with TTL and eviction. The application database remains authoritative for recoverable values.",
    },
    routing: {
      technology: "Client-side consistent hashing",
      reason: "Hash keys to owning shards. Refresh ring versions during membership changes and handle hot keys separately.",
    },
    support: {
      technology: "Single-flight refill",
      reason: "Collapse simultaneous cache misses and cap fallbacks to the database.",
    },
  },
  "circuit-breaker": {
    storage: {
      technology: "In-memory rolling counters",
      reason: "Track recent outcomes and probe budget near each caller so the breaker can act during dependency failure.",
    },
    routing: {
      technology: "Envoy or a client-side circuit breaker",
      reason: "Use per-dependency concurrency limits, state transitions, and bounded half-open probes.",
    },
    support: {
      technology: "Timeout and fallback policy",
      reason: "Expire slow calls within the user deadline, and return a defined fallback when the breaker is open.",
    },
  },
  "dns-resolver": {
    storage: {
      technology: "TTL-aware in-memory cache",
      reason: "Cache positive and negative resource records with separately enforced validity periods.",
    },
    routing: {
      technology: "Anycast DNS ingress",
      reason: "Spread UDP and TCP resolution requests across nearby healthy resolver instances.",
    },
    support: {
      technology: "Request coalescing and rate budgets",
      reason: "Deduplicate active misses and bound work spent following referrals.",
    },
  },
  "webhooks": {
    storage: {
      technology: "PostgreSQL outbox and delivery receipts",
      reason: "Commit events with the source change. Persist one attempt history for each event and subscriber.",
    },
    routing: {
      technology: "SQS delivery queues and worker pools",
      reason: "Schedule attempts by destination policy and keep a slow recipient from blocking the rest.",
    },
    support: {
      technology: "Signed delivery with a stable ID",
      reason: "Recipients verify the request and deduplicate replays by delivery ID.",
    },
  },
  "session-store": {
    storage: {
      technology: "Redis for session lookup and PostgreSQL for account state",
      reason: "Keep session expiry and revocation within a defined read policy. Verify an account-level version for sensitive operations.",
    },
    routing: {
      technology: "AWS Application Load Balancer (L7)",
      reason: "Distribute login and authenticated requests across stateless application replicas.",
    },
    support: {
      technology: "Secure opaque cookies",
      reason: "Hash stored tokens, rotate sessions after privilege changes and expire credentials on logout.",
    },
    ingress: ["Cookie or logout"],
  },
  "load-balancer": {
    storage: {
      technology: "PostgreSQL control plane and local health state",
      reason: "Store route revisions centrally and keep live request and health state at each proxy.",
    },
    routing: {
      technology: "Envoy L7 proxy",
      reason: "Resolve the backend pool by host and path, then choose a healthy replica using the configured algorithm.",
    },
    support: {
      technology: "Health checks and draining",
      reason: "Remove unhealthy or draining targets gradually and cap retries against the remaining pool.",
    },
  },
  "api-metering": {
    storage: {
      technology: "PostgreSQL for finalized usage and object storage for raw events",
      reason: "Keep durable invoice-period snapshots and the evidence needed to reconcile them.",
    },
    routing: {
      technology: "Kafka partition routing",
      reason: "Route events by account and meter so reducers can deduplicate and roll up within an owned key range.",
    },
    support: {
      technology: "Flink or a keyed stream consumer",
      reason: "Compute provisional usage and apply late adjustments to finalized periods through an audit trail.",
    },
  },
  "unique-id-generator": {
    storage: {
      technology: "etcd lease metadata and in-memory sequence state",
      reason: "Coordinate worker IDs with a consistent lease store. Generate IDs locally from time, worker and sequence.",
    },
    routing: {
      technology: "Regional ID generator replicas",
      reason: "Distribute callers across healthy generators whose worker IDs are unique and fenced.",
    },
    support: {
      technology: "Clock skew guard",
      reason: "Pause a generator with an unsafe clock or expired worker lease.",
    },
  },
  "service-discovery": {
    storage: {
      technology: "etcd",
      reason: "Use a replicated registry with versioned endpoint records and leases.",
    },
    routing: {
      technology: "Client-side endpoint selection",
      reason: "Consumers watch membership and balance requests to healthy providers locally.",
    },
    support: {
      technology: "Snapshots and versioned watches",
      reason: "Repair gaps by replacing the local endpoint set with a valid snapshot.",
    },
  },
  "offline-sync": {
    storage: {
      technology: "SQLite on device and PostgreSQL on server",
      reason: "Track pending mutations locally and commit authoritative record revisions, tombstones and receipts on the server.",
    },
    routing: {
      technology: "AWS Application Load Balancer (L7)",
      reason: "Spread sync batches across stateless replicas and limit burst work by account or device.",
    },
    support: {
      technology: "Ordered change feed",
      reason: "Replay by cursor and require resnapshot when a cursor falls outside retention.",
    },
    ingress: ["Push when online"],
  },
  "event-tickets": eventTicketsTechnology,
};
