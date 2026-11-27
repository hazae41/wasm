// deno-lint-ignore-file no-namespace

import type { Nullable } from "@/libs/nullable/mod.ts";
import { Readable, type Writable } from "@hazae41/binary";
import { Cursor } from "@hazae41/cursor";

export class Module {

  constructor(
    public head: Head,
    public body: Body
  ) { }

  size(): number {
    return this.head.size() + this.body.size()
  }

  write(cursor: Cursor) {
    this.head.write(cursor)
    this.body.write(cursor)
  }

}

export namespace Module {

  export function read(cursor: Cursor): Module {
    const head = Head.read(cursor)
    const body = Body.read(cursor)

    return new Module(head, body)
  }

}

export class Head {

  constructor(
    public version: number
  ) { }

  size(): number {
    return 4 + 4
  }

  write(cursor: Cursor) {
    cursor.writeUint32(1836278016, true)
    cursor.writeUint32(this.version, true)
  }

}

export namespace Head {

  export function read(cursor: Cursor): Head {
    const magic = cursor.readUint32(true)

    if (magic !== 1836278016)
      throw new Error("Invalid magic number")

    const version = cursor.readUint32(true)

    if (version !== 1)
      throw new Error("Unsupported version")

    return new Head(version)
  }

}

export class Body {

  constructor(
    public sections: Section[]
  ) { }

  size(): number {
    let size = 0

    for (const section of this.sections)
      size += 1 + new LEB128.U32(section.size()).size() + section.size()

    return size
  }

  write(cursor: Cursor) {
    for (const section of this.sections) {
      cursor.writeUint8(section.kind)

      new LEB128.U32(section.size()).write(cursor)

      section.write(cursor)
    }
  }

}

export namespace Body {

  export function read(cursor: Cursor): Body {
    const sections = new Array<Section>()

    while (cursor.remaining > 0) {
      const kind = cursor.readUint8()

      const size = LEB128.U32.read(cursor)

      const data = cursor.read(size.value)

      if (kind === CustomSection.kind) {
        const section = Readable.readFromBytes(CustomSection, data)

        sections.push(section)

        continue
      }

      if (kind === TypeSection.kind) {
        const section = Readable.readFromBytes(TypeSection, data)

        sections.push(section)

        continue
      }

      if (kind === ImportSection.kind) {
        const section = Readable.readFromBytes(ImportSection, data)

        sections.push(section)

        continue
      }

      if (kind === FunctionSection.kind) {
        const section = Readable.readFromBytes(FunctionSection, data)

        sections.push(section)

        continue
      }

      if (kind === TableSection.kind) {
        const section = Readable.readFromBytes(TableSection, data)

        sections.push(section)

        continue
      }

      if (kind === MemorySection.kind) {
        const section = Readable.readFromBytes(MemorySection, data)

        sections.push(section)

        continue
      }

      if (kind === GlobalSection.kind) {
        const section = Readable.readFromBytes(GlobalSection, data)

        sections.push(section)

        continue
      }

      if (kind === ExportSection.kind) {
        const section = Readable.readFromBytes(ExportSection, data)

        sections.push(section)

        continue
      }

      if (kind === StartSection.kind) {
        const section = Readable.readFromBytes(StartSection, data)

        sections.push(section)

        continue
      }

      if (kind === ElementSection.kind) {
        const section = Readable.readFromBytes(ElementSection, data)

        sections.push(section)

        continue
      }

      if (kind === CodeSection.kind) {
        const section = Readable.readFromBytes(CodeSection, data)

        sections.push(section)

        continue
      }

      if (kind === DataSection.kind) {
        const section = Readable.readFromBytes(DataSection, data)

        sections.push(section)

        continue
      }

      if (kind === DataCountSection.kind) {
        const section = Readable.readFromBytes(DataCountSection, data)

        sections.push(section)

        continue
      }

      if (kind === TagSection.kind) {
        const section = Readable.readFromBytes(TagSection, data)

        sections.push(section)

        continue
      }

      sections.push(new UnknownSection(kind, data))

      continue
    }

    return new Body(sections)
  }

}

export type Section =
  | UnknownSection
  | CustomSection
  | TypeSection
  | ImportSection
  | FunctionSection
  | TableSection
  | GlobalSection
  | MemorySection
  | ExportSection
  | StartSection
  | ElementSection
  | CodeSection
  | DataSection
  | DataCountSection
  | TagSection

export class UnknownSection {

  constructor(
    public kind: number,
    public data: Uint8Array
  ) { }

  size(): number {
    return this.data.length
  }

  write(cursor: Cursor) {
    cursor.write(this.data)
  }

}

export class CustomSection {

  constructor(
    public name: Uint8Array,
    public data: Uint8Array
  ) { }

  get kind(): typeof CustomSection.kind {
    return CustomSection.kind
  }

  size(): number {
    return new LEB128.U32(this.name.length).size() + this.name.length + this.data.length
  }

  write(cursor: Cursor) {
    new LEB128.U32(this.name.length).write(cursor)

    cursor.write(this.name)

    cursor.write(this.data)
  }

}

export namespace CustomSection {

  export const kind = 0

  export function read(cursor: Cursor): CustomSection {
    const size = LEB128.U32.read(cursor)

    const name = cursor.read(size.value)

    const data = cursor.read(cursor.remaining)

    return new CustomSection(name, data)
  }

}

export class TypeSection {

  constructor(
    public descriptors: TypeSection.TypeDescriptor[]
  ) { }

  get kind(): typeof TypeSection.kind {
    return TypeSection.kind
  }

  size(): number {
    let size = 0

    size += new LEB128.U32(this.descriptors.length).size()

    for (const descriptor of this.descriptors) {
      size += 1

      if (descriptor.prefix === TypeSection.FuncType.kind) {
        size += descriptor.body.size()
        continue
      }

      if (descriptor.prefix === 0x4E || descriptor.prefix === 0x4D) {
        size += new LEB128.U32(descriptor.subtypes.length).size()

        for (const subtype of descriptor.subtypes)
          size += new LEB128.U32(subtype).size()

        // NOOP
      }

      size += 1

      size += descriptor.body.size()
      continue
    }

    return size
  }

  write(cursor: Cursor) {
    new LEB128.U32(this.descriptors.length).write(cursor)

    for (const descriptor of this.descriptors) {
      cursor.writeUint8(descriptor.prefix)

      if (descriptor.prefix === TypeSection.FuncType.kind) {
        descriptor.body.write(cursor)
        continue
      }

      if (descriptor.prefix === 0x4E || descriptor.prefix === 0x4D) {
        new LEB128.U32(descriptor.subtypes.length).write(cursor)

        for (const subtype of descriptor.subtypes)
          new LEB128.U32(subtype).write(cursor)

        // NOOP
      }

      cursor.writeUint8(descriptor.body.kind)

      descriptor.body.write(cursor)
      continue
    }

    return
  }

}

export namespace TypeSection {

  export const kind = 0x01

  export interface TypeDescriptor {
    prefix: number
    subtypes: number[]
    body: TypeBody
  }

  export function read(cursor: Cursor): TypeSection {
    const count = LEB128.U32.read(cursor)

    const types = new Array<TypeDescriptor>()

    for (let i = 0; i < count.value; i++) {
      const prefix = cursor.readUint8()

      if (prefix === FuncType.kind) {
        const body = FuncType.read(cursor)
        types.push({ prefix, subtypes: [], body })
        continue
      }

      const subtypes = new Array<number>()

      if (prefix === 0x4E || prefix === 0x4D) {
        const subcount = LEB128.U32.read(cursor)

        for (let j = 0; j < subcount.value; j++)
          subtypes.push(LEB128.U32.read(cursor).value)

        // NOOP
      }

      const kind = cursor.readUint8()

      if (kind === FuncType.kind) {
        const body = FuncType.read(cursor)
        types.push({ prefix, subtypes, body })
        continue
      }

      if (kind === StructType.kind) {
        const body = StructType.read(cursor)
        types.push({ prefix, subtypes, body })
        continue
      }

      if (kind === ArrayType.kind) {
        const body = ArrayType.read(cursor)
        types.push({ prefix, subtypes, body })
        continue
      }

      throw new Error(`Unknown section 0x${kind.toString(16).padStart(2, "0")}`)
    }

    return new TypeSection(types)
  }

  export type TypeBody =
    | FuncType
    | StructType
    | ArrayType

  export class FuncType {

    constructor(
      public params: number[],
      public results: number[]
    ) { }

    get kind(): typeof FuncType.kind {
      return FuncType.kind
    }

    size(): number {
      let size = 0

      size += new LEB128.U32(this.params.length).size()

      size += this.params.length

      size += new LEB128.U32(this.results.length).size()

      size += this.results.length

      return size
    }

    write(cursor: Cursor) {
      new LEB128.U32(this.params.length).write(cursor)

      for (const param of this.params)
        cursor.writeUint8(param)

      new LEB128.U32(this.results.length).write(cursor)

      for (const result of this.results)
        cursor.writeUint8(result)

      return
    }

  }

  export namespace FuncType {

    export const kind = 0x60

    export function read(cursor: Cursor): FuncType {
      const pcount = LEB128.U32.read(cursor)

      const params = new Array<number>()

      for (let i = 0; i < pcount.value; i++)
        params.push(cursor.readUint8())

      const rcount = LEB128.U32.read(cursor)

      const results = new Array<number>()

      for (let i = 0; i < rcount.value; i++)
        results.push(cursor.readUint8())

      return new FuncType(params, results)
    }

  }

  export class StructType {

    constructor(
      public fields: [number, boolean][]
    ) { }

    get kind(): typeof StructType.kind {
      return StructType.kind
    }

    size(): number {
      let size = 0

      size += new LEB128.U32(this.fields.length).size()

      for (const _ of this.fields)
        size += 1 + 1

      return size
    }

    write(cursor: Cursor) {
      new LEB128.U32(this.fields.length).write(cursor)

      for (const [valtype, mutable] of this.fields) {
        cursor.writeUint8(valtype)
        cursor.writeUint8(mutable ? 1 : 0)
      }

      return
    }

  }

  export namespace StructType {

    export const kind = 0x5E

    export function read(cursor: Cursor): StructType {
      const count = LEB128.U32.read(cursor)

      const fields = new Array<[number, boolean]>()

      for (let i = 0; i < count.value; i++) {
        const valtype = cursor.readUint8()
        const mutable = cursor.readUint8() === 1

        fields.push([valtype, mutable])
      }

      return new StructType(fields)
    }

  }

  export class ArrayType {

    constructor(
      public valtype: number,
      public mutable: boolean
    ) { }

    get kind(): typeof ArrayType.kind {
      return ArrayType.kind
    }

    size(): number {
      return 1 + 1
    }

    write(cursor: Cursor) {
      cursor.writeUint8(this.valtype)
      cursor.writeUint8(this.mutable ? 1 : 0)
    }

  }

  export namespace ArrayType {

    export const kind = 0x5F

    export function read(cursor: Cursor): ArrayType {
      const valtype = cursor.readUint8()
      const mutable = cursor.readUint8() === 1

      return new ArrayType(valtype, mutable)
    }

  }

}

export class ImportSection {

  constructor(
    public descriptors: ImportSection.ImportDescriptor[]
  ) { }

  get kind(): typeof ImportSection.kind {
    return ImportSection.kind
  }

  size(): number {
    let size = 0

    size += new LEB128.U32(this.descriptors.length).size()

    for (const descriptor of this.descriptors) {
      size += new LEB128.U32(descriptor.from.length).size() + descriptor.from.length

      size += new LEB128.U32(descriptor.name.length).size() + descriptor.name.length

      size += 1

      size += descriptor.body.size()
    }

    return size
  }

  write(cursor: Cursor) {
    new LEB128.U32(this.descriptors.length).write(cursor)

    for (const descriptor of this.descriptors) {
      new LEB128.U32(descriptor.from.length).write(cursor)
      cursor.write(descriptor.from)

      new LEB128.U32(descriptor.name.length).write(cursor)
      cursor.write(descriptor.name)

      cursor.writeUint8(descriptor.body.kind)

      descriptor.body.write(cursor)
    }
  }
}

export namespace ImportSection {

  export const kind = 0x02

  export interface ImportDescriptor {
    from: Uint8Array
    name: Uint8Array
    body: ImportBody
  }

  export function read(cursor: Cursor): ImportSection {
    const count = LEB128.U32.read(cursor)

    const descriptors = new Array<ImportDescriptor>()

    for (let i = 0; i < count.value; i++) {
      const from = cursor.read(LEB128.U32.read(cursor).value)
      const name = cursor.read(LEB128.U32.read(cursor).value)

      const kind = cursor.readUint8()

      if (kind === 0x00) {
        const body = FunctionImport.read(cursor)
        descriptors.push({ from, name, body })
        continue
      }

      if (kind === 0x01) {
        const body = TableImport.read(cursor)
        descriptors.push({ from, name, body })
        continue
      }

      if (kind === 0x02) {
        const body = MemoryImport.read(cursor)
        descriptors.push({ from, name, body })
        continue
      }

      if (kind === 0x03) {
        const body = GlobalImport.read(cursor)
        descriptors.push({ from, name, body })
        continue
      }

      throw new Error(`Unknown import 0x${kind.toString(16).padStart(2, "0")}`)
    }

    return new ImportSection(descriptors)
  }

  export type ImportBody =
    | FunctionImport
    | TableImport
    | MemoryImport
    | GlobalImport

  export class FunctionImport {

    constructor(
      public typeidx: number
    ) { }

    get kind(): typeof FunctionImport.kind {
      return FunctionImport.kind
    }

    size(): number {
      return new LEB128.U32(this.typeidx).size()
    }

    write(cursor: Cursor) {
      new LEB128.U32(this.typeidx).write(cursor)
    }

  }

  export namespace FunctionImport {

    export const kind = 0x00

    export function read(cursor: Cursor): FunctionImport {
      return new FunctionImport(LEB128.U32.read(cursor).value)
    }

  }

  export class TableImport {

    constructor(
      public reftype: number,
      public flag: number,
      public min: number,
      public max: Nullable<number>,
    ) { }

    get kind(): typeof TableImport.kind {
      return TableImport.kind
    }

    size(): number {
      let size = 0

      size += 1

      size += 1

      size += new LEB128.U32(this.min).size()

      if (this.max != null)
        size += new LEB128.U32(this.max).size()

      return size
    }

    write(cursor: Cursor) {
      cursor.writeUint8(this.reftype)

      cursor.writeUint8(this.flag)

      new LEB128.U32(this.min).write(cursor)

      if (this.max != null)
        new LEB128.U32(this.max).write(cursor)

      return
    }

  }

  export namespace TableImport {

    export const kind = 0x01

    export function read(cursor: Cursor): TableImport {
      const reftype = cursor.readUint8()

      const flag = cursor.readUint8()

      const min = LEB128.U32.read(cursor).value
      const max = flag & 0x01 ? LEB128.U32.read(cursor).value : null

      return new TableImport(reftype, flag, min, max)
    }

  }

  export class MemoryImport {

    constructor(
      public flag: number,
      public min: number,
      public max: Nullable<number>,
    ) { }

    get kind(): typeof MemoryImport.kind {
      return MemoryImport.kind
    }

    size(): number {
      let size = 1

      size += new LEB128.U32(this.min).size()

      if (this.max != null)
        size += new LEB128.U32(this.max).size()

      return size
    }

    write(cursor: Cursor) {
      cursor.writeUint8(this.flag)

      new LEB128.U32(this.min).write(cursor)

      if (this.max != null)
        new LEB128.U32(this.max).write(cursor)

      return
    }

  }

  export namespace MemoryImport {

    export const kind = 0x02

    export function read(cursor: Cursor): MemoryImport {
      const flag = cursor.readUint8()

      const min = LEB128.U32.read(cursor)
      const max = flag & 0x01 ? LEB128.U32.read(cursor).value : null

      return new MemoryImport(flag, min.value, max)
    }

  }

  export class GlobalImport {

    constructor(
      public valtype: number,
      public mutable: number,
    ) { }

    get kind(): typeof GlobalImport.kind {
      return GlobalImport.kind
    }

    size(): number {
      return 1 + 1
    }

    write(cursor: Cursor) {
      cursor.writeUint8(this.valtype)
      cursor.writeUint8(this.mutable)
    }

  }

  export namespace GlobalImport {

    export const kind = 0x03

    export function read(cursor: Cursor): GlobalImport {
      const valtype = cursor.readUint8()
      const mutable = cursor.readUint8()

      return new GlobalImport(valtype, mutable)
    }

  }

}

export class FunctionSection {

  constructor(
    public typeidxs: number[]
  ) { }

  get kind(): typeof FunctionSection.kind {
    return FunctionSection.kind
  }

  size(): number {
    let size = 0

    size += new LEB128.U32(this.typeidxs.length).size()

    for (const typeidx of this.typeidxs)
      size += new LEB128.U32(typeidx).size()

    return size
  }

  write(cursor: Cursor) {
    new LEB128.U32(this.typeidxs.length).write(cursor)

    for (const typeidx of this.typeidxs)
      new LEB128.U32(typeidx).write(cursor)

    return
  }

}

export namespace FunctionSection {

  export const kind = 0x03

  export function read(cursor: Cursor): FunctionSection {
    const count = LEB128.U32.read(cursor)

    const typeidxs = new Array<number>()

    for (let i = 0; i < count.value; i++)
      typeidxs.push(LEB128.U32.read(cursor).value)

    return new FunctionSection(typeidxs)
  }

}

export class TableSection {

  constructor(
    public descriptors: TableSection.TableDescriptor[]
  ) { }

  get kind(): typeof TableSection.kind {
    return TableSection.kind
  }

  size(): number {
    let size = 0

    size += new LEB128.U32(this.descriptors.length).size()

    for (const descriptor of this.descriptors) {
      size += 1

      size += 1

      size += new LEB128.U32(descriptor.min).size()

      if (descriptor.max != null)
        size += new LEB128.U32(descriptor.max).size()

      continue
    }

    return size
  }

  write(cursor: Cursor) {
    new LEB128.U32(this.descriptors.length).write(cursor)

    for (const descriptor of this.descriptors) {
      cursor.writeUint8(descriptor.reftype)

      cursor.writeUint8(descriptor.flag)

      new LEB128.U32(descriptor.min).write(cursor)

      if (descriptor.max != null)
        new LEB128.U32(descriptor.max).write(cursor)

      continue
    }

    return
  }

}

export namespace TableSection {

  export const kind = 0x04

  export interface TableDescriptor {
    reftype: number
    flag: number
    min: number
    max: Nullable<number>
  }

  export function read(cursor: Cursor): TableSection {
    const count = LEB128.U32.read(cursor)

    const descriptors = new Array<TableDescriptor>()

    for (let i = 0; i < count.value; i++) {
      const reftype = cursor.readUint8()

      const flag = cursor.readUint8()

      const min = LEB128.U32.read(cursor).value
      const max = flag & 0x01 ? LEB128.U32.read(cursor).value : null

      descriptors.push({ reftype, flag, min, max })
    }

    return new TableSection(descriptors)
  }

}

export class MemorySection {

  constructor(
    public descriptors: MemorySection.MemoryDescriptor[]
  ) { }

  get kind(): typeof MemorySection.kind {
    return MemorySection.kind
  }

  size(): number {
    let size = 0

    size += new LEB128.U32(this.descriptors.length).size()

    for (const descriptor of this.descriptors) {
      size += 1

      size += new LEB128.U32(descriptor.min).size()

      if (descriptor.max != null)
        size += new LEB128.U32(descriptor.max).size()

      continue
    }

    return size
  }

  write(cursor: Cursor) {
    new LEB128.U32(this.descriptors.length).write(cursor)

    for (const descriptor of this.descriptors) {
      cursor.writeUint8(descriptor.flag)

      new LEB128.U32(descriptor.min).write(cursor)

      if (descriptor.max != null)
        new LEB128.U32(descriptor.max).write(cursor)

      continue
    }

    return
  }

}

export namespace MemorySection {

  export const kind = 0x05

  export interface MemoryDescriptor {
    flag: number
    min: number
    max: Nullable<number>
  }

  export function read(cursor: Cursor): MemorySection {
    const count = LEB128.U32.read(cursor)

    const descriptors = new Array<MemoryDescriptor>()

    for (let i = 0; i < count.value; i++) {
      const flag = cursor.readUint8()

      const min = LEB128.U32.read(cursor).value
      const max = flag & 0x01 ? LEB128.U32.read(cursor).value : null

      descriptors.push({ flag, min, max })
    }

    return new MemorySection(descriptors)
  }

}

export class GlobalSection {

  constructor(
    public descriptors: GlobalSection.GlobalDescriptor[]
  ) { }

  get kind(): typeof GlobalSection.kind {
    return GlobalSection.kind
  }

  size(): number {
    let size = 0

    size += new LEB128.U32(this.descriptors.length).size()

    for (const descriptor of this.descriptors) {
      size += 1
      size += 1

      for (const instruction of descriptor.instructions)
        size += instruction.size()

      continue
    }

    return size
  }

  write(cursor: Cursor) {
    new LEB128.U32(this.descriptors.length).write(cursor)

    for (const descriptor of this.descriptors) {
      cursor.writeUint8(descriptor.valtype)
      cursor.writeUint8(descriptor.mutable)

      for (const instruction of descriptor.instructions)
        instruction.write(cursor)

      continue
    }

    return
  }

}

export namespace GlobalSection {

  export const kind = 0x06

  export interface GlobalDescriptor {

    valtype: number

    mutable: number

    instructions: Instruction[]

  }

  export function read(cursor: Cursor): GlobalSection {
    const count = LEB128.U32.read(cursor)

    const descriptors = new Array<GlobalDescriptor>()

    for (let i = 0; i < count.value; i++) {
      const valtype = cursor.readUint8()
      const mutable = cursor.readUint8()

      const instructions = new Array<Instruction>()

      while (true) {
        const instruction = Instruction.read(cursor)

        instructions.push(instruction)

        if (instruction.opcode === 0x0b)
          break

        continue
      }

      descriptors.push({ valtype, mutable, instructions })
    }

    return new GlobalSection(descriptors)
  }

}

export class ExportSection {

  constructor(
    public descriptors: ExportSection.ExportDescriptor[]
  ) { }

  get kind(): typeof ExportSection.kind {
    return ExportSection.kind
  }

  size(): number {
    let size = 0

    size += new LEB128.U32(this.descriptors.length).size()

    for (const descriptor of this.descriptors) {
      size += new LEB128.U32(descriptor.name.length).size()

      size += descriptor.name.length

      size += 1

      size += new LEB128.U32(descriptor.xidx).size()
    }

    return size
  }

  write(cursor: Cursor) {
    new LEB128.U32(this.descriptors.length).write(cursor)

    for (const descriptor of this.descriptors) {
      new LEB128.U32(descriptor.name.length).write(cursor)

      cursor.write(descriptor.name)

      cursor.writeUint8(descriptor.kind)

      new LEB128.U32(descriptor.xidx).write(cursor)
    }

    return
  }
}

export namespace ExportSection {

  export const kind = 0x07

  export interface ExportDescriptor {

    name: Uint8Array

    kind: number

    xidx: number

  }

  export function read(cursor: Cursor): ExportSection {
    const count = LEB128.U32.read(cursor)

    const exports = new Array<ExportDescriptor>()

    for (let i = 0; i < count.value; i++) {
      const name = cursor.read(LEB128.U32.read(cursor).value)
      const kind = cursor.readUint8()
      const xidx = LEB128.U32.read(cursor).value

      exports.push({ name, kind, xidx })
    }

    return new ExportSection(exports)
  }

}

export class StartSection {

  constructor(
    public funcidx: number
  ) { }

  get kind(): typeof StartSection.kind {
    return StartSection.kind
  }

  size(): number {
    return new LEB128.U32(this.funcidx).size()
  }

  write(cursor: Cursor) {
    new LEB128.U32(this.funcidx).write(cursor)
  }

}

export namespace StartSection {

  export const kind = 0x08

  export function read(cursor: Cursor): StartSection {
    return new StartSection(LEB128.U32.read(cursor).value)
  }

}

export class ElementSection {

  constructor(
    public segments: ElementSection.ElementSegment[]
  ) { }

  get kind(): typeof ElementSection.kind {
    return ElementSection.kind
  }

  size(): number {
    let size = 0

    size += new LEB128.U32(this.segments.length).size()

    for (const segment of this.segments) {
      size += 1

      if (segment.flag === 0) {
        for (const instruction of segment.instructions)
          size += instruction.size()

        size += new LEB128.U32(segment.funcidxs.length).size()

        for (const funcidx of segment.funcidxs)
          size += new LEB128.U32(funcidx).size()

        continue
      }

      if (segment.flag === 1) {
        size += 1

        size += new LEB128.U32(segment.elements.length).size()

        for (const instructions of segment.elements)
          for (const instruction of instructions)
            size += instruction.size()

        continue
      }

      if (segment.flag === 2) {
        size += new LEB128.U32(segment.tableidx).size()

        for (const instruction of segment.instructions)
          size += instruction.size()

        size += 1

        size += new LEB128.U32(segment.elements.length).size()

        for (const instructions of segment.elements)
          for (const instruction of instructions)
            size += instruction.size()

        continue
      }

      if (segment.flag === 3) {
        size += 1

        size += new LEB128.U32(segment.elements.length).size()

        for (const instructions of segment.elements)
          for (const instruction of instructions)
            size += instruction.size()

        continue
      }

      if (segment.flag === 4) {
        for (const instruction of segment.instructions)
          size += instruction.size()

        size += new LEB128.U32(segment.funcidxs.length).size()

        for (const funcidx of segment.funcidxs)
          size += new LEB128.U32(funcidx).size()

        continue
      }

      if (segment.flag === 5) {
        size += 1

        size += new LEB128.U32(segment.funcidxs.length).size()

        for (const funcidx of segment.funcidxs)
          size += new LEB128.U32(funcidx).size()

        continue
      }

      if (segment.flag === 6) {
        size += new LEB128.U32(segment.tableidx).size()

        for (const instruction of segment.instructions)
          size += instruction.size()

        size += 1

        size += new LEB128.U32(segment.funcidxs.length).size()

        for (const funcidx of segment.funcidxs)
          size += new LEB128.U32(funcidx).size()

        continue
      }

      if (segment.flag === 7) {
        size += 1

        size += new LEB128.U32(segment.funcidxs.length).size()

        for (const funcidx of segment.funcidxs)
          size += new LEB128.U32(funcidx).size()

        continue
      }
    }

    return size
  }

  write(cursor: Cursor) {
    new LEB128.U32(this.segments.length).write(cursor)

    for (const segment of this.segments) {
      cursor.writeUint8(segment.flag)

      if (segment.flag === 0) {
        for (const instruction of segment.instructions)
          instruction.write(cursor)

        new LEB128.U32(segment.funcidxs.length).write(cursor)

        for (const funcidx of segment.funcidxs)
          new LEB128.U32(funcidx).write(cursor)

        continue
      }

      if (segment.flag === 1) {
        cursor.writeUint8(segment.reftype)

        new LEB128.U32(segment.elements.length).write(cursor)

        for (const instructions of segment.elements)
          for (const instruction of instructions)
            instruction.write(cursor)

        continue
      }

      if (segment.flag === 2) {
        new LEB128.U32(segment.tableidx).write(cursor)

        for (const instruction of segment.instructions)
          instruction.write(cursor)

        cursor.writeUint8(segment.reftype)

        new LEB128.U32(segment.elements.length).write(cursor)

        for (const instructions of segment.elements)
          for (const instruction of instructions)
            instruction.write(cursor)

        continue
      }

      if (segment.flag === 3) {
        cursor.writeUint8(segment.reftype)

        new LEB128.U32(segment.elements.length).write(cursor)

        for (const instructions of segment.elements)
          for (const instruction of instructions)
            instruction.write(cursor)

        continue
      }

      if (segment.flag === 4) {
        for (const instruction of segment.instructions)
          instruction.write(cursor)

        new LEB128.U32(segment.funcidxs.length).write(cursor)

        for (const funcidx of segment.funcidxs)
          new LEB128.U32(funcidx).write(cursor)

        continue
      }

      if (segment.flag === 5) {
        cursor.writeUint8(segment.reftype)

        new LEB128.U32(segment.funcidxs.length).write(cursor)

        for (const funcidx of segment.funcidxs)
          new LEB128.U32(funcidx).write(cursor)

        continue
      }

      if (segment.flag === 6) {
        new LEB128.U32(segment.tableidx).write(cursor)

        for (const instruction of segment.instructions)
          instruction.write(cursor)

        cursor.writeUint8(segment.reftype)

        new LEB128.U32(segment.funcidxs.length).write(cursor)

        for (const funcidx of segment.funcidxs)
          new LEB128.U32(funcidx).write(cursor)

        continue
      }

      if (segment.flag === 7) {
        cursor.writeUint8(segment.reftype)

        new LEB128.U32(segment.funcidxs.length).write(cursor)

        for (const funcidx of segment.funcidxs)
          new LEB128.U32(funcidx).write(cursor)

        continue
      }
    }
  }
}

export namespace ElementSection {

  export const kind = 0x09

  export type ElementSegment =
    | { flag: 0, instructions: Instruction[], funcidxs: number[] }
    | { flag: 1, reftype: number, elements: Instruction[][] }
    | { flag: 2, tableidx: number, instructions: Instruction[], reftype: number, elements: Instruction[][] }
    | { flag: 3, reftype: number, elements: Instruction[][] }
    | { flag: 4, instructions: Instruction[], funcidxs: number[] }
    | { flag: 5, reftype: number, funcidxs: number[] }
    | { flag: 6, tableidx: number, instructions: Instruction[], reftype: number, funcidxs: number[] }
    | { flag: 7, reftype: number, funcidxs: number[] }

  export function read(cursor: Cursor): ElementSection {
    const count = LEB128.U32.read(cursor)

    const segments = new Array<ElementSegment>()

    for (let i = 0; i < count.value; i++) {
      const flag = cursor.readUint8()

      if (flag === 0) {
        const instructions = new Array<Instruction>()

        while (true) {
          const instruction = Instruction.read(cursor)

          instructions.push(instruction)

          if (instruction.opcode === 0x0b)
            break

          continue
        }

        const count = LEB128.U32.read(cursor)

        const funcidxs = new Array<number>()

        for (let j = 0; j < count.value; j++)
          funcidxs.push(LEB128.U32.read(cursor).value)

        segments.push({ flag, instructions, funcidxs })
        continue
      }

      if (flag === 1) {
        const reftype = cursor.readUint8()

        const count = LEB128.U32.read(cursor)

        const elements = new Array<Array<Instruction>>()

        for (let j = 0; j < count.value; j++) {
          const instructions = new Array<Instruction>()

          while (true) {
            const instruction = Instruction.read(cursor)

            instructions.push(instruction)

            if (instruction.opcode === 0x0b)
              break

            continue
          }

          elements.push(instructions)
        }

        segments.push({ flag, reftype, elements })
        continue
      }

      if (flag === 2) {
        const tableidx = LEB128.U32.read(cursor).value

        const instructions = new Array<Instruction>()

        while (true) {
          const instruction = Instruction.read(cursor)

          instructions.push(instruction)

          if (instruction.opcode === 0x0b)
            break

          continue
        }

        const reftype = cursor.readUint8()

        const count = LEB128.U32.read(cursor)

        const elements = new Array<Array<Instruction>>()

        for (let j = 0; j < count.value; j++) {
          const instructions = new Array<Instruction>()

          while (true) {
            const instruction = Instruction.read(cursor)

            instructions.push(instruction)

            if (instruction.opcode === 0x0b)
              break

            continue
          }

          elements.push(instructions)
        }

        segments.push({ flag, tableidx, instructions, reftype, elements })
        continue
      }

      if (flag === 3) {
        const reftype = cursor.readUint8()

        const count = LEB128.U32.read(cursor)

        const elements = new Array<Array<Instruction>>()

        for (let j = 0; j < count.value; j++) {
          const instructions = new Array<Instruction>()

          while (true) {
            const instruction = Instruction.read(cursor)

            instructions.push(instruction)

            if (instruction.opcode === 0x0b)
              break

            continue
          }

          elements.push(instructions)
        }

        segments.push({ flag, reftype, elements })
        continue
      }

      if (flag === 4) {
        const instructions = new Array<Instruction>()

        while (true) {
          const instruction = Instruction.read(cursor)

          instructions.push(instruction)

          if (instruction.opcode === 0x0b)
            break

          continue
        }

        const count = LEB128.U32.read(cursor)

        const funcidxs = new Array<number>()

        for (let j = 0; j < count.value; j++)
          funcidxs.push(LEB128.U32.read(cursor).value)

        segments.push({ flag, instructions, funcidxs })
        continue
      }

      if (flag === 5) {
        const reftype = cursor.readUint8()

        const count = LEB128.U32.read(cursor)

        const funcidxs = new Array<number>()

        for (let j = 0; j < count.value; j++)
          funcidxs.push(LEB128.U32.read(cursor).value)

        segments.push({ flag, reftype, funcidxs })
        continue
      }

      if (flag === 6) {
        const tableidx = LEB128.U32.read(cursor).value

        const instructions = new Array<Instruction>()

        while (true) {
          const instruction = Instruction.read(cursor)

          instructions.push(instruction)

          if (instruction.opcode === 0x0b)
            break

          continue
        }

        const reftype = cursor.readUint8()

        const count = LEB128.U32.read(cursor)

        const funcidxs = new Array<number>()

        for (let j = 0; j < count.value; j++)
          funcidxs.push(LEB128.U32.read(cursor).value)

        segments.push({ flag, tableidx, instructions, reftype, funcidxs })
        continue
      }

      if (flag === 7) {
        const reftype = cursor.readUint8()

        const count = LEB128.U32.read(cursor)

        const funcidxs = new Array<number>()

        for (let j = 0; j < count.value; j++)
          funcidxs.push(LEB128.U32.read(cursor).value)

        segments.push({ flag, reftype, funcidxs })
        continue
      }

      throw new Error(`Unknown element segment flag 0x${flag.toString(16).padStart(2, "0")}`)
    }

    return new ElementSection(segments)
  }

}

export class CodeSection {

  constructor(
    public bodies: CodeSection.FunctionBody[],
  ) { }

  get kind(): typeof CodeSection.kind {
    return CodeSection.kind
  }

  size(): number {
    let size = 0

    size += new LEB128.U32(this.bodies.length).size()

    for (const func of this.bodies)
      size += func.size()

    return size
  }

  write(cursor: Cursor) {
    new LEB128.U32(this.bodies.length).write(cursor)

    for (const func of this.bodies)
      func.write(cursor)

    return
  }

}

export namespace CodeSection {

  export const kind = 0x0A

  export function read(cursor: Cursor): CodeSection {
    const count = LEB128.U32.read(cursor)

    const bodies = new Array<FunctionBody>()

    for (let i = 0; i < count.value; i++)
      bodies.push(FunctionBody.read(cursor))

    return new CodeSection(bodies)
  }

  export class FunctionBody {

    constructor(
      public locals: FunctionBody.Local[],
      public instructions: Instruction[]
    ) { }

    size(): number {
      let subsize = 0

      subsize += new LEB128.U32(this.locals.length).size()

      for (const local of this.locals)
        subsize += local.size()

      for (const instruction of this.instructions)
        subsize += instruction.size()

      return new LEB128.U32(subsize).size() + subsize
    }

    write(cursor: Cursor) {
      let subsize = 0

      subsize += new LEB128.U32(this.locals.length).size()

      for (const local of this.locals)
        subsize += local.size()

      for (const instruction of this.instructions)
        subsize += instruction.size()

      new LEB128.U32(subsize).write(cursor)

      new LEB128.U32(this.locals.length).write(cursor)

      for (const local of this.locals)
        local.write(cursor)

      for (const instruction of this.instructions)
        instruction.write(cursor)

      return
    }

  }

  export namespace FunctionBody {

    export function read(cursor: Cursor): FunctionBody {
      const size = LEB128.U32.read(cursor)
      const data = cursor.read(size.value)

      const subcursor = new Cursor(data)

      const locals = Locals.read(subcursor)

      const instructions = new Array<Instruction>()

      while (subcursor.remaining > 0)
        instructions.push(Instruction.read(subcursor))

      return new FunctionBody(locals, instructions)
    }

    export namespace Locals {

      export function read(cursor: Cursor): Local[] {
        const count = LEB128.U32.read(cursor)

        const locals = new Array<Local>()

        for (let i = 0; i < count.value; i++)
          locals.push(Local.read(cursor))

        return locals
      }

    }

    export class Local {

      constructor(
        public count: number,
        public valtype: number
      ) { }

      size(): number {
        return new LEB128.U32(this.count).size() + 1
      }

      write(cursor: Cursor) {
        new LEB128.U32(this.count).write(cursor)

        cursor.writeUint8(this.valtype)

        return
      }

    }

    export namespace Local {

      export function read(cursor: Cursor): Local {
        const count = LEB128.U32.read(cursor)
        const valtype = cursor.readUint8()

        return new Local(count.value, valtype)
      }

    }

  }

}

export class DataSection {

  constructor(
    public segments: DataSection.DataSegment[]
  ) { }

  get kind(): typeof DataSection.kind {
    return DataSection.kind
  }

  size(): number {
    let size = 0

    size += new LEB128.U32(this.segments.length).size()

    for (const segment of this.segments) {
      size += 1

      if (segment.flag === 0) {
        for (const instruction of segment.instructions)
          size += instruction.size()

        size += new LEB128.U32(segment.data.length).size()

        size += segment.data.length

        continue
      }

      if (segment.flag === 1) {
        size += new LEB128.U32(segment.data.length).size()

        size += segment.data.length

        continue
      }

      if (segment.flag === 2) {
        size += new LEB128.U32(segment.memidx).size()

        for (const instruction of segment.instructions)
          size += instruction.size()

        size += new LEB128.U32(segment.data.length).size()

        size += segment.data.length

        continue
      }
    }

    return size
  }

  write(cursor: Cursor) {
    new LEB128.U32(this.segments.length).write(cursor)

    for (const segment of this.segments) {
      cursor.writeUint8(segment.flag)

      if (segment.flag === 0) {
        for (const instruction of segment.instructions)
          instruction.write(cursor)

        new LEB128.U32(segment.data.length).write(cursor)

        cursor.write(segment.data)

        continue
      }

      if (segment.flag === 1) {
        new LEB128.U32(segment.data.length).write(cursor)

        cursor.write(segment.data)

        continue
      }

      if (segment.flag === 2) {
        new LEB128.U32(segment.memidx).write(cursor)

        for (const instruction of segment.instructions)
          instruction.write(cursor)

        new LEB128.U32(segment.data.length).write(cursor)

        cursor.write(segment.data)

        continue
      }
    }

    return
  }

}

export namespace DataSection {

  export const kind = 0x0b

  export type DataSegment =
    | { flag: 0, instructions: Instruction[], data: Uint8Array }
    | { flag: 1, data: Uint8Array }
    | { flag: 2, memidx: number, instructions: Instruction[], data: Uint8Array }

  export function read(cursor: Cursor): DataSection {
    const count = LEB128.U32.read(cursor)

    const segments = new Array<DataSegment>()

    for (let i = 0; i < count.value; i++) {
      const flag = cursor.readUint8()

      if (flag === 0) {
        const instructions = new Array<Instruction>()

        while (true) {
          const instruction = Instruction.read(cursor)

          instructions.push(instruction)

          if (instruction.opcode === 0x0b)
            break

          continue
        }

        const data = cursor.read(LEB128.U32.read(cursor).value)

        segments.push({ flag, instructions, data })
        continue
      }

      if (flag === 1) {
        const data = cursor.read(LEB128.U32.read(cursor).value)

        segments.push({ flag, data })
        continue
      }

      if (flag === 2) {
        const memidx = LEB128.U32.read(cursor).value

        const instructions = new Array<Instruction>()

        while (true) {
          const instruction = Instruction.read(cursor)

          instructions.push(instruction)

          if (instruction.opcode === 0x0b)
            break

          continue
        }

        const data = cursor.read(LEB128.U32.read(cursor).value)

        segments.push({ flag, memidx, instructions, data })
        continue
      }

      throw new Error(`Unknown data segment flag 0x${flag.toString(16).padStart(2, "0")}`)
    }

    return new DataSection(segments)
  }
}

export class DataCountSection {

  constructor(
    public count: number
  ) { }

  get kind(): typeof DataCountSection.kind {
    return DataCountSection.kind
  }

  size(): number {
    return new LEB128.U32(this.count).size()
  }

  write(cursor: Cursor) {
    new LEB128.U32(this.count).write(cursor)
  }

}

export namespace DataCountSection {

  export const kind = 0x0c

  export function read(cursor: Cursor): DataCountSection {
    return new DataCountSection(LEB128.U32.read(cursor).value)
  }

}

export class TagSection {

  constructor(
    public tags: [number, number][]
  ) { }

  get kind(): typeof TagSection.kind {
    return TagSection.kind
  }

  size(): number {
    let size = 0

    size += new LEB128.U32(this.tags.length).size()

    for (const [_, typeidx] of this.tags) {
      size += 1

      size += new LEB128.U32(typeidx).size()

      continue
    }

    return size
  }

  write(cursor: Cursor) {
    new LEB128.U32(this.tags.length).write(cursor)

    for (const [attribute, typeidx] of this.tags) {
      cursor.writeUint8(attribute)

      new LEB128.U32(typeidx).write(cursor)

      continue
    }

    return
  }

}

export namespace TagSection {

  export const kind = 0x0d

  export function read(cursor: Cursor): TagSection {
    const count = LEB128.U32.read(cursor)

    const tags = new Array<[number, number]>()

    for (let i = 0; i < count.value; i++) {
      const attribute = cursor.readUint8()
      const typeidx = LEB128.U32.read(cursor).value

      tags.push([attribute, typeidx])
    }

    return new TagSection(tags)
  }
}

export class Instruction {

  constructor(
    public opcode: number,
    public params: Writable[]
  ) { }

  size(): number {
    let size = 1

    for (const param of this.params)
      size += param.size()

    return size
  }

  write(cursor: Cursor) {
    cursor.writeUint8(this.opcode)

    for (const param of this.params)
      param.write(cursor)

    return
  }

}

export namespace Instruction {

  export function read(cursor: Cursor): Instruction {
    const opcode = cursor.readUint8()

    switch (opcode) {

      /**
       * Control flow
       */

      case 0x00: // unreachable
        return new Instruction(opcode, [])
      case 0x01: // nop
        return new Instruction(opcode, [])

      case 0x02: // block  (blocktype)
        return new Instruction(opcode, [LEB128.I33.read(cursor)])
      case 0x03: // loop  (blocktype)
        return new Instruction(opcode, [LEB128.I33.read(cursor)])
      case 0x04: // if  (blocktype)
        return new Instruction(opcode, [LEB128.I33.read(cursor)])

      case 0x05: // else
        return new Instruction(opcode, [])

      case 0x08: // throw  (tagidx)
        return new Instruction(opcode, [LEB128.U32.read(cursor)])

      case 0x0a: // throw_ref
        return new Instruction(opcode, [])

      case 0x0b: // end
        return new Instruction(opcode, [])

      case 0x0c: // br  (labelidx)
        return new Instruction(opcode, [LEB128.U32.read(cursor)])
      case 0x0d: // br_if  (labelidx)
        return new Instruction(opcode, [LEB128.U32.read(cursor)])

      case 0x0e: { // br_table (vec<labelidx> + default labelidx)
        const count = LEB128.U32.read(cursor)

        const labels = new Array<LEB128.U32>()

        for (let i = 0; i < count.value; i++)
          labels.push(LEB128.U32.read(cursor))

        const fallback = LEB128.U32.read(cursor)

        return new Instruction(opcode, [count, ...labels, fallback])
      }

      case 0x0f: // return
        return new Instruction(opcode, [])

      case 0x10: // call    (funcidx)
        return new Instruction(opcode, [LEB128.U32.read(cursor)])

      case 0x11: // call_indirect  (typeidx, tableidx)
        return new Instruction(opcode, [LEB128.U32.read(cursor), LEB128.U32.read(cursor)])

      case 0x12: // return_call  (funcidx)
        return new Instruction(opcode, [LEB128.U32.read(cursor)])

      case 0x13: // return_call_indirect (typeidx, tableidx)
        return new Instruction(opcode, [LEB128.U32.read(cursor), LEB128.U32.read(cursor)])

      case 0x14: // call_ref   (typeidx)
        return new Instruction(opcode, [LEB128.U32.read(cursor)])
      case 0x15: // return_call_ref (typeidx)
        return new Instruction(opcode, [LEB128.U32.read(cursor)])

      /**
       * Parametric
       */

      case 0x1a: // drop
        return new Instruction(opcode, [])
      case 0x1b: // select
        return new Instruction(opcode, [])

      case 0x1c: { // select (typed) (vec<valtype>)
        const count = LEB128.U32.read(cursor)

        const types = new Array<LEB128.U32>()

        for (let i = 0; i < count.value; i++)
          types.push(LEB128.U32.read(cursor))

        return new Instruction(opcode, [count, ...types])
      }

      case 0x1f: { // try_table (blocktype + vec<catch>)
        const blocktype = LEB128.I33.read(cursor)

        const count = LEB128.U32.read(cursor)

        const catches = new Array<Writable>()

        for (let i = 0; i < count.value; i++) {
          const kind = U8.read(cursor)

          catches.push(kind)

          switch (kind.value) {
            case 0: // catch
              catches.push(LEB128.U32.read(cursor)) // tagidx
              catches.push(LEB128.U32.read(cursor)) // labelidx
              break
            case 1: // catch_ref
              catches.push(LEB128.U32.read(cursor)) // tagidx
              catches.push(LEB128.U32.read(cursor)) // labelidx
              break
            case 2: // catch_all
              catches.push(LEB128.U32.read(cursor)) // labelidx
              break
            case 3: // catch_all_ref
              catches.push(LEB128.U32.read(cursor)) // labelidx
              break
          }

          continue
        }

        return new Instruction(opcode, [blocktype, count, ...catches])
      }

      /**
       * Variables
       */

      case 0x20: // local.get (localidx)
        return new Instruction(opcode, [LEB128.U32.read(cursor)])
      case 0x21: // local.set (localidx)
        return new Instruction(opcode, [LEB128.U32.read(cursor)])
      case 0x22: // local.tee (localidx)
        return new Instruction(opcode, [LEB128.U32.read(cursor)])
      case 0x23: // global.get (globalidx)
        return new Instruction(opcode, [LEB128.U32.read(cursor)])
      case 0x24: // global.set (globalidx)
        return new Instruction(opcode, [LEB128.U32.read(cursor)])
      case 0x25: // table.get (tableidx)
        return new Instruction(opcode, [LEB128.U32.read(cursor)])
      case 0x26: // table.set (tableidx)
        return new Instruction(opcode, [LEB128.U32.read(cursor)])

      // Memory loads / stores (memarg = align:u32 + offset:u32)
      case 0x28: // i32.load
        return new Instruction(opcode, [LEB128.U32.read(cursor), LEB128.U32.read(cursor)])
      case 0x29: // i64.load
        return new Instruction(opcode, [LEB128.U32.read(cursor), LEB128.U32.read(cursor)])
      case 0x2a: // f32.load
        return new Instruction(opcode, [LEB128.U32.read(cursor), LEB128.U32.read(cursor)])
      case 0x2b: // f64.load
        return new Instruction(opcode, [LEB128.U32.read(cursor), LEB128.U32.read(cursor)])
      case 0x2c: // i32.load8_s
        return new Instruction(opcode, [LEB128.U32.read(cursor), LEB128.U32.read(cursor)])
      case 0x2d: // i32.load8_u
        return new Instruction(opcode, [LEB128.U32.read(cursor), LEB128.U32.read(cursor)])
      case 0x2e: // i32.load16_s
        return new Instruction(opcode, [LEB128.U32.read(cursor), LEB128.U32.read(cursor)])
      case 0x2f: // i32.load16_u
        return new Instruction(opcode, [LEB128.U32.read(cursor), LEB128.U32.read(cursor)])
      case 0x30: // i64.load8_s
        return new Instruction(opcode, [LEB128.U32.read(cursor), LEB128.U32.read(cursor)])
      case 0x31: // i64.load8_u
        return new Instruction(opcode, [LEB128.U32.read(cursor), LEB128.U32.read(cursor)])
      case 0x32: // i64.load16_s
        return new Instruction(opcode, [LEB128.U32.read(cursor), LEB128.U32.read(cursor)])
      case 0x33: // i64.load16_u
        return new Instruction(opcode, [LEB128.U32.read(cursor), LEB128.U32.read(cursor)])
      case 0x34: // i64.load32_s
        return new Instruction(opcode, [LEB128.U32.read(cursor), LEB128.U32.read(cursor)])
      case 0x35: // i64.load32_u
        return new Instruction(opcode, [LEB128.U32.read(cursor), LEB128.U32.read(cursor)])
      case 0x36: // i32.store
        return new Instruction(opcode, [LEB128.U32.read(cursor), LEB128.U32.read(cursor)])
      case 0x37: // i64.store
        return new Instruction(opcode, [LEB128.U32.read(cursor), LEB128.U32.read(cursor)])
      case 0x38: // f32.store
        return new Instruction(opcode, [LEB128.U32.read(cursor), LEB128.U32.read(cursor)])
      case 0x39: // f64.store
        return new Instruction(opcode, [LEB128.U32.read(cursor), LEB128.U32.read(cursor)])
      case 0x3a: // i32.store8
        return new Instruction(opcode, [LEB128.U32.read(cursor), LEB128.U32.read(cursor)])
      case 0x3b: // i32.store16
        return new Instruction(opcode, [LEB128.U32.read(cursor), LEB128.U32.read(cursor)])
      case 0x3c: // i64.store8
        return new Instruction(opcode, [LEB128.U32.read(cursor), LEB128.U32.read(cursor)])
      case 0x3d: // i64.store16
        return new Instruction(opcode, [LEB128.U32.read(cursor), LEB128.U32.read(cursor)])
      case 0x3e: // i64.store32
        return new Instruction(opcode, [LEB128.U32.read(cursor), LEB128.U32.read(cursor)])

      case 0x3f: // memory.size (memidx)
        return new Instruction(opcode, [LEB128.U32.read(cursor)])
      case 0x40: // memory.grow (memidx)
        return new Instruction(opcode, [LEB128.U32.read(cursor)])

      /**
       * Constants
       */

      case 0x41: // i32.const
        return new Instruction(opcode, [LEB128.I32.read(cursor)])
      case 0x42: // i64.const
        return new Instruction(opcode, [LEB128.I64.read(cursor)])
      case 0x43: // f32.const
        return new Instruction(opcode, [F32.read(cursor)])
      case 0x44: // f64.const
        return new Instruction(opcode, [F64.read(cursor)])

      /**
       * Numeric operators
       */

      case 0x45: // i32.eqz
        return new Instruction(opcode, [])
      case 0x46: // i32.eq
        return new Instruction(opcode, [])
      case 0x47: // i32.ne
        return new Instruction(opcode, [])
      case 0x48: // i32.lt_s
        return new Instruction(opcode, [])
      case 0x49: // i32.lt_u
        return new Instruction(opcode, [])
      case 0x4a: // i32.gt_s
        return new Instruction(opcode, [])
      case 0x4b: // i32.gt_u
        return new Instruction(opcode, [])
      case 0x4c: // i32.le_s
        return new Instruction(opcode, [])
      case 0x4d: // i32.le_u
        return new Instruction(opcode, [])
      case 0x4e: // i32.ge_s
        return new Instruction(opcode, [])
      case 0x4f: // i32.ge_u
        return new Instruction(opcode, [])
      case 0x50: // i64.eqz
        return new Instruction(opcode, [])
      case 0x51: // i64.eq
        return new Instruction(opcode, [])
      case 0x52: // i64.ne
        return new Instruction(opcode, [])
      case 0x53: // i64.lt_s
        return new Instruction(opcode, [])
      case 0x54: // i64.lt_u
        return new Instruction(opcode, [])
      case 0x55: // i64.gt_s
        return new Instruction(opcode, [])
      case 0x56: // i64.gt_u
        return new Instruction(opcode, [])
      case 0x57: // i64.le_s
        return new Instruction(opcode, [])
      case 0x58: // i64.le_u
        return new Instruction(opcode, [])
      case 0x59: // i64.ge_s
        return new Instruction(opcode, [])
      case 0x5a: // i64.ge_u
        return new Instruction(opcode, [])
      case 0x5b: // f32.eq
        return new Instruction(opcode, [])
      case 0x5c: // f32.ne
        return new Instruction(opcode, [])
      case 0x5d: // f32.lt
        return new Instruction(opcode, [])
      case 0x5e: // f32.gt
        return new Instruction(opcode, [])
      case 0x5f: // f32.le
        return new Instruction(opcode, [])
      case 0x60: // f32.ge
        return new Instruction(opcode, [])
      case 0x61: // f64.eq
        return new Instruction(opcode, [])
      case 0x62: // f64.ne
        return new Instruction(opcode, [])
      case 0x63: // f64.lt
        return new Instruction(opcode, [])
      case 0x64: // f64.gt
        return new Instruction(opcode, [])
      case 0x65: // f64.le
        return new Instruction(opcode, [])
      case 0x66: // f64.ge
        return new Instruction(opcode, [])
      case 0x67: // i32.clz
        return new Instruction(opcode, [])
      case 0x68: // i32.ctz
        return new Instruction(opcode, [])
      case 0x69: // i32.popcnt
        return new Instruction(opcode, [])
      case 0x6a: // i32.add
        return new Instruction(opcode, [])
      case 0x6b: // i32.sub
        return new Instruction(opcode, [])
      case 0x6c: // i32.mul
        return new Instruction(opcode, [])
      case 0x6d: // i32.div_s
        return new Instruction(opcode, [])
      case 0x6e: // i32.div_u
        return new Instruction(opcode, [])
      case 0x6f: // i32.rem_s
        return new Instruction(opcode, [])
      case 0x70: // i32.rem_u
        return new Instruction(opcode, [])
      case 0x71: // i32.and
        return new Instruction(opcode, [])
      case 0x72: // i32.or
        return new Instruction(opcode, [])
      case 0x73: // i32.xor
        return new Instruction(opcode, [])
      case 0x74: // i32.shl
        return new Instruction(opcode, [])
      case 0x75: // i32.shr_s
        return new Instruction(opcode, [])
      case 0x76: // i32.shr_u
        return new Instruction(opcode, [])
      case 0x77: // i32.rotl
        return new Instruction(opcode, [])
      case 0x78: // i32.rotr
        return new Instruction(opcode, [])
      case 0x79: // i64.clz
        return new Instruction(opcode, [])
      case 0x7a: // i64.ctz
        return new Instruction(opcode, [])
      case 0x7b: // i64.popcnt
        return new Instruction(opcode, [])
      case 0x7c: // i64.add
        return new Instruction(opcode, [])
      case 0x7d: // i64.sub
        return new Instruction(opcode, [])
      case 0x7e: // i64.mul
        return new Instruction(opcode, [])
      case 0x7f: // i64.div_s
        return new Instruction(opcode, [])
      case 0x80: // i64.div_u
        return new Instruction(opcode, [])
      case 0x81: // i64.rem_s
        return new Instruction(opcode, [])
      case 0x82: // i64.rem_u
        return new Instruction(opcode, [])
      case 0x83: // i64.and
        return new Instruction(opcode, [])
      case 0x84: // i64.or
        return new Instruction(opcode, [])
      case 0x85: // i64.xor
        return new Instruction(opcode, [])
      case 0x86: // i64.shl
        return new Instruction(opcode, [])
      case 0x87: // i64.shr_s
        return new Instruction(opcode, [])
      case 0x88: // i64.shr_u
        return new Instruction(opcode, [])
      case 0x89: // i64.rotl
        return new Instruction(opcode, [])
      case 0x8a: // i64.rotr
        return new Instruction(opcode, [])
      case 0x8b: // f32.abs
        return new Instruction(opcode, [])
      case 0x8c: // f32.neg
        return new Instruction(opcode, [])
      case 0x8d: // f32.ceil
        return new Instruction(opcode, [])
      case 0x8e: // f32.floor
        return new Instruction(opcode, [])
      case 0x8f: // f32.trunc
        return new Instruction(opcode, [])
      case 0x90: // f32.nearest
        return new Instruction(opcode, [])
      case 0x91: // f32.sqrt
        return new Instruction(opcode, [])
      case 0x92: // f32.add
        return new Instruction(opcode, [])
      case 0x93: // f32.sub
        return new Instruction(opcode, [])
      case 0x94: // f32.mul
        return new Instruction(opcode, [])
      case 0x95: // f32.div
        return new Instruction(opcode, [])
      case 0x96: // f32.min
        return new Instruction(opcode, [])
      case 0x97: // f32.max
        return new Instruction(opcode, [])
      case 0x98: // f32.copysign
        return new Instruction(opcode, [])
      case 0x99: // f64.abs
        return new Instruction(opcode, [])
      case 0x9a: // f64.neg
        return new Instruction(opcode, [])
      case 0x9b: // f64.ceil
        return new Instruction(opcode, [])
      case 0x9c: // f64.floor
        return new Instruction(opcode, [])
      case 0x9d: // f64.trunc
        return new Instruction(opcode, [])
      case 0x9e: // f64.nearest
        return new Instruction(opcode, [])
      case 0x9f: // f64.sqrt
        return new Instruction(opcode, [])
      case 0xa0: // f64.add
        return new Instruction(opcode, [])
      case 0xa1: // f64.sub
        return new Instruction(opcode, [])
      case 0xa2: // f64.mul
        return new Instruction(opcode, [])
      case 0xa3: // f64.div
        return new Instruction(opcode, [])
      case 0xa4: // f64.min
        return new Instruction(opcode, [])
      case 0xa5: // f64.max
        return new Instruction(opcode, [])
      case 0xa6: // f64.copysign
        return new Instruction(opcode, [])
      case 0xa7: // i32.wrap_i64
        return new Instruction(opcode, [])
      case 0xa8: // i32.trunc_f32_s
        return new Instruction(opcode, [])
      case 0xa9: // i32.trunc_f32_u
        return new Instruction(opcode, [])
      case 0xaa: // i32.trunc_f64_s
        return new Instruction(opcode, [])
      case 0xab: // i32.trunc_f64_u
        return new Instruction(opcode, [])
      case 0xac: // i64.extend_i32_s
        return new Instruction(opcode, [])
      case 0xad: // i64.extend_i32_u
        return new Instruction(opcode, [])
      case 0xae: // i64.trunc_f32_s
        return new Instruction(opcode, [])
      case 0xaf: // i64.trunc_f32_u
        return new Instruction(opcode, [])
      case 0xb0: // i64.trunc_f64_s
        return new Instruction(opcode, [])
      case 0xb1: // i64.trunc_f64_u
        return new Instruction(opcode, [])
      case 0xb2: // f32.convert_i32_s
        return new Instruction(opcode, [])
      case 0xb3: // f32.convert_i32_u
        return new Instruction(opcode, [])
      case 0xb4: // f32.convert_i64_s
        return new Instruction(opcode, [])
      case 0xb5: // f32.convert_i64_u
        return new Instruction(opcode, [])
      case 0xb6: // f32.demote_f64
        return new Instruction(opcode, [])
      case 0xb7: // f64.convert_i32_s
        return new Instruction(opcode, [])
      case 0xb8: // f64.convert_i32_u
        return new Instruction(opcode, [])
      case 0xb9: // f64.convert_i64_s
        return new Instruction(opcode, [])
      case 0xba: // f64.convert_i64_u
        return new Instruction(opcode, [])
      case 0xbb: // f64.promote_f32
        return new Instruction(opcode, [])
      case 0xbc: // i32.reinterpret_f32
        return new Instruction(opcode, [])
      case 0xbd: // i64.reinterpret_f64
        return new Instruction(opcode, [])
      case 0xbe: // f32.reinterpret_i32
        return new Instruction(opcode, [])
      case 0xbf: // f64.reinterpret_i64
        return new Instruction(opcode, [])
      case 0xc0: // i32.extend8_s
        return new Instruction(opcode, [])
      case 0xc1: // i32.extend16_s
        return new Instruction(opcode, [])
      case 0xc2: // i64.extend8_s
        return new Instruction(opcode, [])
      case 0xc3: // i64.extend16_s
        return new Instruction(opcode, [])
      case 0xc4: // i64.extend32_s
        return new Instruction(opcode, [])

      /**
       * Reference types
       */

      case 0xd0: // ref.null  (heaptype)
        return new Instruction(opcode, [LEB128.I33.read(cursor)])
      case 0xd1: // ref.is_null
        return new Instruction(opcode, [])
      case 0xd2: // ref.func  (funcidx)
        return new Instruction(opcode, [LEB128.U32.read(cursor)])
      case 0xd3: // ref.eq
        return new Instruction(opcode, [])
      case 0xd4: // ref.as_non_null
        return new Instruction(opcode, [])
      case 0xd5: // br_on_null  (labelidx)
        return new Instruction(opcode, [LEB128.U32.read(cursor)])
      case 0xd6: // br_on_non_null (labelidx)
        return new Instruction(opcode, [LEB128.U32.read(cursor)])

      /**
       * GC / reference instructions
       */

      case 0xfb: {
        const subopcode = LEB128.U32.read(cursor)

        switch (subopcode.value) {
          case 0: // struct.new
            return new Instruction(opcode, [subopcode, LEB128.U32.read(cursor)])
          case 1: // struct.new_default
            return new Instruction(opcode, [subopcode, LEB128.U32.read(cursor)])
          case 2: // struct.get
            return new Instruction(opcode, [subopcode, LEB128.U32.read(cursor), LEB128.U32.read(cursor)])
          case 3: // struct.get_s
            return new Instruction(opcode, [subopcode, LEB128.U32.read(cursor), LEB128.U32.read(cursor)])
          case 4: // struct.get_u
            return new Instruction(opcode, [subopcode, LEB128.U32.read(cursor), LEB128.U32.read(cursor)])
          case 5: // struct.set
            return new Instruction(opcode, [subopcode, LEB128.U32.read(cursor), LEB128.U32.read(cursor)])
          case 6: // array.new
            return new Instruction(opcode, [subopcode, LEB128.U32.read(cursor)])
          case 7: // array.new_default
            return new Instruction(opcode, [subopcode, LEB128.U32.read(cursor)])
          case 8: // array.new_fixed
            return new Instruction(opcode, [subopcode, LEB128.U32.read(cursor), LEB128.U32.read(cursor)])
          case 9: // array.new_data
            return new Instruction(opcode, [subopcode, LEB128.U32.read(cursor), LEB128.U32.read(cursor)])
          case 10: // array.new_elem
            return new Instruction(opcode, [subopcode, LEB128.U32.read(cursor), LEB128.U32.read(cursor)])
          case 11: // array.get
            return new Instruction(opcode, [subopcode, LEB128.U32.read(cursor)])
          case 12: // array.get_s
            return new Instruction(opcode, [subopcode, LEB128.U32.read(cursor)])
          case 13: // array.get_u
            return new Instruction(opcode, [subopcode, LEB128.U32.read(cursor)])
          case 14: // array.set
            return new Instruction(opcode, [subopcode, LEB128.U32.read(cursor)])
          case 15: // array.len
            return new Instruction(opcode, [subopcode])
          case 16: // array.fill
            return new Instruction(opcode, [subopcode, LEB128.U32.read(cursor)])
          case 17: // array.copy
            return new Instruction(opcode, [subopcode, LEB128.U32.read(cursor), LEB128.U32.read(cursor)])
          case 20: // ref.test
            return new Instruction(opcode, [subopcode, LEB128.I33.read(cursor)])
          case 21: // ref.test null
            return new Instruction(opcode, [subopcode, LEB128.I33.read(cursor)])
          case 22: // ref.cast
            return new Instruction(opcode, [subopcode, LEB128.I33.read(cursor)])
          case 23: // ref.cast null
            return new Instruction(opcode, [subopcode, LEB128.I33.read(cursor)])
          case 24: // br_on_cast
            return new Instruction(opcode, [subopcode, U8.read(cursor), LEB128.U32.read(cursor), LEB128.I33.read(cursor), LEB128.I33.read(cursor)])
          case 25: // br_on_cast_fail
            return new Instruction(opcode, [subopcode, U8.read(cursor), LEB128.U32.read(cursor), LEB128.I33.read(cursor), LEB128.I33.read(cursor)])
          case 26: // any.convert_extern
            return new Instruction(opcode, [subopcode])
          case 27: // extern.convert_any
            return new Instruction(opcode, [subopcode])
          case 28: // ref.i31
            return new Instruction(opcode, [subopcode])
          case 29: // i31.get_s
            return new Instruction(opcode, [subopcode])
          case 30: // i31.get_u
            return new Instruction(opcode, [subopcode])
        }

        throw new Error(`Unknown 0xFB sub-opcode 0x${subopcode.value.toString(16)}`)
      }

      /**
       * saturating trunc / bulk memory / table
       */

      case 0xfc: {
        const subopcode = LEB128.U32.read(cursor)

        switch (subopcode.value) {
          case 0x00: // i32.trunc_sat_f32_s
            return new Instruction(opcode, [subopcode])
          case 0x01: // i32.trunc_sat_f32_u
            return new Instruction(opcode, [subopcode])
          case 0x02: // i32.trunc_sat_f64_s
            return new Instruction(opcode, [subopcode])
          case 0x03: // i32.trunc_sat_f64_u
            return new Instruction(opcode, [subopcode])
          case 0x04: // i64.trunc_sat_f32_s
            return new Instruction(opcode, [subopcode])
          case 0x05: // i64.trunc_sat_f32_u
            return new Instruction(opcode, [subopcode])
          case 0x06: // i64.trunc_sat_f64_s
            return new Instruction(opcode, [subopcode])
          case 0x07: // i64.trunc_sat_f64_u
            return new Instruction(opcode, [subopcode])
          case 0x08: // memory.init (dataidx, memidx)
            return new Instruction(opcode, [subopcode, LEB128.U32.read(cursor), LEB128.U32.read(cursor)])
          case 0x09: // data.drop (dataidx)
            return new Instruction(opcode, [subopcode, LEB128.U32.read(cursor)])
          case 0x0a: // memory.copy (dst memidx, src memidx)
            return new Instruction(opcode, [subopcode, LEB128.U32.read(cursor), LEB128.U32.read(cursor)])
          case 0x0b: // memory.fill (memidx)
            return new Instruction(opcode, [subopcode, LEB128.U32.read(cursor)])
          case 0x0c: // table.init (elemidx, tableidx)
            return new Instruction(opcode, [subopcode, LEB128.U32.read(cursor), LEB128.U32.read(cursor)])
          case 0x0d: // elem.drop (elemidx)
            return new Instruction(opcode, [subopcode, LEB128.U32.read(cursor)])
          case 0x0e: // table.copy (dst tableidx, src tableidx)
            return new Instruction(opcode, [subopcode, LEB128.U32.read(cursor), LEB128.U32.read(cursor)])
          case 0x0f: // table.grow (tableidx)
            return new Instruction(opcode, [subopcode, LEB128.U32.read(cursor)])
          case 0x10: // table.size (tableidx)
            return new Instruction(opcode, [subopcode, LEB128.U32.read(cursor)])
          case 0x11: // table.fill (tableidx)
            return new Instruction(opcode, [subopcode, LEB128.U32.read(cursor)])
        }

        throw new Error(`Unknown 0xFC sub-opcode 0x${subopcode.value.toString(16)}`)
      }

      /**
       * SIMD (v128)
       */

      case 0xfd: {
        const subopcode = LEB128.U32.read(cursor)

        switch (subopcode.value) {
          case 0: // v128.load
            return new Instruction(opcode, [subopcode, LEB128.U32.read(cursor), LEB128.U32.read(cursor)])
          case 1: // v128.load8x8_s
            return new Instruction(opcode, [subopcode, LEB128.U32.read(cursor), LEB128.U32.read(cursor)])
          case 2: // v128.load8x8_u
            return new Instruction(opcode, [subopcode, LEB128.U32.read(cursor), LEB128.U32.read(cursor)])
          case 3: // v128.load16x4_s
            return new Instruction(opcode, [subopcode, LEB128.U32.read(cursor), LEB128.U32.read(cursor)])
          case 4: // v128.load16x4_u
            return new Instruction(opcode, [subopcode, LEB128.U32.read(cursor), LEB128.U32.read(cursor)])
          case 5: // v128.load32x2_s
            return new Instruction(opcode, [subopcode, LEB128.U32.read(cursor), LEB128.U32.read(cursor)])
          case 6: // v128.load32x2_u
            return new Instruction(opcode, [subopcode, LEB128.U32.read(cursor), LEB128.U32.read(cursor)])
          case 7: // v128.load8_splat
            return new Instruction(opcode, [subopcode, LEB128.U32.read(cursor), LEB128.U32.read(cursor)])
          case 8: // v128.load16_splat
            return new Instruction(opcode, [subopcode, LEB128.U32.read(cursor), LEB128.U32.read(cursor)])
          case 9: // v128.load32_splat
            return new Instruction(opcode, [subopcode, LEB128.U32.read(cursor), LEB128.U32.read(cursor)])
          case 10: // v128.load64_splat
            return new Instruction(opcode, [subopcode, LEB128.U32.read(cursor), LEB128.U32.read(cursor)])
          case 11: // v128.store
            return new Instruction(opcode, [subopcode, LEB128.U32.read(cursor), LEB128.U32.read(cursor)])
          case 12: { // v128.const — 16 raw bytes
            const bytes = new Array<U8>()

            for (let i = 0; i < 16; i++)
              bytes.push(U8.read(cursor))

            return new Instruction(opcode, [subopcode, ...bytes])
          }
          case 13: { // i8x16.shuffle — 16 lane indices
            const lanes = new Array<U8>()

            for (let i = 0; i < 16; i++)
              lanes.push(U8.read(cursor))

            return new Instruction(opcode, [subopcode, ...lanes])
          }
          case 21: // i8x16.extract_lane_s
            return new Instruction(opcode, [subopcode, U8.read(cursor)])
          case 22: // i8x16.extract_lane_u
            return new Instruction(opcode, [subopcode, U8.read(cursor)])
          case 23: // i8x16.replace_lane
            return new Instruction(opcode, [subopcode, U8.read(cursor)])
          case 24: // i16x8.extract_lane_s
            return new Instruction(opcode, [subopcode, U8.read(cursor)])
          case 25: // i16x8.extract_lane_u
            return new Instruction(opcode, [subopcode, U8.read(cursor)])
          case 26: // i16x8.replace_lane
            return new Instruction(opcode, [subopcode, U8.read(cursor)])
          case 27: // i32x4.extract_lane
            return new Instruction(opcode, [subopcode, U8.read(cursor)])
          case 28: // i32x4.replace_lane
            return new Instruction(opcode, [subopcode, U8.read(cursor)])
          case 29: // i64x2.extract_lane
            return new Instruction(opcode, [subopcode, U8.read(cursor)])
          case 30: // i64x2.replace_lane
            return new Instruction(opcode, [subopcode, U8.read(cursor)])
          case 31: // f32x4.extract_lane
            return new Instruction(opcode, [subopcode, U8.read(cursor)])
          case 32: // f32x4.replace_lane
            return new Instruction(opcode, [subopcode, U8.read(cursor)])
          case 33: // f64x2.extract_lane
            return new Instruction(opcode, [subopcode, U8.read(cursor)])
          case 34: // f64x2.replace_lane
            return new Instruction(opcode, [subopcode, U8.read(cursor)])
          case 84: // v128.load8_lane
            return new Instruction(opcode, [subopcode, LEB128.U32.read(cursor), LEB128.U32.read(cursor), U8.read(cursor)])
          case 85: // v128.load16_lane
            return new Instruction(opcode, [subopcode, LEB128.U32.read(cursor), LEB128.U32.read(cursor), U8.read(cursor)])
          case 86: // v128.load32_lane
            return new Instruction(opcode, [subopcode, LEB128.U32.read(cursor), LEB128.U32.read(cursor), U8.read(cursor)])
          case 87: // v128.load64_lane
            return new Instruction(opcode, [subopcode, LEB128.U32.read(cursor), LEB128.U32.read(cursor), U8.read(cursor)])
          case 88: // v128.store8_lane
            return new Instruction(opcode, [subopcode, LEB128.U32.read(cursor), LEB128.U32.read(cursor), U8.read(cursor)])
          case 89: // v128.store16_lane
            return new Instruction(opcode, [subopcode, LEB128.U32.read(cursor), LEB128.U32.read(cursor), U8.read(cursor)])
          case 90: // v128.store32_lane
            return new Instruction(opcode, [subopcode, LEB128.U32.read(cursor), LEB128.U32.read(cursor), U8.read(cursor)])
          case 91: // v128.store64_lane
            return new Instruction(opcode, [subopcode, LEB128.U32.read(cursor), LEB128.U32.read(cursor), U8.read(cursor)])
          case 92: // v128.load32_zero
            return new Instruction(opcode, [subopcode, LEB128.U32.read(cursor), LEB128.U32.read(cursor)])
          case 93: // v128.load64_zero
            return new Instruction(opcode, [subopcode, LEB128.U32.read(cursor), LEB128.U32.read(cursor)])

          // No-immediate SIMD ops
          case 14: // i8x16.swizzle
            return new Instruction(opcode, [subopcode])
          case 15: // i8x16.splat
            return new Instruction(opcode, [subopcode])
          case 16: // i16x8.splat
            return new Instruction(opcode, [subopcode])
          case 17: // i32x4.splat
            return new Instruction(opcode, [subopcode])
          case 18: // i64x2.splat
            return new Instruction(opcode, [subopcode])
          case 19: // f32x4.splat
            return new Instruction(opcode, [subopcode])
          case 20: // f64x2.splat
            return new Instruction(opcode, [subopcode])
          case 35: // i8x16.eq
            return new Instruction(opcode, [subopcode])
          case 36: // i8x16.ne
            return new Instruction(opcode, [subopcode])
          case 37: // i8x16.lt_s
            return new Instruction(opcode, [subopcode])
          case 38: // i8x16.lt_u
            return new Instruction(opcode, [subopcode])
          case 39: // i8x16.gt_s
            return new Instruction(opcode, [subopcode])
          case 40: // i8x16.gt_u
            return new Instruction(opcode, [subopcode])
          case 41: // i8x16.le_s
            return new Instruction(opcode, [subopcode])
          case 42: // i8x16.le_u
            return new Instruction(opcode, [subopcode])
          case 43: // i8x16.ge_s
            return new Instruction(opcode, [subopcode])
          case 44: // i8x16.ge_u
            return new Instruction(opcode, [subopcode])
          case 45: // i16x8.eq
            return new Instruction(opcode, [subopcode])
          case 46: // i16x8.ne
            return new Instruction(opcode, [subopcode])
          case 47: // i16x8.lt_s
            return new Instruction(opcode, [subopcode])
          case 48: // i16x8.lt_u
            return new Instruction(opcode, [subopcode])
          case 49: // i16x8.gt_s
            return new Instruction(opcode, [subopcode])
          case 50: // i16x8.gt_u
            return new Instruction(opcode, [subopcode])
          case 51: // i16x8.le_s
            return new Instruction(opcode, [subopcode])
          case 52: // i16x8.le_u
            return new Instruction(opcode, [subopcode])
          case 53: // i16x8.ge_s
            return new Instruction(opcode, [subopcode])
          case 54: // i16x8.ge_u
            return new Instruction(opcode, [subopcode])
          case 55: // i32x4.eq
            return new Instruction(opcode, [subopcode])
          case 56: // i32x4.ne
            return new Instruction(opcode, [subopcode])
          case 57: // i32x4.lt_s
            return new Instruction(opcode, [subopcode])
          case 58: // i32x4.lt_u
            return new Instruction(opcode, [subopcode])
          case 59: // i32x4.gt_s
            return new Instruction(opcode, [subopcode])
          case 60: // i32x4.gt_u
            return new Instruction(opcode, [subopcode])
          case 61: // i32x4.le_s
            return new Instruction(opcode, [subopcode])
          case 62: // i32x4.le_u
            return new Instruction(opcode, [subopcode])
          case 63: // i32x4.ge_s
            return new Instruction(opcode, [subopcode])
          case 64: // i32x4.ge_u
            return new Instruction(opcode, [subopcode])
          case 65: // f32x4.eq
            return new Instruction(opcode, [subopcode])
          case 66: // f32x4.ne
            return new Instruction(opcode, [subopcode])
          case 67: // f32x4.lt
            return new Instruction(opcode, [subopcode])
          case 68: // f32x4.gt
            return new Instruction(opcode, [subopcode])
          case 69: // f32x4.le
            return new Instruction(opcode, [subopcode])
          case 70: // f32x4.ge
            return new Instruction(opcode, [subopcode])
          case 71: // f64x2.eq
            return new Instruction(opcode, [subopcode])
          case 72: // f64x2.ne
            return new Instruction(opcode, [subopcode])
          case 73: // f64x2.lt
            return new Instruction(opcode, [subopcode])
          case 74: // f64x2.gt
            return new Instruction(opcode, [subopcode])
          case 75: // f64x2.le
            return new Instruction(opcode, [subopcode])
          case 76: // f64x2.ge
            return new Instruction(opcode, [subopcode])
          case 77: // v128.not
            return new Instruction(opcode, [subopcode])
          case 78: // v128.and
            return new Instruction(opcode, [subopcode])
          case 79: // v128.andnot
            return new Instruction(opcode, [subopcode])
          case 80: // v128.or
            return new Instruction(opcode, [subopcode])
          case 81: // v128.xor
            return new Instruction(opcode, [subopcode])
          case 82: // v128.bitselect
            return new Instruction(opcode, [subopcode])
          case 83: // v128.any_true
            return new Instruction(opcode, [subopcode])
          case 94: // f32x4.demote_f64x2_zero
            return new Instruction(opcode, [subopcode])
          case 95: // f64x2.promote_low_f32x4
            return new Instruction(opcode, [subopcode])
          case 96: // i8x16.abs
            return new Instruction(opcode, [subopcode])
          case 97: // i8x16.neg
            return new Instruction(opcode, [subopcode])
          case 98: // i8x16.popcnt
            return new Instruction(opcode, [subopcode])
          case 99: // i8x16.all_true
            return new Instruction(opcode, [subopcode])
          case 100: // i8x16.bitmask
            return new Instruction(opcode, [subopcode])
          case 101: // i8x16.narrow_i16x8_s
            return new Instruction(opcode, [subopcode])
          case 102: // i8x16.narrow_i16x8_u
            return new Instruction(opcode, [subopcode])
          case 103: // f32x4.ceil
            return new Instruction(opcode, [subopcode])
          case 104: // f32x4.floor
            return new Instruction(opcode, [subopcode])
          case 105: // f32x4.trunc
            return new Instruction(opcode, [subopcode])
          case 106: // f32x4.nearest
            return new Instruction(opcode, [subopcode])
          case 107: // i8x16.shl
            return new Instruction(opcode, [subopcode])
          case 108: // i8x16.shr_s
            return new Instruction(opcode, [subopcode])
          case 109: // i8x16.shr_u
            return new Instruction(opcode, [subopcode])
          case 110: // i8x16.add
            return new Instruction(opcode, [subopcode])
          case 111: // i8x16.add_sat_s
            return new Instruction(opcode, [subopcode])
          case 112: // i8x16.add_sat_u
            return new Instruction(opcode, [subopcode])
          case 113: // i8x16.sub
            return new Instruction(opcode, [subopcode])
          case 114: // i8x16.sub_sat_s
            return new Instruction(opcode, [subopcode])
          case 115: // i8x16.sub_sat_u
            return new Instruction(opcode, [subopcode])
          case 116: // f64x2.ceil
            return new Instruction(opcode, [subopcode])
          case 117: // f64x2.floor
            return new Instruction(opcode, [subopcode])
          case 118: // i8x16.min_s
            return new Instruction(opcode, [subopcode])
          case 119: // i8x16.min_u
            return new Instruction(opcode, [subopcode])
          case 120: // i8x16.max_s
            return new Instruction(opcode, [subopcode])
          case 121: // i8x16.max_u
            return new Instruction(opcode, [subopcode])
          case 123: // i8x16.avgr_u
            return new Instruction(opcode, [subopcode])
          case 124: // i16x8.extadd_pairwise_i8x16_s
            return new Instruction(opcode, [subopcode])
          case 125: // i16x8.extadd_pairwise_i8x16_u
            return new Instruction(opcode, [subopcode])
          case 126: // i32x4.extadd_pairwise_i16x8_s
            return new Instruction(opcode, [subopcode])
          case 127: // i32x4.extadd_pairwise_i16x8_u
            return new Instruction(opcode, [subopcode])
          case 128: // i16x8.abs
            return new Instruction(opcode, [subopcode])
          case 129: // i16x8.neg
            return new Instruction(opcode, [subopcode])
          case 130: // i16x8.q15mulr_sat_s
            return new Instruction(opcode, [subopcode])
          case 131: // i16x8.all_true
            return new Instruction(opcode, [subopcode])
          case 132: // i16x8.bitmask
            return new Instruction(opcode, [subopcode])
          case 133: // i16x8.narrow_i32x4_s
            return new Instruction(opcode, [subopcode])
          case 134: // i16x8.narrow_i32x4_u
            return new Instruction(opcode, [subopcode])
          case 135: // i16x8.extend_low_i8x16_s
            return new Instruction(opcode, [subopcode])
          case 136: // i16x8.extend_high_i8x16_s
            return new Instruction(opcode, [subopcode])
          case 137: // i16x8.extend_low_i8x16_u
            return new Instruction(opcode, [subopcode])
          case 138: // i16x8.extend_high_i8x16_u
            return new Instruction(opcode, [subopcode])
          case 139: // i16x8.shl
            return new Instruction(opcode, [subopcode])
          case 140: // i16x8.shr_s
            return new Instruction(opcode, [subopcode])
          case 141: // i16x8.shr_u
            return new Instruction(opcode, [subopcode])
          case 142: // i16x8.add
            return new Instruction(opcode, [subopcode])
          case 143: // i16x8.add_sat_s
            return new Instruction(opcode, [subopcode])
          case 144: // i16x8.add_sat_u
            return new Instruction(opcode, [subopcode])
          case 145: // i16x8.sub
            return new Instruction(opcode, [subopcode])
          case 146: // i16x8.sub_sat_s
            return new Instruction(opcode, [subopcode])
          case 147: // i16x8.sub_sat_u
            return new Instruction(opcode, [subopcode])
          case 149: // f64x2.trunc
            return new Instruction(opcode, [subopcode])
          case 150: // i16x8.mul
            return new Instruction(opcode, [subopcode])
          case 151: // i16x8.min_s
            return new Instruction(opcode, [subopcode])
          case 152: // i16x8.min_u
            return new Instruction(opcode, [subopcode])
          case 153: // i16x8.max_s
            return new Instruction(opcode, [subopcode])
          case 154: // i16x8.max_u
            return new Instruction(opcode, [subopcode])
          case 155: // i16x8.avgr_u
            return new Instruction(opcode, [subopcode])
          case 156: // i16x8.extmul_low_i8x16_s
            return new Instruction(opcode, [subopcode])
          case 157: // i16x8.extmul_high_i8x16_s
            return new Instruction(opcode, [subopcode])
          case 158: // i16x8.extmul_low_i8x16_u
            return new Instruction(opcode, [subopcode])
          case 159: // i16x8.extmul_high_i8x16_u
            return new Instruction(opcode, [subopcode])
          case 160: // i32x4.abs
            return new Instruction(opcode, [subopcode])
          case 161: // i32x4.neg
            return new Instruction(opcode, [subopcode])
          case 163: // i32x4.all_true
            return new Instruction(opcode, [subopcode])
          case 164: // i32x4.bitmask
            return new Instruction(opcode, [subopcode])
          case 167: // i32x4.extend_low_i16x8_s
            return new Instruction(opcode, [subopcode])
          case 168: // i32x4.extend_high_i16x8_s
            return new Instruction(opcode, [subopcode])
          case 169: // i32x4.extend_low_i16x8_u
            return new Instruction(opcode, [subopcode])
          case 170: // i32x4.extend_high_i16x8_u
            return new Instruction(opcode, [subopcode])
          case 171: // i32x4.shl
            return new Instruction(opcode, [subopcode])
          case 172: // i32x4.shr_s
            return new Instruction(opcode, [subopcode])
          case 173: // i32x4.shr_u
            return new Instruction(opcode, [subopcode])
          case 174: // i32x4.add
            return new Instruction(opcode, [subopcode])
          case 177: // i32x4.sub
            return new Instruction(opcode, [subopcode])
          case 181: // i32x4.mul
            return new Instruction(opcode, [subopcode])
          case 182: // i32x4.min_s
            return new Instruction(opcode, [subopcode])
          case 183: // i32x4.min_u
            return new Instruction(opcode, [subopcode])
          case 184: // i32x4.max_s
            return new Instruction(opcode, [subopcode])
          case 185: // i32x4.max_u
            return new Instruction(opcode, [subopcode])
          case 186: // i32x4.dot_i16x8_s
            return new Instruction(opcode, [subopcode])
          case 188: // i32x4.extmul_low_i16x8_s
            return new Instruction(opcode, [subopcode])
          case 189: // i32x4.extmul_high_i16x8_s
            return new Instruction(opcode, [subopcode])
          case 190: // i32x4.extmul_low_i16x8_u
            return new Instruction(opcode, [subopcode])
          case 191: // i32x4.extmul_high_i16x8_u
            return new Instruction(opcode, [subopcode])
          case 192: // i64x2.abs
            return new Instruction(opcode, [subopcode])
          case 193: // i64x2.neg
            return new Instruction(opcode, [subopcode])
          case 195: // i64x2.all_true
            return new Instruction(opcode, [subopcode])
          case 196: // i64x2.bitmask
            return new Instruction(opcode, [subopcode])
          case 199: // i64x2.extend_low_i32x4_s
            return new Instruction(opcode, [subopcode])
          case 200: // i64x2.extend_high_i32x4_s
            return new Instruction(opcode, [subopcode])
          case 201: // i64x2.extend_low_i32x4_u
            return new Instruction(opcode, [subopcode])
          case 202: // i64x2.extend_high_i32x4_u
            return new Instruction(opcode, [subopcode])
          case 203: // i64x2.shl
            return new Instruction(opcode, [subopcode])
          case 204: // i64x2.shr_s
            return new Instruction(opcode, [subopcode])
          case 205: // i64x2.shr_u
            return new Instruction(opcode, [subopcode])
          case 206: // i64x2.add
            return new Instruction(opcode, [subopcode])
          case 209: // i64x2.sub
            return new Instruction(opcode, [subopcode])
          case 213: // i64x2.mul
            return new Instruction(opcode, [subopcode])
          case 214: // i64x2.eq
            return new Instruction(opcode, [subopcode])
          case 215: // i64x2.ne
            return new Instruction(opcode, [subopcode])
          case 216: // i64x2.lt_s
            return new Instruction(opcode, [subopcode])
          case 217: // i64x2.gt_s
            return new Instruction(opcode, [subopcode])
          case 218: // i64x2.le_s
            return new Instruction(opcode, [subopcode])
          case 219: // i64x2.ge_s
            return new Instruction(opcode, [subopcode])
          case 220: // i64x2.extmul_low_i32x4_s
            return new Instruction(opcode, [subopcode])
          case 221: // i64x2.extmul_high_i32x4_s
            return new Instruction(opcode, [subopcode])
          case 222: // i64x2.extmul_low_i32x4_u
            return new Instruction(opcode, [subopcode])
          case 223: // i64x2.extmul_high_i32x4_u
            return new Instruction(opcode, [subopcode])
          case 224: // f32x4.abs
            return new Instruction(opcode, [subopcode])
          case 225: // f32x4.neg
            return new Instruction(opcode, [subopcode])
          case 227: // f32x4.sqrt
            return new Instruction(opcode, [subopcode])
          case 228: // f32x4.add
            return new Instruction(opcode, [subopcode])
          case 229: // f32x4.sub
            return new Instruction(opcode, [subopcode])
          case 230: // f32x4.mul
            return new Instruction(opcode, [subopcode])
          case 231: // f32x4.div
            return new Instruction(opcode, [subopcode])
          case 232: // f32x4.min
            return new Instruction(opcode, [subopcode])
          case 233: // f32x4.max
            return new Instruction(opcode, [subopcode])
          case 234: // f32x4.pmin
            return new Instruction(opcode, [subopcode])
          case 235: // f32x4.pmax
            return new Instruction(opcode, [subopcode])
          case 236: // f64x2.abs
            return new Instruction(opcode, [subopcode])
          case 237: // f64x2.neg
            return new Instruction(opcode, [subopcode])
          case 239: // f64x2.sqrt
            return new Instruction(opcode, [subopcode])
          case 240: // f64x2.add
            return new Instruction(opcode, [subopcode])
          case 241: // f64x2.sub
            return new Instruction(opcode, [subopcode])
          case 242: // f64x2.mul
            return new Instruction(opcode, [subopcode])
          case 243: // f64x2.div
            return new Instruction(opcode, [subopcode])
          case 244: // f64x2.min
            return new Instruction(opcode, [subopcode])
          case 245: // f64x2.max
            return new Instruction(opcode, [subopcode])
          case 246: // f64x2.pmin
            return new Instruction(opcode, [subopcode])
          case 247: // f64x2.pmax
            return new Instruction(opcode, [subopcode])
          case 248: // i32x4.trunc_sat_f32x4_s
            return new Instruction(opcode, [subopcode])
          case 249: // i32x4.trunc_sat_f32x4_u
            return new Instruction(opcode, [subopcode])
          case 250: // f32x4.convert_i32x4_s
            return new Instruction(opcode, [subopcode])
          case 251: // f32x4.convert_i32x4_u
            return new Instruction(opcode, [subopcode])
          case 252: // i32x4.trunc_sat_f64x2_s_zero
            return new Instruction(opcode, [subopcode])
          case 253: // i32x4.trunc_sat_f64x2_u_zero
            return new Instruction(opcode, [subopcode])
          case 254: // f64x2.convert_low_i32x4_s
            return new Instruction(opcode, [subopcode])
          case 255: // f64x2.convert_low_i32x4_u
            return new Instruction(opcode, [subopcode])
        }

        throw new Error(`Unknown 0xFD sub-opcode ${subopcode.value}`)
      }

      /**
       * Atomics
       */

      case 0xfe: {
        const subopcode = LEB128.U32.read(cursor)

        switch (subopcode.value) {
          case 0x00: // memory.atomic.notify
            return new Instruction(opcode, [subopcode, LEB128.U32.read(cursor), LEB128.U32.read(cursor)])
          case 0x01: // memory.atomic.wait32
            return new Instruction(opcode, [subopcode, LEB128.U32.read(cursor), LEB128.U32.read(cursor)])
          case 0x02: // memory.atomic.wait64
            return new Instruction(opcode, [subopcode, LEB128.U32.read(cursor), LEB128.U32.read(cursor)])
          case 0x03: // atomic.fence
            return new Instruction(opcode, [subopcode])

          case 0x10: // i32.atomic.load
            return new Instruction(opcode, [subopcode, LEB128.U32.read(cursor), LEB128.U32.read(cursor)])
          case 0x11: // i64.atomic.load
            return new Instruction(opcode, [subopcode, LEB128.U32.read(cursor), LEB128.U32.read(cursor)])
          case 0x12: // i32.atomic.load8_u
            return new Instruction(opcode, [subopcode, LEB128.U32.read(cursor), LEB128.U32.read(cursor)])
          case 0x13: // i32.atomic.load16_u
            return new Instruction(opcode, [subopcode, LEB128.U32.read(cursor), LEB128.U32.read(cursor)])
          case 0x14: // i64.atomic.load8_u
            return new Instruction(opcode, [subopcode, LEB128.U32.read(cursor), LEB128.U32.read(cursor)])
          case 0x15: // i64.atomic.load16_u
            return new Instruction(opcode, [subopcode, LEB128.U32.read(cursor), LEB128.U32.read(cursor)])
          case 0x16: // i64.atomic.load32_u
            return new Instruction(opcode, [subopcode, LEB128.U32.read(cursor), LEB128.U32.read(cursor)])

          case 0x17: // i32.atomic.store
            return new Instruction(opcode, [subopcode, LEB128.U32.read(cursor), LEB128.U32.read(cursor)])
          case 0x18: // i64.atomic.store
            return new Instruction(opcode, [subopcode, LEB128.U32.read(cursor), LEB128.U32.read(cursor)])
          case 0x19: // i32.atomic.store8
            return new Instruction(opcode, [subopcode, LEB128.U32.read(cursor), LEB128.U32.read(cursor)])
          case 0x1a: // i32.atomic.store16
            return new Instruction(opcode, [subopcode, LEB128.U32.read(cursor), LEB128.U32.read(cursor)])
          case 0x1b: // i64.atomic.store8
            return new Instruction(opcode, [subopcode, LEB128.U32.read(cursor), LEB128.U32.read(cursor)])
          case 0x1c: // i64.atomic.store16
            return new Instruction(opcode, [subopcode, LEB128.U32.read(cursor), LEB128.U32.read(cursor)])
          case 0x1d: // i64.atomic.store32
            return new Instruction(opcode, [subopcode, LEB128.U32.read(cursor), LEB128.U32.read(cursor)])

          case 0x1e: // i32.atomic.rmw.add
            return new Instruction(opcode, [subopcode, LEB128.U32.read(cursor), LEB128.U32.read(cursor)])
          case 0x1f: // i64.atomic.rmw.add
            return new Instruction(opcode, [subopcode, LEB128.U32.read(cursor), LEB128.U32.read(cursor)])
          case 0x20: // i32.atomic.rmw8.add_u
            return new Instruction(opcode, [subopcode, LEB128.U32.read(cursor), LEB128.U32.read(cursor)])
          case 0x21: // i32.atomic.rmw16.add_u
            return new Instruction(opcode, [subopcode, LEB128.U32.read(cursor), LEB128.U32.read(cursor)])
          case 0x22: // i64.atomic.rmw8.add_u
            return new Instruction(opcode, [subopcode, LEB128.U32.read(cursor), LEB128.U32.read(cursor)])
          case 0x23: // i64.atomic.rmw16.add_u
            return new Instruction(opcode, [subopcode, LEB128.U32.read(cursor), LEB128.U32.read(cursor)])
          case 0x24: // i64.atomic.rmw32.add_u
            return new Instruction(opcode, [subopcode, LEB128.U32.read(cursor), LEB128.U32.read(cursor)])

          case 0x25: // i32.atomic.rmw.sub
            return new Instruction(opcode, [subopcode, LEB128.U32.read(cursor), LEB128.U32.read(cursor)])
          case 0x26: // i64.atomic.rmw.sub
            return new Instruction(opcode, [subopcode, LEB128.U32.read(cursor), LEB128.U32.read(cursor)])
          case 0x27: // i32.atomic.rmw8.sub_u
            return new Instruction(opcode, [subopcode, LEB128.U32.read(cursor), LEB128.U32.read(cursor)])
          case 0x28: // i32.atomic.rmw16.sub_u
            return new Instruction(opcode, [subopcode, LEB128.U32.read(cursor), LEB128.U32.read(cursor)])
          case 0x29: // i64.atomic.rmw8.sub_u
            return new Instruction(opcode, [subopcode, LEB128.U32.read(cursor), LEB128.U32.read(cursor)])
          case 0x2a: // i64.atomic.rmw16.sub_u
            return new Instruction(opcode, [subopcode, LEB128.U32.read(cursor), LEB128.U32.read(cursor)])
          case 0x2b: // i64.atomic.rmw32.sub_u
            return new Instruction(opcode, [subopcode, LEB128.U32.read(cursor), LEB128.U32.read(cursor)])

          case 0x2c: // i32.atomic.rmw.and
            return new Instruction(opcode, [subopcode, LEB128.U32.read(cursor), LEB128.U32.read(cursor)])
          case 0x2d: // i64.atomic.rmw.and
            return new Instruction(opcode, [subopcode, LEB128.U32.read(cursor), LEB128.U32.read(cursor)])
          case 0x2e: // i32.atomic.rmw8.and_u
            return new Instruction(opcode, [subopcode, LEB128.U32.read(cursor), LEB128.U32.read(cursor)])
          case 0x2f: // i32.atomic.rmw16.and_u
            return new Instruction(opcode, [subopcode, LEB128.U32.read(cursor), LEB128.U32.read(cursor)])
          case 0x30: // i64.atomic.rmw8.and_u
            return new Instruction(opcode, [subopcode, LEB128.U32.read(cursor), LEB128.U32.read(cursor)])
          case 0x31: // i64.atomic.rmw16.and_u
            return new Instruction(opcode, [subopcode, LEB128.U32.read(cursor), LEB128.U32.read(cursor)])
          case 0x32: // i64.atomic.rmw32.and_u
            return new Instruction(opcode, [subopcode, LEB128.U32.read(cursor), LEB128.U32.read(cursor)])

          case 0x33: // i32.atomic.rmw.or
            return new Instruction(opcode, [subopcode, LEB128.U32.read(cursor), LEB128.U32.read(cursor)])
          case 0x34: // i64.atomic.rmw.or
            return new Instruction(opcode, [subopcode, LEB128.U32.read(cursor), LEB128.U32.read(cursor)])
          case 0x35: // i32.atomic.rmw8.or_u
            return new Instruction(opcode, [subopcode, LEB128.U32.read(cursor), LEB128.U32.read(cursor)])
          case 0x36: // i32.atomic.rmw16.or_u
            return new Instruction(opcode, [subopcode, LEB128.U32.read(cursor), LEB128.U32.read(cursor)])
          case 0x37: // i64.atomic.rmw8.or_u
            return new Instruction(opcode, [subopcode, LEB128.U32.read(cursor), LEB128.U32.read(cursor)])
          case 0x38: // i64.atomic.rmw16.or_u
            return new Instruction(opcode, [subopcode, LEB128.U32.read(cursor), LEB128.U32.read(cursor)])
          case 0x39: // i64.atomic.rmw32.or_u
            return new Instruction(opcode, [subopcode, LEB128.U32.read(cursor), LEB128.U32.read(cursor)])

          case 0x3a: // i32.atomic.rmw.xor
            return new Instruction(opcode, [subopcode, LEB128.U32.read(cursor), LEB128.U32.read(cursor)])
          case 0x3b: // i64.atomic.rmw.xor
            return new Instruction(opcode, [subopcode, LEB128.U32.read(cursor), LEB128.U32.read(cursor)])
          case 0x3c: // i32.atomic.rmw8.xor_u
            return new Instruction(opcode, [subopcode, LEB128.U32.read(cursor), LEB128.U32.read(cursor)])
          case 0x3d: // i32.atomic.rmw16.xor_u
            return new Instruction(opcode, [subopcode, LEB128.U32.read(cursor), LEB128.U32.read(cursor)])
          case 0x3e: // i64.atomic.rmw8.xor_u
            return new Instruction(opcode, [subopcode, LEB128.U32.read(cursor), LEB128.U32.read(cursor)])
          case 0x3f: // i64.atomic.rmw16.xor_u
            return new Instruction(opcode, [subopcode, LEB128.U32.read(cursor), LEB128.U32.read(cursor)])
          case 0x40: // i64.atomic.rmw32.xor_u
            return new Instruction(opcode, [subopcode, LEB128.U32.read(cursor), LEB128.U32.read(cursor)])

          case 0x41: // i32.atomic.rmw.xchg
            return new Instruction(opcode, [subopcode, LEB128.U32.read(cursor), LEB128.U32.read(cursor)])
          case 0x42: // i64.atomic.rmw.xchg
            return new Instruction(opcode, [subopcode, LEB128.U32.read(cursor), LEB128.U32.read(cursor)])
          case 0x43: // i32.atomic.rmw8.xchg_u
            return new Instruction(opcode, [subopcode, LEB128.U32.read(cursor), LEB128.U32.read(cursor)])
          case 0x44: // i32.atomic.rmw16.xchg_u
            return new Instruction(opcode, [subopcode, LEB128.U32.read(cursor), LEB128.U32.read(cursor)])
          case 0x45: // i64.atomic.rmw8.xchg_u
            return new Instruction(opcode, [subopcode, LEB128.U32.read(cursor), LEB128.U32.read(cursor)])
          case 0x46: // i64.atomic.rmw16.xchg_u
            return new Instruction(opcode, [subopcode, LEB128.U32.read(cursor), LEB128.U32.read(cursor)])
          case 0x47: // i64.atomic.rmw32.xchg_u
            return new Instruction(opcode, [subopcode, LEB128.U32.read(cursor), LEB128.U32.read(cursor)])

          case 0x48: // i32.atomic.rmw.cmpxchg
            return new Instruction(opcode, [subopcode, LEB128.U32.read(cursor), LEB128.U32.read(cursor)])
          case 0x49: // i64.atomic.rmw.cmpxchg
            return new Instruction(opcode, [subopcode, LEB128.U32.read(cursor), LEB128.U32.read(cursor)])
          case 0x4a: // i32.atomic.rmw8.cmpxchg_u
            return new Instruction(opcode, [subopcode, LEB128.U32.read(cursor), LEB128.U32.read(cursor)])
          case 0x4b: // i32.atomic.rmw16.cmpxchg_u
            return new Instruction(opcode, [subopcode, LEB128.U32.read(cursor), LEB128.U32.read(cursor)])
          case 0x4c: // i64.atomic.rmw8.cmpxchg_u
            return new Instruction(opcode, [subopcode, LEB128.U32.read(cursor), LEB128.U32.read(cursor)])
          case 0x4d: // i64.atomic.rmw16.cmpxchg_u
            return new Instruction(opcode, [subopcode, LEB128.U32.read(cursor), LEB128.U32.read(cursor)])
          case 0x4e: // i64.atomic.rmw32.cmpxchg_u
            return new Instruction(opcode, [subopcode, LEB128.U32.read(cursor), LEB128.U32.read(cursor)])
        }

        throw new Error(`Unknown 0xFE sub-opcode 0x${subopcode.value.toString(16)}`)
      }
    }

    throw new Error(`Unknown opcode 0x${opcode.toString(16).padStart(2, "0")}`)
  }

}

export namespace LEB128 {

  export class U64 {

    constructor(
      public value: bigint
    ) { }

    size(): number {
      let size = 0

      let value = this.value

      do {
        let byte = Number(value & 0x7Fn)

        value >>= 7n

        if (value !== 0n)
          byte |= 0x80

        size += 1
      } while (value !== 0n)

      return size
    }

    write(cursor: Cursor) {
      let value = this.value

      do {
        let byte = Number(value & 0x7Fn)

        value >>= 7n

        if (value !== 0n)
          byte |= 0x80

        cursor.writeUint8(byte)
      } while (value !== 0n)
    }

  }

  export namespace U64 {

    export function read(cursor: Cursor): U64 {
      let value = 0n
      let shift = 0n

      let byte: number

      do {
        byte = cursor.readUint8()

        value |= (BigInt(byte & 0x7F) << shift)

        shift += 7n

        continue
      } while ((byte & 0x80) && (shift < 70n))

      if (value > (2n ** 64n - 1n))
        throw new Error(`Value exceeds U64 range`)

      return new U64(value)
    }

  }

  export class I64 {

    constructor(
      public value: bigint
    ) { }

    size(): number {
      let size = 0

      let value = this.value

      let more = true

      while (more) {
        let byte = Number(value & 0x7Fn)

        value >>= 7n

        if ((value === 0n && (byte & 0x40) === 0) || (value === -1n && (byte & 0x40) !== 0)) {
          more = false
        } else {
          byte |= 0x80
        }

        size += 1
      }

      return size
    }

    write(cursor: Cursor) {
      let value = this.value

      let more = true

      while (more) {
        let byte = Number(value & 0x7Fn)

        value >>= 7n

        if ((value === 0n && (byte & 0x40) === 0) || (value === -1n && (byte & 0x40) !== 0)) {
          more = false
        } else {
          byte |= 0x80
        }

        cursor.writeUint8(byte)
      }
    }

  }

  export namespace I64 {

    export function read(cursor: Cursor): I64 {
      let value = 0n
      let shift = 0n

      let byte: number

      do {
        byte = cursor.readUint8()

        value |= (BigInt(byte & 0x7F) << shift)

        shift += 7n

        continue
      } while ((byte & 0x80) && (shift < 70n))

      if (byte & 0x40)
        value |= (-1n << shift)

      if (value > (2n ** 63n - 1n))
        throw new Error(`Value exceeds I64 range`)

      return new I64(value)
    }

  }

  export class U32 {

    constructor(
      public value: number
    ) { }

    size(): number {
      let size = 0

      let value = BigInt(this.value)

      do {
        let byte = Number(value & 0x7Fn)

        value >>= 7n

        if (value !== 0n)
          byte |= 0x80

        size += 1
      } while (value !== 0n)

      return size
    }

    write(cursor: Cursor) {
      let value = BigInt(this.value)

      do {
        let byte = Number(value & 0x7Fn)

        value >>= 7n

        if (value !== 0n)
          byte |= 0x80

        cursor.writeUint8(byte)
      } while (value !== 0n)
    }

  }

  export namespace U32 {

    export function read(cursor: Cursor): U32 {
      let value = 0n
      let shift = 0n

      let byte: number

      do {
        byte = cursor.readUint8()

        value |= (BigInt(byte & 0x7F) << shift)

        shift += 7n

        continue
      } while ((byte & 0x80) && (shift < 70n))

      if (value > ((2n ** 32n) - 1n))
        throw new Error(`Value exceeds U32 range`)

      return new U32(Number(value))
    }

  }

  export class I32 {

    constructor(
      public value: number
    ) { }

    size(): number {
      let size = 0

      let value = BigInt(this.value)

      let more = true

      while (more) {
        let byte = Number(value & 0x7Fn)

        value >>= 7n

        if ((value === 0n && (byte & 0x40) === 0) || (value === -1n && (byte & 0x40) !== 0)) {
          more = false
        } else {
          byte |= 0x80
        }

        size += 1
      }

      return size
    }

    write(cursor: Cursor) {
      let value = BigInt(this.value)

      let more = true

      while (more) {
        let byte = Number(value & 0x7Fn)

        value >>= 7n

        if ((value === 0n && (byte & 0x40) === 0) || (value === -1n && (byte & 0x40) !== 0)) {
          more = false
        } else {
          byte |= 0x80
        }

        cursor.writeUint8(byte)
      }
    }

  }

  export namespace I32 {

    export function read(cursor: Cursor): I32 {
      let value = 0n
      let shift = 0n

      let byte: number

      do {
        byte = cursor.readUint8()

        value |= (BigInt(byte & 0x7F) << shift)

        shift += 7n

        continue
      } while ((byte & 0x80) && (shift < 70n))

      if (byte & 0x40)
        value |= (-1n << shift)

      if (value > (2n ** 31n - 1n))
        throw new Error(`Value exceeds I32 range`)

      return new I32(Number(value))
    }

  }

  export class I33 {

    constructor(
      public value: number
    ) { }

    size(): number {
      let size = 0

      let value = BigInt(this.value)

      let more = true

      while (more) {
        let byte = Number(value & 0x7Fn)

        value >>= 7n

        if ((value === 0n && (byte & 0x40) === 0) || (value === -1n && (byte & 0x40) !== 0)) {
          more = false
        } else {
          byte |= 0x80
        }

        size += 1
      }

      return size
    }

    write(cursor: Cursor) {
      let value = BigInt(this.value)

      let more = true

      while (more) {
        let byte = Number(value & 0x7Fn)

        value >>= 7n

        if ((value === 0n && (byte & 0x40) === 0) || (value === -1n && (byte & 0x40) !== 0)) {
          more = false
        } else {
          byte |= 0x80
        }

        cursor.writeUint8(byte)
      }
    }

  }

  export namespace I33 {

    export function read(cursor: Cursor): I33 {
      let value = 0n
      let shift = 0n

      let byte: number

      do {
        byte = cursor.readUint8()

        value |= (BigInt(byte & 0x7F) << shift)

        shift += 7n

        continue
      } while ((byte & 0x80) && (shift < 70n))

      if (byte & 0x40)
        value |= (-1n << shift)

      if (value > ((2n ** 32n) - 1n))
        throw new Error(`Value exceeds I33 range`)

      return new I33(Number(value))
    }

  }

}

export class U8 {

  constructor(
    public value: number
  ) { }

  size(): number {
    return 1
  }

  write(cursor: Cursor) {
    cursor.writeUint8(this.value)
  }

}

export namespace U8 {

  export function read(cursor: Cursor): U8 {
    return new U8(cursor.readUint8())
  }

}

export class F32 {

  constructor(
    public value: number
  ) { }

  size(): number {
    return 4
  }

  write(cursor: Cursor) {
    cursor.writeFloat32(this.value, true)
  }

}

export namespace F32 {

  export function read(cursor: Cursor): F32 {
    return new F32(cursor.readFloat32(true))
  }

}

export class F64 {

  constructor(
    public value: number
  ) { }

  size(): number {
    return 8
  }

  write(cursor: Cursor) {
    cursor.writeFloat64(this.value, true)
  }

}

export namespace F64 {

  export function read(cursor: Cursor): F64 {
    return new F64(cursor.readFloat64(true))
  }

}