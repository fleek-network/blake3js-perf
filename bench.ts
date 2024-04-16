import { hash as rustWasmHash } from "./blake3-wasm/pkg/blake3_wasm.js";
import { sha256 } from "https://denopkg.com/chiefbiiko/sha256@v1.0.0/mod.ts";
import { hash as jsHashV0 } from "./js/v0.ts";
import { hash as jsHashV1 } from "./js/v1.ts";
import { hash as jsHashV2 } from "./js/v2.ts";
import { hash as jsHashV3 } from "./js/v3.ts";
import { hash as jsHashV4 } from "./js/v4.ts";
import { hash as jsHashV5 } from "./js/v5.ts";
import { hash as latestHash } from "./js/latest.ts";

// Share the same input buffer across benchmars.
const INPUT_BUFFER = new Uint8Array(1024 * 1024);
const BENCH_CASES = (<[string, number][]>[
  ["96B", 96],
  ["512B", 512],
  ["1Kib", 1 * 1024],
  ["32Kib", 32 * 1024],
  ["64Kib", 64 * 1024],
  ["256Kib", 256 * 1024],
  ["1MB", 1024 * 1024],
]).map(([humanSize, length]) => {
  // Slice up to `length` many bytes from the shared array.
  const array = new Uint8Array(INPUT_BUFFER.buffer, 0, length);
  return <[string, Uint8Array]>[humanSize, array];
});

// Randomize the input.
for (let i = 0; i < INPUT_BUFFER.length; ) {
  let rng = Math.random() * Number.MAX_SAFE_INTEGER;
  for (let j = 0; j < 4; ++j) {
    INPUT_BUFFER[i++] = rng & 0xff;
    rng >>= 8;
  }
}

function bench(name: string, fn: (array: Uint8Array) => any) {
  for (const [group, input] of BENCH_CASES) {
    Deno.bench({
      name: `${name} ${group}`,
      group,
      fn() {
        fn(input);
      },
    });
  }
}

bench("Sha256", sha256);
bench("Rust (wasm)", rustWasmHash);
bench("Js#01", jsHashV0);
bench("Js#02", jsHashV1);
bench("Js#03", jsHashV2);
bench("Js#04", jsHashV3);
bench("Js#05", jsHashV4);
bench("Js#06", jsHashV5);
bench("Js#07", latestHash);
