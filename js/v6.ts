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

export function hash(input: Uint8Array): Uint8Array {
  const flags = 0;
  const keyWords = IV;

  // The hasher state.
  const blockWords = new Uint32Array(16) as W16;
  const maxCvDepth = Math.log2(1 + (input.length >> 10)) + 1;
  const cvStack = new Uint32Array(maxCvDepth << 3);
  let cvStackPos = 0;

  let chunkCounter = 0;
  let offset = 0;

  // Compute the number of bytes we can process knowing there is more data.
  const length = input.length;
  const take = Math.max(0, ((length - 1) | 1023) - 1023);

  for (; offset < take; ) {
    cvStack.set(keyWords, cvStackPos);

    for (let i = 0; i < 16; ++i, offset += 64) {
      readLittleEndianWordsFull(input, offset, blockWords);

      compress(
        cvStack,
        cvStackPos,
        blockWords,
        0,
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

  // last chunk. it can be any number of blocks. in one special case where
  // n(remaining_bytes) <= BLOCK_LEN, the flag should be set to CHUNK_END
  // on the initial block.
  const remainingBytes = length - take;
  // remainingBytes > 0 -> no underflow.
  const fullBlocks = ((remainingBytes - 1) / 64) | 0;

  cvStack.set(keyWords, cvStackPos);

  for (let i = 0; i < fullBlocks; ++i, offset += 64) {
    readLittleEndianWordsFull(input, offset, blockWords);

    compress(
      cvStack,
      cvStackPos,
      blockWords,
      0,
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

  readLittleEndianWords(input, offset, blockWords);

  if (cvStackPos == 0) {
    compress(
      cvStack,
      0,
      blockWords,
      0,
      blockWords,
      0,
      true,
      0,
      length - offset,
      flags | ROOT | CHUNK_END | (fullBlocks === 0 ? CHUNK_START : 0),
    );
  } else {
    compress(
      cvStack,
      cvStackPos,
      blockWords,
      0,
      cvStack,
      cvStackPos,
      true,
      chunkCounter,
      length - offset,
      flags | CHUNK_END | (fullBlocks === 0 ? CHUNK_START : 0),
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
      blockWords,
      0,
      true,
      0,
      BLOCK_LEN,
      flags | PARENT | ROOT,
    );
  }

  return new Uint8Array(blockWords.buffer, 0, 32);
}
