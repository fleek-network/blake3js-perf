import { VECTOR } from "./testvec.ts";
import { hash } from "./js/latest.ts";
import { assertStrictEquals } from "https://deno.land/std/assert/mod.ts";

function buf2hex(buffer: ArrayLike<number>) {
  return [...new Uint8Array(buffer)]
    .map((x) => x.toString(16).padStart(2, "0"))
    .join("");
}

function previousPow2(n: number): number {
  n = n | (n >> 1);
  n = n | (n >> 2);
  n = n | (n >> 4);
  n = n | (n >> 8);
  n = n | (n >> 16);
  return n - (n >> 1);
}

Deno.test({
  name: "TEST VECTOR",
  fn() {
    const buffer = new Uint8Array(128 * 1024);
    for (let i = 0; i < buffer.length; ++i) {
      buffer[i] = i & 0xff;
    }

    for (let id = 0; id < VECTOR.length; ++id) {
      const [size, expectedHash] = VECTOR[id]! as [number, string];
      const input = new Uint8Array(buffer.buffer, 0, size);
      const actualHash = buf2hex(hash(input));
      // if (actualHash !== expectedHash) {
      //   console.log(size, size - previousPow2(size));
      // }
      assertStrictEquals(actualHash, expectedHash, `size=${size};` + input);
    }
  },
});

Deno.test({
  name: "Right Rotate",
  fn() {
    const input = new Uint8Array(32);
    // this will force the first call to rightRotate to have input=0xffffffff or -1 but
    // regardless it should work.
    input[0] = 25;
    input[1] = 199;
    input[2] = 231;
    input[3] = 68;
    const actualHash = buf2hex(hash(input));
    assertStrictEquals(
      actualHash,
      "a1d06679e5df29d2b07da0e86a97ede72f9aed3dd186631c0adcc1d46788bcf4",
    );
  },
});
