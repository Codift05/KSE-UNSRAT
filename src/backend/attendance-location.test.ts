import assert from "node:assert/strict";
import test from "node:test";
import { distanceMeters, validCoordinates } from "./attendance-location.ts";

test("validasi koordinat dan jarak", () => {
  assert.equal(Math.round(distanceMeters(1.4748, 124.8421, 1.4748, 124.8421)), 0);
  assert.equal(validCoordinates(1.4748, 124.8421, 25), true);
  assert.equal(validCoordinates(1.4748, 124.8421, 682014), true);
  assert.equal(validCoordinates(91, 124.8421, 25), false);
});
