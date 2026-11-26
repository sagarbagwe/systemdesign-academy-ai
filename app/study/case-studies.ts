import type { StudyTopic } from "./types";

export const engineeringTopics: StudyTopic[] = [
  {
    id: "shopify-inventory-reservations", title: "Shopify Inventory Reservations", group: "cases", practice: "inventory",
    summary: "Use a retail inventory scenario to reason about overselling and storage authority.",
    method: "Keep the balance and reservations under the same transactional decision. Reserve only if available quantity is sufficient. Confirm or expire the hold with a check on its current ID and version.",
    tradeoff: "A cache can show availability cheaply. A conflicting purchase needs one durable authority to decide who receives the stock.",
    say: "A catalogue can show older availability. Checkout asks the inventory writer to reserve stock atomically, so two orders cannot both claim the last item.",
    diagram: [["Checkout", "Inventory service", "Reserve SKU quantity"], ["Inventory service", "Transactional inventory DB", "Update stock and hold"], ["Expiry worker", "Transactional inventory DB", "Release current hold", "async"], ["Catalogue", "Availability cache", "Read advisory stock"]],
  },
  {
    id: "discord-message-storage", title: "Discord Message Storage", group: "cases", practice: "messaging",
    summary: "Use a large chat archive to study partition layout and hot-channel reads.",
    method: "Store messages by conversation and time bucket, ordered by a cursor. Make common history reads bounded. Coalesce repeated reads on hot channels and measure tail latency during migrations.",
    tradeoff: "A finer bucket limits partition size but makes long history scans touch more partitions.",
    say: "The common read is recent messages in one channel. I’ll partition for that access pattern and share work when many clients ask for the same window.",
    diagram: [["Chat API", "Message store", "Write channel and bucket"], ["History reads", "Request coalescer", "Share identical lookups"], ["Request coalescer", "Message store", "Read ordered page"]],
  },
  {
    id: "slack-job-queue", title: "Slack Job Queue", group: "cases", practice: "job-queue",
    summary: "Study how a durable front buffer can protect a job execution queue during write bursts.",
    method: "Persist submissions in a partitioned log, then admit jobs to the execution queue at a rate the workers can drain. Bound the backlog and fence each completion.",
    tradeoff: "A second queue adds recovery and ordering questions. It protects a hot execution tier when ingestion peaks are higher than steady processing capacity.",
    say: "I’ll absorb the burst in a durable log and feed workers at a known rate. I’ll monitor age, because an accepted job still has a deadline.",
    diagram: [["Job producers", "Durable ingress log", "Absorb submission burst", "async"], ["Durable ingress log", "Admission workers", "Read at drain capacity", "async"], ["Admission workers", "Execution queue", "Submit by stable job ID", "async"], ["Execution queue", "Worker pool", "Lease job", "async"]],
  },
  {
    id: "figma-multiplayer", title: "Figma Multiplayer", group: "cases", practice: "collaborative-docs",
    summary: "Explore concurrent editing through shared object IDs and explicit merge rules.",
    method: "Represent edits to objects and properties as operations with client IDs. Send them through a document session, merge competing edits by defined rules, and replay missing operations on reconnect.",
    tradeoff: "Property-level conflict rules improve collaboration on independent edits. Moves, deletes, and awareness still need explicit semantics.",
    say: "Two people editing different properties can usually merge. I’ll define what happens when they edit the same property or move an object another person deletes.",
    diagram: [["Editor A", "Document session", "Send property edit"], ["Editor B", "Document session", "Send concurrent edit"], ["Document session", "Operation log", "Sequence and persist"], ["Operation log", "Connected editors", "Broadcast merged state", "async"]],
  },
  {
    id: "spotify-data-lake", title: "Spotify Data Lake", group: "cases", practice: "object-storage",
    summary: "Study how a point lookup can find a small relevant part of a large data lake.",
    method: "Keep immutable files in object storage and maintain a key-to-location index for frequent point lookups. Use row-group metadata and a versioned manifest to find the right file slice.",
    tradeoff: "An index avoids scanning the lake but needs updates and validation as partitions compact and snapshots change.",
    say: "A point lookup should read one small data range, not scan a whole dataset. I’ll version the locator along with the dataset snapshot.",
    diagram: [["Lookup API", "Key locator index", "Find object and row group"], ["Key locator index", "Snapshot manifest", "Resolve snapshot version"], ["Lookup API", "Object storage", "Fetch bounded file range"]],
  },
  {
    id: "meta-zgateway", title: "Meta ZGateway", group: "cases", practice: "key-value-store",
    summary: "Use a database gateway scenario to study connection fan-in, routing, and overload.",
    method: "Accept many client connections at a smaller gateway tier, pool connections to replicas, and route by shard ownership. Apply deadlines and bounded retries, then shed load when budgets are exhausted.",
    tradeoff: "Gateways hide topology and reduce connection counts at storage nodes. They add a hop and need their own availability and capacity plan.",
    say: "The gateway owns routing and connection reuse. I’ll bound retries there so a slow replica doesn’t turn thousands of callers into extra backend traffic.",
    diagram: [["Application clients", "Database gateway", "Send bounded operation"], ["Shard map", "Database gateway", "Resolve replica set"], ["Database gateway", "Data replicas", "Use pooled connection"], ["Database gateway", "Overload response", "Shed excess work", "reject"]],
  },
];
