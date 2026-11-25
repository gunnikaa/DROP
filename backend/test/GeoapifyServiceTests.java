import com.drop.service.GeoapifyService;
import java.util.List;
import java.util.Map;

public final class GeoapifyServiceTests {
  public static void main(String[] args) {
    String response = "{\"features\":["
        + "{\"properties\":{\"place_id\":\"place-1\",\"name\":\"Pali Cafe\",\"formatted\":\"Pali Hill, Mumbai\",\"categories\":[\"catering.cafe\"],\"lat\":19.06,\"lon\":72.83,\"datasource\":{\"raw\":{\"osm_type\":\"node\",\"osm_id\":\"123\",\"contact:phone\":\"+91 22 1234\",\"contact:email\":\"cafe@example.test\",\"contact:website\":\"https://example.test\"}}}},"
        + "{\"properties\":{\"place_id\":\"place-2\",\"name\":\"Other Restaurant\",\"formatted\":\"Fort, Mumbai\",\"categories\":[\"catering.restaurant\"],\"lat\":18.93,\"lon\":72.83}}]}";
    List<Map<String,Object>> pali = GeoapifyService.parse(response, "Pali");
    check(pali.size() == 1, "name query filters live-provider response");
    Map<String,Object> place = pali.get(0);
    check("GEOAPIFY_OPENSTREETMAP".equals(place.get("source")), "provider and source are identified");
    check(Boolean.FALSE.equals(place.get("availabilityConfirmed")), "external results remain unverified");
    check("https://www.google.com/maps/search/?api=1&query=19.06,72.83".equals(place.get("mapsUrl")), "map links open coordinates in Google Maps");
    check("+91 22 1234".equals(place.get("phone")) && "cafe@example.test".equals(place.get("email")) && "https://example.test".equals(place.get("website")), "OSM contact tags are mapped to visible fields");
    Map<String,Object> detailsTarget = new java.util.HashMap<>();
    GeoapifyService.mergeDetails(detailsTarget, "{\"features\":[{\"properties\":{\"feature_type\":\"details\",\"contact\":{\"phone\":\"+91 22 9876\",\"email\":\"hello@example.test\"},\"website\":\"https://venue.example.test\"}}]}");
    check("+91 22 9876".equals(detailsTarget.get("phone")) && "hello@example.test".equals(detailsTarget.get("email")) && "https://venue.example.test".equals(detailsTarget.get("website")), "Place Details contact fields are merged into search results");
    check(GeoapifyService.parse(response, "events").size() == 2, "category searches show suitable categories instead of name matches");
    check(GeoapifyService.parse("{\"features\":[]}", "Mumbai").isEmpty(), "empty provider result is handled");
    System.out.println("PASS: Geoapify adapter tests (8 assertions)");
  }

  private static void check(boolean passed, String message) {
    if (!passed) throw new AssertionError("FAIL: " + message);
    System.out.println("PASS: " + message);
  }
}
