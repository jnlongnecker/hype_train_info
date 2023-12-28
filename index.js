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
    updateDonation(msg);
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
    if (msg.message.bits_spent == 0) return;

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

    bitterInfo.bits += msg.message.bits_spent;
    chatInfo.totalBits += msg.message.bits_spent;

    chatInfo.chatters[msg.commenter.name] = bitterInfo;
}

function updateDonation(msg) {
    let body = msg.message.body;
    let isTier1 = body.includes('Tier 1');
    let isTier2 = body.includes('Tier 2');
    let isTier3 = body.includes('Tier 3');
    let isDuplicateMsg = body.includes("AdmiralBahroo's community");

    if ((!isTier1 && !isTier2 && !isTier3) || isDuplicateMsg) {
        return;
    }
    if (isTier1) chatInfo.total1Subs += 1;
    if (isTier2) chatInfo.total2Subs += 1;
    if (isTier3) chatInfo.total3Subs += 1;

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

    let isGifted = body.includes('gifted');
    if (isGifted) {
        let sections = body.split(' ');
        let recipient = sections[sections.length - 2].split('!')[0];
        chatInfo.gifted.push(recipient);

        if (isTier1) subberInfo.tier1Gifted += 1;
        if (isTier2) subberInfo.tier2Gifted += 1;
        if (isTier3) subberInfo.tier3Gifted += 1;
    } else {
        if (isTier1) subberInfo.tier = 1;
        if (isTier2) subberInfo.tier = 2;
        if (isTier3) subberInfo.tier = 3;
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