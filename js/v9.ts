type Word = number;
type W16 = Uint32Array & { length: 16 };
type W8 = Uint32Array & { length: 8 };

const BLOCK_LEN = 64;

const CHUNK_START = 1 << 0;
const CHUNK_END = 1 << 1;
const PARENT = 1 << 2;
const ROOT = 1 << 3;

const IV = new Uint32Array([
  0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c,
  0x1f83d9ab, 0x5be0cd19,
]) as W8;

// Blake3 is really little endian friendly, given +95% of devices running the client
// are indeed little endian, we can do some optimizations in regards to that.
const IsBigEndian = !new Uint8Array(new Uint32Array([1]).buffer)[0];

// Pre-allocate and reuse when possible.
const blockWords = new Uint32Array(16) as W16;

// prettier-ignore
const { compress4x, wasmMemoryBuffer } = await (async function () {
  let wasmCode = new Uint8Array(10 * 1024);
  let currentSize = 0;

  function put(value: ArrayLike<number>) {
    for (let i = 0; i < value.length; ++i, ++currentSize) {
      wasmCode[currentSize] = value[i];
    }
  }

  // Write a fixed size LEB-u32 in the given location. 5 bytes should be reserved.
  function writeLebU32(value: number, pos: number) {
    for (let i = 0; i < 5; ++i) {
      wasmCode[pos + i] = (value & 127) | (i < 4 ? 0x80 : 0);
      value = value >> 7;
    }
  }

  // Convert a number a number to LEB-u32
  function toLebU32(value: number) {
    value |= 0;
    const result: number[] = [];
    while (true) {
      const byte_ = value & 0x7f;
      value >>= 7;
      if (
        (value === 0 && (byte_ & 0x40) === 0) ||
        (value === -1 && (byte_ & 0x40) !== 0)
      ) {
        result.push(byte_);
        return result;
      }
      result.push(byte_ | 0x80);
    }
  }

  put([
    0x00, 0x61, 0x73, 0x6d, // magic
    0x01, 0x00, 0x00, 0x00, // version

    // SECTION 1: Types
    // vec<functype>
    0x01, 0x04, // {
    0x01, // [

    // T0: func compress4() -> ()
    0x60, 0x00, 0x00, // ]}

    // SECTION 2: Imports
    0x02, 0x0b, // {
    0x01, // [(
    0x02, 0x6a, 0x73, // mod="js"
    0x03, 0x6d, 0x65, 0x6d, // nm="mem"
    0x02, 0x00, 0x01, // mem {min=1, max=empty}
    //)]}

    // SECTION 3: Functions
    // vec<typeidx>
    0x03, 0x02, // {
    0x01, // [
    // T0
    0x00, // ]}

    // SECTION 7: Exports
    0x07, 0x0e, // {
    0x01, // [(
    // name="compress4x"
    0x0a, 0x63, 0x6F, 0x6D, 0x70, 0x72, 0x65, 0x73, 0x73, 0x34, 0x78,
    // export desc: funcidx
    0x00, 0x00,//)]}

    // SECTION 10: Code
    // Reserve 5 bytes for a u32:LEB128.
    // codesec = section(vec(code))
    // code = size:u32 code:func
    // func = vec(locals) e:expr
    // locals = n:u32 t:valtype
    // expr = (in:instr)* 0x0b
    0x0a, 0x00, 0x00, 0x00, 0x00, 0x00, // {
    0x01, // [(
    // size:u32
    0x00, 0x00, 0x00, 0x00, 0x00,
    // begin func:
    0x01, // [
    0x20, 0x7b, // 32xv128
    // ]

    // -- Instructions go here.

    // )]}
  ]);

  const compress4BeignOffset = currentSize;

  // Memory:
  // $0..$15  -> wordBlocks
  // $16..$32 -> state and cv

  // Load all of the variables.
  for (let i = 0; i < 32; ++i) {
    put([
      0x41, ...toLebU32(i * 16), // i32.const [16 * i]
      0xfd, 0, 4, 0,                    // i128.load align=4
      0x21, i,                          // local.set $[i]
    ]);
  }

  const M_ACCESS_ORDER = [
    0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 2, 6, 3, 10, 7, 0, 4,
    13, 1, 11, 12, 5, 9, 14, 15, 8, 3, 4, 10, 12, 13, 2, 7, 14, 6, 5, 9, 0, 11,
    15, 8, 1, 10, 7, 12, 9, 14, 3, 13, 15, 4, 0, 11, 2, 5, 8, 1, 6, 12, 13, 9,
    11, 15, 10, 14, 8, 7, 2, 5, 3, 0, 1, 6, 4, 9, 14, 11, 5, 8, 12, 15, 1, 13,
    3, 0, 10, 2, 6, 4, 7, 11, 15, 5, 0, 1, 9, 8, 6, 14, 10, 2, 12, 3, 4, 7, 13,
  ];

  let _next_m = 0;
  function gi(a: number, b: number, c: number, d: number, d_rot: number, b_rot: number) {
    let m = M_ACCESS_ORDER[_next_m++];
    // loading b happens outside.
    put([
      0x20, a,          // local.load $[a]
      0x20, m,          // local.load $[m]
      0xfd, 174, 1,     // i32x4.add
      0xfd, 174, 1,     // i32x4.add
      0x22, a,          // local.tee $[a]
      0x20, d,          // local.get $[d]
      0xfd, 81,         // v128.xor
      0x22, d,          // local.tee $[d]
      0x41, d_rot,      // i32.const [d_rot]
      0xfd, 173, 1,     // i32x4.shr_u
      0x20, d,          // local.get $[d]
      0x41, 32 - d_rot, // i32.const [32 - d_rot]
      0xfd, 171, 1,     // i32x4.shl
      0xfd, 80,         // i32x4.or
      0x22, d,          // local.tee $[d]
      0x20, c,          // local.load $[c]
      0xfd, 174, 1,     // i32x4.add
      0x22, c,          // local.tee $[c]
      0x20, b,          // local.load $[b]
      0xfd, 81,         // v128.xor
      0x22, b,          // local.tee $[b]
      0x41, b_rot,      // i32.const [b_rot]
      0xfd, 173, 1,     // i32x4.shr_u
      0x20, b,          // local.get $[b]
      0x41, 32 - b_rot, // i32.const [32 - b_rot]
      0xfd, 171, 1,     // i32x4.shl
      0xfd, 80,         // i32x4.or
    ]);
    // storing b happens outside.
  }

  function g(a: number, b: number, c: number, d: number) {
    put([0x20, b]); // local.load $[b]
    gi(a, b, c, d, 16, 12);
    put([0x22, b]); // local.tee $[b]
    gi(a, b, c, d, 8, 7);
    put([0x21, b]); // local.set $[b]
  }

  // Perform the rounds.
  for (let i = 0; i < 7; ++i) {
    // Mix the columns.
    g(16, 20, 24, 28);
    g(17, 21, 25, 29);
    g(18, 22, 26, 30);
    g(19, 23, 27, 31);
    // Mix the diagonals.
    g(16, 21, 26, 31);
    g(17, 22, 27, 28);
    g(18, 23, 24, 29);
    g(19, 20, 25, 30);
  }

  // Store the output cv back to memory.
  for (let i = 16; i < 24; ++i) {
    put([
      0x41, ...toLebU32(i * 16),  // i32.const [16 * i]
      0x20, i,                           // local.get $[i]
      0x20, i + 8,                       // local.get $[i + 8]
      0xfd, 81,                          // v128.xor
      0xfd, 11, 4, 0,                    // v128.store align=4
    ])
  }

  put([0x0b]); // end of function

  const length = currentSize - compress4BeignOffset + 3;
  writeLebU32(length, compress4BeignOffset - 8);
  writeLebU32(length + 6, compress4BeignOffset - 14);

  wasmCode = wasmCode.subarray(0, currentSize);
  const memory = new WebAssembly.Memory({ initial: 1 });
  const importObject = {
    js: { mem: memory },
  };

  const wasmInstance = (await WebAssembly.instantiate(wasmCode, importObject)).instance;
  return {
    wasmMemoryBuffer: memory.buffer,
    compress4x: wasmInstance.exports.compress4x as (() => void)
  };
})();

function compress(
  cv: Uint32Array,
  cvOffset: number,
  blockWords: Uint32Array,
  blockWordsOffset: number,
  out: Uint32Array,
  outOffset: number,
  truncateOutput: boolean,
  counter: number,
  blockLen: Word,
  flags: Word,
) {
  let s_0 = cv[cvOffset + 0] | 0;
  let s_1 = cv[cvOffset + 1] | 0;
  let s_2 = cv[cvOffset + 2] | 0;
  let s_3 = cv[cvOffset + 3] | 0;
  let s_4 = cv[cvOffset + 4] | 0;
  let s_5 = cv[cvOffset + 5] | 0;
  let s_6 = cv[cvOffset + 6] | 0;
  let s_7 = cv[cvOffset + 7] | 0;
  let s_8 = 0x6a09e667;
  let s_9 = 0xbb67ae85;
  let s_10 = 0x3c6ef372;
  let s_11 = 0xa54ff53a;
  let s_12 = counter | 0;
  let s_13 = (counter / 0x100000000) | 0;
  let s_14 = blockLen | 0;
  let s_15 = flags | 0;

  let m_0 = blockWords[blockWordsOffset + 0] | 0;
  let m_1 = blockWords[blockWordsOffset + 1] | 0;
  let m_2 = blockWords[blockWordsOffset + 2] | 0;
  let m_3 = blockWords[blockWordsOffset + 3] | 0;
  let m_4 = blockWords[blockWordsOffset + 4] | 0;
  let m_5 = blockWords[blockWordsOffset + 5] | 0;
  let m_6 = blockWords[blockWordsOffset + 6] | 0;
  let m_7 = blockWords[blockWordsOffset + 7] | 0;
  let m_8 = blockWords[blockWordsOffset + 8] | 0;
  let m_9 = blockWords[blockWordsOffset + 9] | 0;
  let m_10 = blockWords[blockWordsOffset + 10] | 0;
  let m_11 = blockWords[blockWordsOffset + 11] | 0;
  let m_12 = blockWords[blockWordsOffset + 12] | 0;
  let m_13 = blockWords[blockWordsOffset + 13] | 0;
  let m_14 = blockWords[blockWordsOffset + 14] | 0;
  let m_15 = blockWords[blockWordsOffset + 15] | 0;

  for (let i = 0; i < 7; ++i) {
    s_0 = (((s_0 + s_4) | 0) + m_0) | 0;
    s_12 ^= s_0;
    s_12 = (s_12 >>> 16) | (s_12 << 16);
    s_8 = (s_8 + s_12) | 0;
    s_4 ^= s_8;
    s_4 = (s_4 >>> 12) | (s_4 << 20);
    s_0 = (((s_0 + s_4) | 0) + m_1) | 0;
    s_12 ^= s_0;
    s_12 = (s_12 >>> 8) | (s_12 << 24);
    s_8 = (s_8 + s_12) | 0;
    s_4 ^= s_8;
    s_4 = (s_4 >>> 7) | (s_4 << 25);
    s_1 = (((s_1 + s_5) | 0) + m_2) | 0;
    s_13 ^= s_1;
    s_13 = (s_13 >>> 16) | (s_13 << 16);
    s_9 = (s_9 + s_13) | 0;
    s_5 ^= s_9;
    s_5 = (s_5 >>> 12) | (s_5 << 20);
    s_1 = (((s_1 + s_5) | 0) + m_3) | 0;
    s_13 ^= s_1;
    s_13 = (s_13 >>> 8) | (s_13 << 24);
    s_9 = (s_9 + s_13) | 0;
    s_5 ^= s_9;
    s_5 = (s_5 >>> 7) | (s_5 << 25);
    s_2 = (((s_2 + s_6) | 0) + m_4) | 0;
    s_14 ^= s_2;
    s_14 = (s_14 >>> 16) | (s_14 << 16);
    s_10 = (s_10 + s_14) | 0;
    s_6 ^= s_10;
    s_6 = (s_6 >>> 12) | (s_6 << 20);
    s_2 = (((s_2 + s_6) | 0) + m_5) | 0;
    s_14 ^= s_2;
    s_14 = (s_14 >>> 8) | (s_14 << 24);
    s_10 = (s_10 + s_14) | 0;
    s_6 ^= s_10;
    s_6 = (s_6 >>> 7) | (s_6 << 25);
    s_3 = (((s_3 + s_7) | 0) + m_6) | 0;
    s_15 ^= s_3;
    s_15 = (s_15 >>> 16) | (s_15 << 16);
    s_11 = (s_11 + s_15) | 0;
    s_7 ^= s_11;
    s_7 = (s_7 >>> 12) | (s_7 << 20);
    s_3 = (((s_3 + s_7) | 0) + m_7) | 0;
    s_15 ^= s_3;
    s_15 = (s_15 >>> 8) | (s_15 << 24);
    s_11 = (s_11 + s_15) | 0;
    s_7 ^= s_11;
    s_7 = (s_7 >>> 7) | (s_7 << 25);
    s_0 = (((s_0 + s_5) | 0) + m_8) | 0;
    s_15 ^= s_0;
    s_15 = (s_15 >>> 16) | (s_15 << 16);
    s_10 = (s_10 + s_15) | 0;
    s_5 ^= s_10;
    s_5 = (s_5 >>> 12) | (s_5 << 20);
    s_0 = (((s_0 + s_5) | 0) + m_9) | 0;
    s_15 ^= s_0;
    s_15 = (s_15 >>> 8) | (s_15 << 24);
    s_10 = (s_10 + s_15) | 0;
    s_5 ^= s_10;
    s_5 = (s_5 >>> 7) | (s_5 << 25);
    s_1 = (((s_1 + s_6) | 0) + m_10) | 0;
    s_12 ^= s_1;
    s_12 = (s_12 >>> 16) | (s_12 << 16);
    s_11 = (s_11 + s_12) | 0;
    s_6 ^= s_11;
    s_6 = (s_6 >>> 12) | (s_6 << 20);
    s_1 = (((s_1 + s_6) | 0) + m_11) | 0;
    s_12 ^= s_1;
    s_12 = (s_12 >>> 8) | (s_12 << 24);
    s_11 = (s_11 + s_12) | 0;
    s_6 ^= s_11;
    s_6 = (s_6 >>> 7) | (s_6 << 25);
    s_2 = (((s_2 + s_7) | 0) + m_12) | 0;
    s_13 ^= s_2;
    s_13 = (s_13 >>> 16) | (s_13 << 16);
    s_8 = (s_8 + s_13) | 0;
    s_7 ^= s_8;
    s_7 = (s_7 >>> 12) | (s_7 << 20);
    s_2 = (((s_2 + s_7) | 0) + m_13) | 0;
    s_13 ^= s_2;
    s_13 = (s_13 >>> 8) | (s_13 << 24);
    s_8 = (s_8 + s_13) | 0;
    s_7 ^= s_8;
    s_7 = (s_7 >>> 7) | (s_7 << 25);
    s_3 = (((s_3 + s_4) | 0) + m_14) | 0;
    s_14 ^= s_3;
    s_14 = (s_14 >>> 16) | (s_14 << 16);
    s_9 = (s_9 + s_14) | 0;
    s_4 ^= s_9;
    s_4 = (s_4 >>> 12) | (s_4 << 20);
    s_3 = (((s_3 + s_4) | 0) + m_15) | 0;
    s_14 ^= s_3;
    s_14 = (s_14 >>> 8) | (s_14 << 24);
    s_9 = (s_9 + s_14) | 0;
    s_4 ^= s_9;
    s_4 = (s_4 >>> 7) | (s_4 << 25);

    if (i != 6) {
      const t0 = m_0;
      const t1 = m_1;
      m_0 = m_2;
      m_2 = m_3;
      m_3 = m_10;
      m_10 = m_12;
      m_12 = m_9;
      m_9 = m_11;
      m_11 = m_5;
      m_5 = t0;
      m_1 = m_6;
      m_6 = m_4;
      m_4 = m_7;
      m_7 = m_13;
      m_13 = m_14;
      m_14 = m_15;
      m_15 = m_8;
      m_8 = t1;
    }
  }

  if (!truncateOutput) {
    out[outOffset + 8] = s_8 ^ cv[cvOffset + 0];
    out[outOffset + 9] = s_9 ^ cv[cvOffset + 1];
    out[outOffset + 10] = s_10 ^ cv[cvOffset + 2];
    out[outOffset + 11] = s_11 ^ cv[cvOffset + 3];
    out[outOffset + 12] = s_12 ^ cv[cvOffset + 4];
    out[outOffset + 13] = s_13 ^ cv[cvOffset + 5];
    out[outOffset + 14] = s_14 ^ cv[cvOffset + 6];
    out[outOffset + 15] = s_15 ^ cv[cvOffset + 7];
  }

  out[outOffset + 0] = s_0 ^ s_8;
  out[outOffset + 1] = s_1 ^ s_9;
  out[outOffset + 2] = s_2 ^ s_10;
  out[outOffset + 3] = s_3 ^ s_11;
  out[outOffset + 4] = s_4 ^ s_12;
  out[outOffset + 5] = s_5 ^ s_13;
  out[outOffset + 6] = s_6 ^ s_14;
  out[outOffset + 7] = s_7 ^ s_15;
}

function readLittleEndianWords(
  array: ArrayLike<number>,
  offset: number,
  words: Uint32Array,
) {
  let i = 0;
  // Read full multiples of four.
  for (; offset + 3 < array.length; ++i, offset += 4) {
    words[i] =
      array[offset] |
      (array[offset + 1] << 8) |
      (array[offset + 2] << 16) |
      (array[offset + 3] << 24);
  }
  // Fill the rest with zero.
  for (let j = i; j < words.length; ++j) {
    words[j] = 0;
  }
  // Read the last word. (If input not a multiple of 4).
  for (let s = 0; offset < array.length; s += 8, ++offset) {
    words[i] |= array[offset] << s;
  }
}

function readLittleEndianWordsFull(
  array: ArrayLike<number>,
  offset: number,
  words: Uint32Array,
) {
  for (let i = 0; i < words.length; ++i, offset += 4) {
    words[i] =
      array[offset] |
      (array[offset + 1] << 8) |
      (array[offset + 2] << 16) |
      (array[offset + 3] << 24);
  }
}

let cvStack: Uint32Array | null = null;

function getCvStack(maxDepth: number) {
  const depth = Math.max(maxDepth, 10);
  const length = depth * 8;
  if (cvStack == null || cvStack.length < length) {
    cvStack = new Uint32Array(length);
  }
  return cvStack;
}

const wasmMemoryU32 = new Uint32Array(wasmMemoryBuffer);

function reverseByteorderOnBigEndian(n: number) {
  n |= 0;
  if (IsBigEndian) {
    return (
      ((n & 0xff) << 24) |
      (((n >> 8) & 0xff) << 16) |
      (((n >> 16) & 0xff) << 8) |
      ((n >> 24) & 0xff)
    );
  } else {
    return n;
  }
}

export function hash(input: Uint8Array): Uint8Array {
  const inputWords = new Uint32Array(
    input.buffer,
    input.byteOffset,
    input.byteLength >> 2,
  );

  const flags = 0;
  const keyWords = IV;
  const out = new Uint32Array(8);
  const length = input.length;

  // The hasher state.
  const maxCvDepth = Math.log2(1 + Math.ceil(input.length / 1024)) + 1;
  const cvStack = getCvStack(maxCvDepth);
  let cvStackPos = 0;
  let chunkCounter = 0;
  let offset = 0;

  const fullFourBlocks = (((length - 1) / 4096) | 0) * 4096;
  const fullFourBlocksWords = fullFourBlocks / 4;

  for (let wordOffset = 0; wordOffset < fullFourBlocksWords; ) {
    // Copy initial cv to wasm memory.
    for (let i = 0; i < 8; ++i) {
      const c = reverseByteorderOnBigEndian(keyWords[i]);
      const s = (16 + i) * 4;
      wasmMemoryU32[s] = c;
      wasmMemoryU32[s + 1] = c;
      wasmMemoryU32[s + 2] = c;
      wasmMemoryU32[s + 3] = c;
    }

    // For each block in all 4 chunks:
    for (let innerBlock = 0; innerBlock < 16; ++innerBlock) {
      // Transpose the inputs to fit on v128 simd lanes.
      for (let i = 0; i < 64; i += 4, ++wordOffset) {
        wasmMemoryU32[i] = reverseByteorderOnBigEndian(inputWords[wordOffset]);
        wasmMemoryU32[i + 1] = reverseByteorderOnBigEndian(
          inputWords[wordOffset + 256],
        );
        wasmMemoryU32[i + 2] = reverseByteorderOnBigEndian(
          inputWords[wordOffset + 512],
        );
        wasmMemoryU32[i + 3] = reverseByteorderOnBigEndian(
          inputWords[wordOffset + 768],
        );
      }

      // cv is already set. either out of loop or previous call to compress4x. here we set the rest
      // of the state variables for each of the 4 chunks.
      //
      // $24 let s_8 = 0x6a09e667;
      // $25 let s_9 = 0xbb67ae85;
      // $26 let s_10 = 0x3c6ef372;
      // $27 let s_11 = 0xa54ff53a;
      // $28 let s_12 = counter | 0;
      // $29 let s_13 = (counter / 0x100000000) | 0;
      // $30 let s_14 = blockLen | 0;
      // $31 let s_15 = flags | 0;
      for (let i = 0; i < 4; ++i) {
        // offsetOf($n) = n * 4 + i;
        wasmMemoryU32[96 + i] = reverseByteorderOnBigEndian(0x6a09e667);
        wasmMemoryU32[100 + i] = reverseByteorderOnBigEndian(0xbb67ae85);
        wasmMemoryU32[104 + i] = reverseByteorderOnBigEndian(0x3c6ef372);
        wasmMemoryU32[108 + i] = reverseByteorderOnBigEndian(0xa54ff53a);
        wasmMemoryU32[112 + i] = reverseByteorderOnBigEndian(
          (chunkCounter + i) | 0,
        );
        wasmMemoryU32[116 + i] = reverseByteorderOnBigEndian(
          ((chunkCounter + i) / 0x100000000) | 0,
        );
        wasmMemoryU32[120 + i] = reverseByteorderOnBigEndian(BLOCK_LEN);
        wasmMemoryU32[124 + i] = reverseByteorderOnBigEndian(
          flags |
            (innerBlock === 0
              ? CHUNK_START
              : innerBlock === 15
                ? CHUNK_END
                : 0),
        );
      }

      compress4x();
    }

    chunkCounter += 4;
    wordOffset += 768;

    // extract the cv from simd lanes.
    for (let c = 0; c < 4; ++c) {
      for (let i = 0; i < 8; ++i) {
        cvStack[cvStackPos + i] = reverseByteorderOnBigEndian(
          wasmMemoryU32[(16 + i) * 4 + c],
        );
      }
      cvStackPos += 8;
    }

    compress(
      keyWords,
      0,
      cvStack,
      cvStackPos - 32,
      cvStack,
      cvStackPos - 32,
      true,
      0,
      BLOCK_LEN,
      flags | PARENT,
    );

    compress(
      keyWords,
      0,
      cvStack,
      cvStackPos - 16,
      cvStack,
      cvStackPos - 24,
      true,
      0,
      BLOCK_LEN,
      flags | PARENT,
    );

    compress(
      keyWords,
      0,
      cvStack,
      cvStackPos - 32,
      cvStack,
      cvStackPos - 32,
      true,
      0,
      BLOCK_LEN,
      flags | PARENT,
    );

    cvStackPos -= 24;
    let totalChunks = chunkCounter / 4;
    while ((totalChunks & 1) === 0) {
      cvStackPos -= 16;

      compress(
        keyWords,
        0,
        cvStack,
        cvStackPos,
        cvStack,
        cvStackPos,
        true,
        0,
        BLOCK_LEN,
        flags | PARENT,
      );

      cvStackPos += 8;
      totalChunks >>= 1;
    }
  }

  // move the offset forward to the last word we
  offset = fullFourBlocks;

  // Compute the number of bytes we can process knowing there is more data.
  const fullChunksEnd =
    offset + Math.max(0, ((length - offset - 1) | 1023) - 1023);

  for (; offset < fullChunksEnd; ) {
    cvStack.set(keyWords, cvStackPos);

    for (let i = 0; i < 16; ++i, offset += 64) {
      if (IsBigEndian) {
        readLittleEndianWordsFull(input, offset, blockWords);
      }

      compress(
        cvStack,
        cvStackPos,
        IsBigEndian ? blockWords : inputWords,
        IsBigEndian ? 0 : offset / 4,
        cvStack,
        cvStackPos,
        true,
        chunkCounter,
        BLOCK_LEN,
        flags | (i === 0 ? CHUNK_START : i === 15 ? CHUNK_END : 0),
      );
    }

    chunkCounter += 1;
    cvStackPos += 8;

    let totalChunks = chunkCounter;
    while ((totalChunks & 1) === 0) {
      cvStackPos -= 16;

      compress(
        keyWords,
        0,
        cvStack,
        cvStackPos,
        cvStack,
        cvStackPos,
        true,
        0,
        BLOCK_LEN,
        flags | PARENT,
      );

      cvStackPos += 8;
      totalChunks >>= 1;
    }
  }

  const numRemainingFullBlocks = ((length - offset - 1) / 64) | 0;
  cvStack.set(keyWords, cvStackPos);

  for (let i = 0; i < numRemainingFullBlocks; ++i, offset += 64) {
    if (IsBigEndian) {
      readLittleEndianWordsFull(input, offset, blockWords);
    }

    compress(
      cvStack,
      cvStackPos,
      IsBigEndian ? blockWords : inputWords,
      IsBigEndian ? 0 : offset / 4,
      cvStack,
      cvStackPos,
      true,
      chunkCounter,
      BLOCK_LEN,
      flags | (i === 0 ? CHUNK_START : i === 15 ? CHUNK_END : 0),
    );
  }

  // There are two path in the code here. One case is that there is nothing in
  // the stack and that this block needs to be finalized. And the other is the
  // opposite, we have entries in the stack which we should merge.

  const lastBlockLen = length - offset;
  let lastBlockWords = blockWords as Uint32Array;
  let lastBlockWordsOffset = 0;
  if (lastBlockLen == BLOCK_LEN) {
    if (IsBigEndian) {
      readLittleEndianWordsFull(input, offset, blockWords);
    } else {
      lastBlockWords = inputWords;
      lastBlockWordsOffset = offset / 4;
    }
  } else {
    readLittleEndianWords(input, offset, blockWords);
  }

  if (cvStackPos == 0) {
    compress(
      cvStack,
      0,
      lastBlockWords,
      lastBlockWordsOffset,
      out,
      0,
      true,
      0,
      length - offset,
      flags |
        ROOT |
        CHUNK_END |
        (numRemainingFullBlocks === 0 ? CHUNK_START : 0),
    );
  } else {
    compress(
      cvStack,
      cvStackPos,
      lastBlockWords,
      lastBlockWordsOffset,
      cvStack,
      cvStackPos,
      true,
      chunkCounter,
      length - offset,
      flags | CHUNK_END | (numRemainingFullBlocks === 0 ? CHUNK_START : 0),
    );

    cvStackPos += 8; // push

    while (cvStackPos > 16) {
      cvStackPos -= 16; // pop 2

      compress(
        keyWords,
        0,
        cvStack,
        cvStackPos,
        cvStack,
        cvStackPos,
        true,
        0,
        BLOCK_LEN,
        flags | PARENT,
      );

      cvStackPos += 8; // push
    }

    cvStackPos -= 16; // pop 2
    compress(
      keyWords,
      0,
      cvStack,
      cvStackPos,
      out,
      0,
      true,
      0,
      BLOCK_LEN,
      flags | PARENT | ROOT,
    );
  }

  return new Uint8Array(out.buffer, 0, 32);
}
