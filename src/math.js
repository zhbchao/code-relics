const buffer = new ArrayBuffer(4);
const view = new DataView(buffer);

export function floatToBits(value) {
  view.setFloat32(0, Math.fround(value), false);
  return view.getUint32(0, false);
}

export function bitsToFloat(bits) {
  view.setUint32(0, bits >>> 0, false);
  return view.getFloat32(0, false);
}

export function toBinary(bits) {
  return (bits >>> 0).toString(2).padStart(32, "0");
}

export function toHex(bits) {
  return `0x${(bits >>> 0).toString(16).padStart(8, "0")}`;
}

export function decomposeFloat(value) {
  const bits = floatToBits(value);
  const binary = toBinary(bits);
  const exponentRaw = (bits >>> 23) & 0xff;

  return {
    value: Math.fround(value),
    bits,
    binary,
    sign: binary.slice(0, 1),
    exponent: binary.slice(1, 9),
    mantissa: binary.slice(9),
    exponentRaw,
    exponentUnbiased: exponentRaw - 127,
  };
}

export function fastInverseSqrt(input) {
  if (!Number.isFinite(input) || input <= 0) {
    throw new RangeError("Fast inverse square root requires a positive finite number.");
  }

  const number = Math.fround(input);
  const x2 = Math.fround(number * 0.5);
  const inputBits = floatToBits(number);
  const shiftedBits = inputBits >>> 1;
  const magicBits = (0x5f3759df - shiftedBits) >>> 0;
  const initial = bitsToFloat(magicBits);
  const correction = Math.fround(
    1.5 - Math.fround(x2 * Math.fround(initial * initial)),
  );
  const refined = Math.fround(initial * correction);
  const truth = 1 / Math.sqrt(number);

  return {
    number,
    x2,
    inputBits,
    shiftedBits,
    magicBits,
    initial,
    correction,
    refined,
    truth,
    initialError: Math.abs((initial - truth) / truth),
    refinedError: Math.abs((refined - truth) / truth),
  };
}

export function errorCurve(minExponent = -6, maxExponent = 6, count = 181) {
  return Array.from({ length: count }, (_, index) => {
    const ratio = index / (count - 1);
    const exponent = minExponent + (maxExponent - minExponent) * ratio;
    const input = 10 ** exponent;
    const result = fastInverseSqrt(input);

    return {
      exponent,
      input,
      initialError: result.initialError,
      refinedError: result.refinedError,
    };
  });
}
