const fs = require('node:fs');

const rawChat = JSON.parse(fs.readFileSync('raw_chat.json', 'utf8'));
let chatInfo = {
    chatters: {},
    subbers: [],
    gifted: [],
    bitters: [],
    totalBits: 0,
    total1Subs: 0,
    total2Subs: 0,
    total3Subs: 0,
    messages: 0,
    uniqueChatters: 0,
};

for (let msg of rawChat.comments) {
    chatInfo.messages += 1;
    updateChatterInfo(msg);
    updateSubscription(msg);
    updateGifted(msg);
    updateHitByGift(msg);
    updateBits(msg);
}

countSubbers();
countBitters();

fs.writeFile('chat_info.json', JSON.stringify(chatInfo, null, 4), err => {
    if (err) {
        console.error(err);
    }
});

logContributors();

console.log(`There were a total of ${chatInfo.subbers.length} chatters who subscribed or gifted subs.`);
console.log(`There were a total of ${chatInfo.bitters.length} chatters who donated bits.`);
console.log(`There were a total of ${chatInfo.gifted.length} chatters who were hit by gifted subs.`);

function updateBits(msg) {
    let bitterInfo = chatInfo.chatters[msg.commenter.name];
    if (!bitterInfo) {
        bitterInfo = {
            name: msg.commenter.name,
            displayName: msg.commenter.display_name,
            messages: 0,
            tier: undefined,
            tier1Gifted: 0,
            tier2Gifted: 0,
            tier3Gifted: 0,
            bits: 0,
        }
    }

    let actualBits = 0;
    let words = msg.message.body.split(' ');
    for (let word of words) {
        if (!word.includes("Cheer")) continue;

        let bits = Number(word.split("Cheer")[1]);
        if (bits) {
            actualBits += bits;
        }
    }

    bitterInfo.bits += actualBits;
    chatInfo.totalBits += actualBits;

    chatInfo.chatters[msg.commenter.name] = bitterInfo;
}

function updateHitByGift(msg) {
    let isGiftLog = msg.message.body.includes(' gifted a Tier ');
    if (!isGiftLog) return;

    let words = msg.message.body.split('!')[0].split(' ');
    let giftedName = words[words.length - 1];
    chatInfo.gifted.push(giftedName);
}

function updateGifted(msg) {
    let body = msg.message.body;
    let isGifted = body.includes(' is gifting ') && body.includes("AdmiralBahroo's community");

    if (!isGifted) return;
    let isTier1 = body.includes('Tier 1');
    let isTier2 = body.includes('Tier 2');
    let isTier3 = body.includes('Tier 3');
    let numSubs = Number(body.split(' is gifting ')[1].split(' ')[0]);

    if (!numSubs) return;

    let subberInfo = chatInfo.chatters[msg.commenter.name];
    if (!subberInfo) {
        subberInfo = {
            name: msg.commenter.name,
            displayName: msg.commenter.display_name,
            messages: 0,
            tier: undefined,
            tier1Gifted: 0,
            tier2Gifted: 0,
            tier3Gifted: 0,
            bits: 0,
        }
    }

    if (isTier1) {
        subberInfo.tier1Gifted += numSubs;
        chatInfo.total1Subs += numSubs;
    }
    if (isTier2) {
        subberInfo.tier2Gifted += numSubs;
        chatInfo.total2Subs += numSubs;
    }
    if (isTier3) {
        subberInfo.tier3Gifted += numSubs;
        chatInfo.total3Subs += numSubs;
    }
    chatInfo.chatters[msg.commenter.name] = subberInfo;
}

function updateSubscription(msg) {
    let body = msg.message.body;

    let didSub = body.includes(' subscribed at Tier ') || body.includes(' subscribed with Prime ');
    if (!didSub) return;

    let isTier1 = body.includes('Tier 1') || body.includes('subscribed with Prime');
    let isTier2 = body.includes('Tier 2');
    let isTier3 = body.includes('Tier 3');

    if ((!isTier1 && !isTier2 && !isTier3)) {
        return;
    }

    let subberInfo = chatInfo.chatters[msg.commenter.name];
    if (!subberInfo) {
        subberInfo = {
            name: msg.commenter.name,
            displayName: msg.commenter.display_name,
            messages: 0,
            tier: undefined,
            tier1Gifted: 0,
            tier2Gifted: 0,
            tier3Gifted: 0,
            bits: 0,
        }
    }

    if (isTier1) {
        chatInfo.total1Subs += 1;
        subberInfo.tier = 1;
    }
    if (isTier2) {
        chatInfo.total2Subs += 1;
        subberInfo.tier = 2;
    }
    if (isTier3) {
        chatInfo.total3Subs += 1;
        subberInfo.tier = 3;
    }

    chatInfo.chatters[msg.commenter.name] = subberInfo;
}

function updateChatterInfo(msg) {
    let commenterInfo = chatInfo.chatters[msg.commenter.name];
    if (!commenterInfo) {
        commenterInfo = {
            name: msg.commenter.name,
            displayName: msg.commenter.display_name,
            messages: 0,
            tier: undefined,
            tier1Gifted: 0,
            tier2Gifted: 0,
            tier3Gifted: 0,
            bits: 0,
        };
    }
    commenterInfo.messages += 1;
    chatInfo.chatters[msg.commenter.name] = commenterInfo;
}

function countSubbers() {
    for (let chatterName in chatInfo.chatters) {
        chatInfo.uniqueChatters += 1;
        let chatter = chatInfo.chatters[chatterName];
        if (chatter.tier || chatter.tier1Gifted || chatter.tier2Gifted || chatter.tier3Gifted) {
            chatInfo.subbers.push(chatter.displayName);
        }
    }
}

function countBitters() {
    for (let chatterName in chatInfo.chatters) {
        let chatter = chatInfo.chatters[chatterName];
        if (chatter.bits > 0) {
            chatInfo.bitters.push(chatter.displayName);
        }
    }
}

function logContributors() {
    let names = "";
    for (let chatterName in chatInfo.chatters) {
        let chatter = chatInfo.chatters[chatterName];
        if (chatter.tier || chatter.tier1Gifted || chatter.tier2Gifted || chatter.tier3Gifted || chatter.bits > 0) {
            names += chatter.displayName + '\n';
        }
    }
    fs.writeFile('contributors.txt', names, err => {
        if (err) {
            console.error(err);
        }
    });
}