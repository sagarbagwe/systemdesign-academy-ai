import type { StudyTopic } from "./types";

export const advancedTopics: StudyTopic[] = [
  {
    id: "proximity-search", title: "Proximity Search", group: "advanced", practice: "nearby-search",
    summary: "Use spatial indexes to search nearby places without scanning all coordinates.",
    method: "Cover the radius with cells, retrieve candidate IDs, and filter exact distance before ranking. Track dense areas separately and use versioned cursors for stable pages.",
    tradeoff: "Smaller cells reduce false candidates but require checking more cells for a wide radius.",
    say: "The spatial index gives me candidates, not the final radius. I’ll compute exact distance before returning or ranking a place.",
    diagram: [["Map query", "Cell coverage", "Cover the requested radius"], ["Cell coverage", "Spatial index", "Fetch candidate IDs"], ["Spatial index", "Distance filter", "Apply actual radius"], ["Distance filter", "Ranked response", "Order and paginate"]],
  },
  {
    id: "vector-databases", title: "Vector Databases", group: "advanced", practice: "vector-search",
    summary: "Retrieve similar embeddings while balancing recall, latency, and index cost.",
    method: "Store vectors with model version and metadata. Restrict the tenant and access scope before surfacing candidates, use approximate retrieval where useful, and measure recall against an exact baseline.",
    tradeoff: "Graph and compressed indexes trade memory, build/update costs, and recall. Extremely selective filters may favor a bounded exact scan.",
    say: "I’ll measure how many true neighbors the index recovers at the latency target, and I’ll test that again with highly selective filters.",
    diagram: [["Query embedding", "Authorized query router", "Apply tenant scope"], ["Authorized query router", "Vector index", "Find approximate candidates"], ["Vector index", "Exact reranker", "Score the shortlist"], ["Exact reranker", "Neighbor results", "Return top K"]],
  },
  {
    id: "time-series-databases", title: "Time Series Databases", group: "advanced", practice: "time-series-db",
    summary: "Write and query timestamped values efficiently by series and time range.",
    method: "Map a bounded label set to a series ID. Append and compact time blocks, downsample older data, and query only the necessary blocks or aggregate tier.",
    tradeoff: "Compression and downsampling save storage. High label cardinality or poorly bounded queries can still exhaust resources.",
    say: "I’ll budget unique series separately from sample volume. A new label with many distinct values can hurt even if the overall write rate is unchanged.",
    diagram: [["Metric samples", "Ingest router", "Validate series labels"], ["Ingest router", "Time blocks", "Append by series and time"], ["Time blocks", "Downsampled storage", "Roll up older data", "async"], ["Range query", "Time blocks", "Scan relevant interval"]],
  },
  {
    id: "big-data-structures", title: "Data Structures for Big Data", group: "advanced", practice: "video-top-k",
    summary: "Use compact summaries when storing or shipping every observation is expensive.",
    method: "Start with an exact baseline. Use a Bloom filter for possible membership, a cardinality sketch for approximate distinct counts, or a frequency sketch for heavy hitters. Validate candidates when false positives matter.",
    tradeoff: "Approximation reduces memory and network cost. Each structure has a different error model and cannot replace evidence for auditing exact outcomes.",
    say: "I’ll use a sketch to shortlist likely popular videos, then verify the shortlist using exact counts when close rankings matter.",
    diagram: [["Event stream", "Partition sketches", "Update compact summaries", "async"], ["Partition sketches", "Merge worker", "Combine estimates"], ["Merge worker", "Exact event store", "Verify candidate counts"], ["Merge worker", "Ranking response", "Publish with stated error"]],
  },
  {
    id: "change-data-capture", title: "Change Data Capture", group: "advanced", practice: "database-sharding",
    summary: "Project committed database changes to other systems without polling for every row.",
    method: "Capture a starting snapshot and a corresponding log position, publish committed changes in order, and retain offsets for recovery. The sink should apply updates and tombstones idempotently.",
    tradeoff: "Log capture reduces dual-write inconsistency. Schema changes, retention gaps, and replay still need a plan.",
    say: "I’ll copy a consistent snapshot, then replay changes from its log position. I’ll verify the sink before switching readers or writers.",
    diagram: [["Source database", "Change capture connector", "Read committed log"], ["Change capture connector", "Versioned change stream", "Publish ordered updates", "async"], ["Versioned change stream", "Target projector", "Replay from offset", "async"], ["Target projector", "Target database", "Apply idempotently"]],
  },
];
