import type { Agent } from "./types.ts";

/**
 * Baut ein soziales Netzwerk zwischen Agenten.
 * In Runde 2+ sieht ein Agent die Reaktionen seiner Nachbarn.
 *
 * Topologien:
 * - small_world: Watts-Strogatz (Solo-Unternehmer, enge Peer-Gruppen)
 * - scale_free: Barabási-Albert (E-Com, Influencer-Hubs)
 * - hierarchical_cluster: Cluster mit Brücken (B2B, Branchen-Silos)
 * - scale_free_dense: Dichtes Scale-Free (Gen Z, viele schwache Ties)
 * - random: Fallback (DACH Allgemein)
 */

export function buildNetwork(
  agents: Agent[],
  topologyType: string,
  avgConnections: number,
): void {
  const n = agents.length;
  if (n < 3) return;

  const adj: Set<number>[] = Array.from({ length: n }, () => new Set());

  switch (topologyType) {
    case "small_world":
      buildSmallWorld(adj, n, avgConnections, 0.3);
      break;
    case "scale_free":
      buildScaleFree(adj, n, Math.max(1, Math.floor(avgConnections / 2)));
      break;
    case "hierarchical_cluster":
      buildHierarchicalCluster(adj, n, avgConnections);
      break;
    case "scale_free_dense":
      buildScaleFree(adj, n, Math.max(1, Math.floor(avgConnections / 2)));
      break;
    case "random":
    default:
      buildRandom(adj, n, avgConnections);
  }

  for (let i = 0; i < n; i++) {
    agents[i].connections = Array.from(adj[i]);
  }
}

// --- Watts-Strogatz Small World ---

function buildSmallWorld(adj: Set<number>[], n: number, k: number, rewiringProb: number): void {
  const halfK = Math.max(1, Math.floor(k / 2));

  // Ring-Lattice
  for (let i = 0; i < n; i++) {
    for (let j = 1; j <= halfK; j++) {
      addEdge(adj, i, (i + j) % n);
    }
  }

  // Rewiring
  for (let i = 0; i < n; i++) {
    for (let j = 1; j <= halfK; j++) {
      if (Math.random() < rewiringProb) {
        const oldNeighbor = (i + j) % n;
        let newNeighbor: number;
        let attempts = 0;
        do {
          newNeighbor = Math.floor(Math.random() * n);
          attempts++;
        } while ((newNeighbor === i || adj[i].has(newNeighbor)) && attempts < 20);

        if (attempts < 20) {
          removeEdge(adj, i, oldNeighbor);
          addEdge(adj, i, newNeighbor);
        }
      }
    }
  }
}

// --- Barabási-Albert Scale Free ---

function buildScaleFree(adj: Set<number>[], n: number, m: number): void {
  // Starte mit vollständigem Graph aus m+1 Knoten
  const initial = Math.min(m + 1, n);
  for (let i = 0; i < initial; i++) {
    for (let j = i + 1; j < initial; j++) {
      addEdge(adj, i, j);
    }
  }

  // Preferential Attachment für restliche Knoten
  for (let i = initial; i < n; i++) {
    const targets = selectPreferentialTargets(adj, i, m);
    for (const t of targets) {
      addEdge(adj, i, t);
    }
  }
}

function selectPreferentialTargets(adj: Set<number>[], newNode: number, m: number): number[] {
  const targets = new Set<number>();
  const degrees = adj.slice(0, newNode).map(s => s.size + 1); // +1 um isolierte Knoten zu vermeiden
  const totalDegree = degrees.reduce((a, b) => a + b, 0);

  let attempts = 0;
  while (targets.size < m && attempts < m * 10) {
    let rand = Math.random() * totalDegree;
    for (let j = 0; j < newNode; j++) {
      rand -= degrees[j];
      if (rand <= 0 && !targets.has(j)) {
        targets.add(j);
        break;
      }
    }
    attempts++;
  }
  return Array.from(targets);
}

// --- Hierarchical Cluster ---

function buildHierarchicalCluster(adj: Set<number>[], n: number, avgConnections: number): void {
  const clusterSize = Math.max(4, Math.min(8, Math.floor(n / 5)));
  const numClusters = Math.ceil(n / clusterSize);

  // Intra-Cluster: dicht vernetzt (70%)
  for (let c = 0; c < numClusters; c++) {
    const start = c * clusterSize;
    const end = Math.min(start + clusterSize, n);
    for (let i = start; i < end; i++) {
      for (let j = i + 1; j < end; j++) {
        if (Math.random() < 0.7) {
          addEdge(adj, i, j);
        }
      }
    }
  }

  // Inter-Cluster: 1-2 Brücken
  for (let c1 = 0; c1 < numClusters; c1++) {
    for (let c2 = c1 + 1; c2 < numClusters; c2++) {
      const bridges = 1 + Math.floor(Math.random() * 2);
      for (let b = 0; b < bridges; b++) {
        const i = c1 * clusterSize + Math.floor(Math.random() * Math.min(clusterSize, n - c1 * clusterSize));
        const j = c2 * clusterSize + Math.floor(Math.random() * Math.min(clusterSize, n - c2 * clusterSize));
        if (i < n && j < n) addEdge(adj, i, j);
      }
    }
  }
}

// --- Random Graph ---

function buildRandom(adj: Set<number>[], n: number, avgConnections: number): void {
  const edgeProb = avgConnections / (n - 1);
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      if (Math.random() < edgeProb) {
        addEdge(adj, i, j);
      }
    }
  }
}

// --- Helpers ---

function addEdge(adj: Set<number>[], i: number, j: number): void {
  adj[i].add(j);
  adj[j].add(i);
}

function removeEdge(adj: Set<number>[], i: number, j: number): void {
  adj[i].delete(j);
  adj[j].delete(i);
}
