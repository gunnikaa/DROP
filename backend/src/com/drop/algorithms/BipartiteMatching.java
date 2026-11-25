package com.drop.algorithms;

import java.util.Arrays;

/** Kuhn augmenting-path maximum bipartite matching: requests -> distinct compatible venues. */
public final class BipartiteMatching {
    private BipartiteMatching() {}
    public static int[] maximumMatching(boolean[][] edges) {
        if (edges == null) throw new IllegalArgumentException("Adjacency matrix cannot be null");
        int n = edges.length, m = n == 0 ? 0 : (edges[0] == null ? -1 : edges[0].length);
        if (m < 0) throw new IllegalArgumentException("Adjacency rows cannot be null");
        for (boolean[] row : edges) if (row == null || row.length != m)
            throw new IllegalArgumentException("Adjacency matrix must be rectangular");
        int[] venueToRequest = new int[m]; Arrays.fill(venueToRequest, -1);
        for (int request = 0; request < n; request++) augment(request, edges, new boolean[m], venueToRequest);
        int[] result = new int[n]; Arrays.fill(result, -1);
        for (int venue = 0; venue < m; venue++) if (venueToRequest[venue] >= 0) result[venueToRequest[venue]] = venue;
        return result;
    }
    private static boolean augment(int u, boolean[][] edges, boolean[] seen, int[] match) {
        for (int v = 0; v < match.length; v++) if (edges[u][v] && !seen[v]) {
            seen[v] = true;
            if (match[v] < 0 || augment(match[v], edges, seen, match)) { match[v] = u; return true; }
        }
        return false;
    }
}
