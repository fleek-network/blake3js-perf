use wasm_bindgen::prelude::*;

#[wasm_bindgen]
pub fn hash(buffer: Vec<u8>) -> Vec<u8> {
    let hash: [u8; 32] = blake3::hash(&buffer).into();
    Vec::from(hash.as_slice())
}
