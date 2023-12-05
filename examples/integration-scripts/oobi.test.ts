import { CreateIdentiferArgs, EventResult, SignifyClient } from 'signify-ts';
import {
    getOrCreateClients,
    getOrCreateIdentifier,
    hasEndRole,
} from './utils/test-setup';
import { resolveEnvironment } from './utils/resolve-env';
import { waitOperation } from './utils/test-util';

let client1: SignifyClient, client2: SignifyClient, client3: SignifyClient;
let name1_id: string, name1_oobi: string;
let name2_id: string, name2_oobi: string;

beforeAll(async () => {
    [client1, client2, client3] = await getOrCreateClients(3);
});
beforeAll(async () => {
    [name1_id, name1_oobi] = await getOrCreateIdentifier(client1, 'name1');
    // name2 with empty witness configuration
    [name2_id, name2_oobi] = await getOrCreateIdentifier(client1, 'name2', {});
});

describe('oobi-test', () => {
    test('step1', async () => {
        let identifier;
        try {
            identifier = await client1.identifiers().get('name3');
        } catch {
            const env = resolveEnvironment();
            let kargs: CreateIdentiferArgs = {
                toad: env.witnessIds.length,
                wits: env.witnessIds,
            };
            const result: EventResult = await client1
                .identifiers()
                .create('name3', kargs);
            let op = await result.op();
            op = await waitOperation(client1, op);
            identifier = await client1.identifiers().get('name3');
        }
        expect(parseInt(identifier.state.bt)).toEqual(3);
        expect(
            await hasEndRole(client1, 'name3', 'agent', client1.agent?.pre!)
        ).toEqual(false);
    });
    test('name1-agent-oobi', async () => {
        let oobi = await client1.oobis().get('name1', 'agent');
        expect(oobi.oobis).toHaveLength(1);
        let op = await client2.oobis().resolve(oobi.oobis[0], 'contact1');
        op = await waitOperation(client2, op);
    });
    test('name1-witness-oobi', async () => {
        let oobi = await client1.oobis().get('name1', 'witness');
        expect(oobi.oobis).toHaveLength(3);
        let op = await client3.oobis().resolve(oobi.oobis[0], 'contact1');
        op = await waitOperation(client3, op);
    });
    test('name2-agent-oobi', async () => {
        let oobi = await client1.oobis().get('name2', 'agent');
        expect(oobi.oobis).toHaveLength(1);
        let op = await client2.oobis().resolve(oobi.oobis[0], 'contact2');
        op = await waitOperation(client2, op);
    });
    test('name2-witness-oobi', async () => {
        let oobi = await client1.oobis().get('name2', 'witness');
        // name2 was created with no witness config, oobis is empty
        expect(oobi.oobis).toHaveLength(0);
    });
    test('name3-agent-oobi', async () => {
        let oobi = await client1.oobis().get('name3', 'agent');
        // name3 was created with no agent role, oobis is empty
        expect(oobi.oobis).toHaveLength(0);
    });
    test('name3-oobi', async () => {
        let oobi = await client1.oobis().get('name3', 'witness');
        expect(oobi.oobis).toHaveLength(3);
        let op = await client2.oobis().resolve(oobi.oobis[0], 'contact3');
        op = await waitOperation(client2, op);
    });
});
