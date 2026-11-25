package com.drop.service;

import com.drop.server.Json;
import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.*;
import java.util.concurrent.CompletableFuture;

/** Geoapify Places adapter; results remain OSM-sourced, unverified discovery only. */
public final class GeoapifyService {
  private static final String BBOX = "72.75,18.89,73.00,19.29";
  private static final String CATEGORIES = "activity.community_center,activity.events_venue,catering.cafe,catering.restaurant,catering.bar,catering.pub,catering.food_court,commercial.art,commercial.clothing,commercial.marketplace,commercial.shopping_mall,entertainment.culture.gallery,entertainment.culture.arts_centre,entertainment.culture.theatre,entertainment.museum,office.coworking";
  private static final Set<String> CATEGORY_SEARCHES = Set.of("cafe", "cafes", "café", "cafés", "coffee", "restaurant", "restaurants", "bar", "bars", "pub", "pubs", "gallery", "galleries", "museum", "museums", "shop", "shops", "hotel", "hotels", "park", "parks", "theatre", "cinema", "event", "events", "event venue", "event venues", "exhibition", "exhibitions", "market", "markets", "popup", "pop-up", "pop up", "art", "arts centre", "community centre", "coworking");
  private static final Set<String> MUMBAI_AREAS = Set.of("bandra", "bandra west", "bandra east", "andheri", "andheri west", "andheri east", "juhu", "powai", "worli", "dadar", "fort", "mumbai", "pali", "pali hill", "colaba", "bkc", "lower parel", "malad", "borivali", "goregaon", "chembur", "kurla", "thane", "navi mumbai");
  private static HttpClient client() { return ClientHolder.CLIENT; }
  private static final class ClientHolder {
    private static final HttpClient CLIENT = HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(8)).build();
  }
  private GeoapifyService() {}

  public static List<Map<String,Object>> search(String rawQuery, String apiKey) throws Exception {
    String query = rawQuery == null ? "" : rawQuery.trim();
    StringBuilder url = new StringBuilder("https://api.geoapify.com/v2/places?categories=")
        .append(enc(CATEGORIES)).append("&filter=rect:").append(BBOX).append("&limit=100&lang=en&apiKey=").append(enc(apiKey));
    String normalized = query.toLowerCase(Locale.ROOT);
    if (!MUMBAI_AREAS.contains(normalized) && !isCategorySearch(normalized)) url.append("&name=").append(enc(query));
    HttpRequest request = HttpRequest.newBuilder(URI.create(url.toString())).timeout(Duration.ofSeconds(18))
        .header("User-Agent", "DROP-Mumbai-Venue-Discovery/1.0")
        .header("Accept", "application/json").GET().build();
    HttpResponse<String> response;
    try { response = client().send(request, HttpResponse.BodyHandlers.ofString()); }
    catch (java.net.http.HttpTimeoutException e) { throw new IllegalStateException("Place search timed out. Please retry in a moment."); }
    if (response.statusCode() == 401 || response.statusCode() == 403) throw new IllegalStateException("Place search is not configured correctly. Check the local API key setting.");
    if (response.statusCode() == 429) throw new IllegalStateException("Place search is busy. Please try again later.");
    if (response.statusCode() / 100 != 2) throw new IllegalStateException("Place search is temporarily unavailable. Please retry later.");
    List<Map<String,Object>> places = parse(response.body(), query);
    enrichContacts(places, apiKey);
    return places;
  }

  public static List<Map<String,Object>> parse(String json, String query) {
    Object root = Json.parse(json);
    if (!(root instanceof Map<?,?> object) || !(object.get("features") instanceof List<?> features)) return List.of();
    List<String> terms = isCategorySearch(query.toLowerCase(Locale.ROOT)) ? List.of() : Arrays.stream(query.toLowerCase(Locale.ROOT).split("[^\\p{L}\\p{N}]+"))
        .filter(t -> t.length() > 2 && !Set.of("the", "and", "for", "with", "near", "mumbai").contains(t))
        .map(t -> t.endsWith("s") && t.length() > 4 ? t.substring(0, t.length() - 1) : t).toList();
    List<Map<String,Object>> result = new ArrayList<>();
    for (Object feature : features) {
      if (!(feature instanceof Map<?,?> f) || !(f.get("properties") instanceof Map<?,?> p)) continue;
      String name = str(p.get("name"));
      if (name.isBlank()) continue;
      String address = first(p, "formatted", "address_line2", "address_line1");
      String category = category(p.get("categories"));
      String searchable = (name + " " + address + " " + category).toLowerCase(Locale.ROOT);
      if (!terms.isEmpty() && terms.stream().noneMatch(searchable::contains)) continue;
      double lat = number(p.get("lat")), lon = number(p.get("lon"));
      if ((lat == 0 || lon == 0) && f.get("geometry") instanceof Map<?,?> geometry && geometry.get("coordinates") instanceof List<?> coords && coords.size() >= 2) {
        lon = number(coords.get(0)); lat = number(coords.get(1));
      }
      if (lat == 0 || lon == 0) continue;
      Map<?,?> datasource = asMap(p.get("datasource"));
      Map<?,?> raw = asMap(datasource.get("raw"));
      String osmType = first(raw, "osm_type"), osmId = first(raw, "osm_id");
      String mapsUrl = "https://www.google.com/maps/search/?api=1&query=" + lat + "," + lon;
      String phone = first(p, "contact.phone", "datasource.raw.contact:phone", "datasource.raw.phone", "contact:phone", "phone");
      String email = first(p, "contact.email", "datasource.raw.contact:email", "datasource.raw.email", "contact:email", "email");
      String website = first(p, "contact.website", "datasource.raw.contact:website", "datasource.raw.website", "contact:website", "website", "url");
      Map<String,Object> place = new LinkedHashMap<>();
      String placeId = first(p, "place_id");
      place.put("id", !placeId.isBlank() ? placeId : !osmId.isBlank() ? "geo-" + osmType + "/" + osmId : "geo-" + lat + "/" + lon);
      place.put("geoapifyPlaceId", placeId);
      place.put("name", name); place.put("address", address); place.put("category", category);
      place.put("lat", lat); place.put("lng", lon); place.put("website", website); place.put("phone", phone); place.put("email", email);
      place.put("mapsUrl", mapsUrl); place.put("source", "GEOAPIFY_OPENSTREETMAP"); place.put("availabilityConfirmed", false);
      place.put("bookingMessage", "Contact this place to ask about pop-up availability.");
      result.add(place);
      if (result.size() == 20) break;
    }
    return List.copyOf(result);
  }

  private static void enrichContacts(List<Map<String,Object>> places, String apiKey) {
    List<Map<String,Object>> withPlaceIds = places.stream().filter(p -> !str(p.get("geoapifyPlaceId")).isBlank()).toList();
    for (int start = 0; start < withPlaceIds.size(); start += 5) {
      List<CompletableFuture<Void>> batch = new ArrayList<>();
      for (Map<String,Object> place : withPlaceIds.subList(start, Math.min(start + 5, withPlaceIds.size()))) {
        String url = "https://api.geoapify.com/v2/place-details?id=" + enc(str(place.get("geoapifyPlaceId"))) + "&apiKey=" + enc(apiKey);
        HttpRequest request = HttpRequest.newBuilder(URI.create(url)).timeout(Duration.ofSeconds(7)).header("Accept", "application/json").GET().build();
        CompletableFuture<Void> detail = client().sendAsync(request, HttpResponse.BodyHandlers.ofString())
            .thenAccept(response -> { if (response.statusCode() / 100 == 2) mergeDetails(place, response.body()); })
            .exceptionally(error -> null);
        batch.add(detail);
      }
      CompletableFuture.allOf(batch.toArray(CompletableFuture[]::new)).join();
      if (start + 5 < withPlaceIds.size()) {
        try { Thread.sleep(1_000); }
        catch (InterruptedException e) { Thread.currentThread().interrupt(); return; }
      }
    }
    for (Map<String,Object> place : places) place.remove("geoapifyPlaceId");
  }

  public static void mergeDetails(Map<String,Object> place, String json) {
    Object root = Json.parse(json);
    if (!(root instanceof Map<?,?> object) || !(object.get("features") instanceof List<?> features)) return;
    for (Object feature : features) {
      if (!(feature instanceof Map<?,?> f) || !(f.get("properties") instanceof Map<?,?> properties)) continue;
      if (properties.get("feature_type") != null && !"details".equals(properties.get("feature_type"))) continue;
      setIfPresent(place, "phone", first(properties, "contact.phone", "datasource.raw.contact:phone", "datasource.raw.phone", "contact:phone", "phone"));
      setIfPresent(place, "email", first(properties, "contact.email", "datasource.raw.contact:email", "datasource.raw.email", "contact:email", "email"));
      setIfPresent(place, "website", first(properties, "contact.website", "datasource.raw.contact:website", "datasource.raw.website", "contact:website", "website", "url"));
      return;
    }
  }

  private static void setIfPresent(Map<String,Object> place, String key, String value) {
    if (value != null && !value.isBlank()) place.put(key, value);
  }

  private static String enc(String value) { return URLEncoder.encode(value, StandardCharsets.UTF_8); }
  private static boolean isCategorySearch(String query) { return CATEGORY_SEARCHES.contains(query.trim().toLowerCase(Locale.ROOT)); }
  private static String str(Object value) { return value == null ? "" : String.valueOf(value); }
  private static double number(Object value) { return value instanceof Number n ? n.doubleValue() : 0; }
  private static Map<?,?> asMap(Object value) { return value instanceof Map<?,?> m ? m : Map.of(); }
  private static String first(Map<?,?> map, String... keys) {
    for (String key : keys) {
      Object v = map.get(key);
      if (key.startsWith("datasource.")) v = asMap(map.get("datasource")).get("raw") instanceof Map<?,?> raw ? raw.get(key.substring("datasource.raw.".length())) : null;
      else if (key.startsWith("contact.")) v = asMap(map.get("contact")).get(key.substring("contact.".length()));
      if (v != null && !String.valueOf(v).isBlank()) return String.valueOf(v);
    }
    return "";
  }
  private static String category(Object value) {
    if (value instanceof List<?> categories && !categories.isEmpty()) {
      String full = String.valueOf(categories.get(0));
      int last = full.lastIndexOf('.');
      return (last >= 0 ? full.substring(last + 1) : full).replace('_', ' ');
    }
    return "place";
  }
}
