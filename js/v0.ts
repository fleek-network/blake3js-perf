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

const MSG_PERMUTATION = [2, 6, 3, 10, 7, 0, 4, 13, 1, 11, 12, 5, 9, 14, 15, 8];

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

function round(state: W16, m: W16) {
  // Mix the columns.
  g(state, 0, 4, 8, 12, m[0], m[1]);
  g(state, 1, 5, 9, 13, m[2], m[3]);
  g(state, 2, 6, 10, 14, m[4], m[5]);
  g(state, 3, 7, 11, 15, m[6], m[7]);
  // Mix the diagonals.
  g(state, 0, 5, 10, 15, m[8], m[9]);
  g(state, 1, 6, 11, 12, m[10], m[11]);
  g(state, 2, 7, 8, 13, m[12], m[13]);
  g(state, 3, 4, 9, 14, m[14], m[15]);
}

function permute(m: W16) {
  const copy = new Uint32Array(m);
  for (let i = 0; i < 16; ++i) {
    m[i] = copy[MSG_PERMUTATION[i]];
  }
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

  const block = new Uint32Array(block_words) as W16;

  round(state, block); // round 1
  permute(block);
  round(state, block); // round 2
  permute(block);
  round(state, block); // round 3
  permute(block);
  round(state, block); // round 4
  permute(block);
  round(state, block); // round 5
  permute(block);
  round(state, block); // round 6
  permute(block);
  round(state, block); // round 7
  permute(block);

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
      readLittleEndianWords(input, offset, blockWords);

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
    readLittleEndianWords(input, offset, blockWords);

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
