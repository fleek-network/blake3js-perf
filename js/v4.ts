type Word = number;
type W16 = Uint32Array & { length: 16 };
type W8 = Uint32Array & { length: 8 };
type Block = Uint8Array & { length: 64 };

const OUT_LEN = 32;
const KEY_LEN = 32;
const BLOCK_LEN = 64;
const CHUNK_LEN = 1024;

const CHUNK_START = 1 << 0;
const CHUNK_END = 1 << 1;
const PARENT = 1 << 2;
const ROOT = 1 << 3;
const KEYED_HASH = 1 << 4;
const DERIVE_KEY_CONTEXT = 1 << 5;
const DERIVE_KEY_MATERIAL = 1 << 6;

const IV = new Uint32Array([
  0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c,
  0x1f83d9ab, 0x5be0cd19,
]) as W8;

function compress(
  cv: W8,
  block_words: W16,
  counter: number,
  blockLen: Word,
  flags: Word,
): W16 {
  const PERMUTATIONS = [
    0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 2, 6, 3, 10, 7, 0, 4,
    13, 1, 11, 12, 5, 9, 14, 15, 8, 3, 4, 10, 12, 13, 2, 7, 14, 6, 5, 9, 0, 11,
    15, 8, 1, 10, 7, 12, 9, 14, 3, 13, 15, 4, 0, 11, 2, 5, 8, 1, 6, 12, 13, 9,
    11, 15, 10, 14, 8, 7, 2, 5, 3, 0, 1, 6, 4, 9, 14, 11, 5, 8, 12, 15, 1, 13,
    3, 0, 10, 2, 6, 4, 7, 11, 15, 5, 0, 1, 9, 8, 6, 14, 10, 2, 12, 3, 4, 7, 13,
  ];

  const m = block_words;
  let p = 0;

  let s_0 = cv[0] | 0;
  let s_1 = cv[1] | 0;
  let s_2 = cv[2] | 0;
  let s_3 = cv[3] | 0;
  let s_4 = cv[4] | 0;
  let s_5 = cv[5] | 0;
  let s_6 = cv[6] | 0;
  let s_7 = cv[7] | 0;
  let s_8 = 0x6a09e667;
  let s_9 = 0xbb67ae85;
  let s_10 = 0x3c6ef372;
  let s_11 = 0xa54ff53a;
  let s_12 = counter | 0;
  let s_13 = (counter / 0x100000000) | 0;
  let s_14 = blockLen | 0;
  let s_15 = flags | 0;

  for (let i = 0; i < 7; ++i) {
    s_0 = (((s_0 + s_4) | 0) + m[PERMUTATIONS[p++]]) | 0;
    s_12 ^= s_0;
    s_12 = (s_12 >>> 16) | (s_12 << 16);
    s_8 = (s_8 + s_12) | 0;
    s_4 ^= s_8;
    s_4 = (s_4 >>> 12) | (s_4 << 20);
    s_0 = (((s_0 + s_4) | 0) + m[PERMUTATIONS[p++]]) | 0;
    s_12 ^= s_0;
    s_12 = (s_12 >>> 8) | (s_12 << 24);
    s_8 = (s_8 + s_12) | 0;
    s_4 ^= s_8;
    s_4 = (s_4 >>> 7) | (s_4 << 25);
    s_1 = (((s_1 + s_5) | 0) + m[PERMUTATIONS[p++]]) | 0;
    s_13 ^= s_1;
    s_13 = (s_13 >>> 16) | (s_13 << 16);
    s_9 = (s_9 + s_13) | 0;
    s_5 ^= s_9;
    s_5 = (s_5 >>> 12) | (s_5 << 20);
    s_1 = (((s_1 + s_5) | 0) + m[PERMUTATIONS[p++]]) | 0;
    s_13 ^= s_1;
    s_13 = (s_13 >>> 8) | (s_13 << 24);
    s_9 = (s_9 + s_13) | 0;
    s_5 ^= s_9;
    s_5 = (s_5 >>> 7) | (s_5 << 25);
    s_2 = (((s_2 + s_6) | 0) + m[PERMUTATIONS[p++]]) | 0;
    s_14 ^= s_2;
    s_14 = (s_14 >>> 16) | (s_14 << 16);
    s_10 = (s_10 + s_14) | 0;
    s_6 ^= s_10;
    s_6 = (s_6 >>> 12) | (s_6 << 20);
    s_2 = (((s_2 + s_6) | 0) + m[PERMUTATIONS[p++]]) | 0;
    s_14 ^= s_2;
    s_14 = (s_14 >>> 8) | (s_14 << 24);
    s_10 = (s_10 + s_14) | 0;
    s_6 ^= s_10;
    s_6 = (s_6 >>> 7) | (s_6 << 25);
    s_3 = (((s_3 + s_7) | 0) + m[PERMUTATIONS[p++]]) | 0;
    s_15 ^= s_3;
    s_15 = (s_15 >>> 16) | (s_15 << 16);
    s_11 = (s_11 + s_15) | 0;
    s_7 ^= s_11;
    s_7 = (s_7 >>> 12) | (s_7 << 20);
    s_3 = (((s_3 + s_7) | 0) + m[PERMUTATIONS[p++]]) | 0;
    s_15 ^= s_3;
    s_15 = (s_15 >>> 8) | (s_15 << 24);
    s_11 = (s_11 + s_15) | 0;
    s_7 ^= s_11;
    s_7 = (s_7 >>> 7) | (s_7 << 25);
    s_0 = (((s_0 + s_5) | 0) + m[PERMUTATIONS[p++]]) | 0;
    s_15 ^= s_0;
    s_15 = (s_15 >>> 16) | (s_15 << 16);
    s_10 = (s_10 + s_15) | 0;
    s_5 ^= s_10;
    s_5 = (s_5 >>> 12) | (s_5 << 20);
    s_0 = (((s_0 + s_5) | 0) + m[PERMUTATIONS[p++]]) | 0;
    s_15 ^= s_0;
    s_15 = (s_15 >>> 8) | (s_15 << 24);
    s_10 = (s_10 + s_15) | 0;
    s_5 ^= s_10;
    s_5 = (s_5 >>> 7) | (s_5 << 25);
    s_1 = (((s_1 + s_6) | 0) + m[PERMUTATIONS[p++]]) | 0;
    s_12 ^= s_1;
    s_12 = (s_12 >>> 16) | (s_12 << 16);
    s_11 = (s_11 + s_12) | 0;
    s_6 ^= s_11;
    s_6 = (s_6 >>> 12) | (s_6 << 20);
    s_1 = (((s_1 + s_6) | 0) + m[PERMUTATIONS[p++]]) | 0;
    s_12 ^= s_1;
    s_12 = (s_12 >>> 8) | (s_12 << 24);
    s_11 = (s_11 + s_12) | 0;
    s_6 ^= s_11;
    s_6 = (s_6 >>> 7) | (s_6 << 25);
    s_2 = (((s_2 + s_7) | 0) + m[PERMUTATIONS[p++]]) | 0;
    s_13 ^= s_2;
    s_13 = (s_13 >>> 16) | (s_13 << 16);
    s_8 = (s_8 + s_13) | 0;
    s_7 ^= s_8;
    s_7 = (s_7 >>> 12) | (s_7 << 20);
    s_2 = (((s_2 + s_7) | 0) + m[PERMUTATIONS[p++]]) | 0;
    s_13 ^= s_2;
    s_13 = (s_13 >>> 8) | (s_13 << 24);
    s_8 = (s_8 + s_13) | 0;
    s_7 ^= s_8;
    s_7 = (s_7 >>> 7) | (s_7 << 25);
    s_3 = (((s_3 + s_4) | 0) + m[PERMUTATIONS[p++]]) | 0;
    s_14 ^= s_3;
    s_14 = (s_14 >>> 16) | (s_14 << 16);
    s_9 = (s_9 + s_14) | 0;
    s_4 ^= s_9;
    s_4 = (s_4 >>> 12) | (s_4 << 20);
    s_3 = (((s_3 + s_4) | 0) + m[PERMUTATIONS[p++]]) | 0;
    s_14 ^= s_3;
    s_14 = (s_14 >>> 8) | (s_14 << 24);
    s_9 = (s_9 + s_14) | 0;
    s_4 ^= s_9;
    s_4 = (s_4 >>> 7) | (s_4 << 25);
  }

  return new Uint32Array([
    s_0 ^ s_8,
    s_1 ^ s_9,
    s_2 ^ s_10,
    s_3 ^ s_11,
    s_4 ^ s_12,
    s_5 ^ s_13,
    s_6 ^ s_14,
    s_7 ^ s_15,
    s_8 ^ cv[0],
    s_9 ^ cv[1],
    s_10 ^ cv[2],
    s_11 ^ cv[3],
    s_12 ^ cv[4],
    s_13 ^ cv[5],
    s_14 ^ cv[6],
    s_15 ^ cv[7],
  ]) as W16;
}

function first8Words(compression_output: W16): W8 {
  return new Uint32Array(compression_output).slice(0, 8) as W8;
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

export function hash(input: Uint8Array): Uint8Array {
  const flags = 0;
  const keyWords = IV;

  // The hasher state.
  const blockWords = new Uint32Array(16) as W16;
  const cvStack: W8[] = [];

  let chunkCounter = 0;
  let offset = 0;

  // Compute the number of bytes we can process knowing there is more data.
  const length = input.length;
  const take = Math.max(0, ((length - 1) | 1023) - 1023);

  for (; offset < take; ) {
    let cv = keyWords;

    for (let i = 0; i < 16; ++i, offset += 64) {
      readLittleEndianWordsFull(input, offset, blockWords);

      // # Case 0
      cv = first8Words(
        compress(
          cv,
          blockWords,
          chunkCounter,
          BLOCK_LEN,
          flags | (i === 0 ? CHUNK_START : i === 15 ? CHUNK_END : 0),
        ),
      );
    }

    chunkCounter += 1;
    cvStack.push(cv);

    let totalChunks = chunkCounter;
    while ((totalChunks & 1) === 0) {
      const rightChildCv = cvStack.pop()!;
      const leftChildCv = cvStack.pop()!;
      blockWords.set(leftChildCv, 0);
      blockWords.set(rightChildCv, 8);
      // # Case 1
      cv = first8Words(
        compress(keyWords, blockWords, 0, BLOCK_LEN, flags | PARENT),
      );
      cvStack.push(cv);
      totalChunks >>= 1;
    }
  }

  // last chunk. it can be any number of blocks. in one special case where
  // n(remaining_bytes) <= BLOCK_LEN, the flag should be set to CHUNK_END
  // on the initial block.
  const remainingBytes = length - take;
  // remainingBytes > 0 -> no underflow.
  const fullBlocks = ((remainingBytes - 1) / 64) | 0;

  let cv = keyWords;

  for (let i = 0; i < fullBlocks; ++i, offset += 64) {
    readLittleEndianWordsFull(input, offset, blockWords);

    // # Case 0
    cv = first8Words(
      compress(
        cv,
        blockWords,
        chunkCounter,
        BLOCK_LEN,
        flags | (i === 0 ? CHUNK_START : i === 15 ? CHUNK_END : 0),
      ),
    );
  }

  // There are two path in the code here. One case is that there is nothing in
  // the stack and that this block needs to be finalized. And the other is the
  // opposite, we have entries in the stack which we should merge.

  let finalChainingValue: W8;
  let finalBlockLen: number;
  let finalFlags: Word;

  readLittleEndianWords(input, offset, blockWords);

  if (cvStack.length == 0) {
    finalChainingValue = cv;
    finalBlockLen = length - offset;
    finalFlags =
      flags | ROOT | CHUNK_END | (fullBlocks === 0 ? CHUNK_START : 0);
  } else {
    finalChainingValue = keyWords;
    finalBlockLen = BLOCK_LEN;
    finalFlags = flags | PARENT | ROOT;

    cv = first8Words(
      compress(
        cv,
        blockWords,
        chunkCounter,
        length - offset,
        flags | CHUNK_END | (fullBlocks === 0 ? CHUNK_START : 0),
      ),
    );

    cvStack.push(cv);

    while (cvStack.length > 2) {
      const rightChildCv = cvStack.pop()!;
      const leftChildCv = cvStack.pop()!;
      blockWords.set(leftChildCv, 0);
      blockWords.set(rightChildCv, 8);
      cv = first8Words(
        compress(keyWords, blockWords, 0, BLOCK_LEN, flags | PARENT),
      );
      cvStack.push(cv);
    }

    const rightChildCv = cvStack.pop()!;
    const leftChildCv = cvStack.pop()!;
    blockWords.set(leftChildCv, 0);
    blockWords.set(rightChildCv, 8);
  }

  let out = compress(
    finalChainingValue,
    blockWords,
    0,
    finalBlockLen,
    finalFlags,
  );

  return new Uint8Array(out.buffer, 0, 32);
}
