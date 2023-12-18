import { EventResult, SignifyClient } from 'signify-ts';
import {
    getOrCreateClients,
    getOrCreateContact,
    getOrCreateIdentifier,
} from './utils/test-setup';
import { waitOperation } from './utils/test-util';

let client1: SignifyClient, client2: SignifyClient;
let name1_id: string, name1_oobi: string;
let contact1_id: string;

beforeAll(async () => {
    [client1, client2] = await getOrCreateClients(2);
});
beforeAll(async () => {
    [name1_id, name1_oobi] = await getOrCreateIdentifier(client1, 'name1');
});
beforeAll(async () => {
    contact1_id = await getOrCreateContact(client2, 'contact1', name1_oobi);
});

interface KeyState {
    i: string;
    s: string;
    [property: string]: any;
}

async function getKeyState(
    client: SignifyClient,
    aid: string
): Promise<KeyState> {
    const keyState: KeyState[] = await client.keyStates().get(name1_id);
    expect(keyState).toHaveLength(1);
    return keyState[0];
}

describe('singlesig-ixn', () => {
    test('step1', async () => {
        expect(name1_id).toEqual(contact1_id);
        const local = await getKeyState(client1, name1_id);
        const remote = await getKeyState(client2, name1_id);
        // local and remote keystate sequence match
        expect(local.s).toEqual(remote.s);
    });
    test('ixn1', async () => {
        // local: keystate before ixn
        const local0 = await getKeyState(client1, name1_id);
        expect(local0).not.toBeNull();
        // remote: keystate before ixn
        const remote0 = await getKeyState(client2, name1_id);
        expect(remote0).not.toBeNull();
        // local and remote keystate match
        expect(local0.s).toEqual(remote0.s);

        const IXNS = 2;
        for (let i = 0; i < IXNS; i++) {
            // local: ixn #n
            const result: EventResult = await client1
                .identifiers()
                .interact('name1', {});
            await waitOperation(client1, await result.op());
        }

        // local: keystate after ixn
        const local1 = await getKeyState(client1, name1_id);
        expect(parseInt(local1.s)).toBeGreaterThan(0);
        // local: sequence has incremented
        expect(parseInt(local1.s)).toEqual(parseInt(local0.s) + IXNS);

        // remote: keystate after ixn
        const remote1 = await getKeyState(client2, name1_id);
        // remote: keystate is behind
        expect(parseInt(remote1.s)).toEqual(parseInt(local1.s) - IXNS);

        // remote: refresh keystate
        let op = await client2
            .keyStates()
            .query(contact1_id, parseInt(remote1.s) + 1, undefined);
        op = await waitOperation(client2, op);

        // remote: keystate after refresh
        const remote2 = await getKeyState(client2, name1_id);
        // local and remote keystate match
        expect(remote2.s).toEqual(local1.s);
    });
});
