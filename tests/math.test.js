import assert from "node:assert/strict";
import test from "node:test";

import {
  bitsToFloat,
  decomposeFloat,
  fastInverseSqrt,
  floatToBits,
  toHex,
} from "../src/math.js";

test("float32 bit conversion round-trips representative values", () => {
  for (const value of [0.001, 0.5, 1, 2, 42, 10000]) {
    assert.equal(bitsToFloat(floatToBits(value)), Math.fround(value));
  }
});

test("IEEE-754 decomposition exposes sign, exponent and mantissa", () => {
  const parts = decomposeFloat(1);

  assert.equal(parts.sign, "0");
  assert.equal(parts.exponent, "01111111");
  assert.equal(parts.mantissa, "0".repeat(23));
  assert.equal(parts.exponentUnbiased, 0);
  assert.equal(toHex(parts.bits), "0x3f800000");
});

test("one Newton step keeps relative error below 0.2% across useful range", () => {
  for (let exponent = -6; exponent <= 6; exponent += 0.125) {
    const result = fastInverseSqrt(10 ** exponent);
    assert.ok(
      result.refinedError < 0.002,
      `relative error ${result.refinedError} was too high at 10^${exponent}`,
    );
  }
});

test("Newton iteration improves the initial approximation", () => {
  for (const value of [0.01, 0.1, 1, 2, 42, 100, 10000]) {
    const result = fastInverseSqrt(value);
    assert.ok(result.refinedError < result.initialError);
  }
});

test("invalid inputs are rejected", () => {
  for (const value of [0, -1, Number.NaN, Number.POSITIVE_INFINITY]) {
    assert.throws(() => fastInverseSqrt(value), RangeError);
  }
});
