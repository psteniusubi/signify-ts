export class Buffer {
    static from(value: Uint8Array): Uint8Array {
        throw new Error("not implemented");
    }
    static concat(values: Uint8Array[]): Uint8Array {
        throw new Error("not implemented");
    }
}

/*
export class TextEncoder {
    encode(value: string): Uint8Array {
        throw new Error("not implemented");
    }
}

export class TextDecoder {
    decode(value: Uint8Array): string {
        throw new Error("not implemented");
    }
}
*/

export class Base64 {
    static encode(value: Uint8Array): string {
        throw new Error("not implemented");
    }
    static decode(value: string): Uint8Array {
        throw new Error("not implemented");
    }
}