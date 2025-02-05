import { strict as assert } from "assert";

let signify: any;
const url = "http://127.0.0.1:3901"
const boot_url = "http://127.0.0.1:3903"

// @ts-ignore
import('signify-ts').then(
    (module) => {
        signify = module
        signify.ready().then(() => {
            console.log("*** Starting CHALLENGE test ***");
            run().then(() => {
                console.log("*** Test complete ***")
            });
        });
    }
)

async function run() {
    
    // Boot two clients
    const bran1 = signify.randomPasscode()
    const bran2 = signify.randomPasscode()
    const client1 = new signify.SignifyClient(url, bran1, signify.Tier.low, boot_url);
    const client2 = new signify.SignifyClient(url, bran2, signify.Tier.low, boot_url);
    await client1.boot()
    await client2.boot()
    await client1.connect()
    await client2.connect()
    const state1 = await client1.state()
    const state2 = await client2.state()
    console.log("Client 1 connected. Client AID:",state1.controller.state.i,"Agent AID: ", state1.agent.i)
    console.log("Client 2 connected. Client AID:",state2.controller.state.i,"Agent AID: ", state2.agent.i)

    // Generate challenge words
    const challenge1_small = await client1.challenges().generate(128)
    assert.equal(challenge1_small.words.length, 12)
    const challenge1_big = await client1.challenges().generate(256)
    assert.equal(challenge1_big.words.length, 24)

    // Create two identifiers, one for each client
    let op1 = await client1.identifiers().create('alice',  {
        toad: 3,
        wits: [
            "BBilc4-L3tFUnfM_wJr4S4OJanAv_VmF_dJNN6vkf2Ha",
            "BLskRTInXnMxWaGqcpSyMgo0nYbalW99cGZESrz3zapM",
            "BIKKuvBwpmDVA4Ds-EpL5bt9OqPzWPja2LigFYZN2YfX"]
        })
    while (!op1["done"] ) {
            op1 = await client1.operations().get(op1.name);
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
    const aid1 = op1['response']
    await client1.identifiers().addEndRole("alice", 'agent', client1!.agent!.pre)
    console.log("Alice's AID:", aid1.i)

    let op2 = await client2.identifiers().create('bob',  {
        toad: 3,
        wits: [
            "BBilc4-L3tFUnfM_wJr4S4OJanAv_VmF_dJNN6vkf2Ha",
            "BLskRTInXnMxWaGqcpSyMgo0nYbalW99cGZESrz3zapM",
            "BIKKuvBwpmDVA4Ds-EpL5bt9OqPzWPja2LigFYZN2YfX"]
        })
    while (!op2["done"] ) {
            op2 = await client2.operations().get(op2.name);
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
    const aid2 = op2['response']
    await client2.identifiers().addEndRole("bob", 'agent', client2!.agent!.pre)
    console.log("Bob's AID:", aid2.i)

    // Exchenge OOBIs
    let oobi1 = await client1.oobis().get("alice","agent")
    let oobi2 = await client2.oobis().get("bob","agent")
    
    op1 = await client1.oobis().resolve(oobi2.oobis[0],"bob")
    while (!op1["done"]) {
        op1 = await client1.operations().get(op1.name);
        await new Promise(resolve => setTimeout(resolve, 1000));
    }
    console.log("Client 1 resolved Bob's OOBI")
    op2 = await client2.oobis().resolve(oobi1.oobis[0],"alice")
    while (!op2["done"]) {
        op2 = await client2.operations().get(op2.name);
        await new Promise(resolve => setTimeout(resolve, 1000));
    }
    console.log("Client 2 resolved Alice's OOBI")

    // List Client 1 contacts
    let contacts1 = await client1.contacts().list()
    assert.equal(contacts1.length,1)
    assert.equal(contacts1[0].alias,'bob')

    // Bob responds to Alice challenge
    await client2.challenges().respond('bob', aid1.i, challenge1_small.words)
    console.log("Bob responded to Alice challenge with signed words")

    // Alice check response, compare challenge words and accept the challenge
    let challenge_received = false
    let contacts:any = []
    while (!challenge_received) {
        contacts = await client1.contacts().list(undefined, undefined, undefined)
        if (contacts[0].challenges.length > 0 ){
            assert.equal(JSON.stringify(contacts[0].challenges[0].words), JSON.stringify(challenge1_small.words))
            challenge_received = true
        }
        await new Promise(resolve => setTimeout(resolve, 1000)); // sleep for 1 second
    }
    await client1.challenges().accept('alice', aid2.i, contacts[0].challenges[0].said)

    // Check Bob's challenge in conctats
    contacts1 = await client1.contacts().list()
    assert.equal(contacts1[0].challenges[0].authenticated, true)
    console.log("Challenge authenticated")

}