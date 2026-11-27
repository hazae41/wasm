import { Readable } from "@hazae41/binary";
import * as Wasm from "./mod.ts";

const body = [0x00, 0xfd, 0x0c, ...new Array(16).fill(0), 0x0b];
const bytes = new Uint8Array([
  0x00, 0x61, 0x73, 0x6d, 0x01, 0x00, 0x00, 0x00,
  0x01, 0x05, 0x01, 0x60, 0x00, 0x01, 0x7b,          // type: () -> v128
  0x03, 0x02, 0x01, 0x00,                            // function section
  0x0a, body.length + 2, 0x01, body.length, ...body, // code section
]);

console.log("WebAssembly.validate:", WebAssembly.validate(bytes));
Readable.readFromBytes(Wasm.Module, bytes)