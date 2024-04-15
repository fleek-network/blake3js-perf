# Blake3 WASM

A very simple wasm library that exports a `hash` function that performs a
blake3 hash.

## Generate the bindings

First, install `wasm-bindgen-cli` globally.

```bash
cargo install wasm-bindgen-cli
```

Then cd to this directory, and run:

```bash
wasm-pack build --target web
```

And the bindings should be in the `pkg` directory. Take a look at the `index.html` file to
see those.
