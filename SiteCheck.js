const { Client, GatewayIntentBits, PermissionsBitField } = require('discord.js');

const axios = require('axios');
require('dotenv').config();

// 클라이언트 생성
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildMessageReactions,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers
    ], });

const channelId = '1322482658911060059'; // 메시지를 보낼 디스코드 채널 ID
const manageChannelId = '1322482366454693969'; //봇을 관리할 디스코드 채널 ID
const roleReactionMap = {
    '👍': '1300141994563080353', // 👍 이모지 -> 역할 ID
    '🔥': '1322482440995868762', // 🔥 이모지 -> 역할 ID
};


const CHANNEL_NAME = '역할 부여'; // 생성할 채널 이름
client.on('messageCreate', async (message) => {
    // 봇 자신의 메시지는 무시
    if (message.author.bot) return;
    if (message.channel.id !== manageChannelId) return;

    // 특정 명령어 확인
    if (message.content === "!채널생성") {
        const guild = message.guild;

        try {
            // 채널 생성
            const channel = await guild.channels.create({
                name: CHANNEL_NAME,
                type: 0, // 텍스트 채널
                permissionOverwrites: [
                    {
                        id: guild.roles.everyone.id, // @everyone 역할
                        deny: [PermissionsBitField.Flags.SendMessages], // 채팅 금지
                    },
                    {
                        id: guild.members.me.id, // 봇의 사용자 ID
                        allow: [PermissionsBitField.Flags.SendMessages], // 봇에게 메시지 전송 허용
                    },
                ],
            });
            console.log(`채널 '${CHANNEL_NAME}'이 생성되었습니다.`);

            // 채널에 메시지 전송
            const msg = await channel.send('이모지를 눌러 역할을 선택하세요! 👍: 길드 멤버로 참가, 🔥: 홍보사이트활성 멘션 받기');

            // 메시지에 이모지 추가
            await msg.react('👍');
            await msg.react('🔥');
            console.log('이모지가 메시지에 추가되었습니다.');

            // 원래 채널에 완료 메시지 전송
            message.channel.send(`채널 '${CHANNEL_NAME}'이 생성되었습니다.`);
        } catch (error) {
            console.error('채널 생성 또는 메시지 처리 중 오류 발생:', error);
            message.channel.send('채널 생성 중 오류가 발생했습니다.');
        }
    }
});

client.on('messageReactionAdd', async (reaction, user) => {
    // 봇 자신의 반응은 무시
    if (user.bot) return;

    // 메시지 및 이모지 확인
    const emoji = reaction.emoji.name;
    const roleId = roleReactionMap[emoji];

    if (!roleId) return; // 매핑되지 않은 이모지면 무시

    try {
        const guild = reaction.message.guild;
        const member = await guild.members.fetch(user.id); // 사용자 정보 가져오기

        if (member) {
            const hasRole = member.roles.cache.has(roleId); // 역할 존재 여부 확인

            if (hasRole) {
                console.log(`역할 부여 스킵: ${user.username} -> 이미 ${roleId} 역할 보유`);
                return; // 이미 역할이 있다면 작업 중단
            }

            await member.roles.add(roleId); // 역할 부여
            console.log(`역할 부여 성공: ${user.username} -> ${roleId}`);
        }
    } catch (error) {
        console.error('역할 부여 중 오류 발생:', error);
    }
});

client.on('messageReactionRemove', async (reaction, user) => {
    // 봇 자신의 반응은 무시
    if (user.bot) return;

    // 메시지 및 이모지 확인
    const emoji = reaction.emoji.name;
    const roleId = roleReactionMap[emoji];

    if (!roleId) return; // 매핑되지 않은 이모지면 무시

    try {
        const guild = reaction.message.guild;
        const member = await guild.members.fetch(user.id); // 사용자 정보 가져오기

        if (member) {
            await member.roles.remove(roleId); // 역할 제거
            console.log(`역할 제거 성공: ${user.username} -> ${roleId}`);
        }
    } catch (error) {
        console.error('역할 제거 중 오류 발생:', error);
    }
});

// 봇이 준비되었을 때 실행

const TOKEN = process.env.DISCORD_TOKEN;

client.once('ready', () => {
    console.log('봇이 실행되었습니다!');
    let lastSentDate = "";
    // 1분마다 실행
    setInterval(async () => {
        const channel = client.channels.cache.get(channelId);
        const now = new Date();
        const today = now.toLocaleString({undefined, timeZone: 'Asia/Seoul' }).split(',')[0]; // YYYY-MM-DD 형식의 오늘 날짜

        if (!channel || !channel.isTextBased()) {
            console.log('올바른 텍스트 채널을 찾을 수 없습니다.');
            return;
        }

        const url1 = 'https://toto-go.com'; // 접속을 확인할 사이트 URL
        const url2 = 'https://todayzo.com'; // 접속을 확인할 사이트 URL
        const url3 = 'https://lintoday.me'; // 접속을 확인할 사이트 URL
        const url4 = 'https://ariaworld.net'; // 접속을 확인할 사이트 URL
        const urls = [url1, url2, url3]
        const results = [];
        const channelName = [];

        // URL 체크
        channelName.push(`홍보`);
        for (const url of urls) {
            try {
                const response = await axios.head(url, {
                    headers: { 'User-Agent': 'Mozilla/5.0' },
                    timeout: 20000,
                });
                //console.log(`[${new Date().toISOString()}] ${url.replace(/^https?:\/\//, '')} 접속 성공:`, response.status);
                results.push(`✅ ${url.replace(/^https?:\/\//, '')} 접속 성공`);
                channelName.push(`✅`);
            } catch (error) {
                //console.log(`[${new Date().toISOString()}] ${url.replace(/^https?:\/\//, '')} 접속 실패:`, error.message);
                results.push(`❌ ${url.replace(/^https?:\/\//, '')} 접속 실패!`);
                channelName.push(`❌`);
            }
        }
        const threadUrl = `https://discord.com/channels/1300018885764059166/1321864208836595813`;

        results.push(`홍보기 다운 링크 [클릭하세요](${threadUrl})`)

        if ((channel.name == channelName.join('')) && (today != lastSentDate)) {
            if (channel) {
                try {
                    await channel.send(`[${today}] <@&${roleReactionMap['🔥']}> 현재 ${now.toLocaleString(undefined, { timeZone: 'Asia/Seoul' })} 모든 홍보 사이트가 정상 동작합니다.`);
                    console.log('역할 멘션 메시지가 전송되었습니다.');
                } catch (error) {
                    console.error('메시지 전송 중 오류 발생:', error);
                }
            } else {
                console.log('올바른 채널을 찾을 수 없습니다.');
            }
            lastSentDate = today; // 메시지 발송 날짜 기록
        }

        try {
            // 채널의 모든 메시지 가져오기
            const messages = await channel.messages.fetch({ limit: 100 }); // 최대 100개까지 가져옴
            if (channel) {
                const message = results.join('\n'); // 결과를 줄바꿈으로 연결
                await channel.send(message);
            } else {
                console.log('올바른 채널을 찾을 수 없습니다.');
            }
            // 모든 메시지 삭제
            for (const message of messages.values()) {
                if (message.content.startsWith(`[${today}]`))
                    continue;
                await message.delete();
            }

        } catch (error) {
            console.error('메시지 처리 중 오류 발생:', error);
        }

        try {
            if(channel){
                await channel.setName(channelName.join(''));
            }
        }
        catch (error) {
            console.error('메시지 처리 중 오류 발생:', error);
        }

        // 결과를 한 번에 채널에 전송
    }, 10000); // 60000ms = 1분
});

// 봇 로그인
client.login(process.env.DISCORD_TOKEN); // 디스코드 개발자 포털에서 복사한 토큰 입력
