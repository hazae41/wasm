# WASM

WebAssembly Binary Format (.wasm) decoder-modifier-encoder for TypeScript

```bash
npm install @hazae41/wasm
```

[**📦 NPM**](https://www.npmjs.com/package/@hazae41/wasm)

## Features

### Current features
- 100% TypeScript and ESM
- No external dependencies
- Rust-like patterns
- No validation done
- Easily edit .wasm
- Latest specification

## Usage 

```tsx
import * as Wasm from "@hazae41/wasm"
import { Readable, Writable } from "@hazae41/binary"
import { readFileSync, writeFileSync } from "node:fs"

const module = Readable.readFromBytes(Wasm.Module, readFileSync("./mod.wasm"))

const imports = module.body.sections.find(section => section.kind === Wasm.ImportSection.kind)! as Wasm.ImportSection

console.log(imports) // Show all imports

const start = module.body.sections.find(section => section.kind === Wasm.StartSection.kind)! as Wasm.StartSection

start.funcidx = 3 // Change start function

writeFileSync("./mod.wasm", Writable.writeToBytes(module))
```