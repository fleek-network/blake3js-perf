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

function rightRotate(word: Word, bits: number): Word {
  return (word >>> bits) | (word << (32 - bits));
}

function g(
  state: W16,
  a: number,
  b: number,
  c: number,
  d: number,
  mx: Word,
  my: Word,
) {
  state[a] = (((state[a] + state[b]) | 0) + mx) | 0;
  state[d] = rightRotate(state[d] ^ state[a], 16);
  state[c] = (state[c] + state[d]) | 0;
  state[b] = rightRotate(state[b] ^ state[c], 12);
  state[a] = (((state[a] + state[b]) | 0) + my) | 0;
  state[d] = rightRotate(state[d] ^ state[a], 8);
  state[c] = (state[c] + state[d]) | 0;
  state[b] = rightRotate(state[b] ^ state[c], 7);
}

function round(state: W16, m: W16, p: number[]) {
  // Mix the columns.
  g(state, 0, 4, 8, 12, m[p[0]], m[p[1]]);
  g(state, 1, 5, 9, 13, m[p[2]], m[p[3]]);
  g(state, 2, 6, 10, 14, m[p[4]], m[p[5]]);
  g(state, 3, 7, 11, 15, m[p[6]], m[p[7]]);
  // Mix the diagonals.
  g(state, 0, 5, 10, 15, m[p[8]], m[p[9]]);
  g(state, 1, 6, 11, 12, m[p[10]], m[p[11]]);
  g(state, 2, 7, 8, 13, m[p[12]], m[p[13]]);
  g(state, 3, 4, 9, 14, m[p[14]], m[p[15]]);
}

function compress(
  chaining_value: W8,
  block_words: W16,
  counter: number,
  block_len: Word,
  flags: Word,
): W16 {
  const state = new Uint32Array([
    chaining_value[0],
    chaining_value[1],
    chaining_value[2],
    chaining_value[3],
    chaining_value[4],
    chaining_value[5],
    chaining_value[6],
    chaining_value[7],
    IV[0],
    IV[1],
    IV[2],
    IV[3],
    counter,
    (counter / 0x100000000) | 0,
    block_len,
    flags,
  ]) as W16;

  const m = block_words;
  round(state, m, [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15]);
  round(state, m, [2, 6, 3, 10, 7, 0, 4, 13, 1, 11, 12, 5, 9, 14, 15, 8]);
  round(state, m, [3, 4, 10, 12, 13, 2, 7, 14, 6, 5, 9, 0, 11, 15, 8, 1]);
  round(state, m, [10, 7, 12, 9, 14, 3, 13, 15, 4, 0, 11, 2, 5, 8, 1, 6]);
  round(state, m, [12, 13, 9, 11, 15, 10, 14, 8, 7, 2, 5, 3, 0, 1, 6, 4]);
  round(state, m, [9, 14, 11, 5, 8, 12, 15, 1, 13, 3, 0, 10, 2, 6, 4, 7]);
  round(state, m, [11, 15, 5, 0, 1, 9, 8, 6, 14, 10, 2, 12, 3, 4, 7, 13]);

  for (let i = 0; i < 8; ++i) {
    state[i] ^= state[i + 8];
    state[i + 8] ^= chaining_value[i];
  }

  return state;
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
