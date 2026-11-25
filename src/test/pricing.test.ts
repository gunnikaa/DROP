import { describe, expect, it } from "vitest";
import { priceSummary } from "@/lib/format";

describe("booking price summary", () => {
  it("adds an 8% DROP fee to the hourly subtotal", () => {
    expect(priceSummary(2000, 3)).toEqual({ subtotal: 6000, fee: 480, total: 6480 });
  });
});
