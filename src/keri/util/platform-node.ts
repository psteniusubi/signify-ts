export const Buffer = globalThis.Buffer;

import { toUint8Array, fromUint8Array } from "js-base64";

export class Base64 {
    static encode(value: Uint8Array): string {
        return fromUint8Array(value, true);
    }
    static decode(value: string): Uint8Array {
        return Buffer.from(toUint8Array(value).buffer);
    }
}

import { TextEncoder, TextDecoder } from "util";

export class Utf8 {
    static encode(value?: string): Uint8Array {
        return new TextEncoder().encode(value);
    }
    static decode(value?: Uint8Array): string {
        return new TextDecoder().decode(value);
    }
}
