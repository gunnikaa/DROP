package com.drop.service;

import com.drop.server.Json;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

/** Public, unverified place discovery through OpenStreetMap's Overpass API. */
public final class OverpassService {
  private static final String BBOX = "(18.89,72.75,19.29,73.00)";
  private static final long CACHE_TTL_MS = Duration.ofMinutes(15).toMillis();
  private static final Map<String,Cached> CACHE = new ConcurrentHashMap<>();
  private static long lastRequestAt;
  private static final HttpClient CLIENT = HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(8)).build();
  private record Cached(long savedAt, List<Map<String,Object>> places) {}

  public static synchronized List<Map<String,Object>> search(String rawQuery) throws Exception {
    String query = rawQuery == null ? "" : rawQuery.trim();
    if (query.length() < 2 || query.length() > 100) throw new IllegalArgumentException("Search must contain 2 to 100 characters.");
    String geoapifyKey = System.getenv("DROP_GEOAPIFY_API_KEY");
    if (geoapifyKey != null && !geoapifyKey.isBlank()) {
      String cacheKey = "geoapify:" + query.toLowerCase(Locale.ROOT);
      long cachedAt = System.currentTimeMillis();
      Cached cached = CACHE.get(cacheKey);
      if (cached != null && cachedAt - cached.savedAt() < CACHE_TTL_MS) return cached.places();
      List<Map<String,Object>> places = GeoapifyService.search(query, geoapifyKey.trim());
      CACHE.put(cacheKey, new Cached(cachedAt, places));
      return places;
    }
    long now = System.currentTimeMillis();
    Cached cached = CACHE.get(query.toLowerCase(Locale.ROOT));
    if (cached != null && now - cached.savedAt() < CACHE_TTL_MS) return cached.places();
    if (now - lastRequestAt < 3_000) throw new IllegalStateException("Please wait a few seconds before starting another public place search.");
    lastRequestAt = now;
    String ql = "[out:json][timeout:18];(" +
      "nwr[\"name\"][\"amenity\"~\"^(cafe|restaurant|bar|pub|arts_centre|community_centre|events_venue|marketplace|theatre|cinema)$\"]" + BBOX + ";" +
      "nwr[\"name\"][\"shop\"~\"^(gallery|art|clothes|mall|antiques)$\"]" + BBOX + ";" +
      "nwr[\"name\"][\"tourism\"~\"^(gallery|museum|attraction)$\"]" + BBOX + ";" +
      "nwr[\"name\"][\"leisure\"~\"^(fitness_centre|sports_centre|park)$\"]" + BBOX + ";" +
      ");out center tags 100;";
    String endpoint = System.getenv().getOrDefault("DROP_OVERPASS_URL", "https://overpass.private.coffee/api/interpreter");
    HttpRequest request = HttpRequest.newBuilder(URI.create(endpoint))
      .timeout(Duration.ofSeconds(25)).header("Content-Type", "application/x-www-form-urlencoded; charset=utf-8")
      .header("User-Agent", "DROP-Mumbai-Venue-Discovery/1.0 (OpenStreetMap attribution; educational prototype)")
      .POST(HttpRequest.BodyPublishers.ofString("data=" + java.net.URLEncoder.encode(ql, java.nio.charset.StandardCharsets.UTF_8))).build();
    HttpResponse<String> response;
    try { response = CLIENT.send(request, HttpResponse.BodyHandlers.ofString()); }
    catch (java.net.http.HttpTimeoutException e) { throw new IllegalStateException("Place search timed out. Please retry in a moment."); }
    if (response.statusCode() / 100 != 2) throw new IllegalStateException("Place search is temporarily unavailable. Please try again later.");
    Object root = Json.parse(response.body());
    if (!(root instanceof Map<?,?> map) || !(map.get("elements") instanceof List<?> elements)) { CACHE.put(query.toLowerCase(Locale.ROOT), new Cached(now, List.of())); return List.of(); }
    List<String> terms = Arrays.stream(query.toLowerCase(Locale.ROOT).split("[^\\p{L}\\p{N}]+"))
      .filter(term -> term.length() > 2 && !Set.of("the", "and", "for", "with", "near", "mumbai").contains(term))
      .map(term -> term.endsWith("s") && term.length() > 4 ? term.substring(0, term.length() - 1) : term).toList();
    List<Map<String,Object>> results = new ArrayList<>();
    for (Object item : elements) {
      if (!(item instanceof Map<?,?> e) || !(e.get("tags") instanceof Map<?,?> tags)) continue;
      String name = String.valueOf(tags.get("name") == null ? "" : tags.get("name"));
      if (name.isBlank()) continue;
      String address = address(tags);
      String category = category(tags);
      String searchable = (name + " " + address + " " + category).toLowerCase(Locale.ROOT);
      if (!terms.isEmpty() && terms.stream().noneMatch(searchable::contains)) continue;
      Map<?,?> center = e.get("center") instanceof Map<?,?> c ? c : e;
      double lat = number(center.get("lat")), lng = number(center.get("lon"));
      if (lat == 0 || lng == 0) continue;
      String id = String.valueOf(e.get("type") == null ? "node" : e.get("type")) + "/" + (e.get("id") == null ? "" : e.get("id"));
      String website = first(tags, "website", "contact:website", "url");
      String phone = first(tags, "phone", "contact:phone");
      String email = first(tags, "email", "contact:email");
      String mapUrl = "https://www.google.com/maps/search/?api=1&query=" + lat + "," + lng;
      Map<String,Object> place = new LinkedHashMap<>();
      place.put("id", id); place.put("name", name); place.put("address", address); place.put("category", category);
      place.put("lat", lat); place.put("lng", lng); place.put("website", website); place.put("phone", phone); place.put("email", email);
      place.put("mapsUrl", mapUrl); place.put("source", "OPENSTREETMAP"); place.put("availabilityConfirmed", false);
      place.put("bookingMessage", "Contact this place to ask about pop-up availability.");
      results.add(place);
      if (results.size() == 20) break;
    }
    List<Map<String,Object>> immutableResults = List.copyOf(results);
    CACHE.put(query.toLowerCase(Locale.ROOT), new Cached(now, immutableResults));
    if (CACHE.size() > 50) CACHE.keySet().stream().findFirst().ifPresent(CACHE::remove);
    return immutableResults;
  }

  private static String address(Map<?,?> tags) {
    List<String> parts = new ArrayList<>();
    for (String key : List.of("addr:housenumber", "addr:street", "addr:suburb", "addr:city", "addr:postcode")) {
      Object value = tags.get(key); if (value != null && !String.valueOf(value).isBlank()) parts.add(String.valueOf(value));
    }
    return String.join(", ", parts);
  }
  private static String category(Map<?,?> tags) {
    for (String key : List.of("amenity", "shop", "leisure", "tourism", "office")) if (tags.get(key) != null) return String.valueOf(tags.get(key));
    return "place";
  }
  private static String first(Map<?,?> tags, String... keys) { for (String key : keys) if (tags.get(key) != null) return String.valueOf(tags.get(key)); return ""; }
  private static double number(Object value) { return value instanceof Number n ? n.doubleValue() : 0; }
}
