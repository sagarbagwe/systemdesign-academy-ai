type HldQuestion = {
  title: string;
  problem: string;
  focus: string;
  related?: { title: string; problem: string };
};

export const hldQuestions: readonly HldQuestion[] = [
  { title: "URL Shortener (TinyURL)", problem: "url-shortener", focus: "Short-code generation, collisions, lookup indexes, and redirect caching." },
  { title: "WhatsApp", problem: "messaging", focus: "WebSocket connections, durable message delivery, per-chat ordering, and offline catch-up." },
  { title: "Twitter / X", problem: "social-feed", focus: "Home timeline storage and hybrid fan-out for accounts with many followers." },
  { title: "Instagram", problem: "photo-sharing", focus: "Media uploads, image variants, feed entries, and authorized CDN delivery." },
  { title: "YouTube", problem: "video", focus: "Resumable uploads, transcoding jobs, adaptive playback, and CDN segments." },
  { title: "Netflix", problem: "video-on-demand", focus: "Playback startup, bitrate adaptation, regional rights, CDN delivery, and personalized discovery.", related: { title: "Recommendation system", problem: "recommendations" } },
  { title: "Uber", problem: "ride-hailing", focus: "Fare quotes, fresh location updates, proximity search, and exclusive driver matching." },
  { title: "Food Delivery System", problem: "food-delivery", focus: "Restaurant acceptance, courier assignment, order state, and live tracking." },
  { title: "Amazon", problem: "ecommerce-store", focus: "Product catalog, cart, and inventory reservations.", related: { title: "Inventory reservation", problem: "inventory" } },
  { title: "Rate Limiter", problem: "rate-limiter", focus: "Token buckets, atomic Redis updates, and failure policy." },
  { title: "Notification System", problem: "notification", focus: "Durable queues, channel workers, idempotent retries, and provider failures." },
  { title: "Distributed Cache", problem: "distributed-cache", focus: "Consistent hashing, eviction, cache misses, and hot keys." },
  { title: "Google Drive", problem: "cloud-drive-sync", focus: "Folder metadata, shared access, change cursors, and versioned file storage." },
  { title: "Google Docs", problem: "collaborative-docs", focus: "Concurrent edits, operation ordering, snapshots, and reconnect." },
  { title: "Dropbox", problem: "cloud-drive-sync", focus: "Chunk reuse, resumable transfers, offline edits, and conflict copies." },
  { title: "Chat Application", problem: "messaging", focus: "Reconnect, delivery receipts, and the lifecycle of an individual message." },
  { title: "Search Engine", problem: "search-engine", focus: "Crawl frontier, inverted indexes, partitioned query fan-out, and ranking." },
  { title: "Payment System", problem: "payments", focus: "Idempotency, payment state, double-entry records, and reconciliation." },
  { title: "Ticket Booking System", problem: "event-tickets", focus: "Search, seat holds, payment authorization, and exclusive claims." },
  { title: "E-commerce Platform", problem: "ecommerce-store", focus: "Seller listings, checkout, stock ownership, and fulfillment boundaries.", related: { title: "Checkout and order confirmation", problem: "checkout" } },
  { title: "Distributed Job Scheduler", problem: "distributed-cron", focus: "Time buckets, worker leases, duplicate triggers, and missed runs." },
  { title: "Logging and Monitoring System", problem: "observability-platform", focus: "Telemetry ingestion, searchable logs, metrics, and incident alerts." },
  { title: "Ride-Sharing Platform", problem: "ride-hailing", focus: "Driver availability, matching fairness, offer expiry, and trip transitions." },
  { title: "Video Conferencing System", problem: "video-conferencing", focus: "Room signaling, WebRTC, STUN/TURN, selective forwarding, and reconnect." },
  { title: "News Feed", problem: "social-feed", focus: "Viewer eligibility, candidate ranking, cursor pagination, and freshness." },
  { title: "Parking Lot", problem: "parking-garage-network", focus: "Atomic space allocation across gates, ticket lifecycle, and live capacity.", related: { title: "Single-garage design", problem: "parking-lot" } },
  { title: "Distributed Message Queue", problem: "job-queue", focus: "Durable enqueue, visibility timeouts, acknowledgments, retries, and dead letters.", related: { title: "Kafka-style event streaming", problem: "event-streaming" } },
  { title: "Web Crawler", problem: "web-crawler", focus: "URL deduplication, frontier scheduling, host politeness, and retries." },
  { title: "Ad Click Aggregation System", problem: "ad-click-aggregation", focus: "Event-time windows, click deduplication, late events, and billable totals." },
  { title: "Leaderboard", problem: "leaderboard", focus: "Rank queries, tie-breaking, score updates, and final season snapshots." },
];

export const hldConcepts = [
  { title: "Load Balancing", topic: "load-balancing-design" },
  { title: "Horizontal vs. Vertical Scaling", topic: "horizontal-vertical-scaling" },
  { title: "SQL vs. NoSQL", topic: "sql-vs-nosql" },
  { title: "Database Sharding", topic: "sharding" },
  { title: "Database Replication", topic: "database-replication" },
  { title: "Consistent Hashing", topic: "consistent-hashing" },
  { title: "Redis and Distributed Caching", topic: "redis" },
  { title: "Kafka and Message Queues", topic: "kafka" },
  { title: "CAP Theorem", topic: "cap-theorem" },
  { title: "Eventual Consistency", topic: "eventual-consistency" },
  { title: "Strong Consistency", topic: "strong-consistency" },
  { title: "Microservices Architecture", topic: "microservices-architecture" },
  { title: "API Gateway", topic: "gateway-technology" },
  { title: "CDN", topic: "cdn-design" },
  { title: "Rate Limiting", topic: "rate-limiting-design" },
  { title: "Circuit Breaker", topic: "circuit-breaker-design" },
  { title: "Fault Tolerance", topic: "fault-tolerance" },
  { title: "Distributed Transactions", topic: "distributed-transactions" },
  { title: "Database Indexing", topic: "database-indexing" },
  { title: "WebSockets", topic: "websocket-design" },
] as const;

export const hldCompanies = [
  { name: "Google", focus: "Search, distributed storage, and large-scale systems.", examples: [
    { title: "Search Engine", problem: "search-engine" },
    { title: "Google Drive", problem: "cloud-drive-sync" },
    { title: "Distributed file system", problem: "distributed-filesystem" },
  ] },
  { name: "Amazon", focus: "E-commerce, inventory, and order management.", examples: [
    { title: "Amazon marketplace", problem: "ecommerce-store" },
    { title: "Inventory reservation", problem: "inventory" },
    { title: "Order tracking", problem: "order-tracking" },
  ] },
  { name: "Meta", focus: "News feeds, media sharing, and messaging.", examples: [
    { title: "News Feed", problem: "social-feed" },
    { title: "Instagram", problem: "photo-sharing" },
    { title: "WhatsApp", problem: "messaging" },
  ] },
  { name: "Netflix", focus: "Video delivery and personalized recommendations.", examples: [
    { title: "Video streaming", problem: "video-on-demand" },
    { title: "Recommendations", problem: "recommendations" },
  ] },
  { name: "Apple", focus: "Sync, storage, messaging, and distributed services.", examples: [
    { title: "File sync", problem: "cloud-drive-sync" },
    { title: "Object storage", problem: "object-storage" },
    { title: "Chat application", problem: "messaging" },
    { title: "Service discovery", problem: "service-discovery" },
  ] },
  { name: "Uber", focus: "Location, matching, and real-time tracking.", examples: [
    { title: "Ride-sharing", problem: "ride-hailing" },
    { title: "Nearby places", problem: "nearby-search" },
    { title: "Real-time ETA", problem: "eta-service" },
  ] },
] as const;

export const hldStudyOrder = [1, 10, 11, 2, 3, 4, 5, 7, 9, 12, 13, 18, 19, 27, 17] as const;

export const hldFramework = [
  { title: "Functional requirements", method: "Ask who uses the system and what three operations you need to support. For ticket booking, cover browsing, holding seats, and checkout." },
  { title: "Non-functional requirements", method: "Pick a measurable latency or freshness target and an invariant. A seat map can be a few seconds stale. A seat can have only one confirmed owner." },
  { title: "Capacity estimation", method: "Estimate peak requests or bytes per second from the workload. Separate the busiest path from average traffic and use the result to choose what needs to scale." },
  { title: "API design", method: "Show request fields, responses, authentication, and retry behavior. A ride request includes a quote ID and an idempotency key." },
  { title: "Database schema", method: "Name the records, keys, indexes, and owning service. Explain which fields must change in one transaction." },
  { title: "High-level architecture diagram", method: "Draw the caller, entry point, serving service, and authoritative store. Label the arrows with specific requests or events. Walk the main path end to end." },
  { title: "Detailed component design", method: "Choose the component with the hardest requirement. For dispatch, explain how a nearby candidate becomes an exclusive driver assignment." },
  { title: "Database scaling and sharding", method: "Identify the hot read or write and explain how your proposed partition key distributes it. Cover how a query finds its shard and how you handle a hot key." },
  { title: "Caching strategy", method: "Specify the key, TTL, invalidation or version policy, and miss path. Explain whether clients can use stale results and where the authoritative check happens." },
  { title: "Message queues and async processing", method: "State when a producer can acknowledge work and when a consumer can commit it. Explain retries, duplicate delivery, and how the queue handles excess load." },
  { title: "Bottlenecks and trade-offs", method: "Name the first limit you expect from the estimate. Pick one alternative and explain what evidence would justify switching." },
  { title: "Failure handling and monitoring", method: "Trace a timeout or crash through the design. Explain what gets retried, what users see, and which latency, lag, or error signal would alert you." },
] as const;
