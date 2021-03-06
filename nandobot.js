const { token, channelId, riotAPIKey, players, gameVersion } = require('./config.json');
const axios = require('axios')
const { Client, Intents, MessageEmbed } = require('discord.js');
const quickDB = require('quick.db');
const bot = new Client({ intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_VOICE_STATES, Intents.FLAGS.GUILD_MESSAGES] })

bot.login(token);

var checkminutes = 1, checkthe_interval = checkminutes * 60 * 1000;
var stopRequesting = false;

setInterval(async function () {

  players.forEach(async function (player, index) {
    setTimeout(async () => { await GetLastMatchFromPlayerAndSendDiscordMessage(player); }, 1000 * index);
  });

}, checkthe_interval);



async function GetLastMatchFromPlayerAndSendDiscordMessage(name) {
  try {
    if (stopRequesting)
      return;

    var puuid = await GetPuuid(name);
    var lastMatch = await GetLastMatchId(puuid);
    var lastMatchStored = await quickDB.get(`${name}.lastMatchId`);

    if (lastMatchStored == lastMatch)
      return;

    var lastMatchInfo = await GetMatchInfo(lastMatch);
    var participantInfo = await GetParticipantData(lastMatchInfo, puuid);

    await quickDB.set(`${name}.lastMatchId`, lastMatch);

    var win = participantInfo.win ? "ganhou" : "perdeu";
    var winColor = participantInfo.win ? "#238ce1" : "#ca2527";
    var champion = participantInfo.championName;
    var kda = `${participantInfo.kills}/${participantInfo.deaths}/${participantInfo.assists}`
    var mainItem = participantInfo.challenges.mythicItemUsed;
    var gameMode = lastMatchInfo.info.gameMode.replace("CLASSIC", "Normal");
    var endTime = lastMatchInfo.info.gameEndTimestamp;
    var duration = FormatSecondsToMinutes(lastMatchInfo.info.gameDuration);
    var channel = bot.channels.cache.get(channelId);

    const gameVersion = (await axios.get("https://ddragon.leagueoflegends.com/api/versions.json")).data[0];

    const embedMessage = new MessageEmbed()
      .setColor(winColor)
      .setTitle(name)
      .setDescription(`Jogou de ${champion} e ${win}!`)
      .setThumbnail(`http://ddragon.leagueoflegends.com/cdn/${gameVersion}/img/champion/${champion}.png`)
      .addFields(
        { name: 'KDA', value: kda, inline: true },
        { name: 'Dura????o', value: duration, inline: true },
        { name: 'Modo', value: gameMode, inline: true },
        { name: 'Dano Total', value: participantInfo.totalDamageDealt.toString(), inline: true },
        { name: 'Cura Total', value: participantInfo.totalHeal.toString(), inline: true })
      .setTimestamp(new Date(endTime))
      .setURL(`https://blitz.gg/lol/match/br1/${encodeURIComponent(name)}/${lastMatch.replace("BR1_","")}`);

    if (mainItem > 0)
      embedMessage.setFooter({ text: 'Item M??tico', iconURL: `http://ddragon.leagueoflegends.com/cdn/${gameVersion}/img/item/${mainItem}.png` });

    if (gameMode == "Normal") {
      var position = FormatStringIntoTitleCase(participantInfo.teamPosition.replace("UTILITY", "SUPORTE").replace("MIDDLE", "MID"));
      embedMessage.addFields({ name: 'Posi????o', value: position, inline: true })
    }

    await channel.send({ embeds: [embedMessage] });
  }
  catch (exception) {
    console.log(exception);

    if (exception.message.includes("403")) {
      var channel = bot.channels.cache.get(channelId);
      await channel.send("API Key inv??lida. Bot desativado.");
      stopRequesting = true;
    }
  }
}


async function GetPuuid(name) {
  var puuid = await quickDB.get(`${name}.puuid`);
  if (puuid != undefined)
    return puuid;

  var uri = `https://br1.api.riotgames.com/lol/summoner/v4/summoners/by-name/${name}?api_key=${riotAPIKey}`;
  const response = await axios.get(uri)
  puuid = response.data.puuid;

  await quickDB.set(`${name}.puuid`, puuid);

  return puuid;
}

async function GetLastMatchId(puuid) {
  var uri = `https://americas.api.riotgames.com/lol/match/v5/matches/by-puuid/${puuid}/ids?start=0&count=1&api_key=${riotAPIKey}`;
  const response = await axios.get(uri)

  return response.data[0];
}

async function GetMatchInfo(matchId) {
  var uri = `https://americas.api.riotgames.com/lol/match/v5/matches/${matchId}?api_key=${riotAPIKey}`;
  const response = await axios.get(uri)
  return response.data;
}

function GetParticipantData(matchInfo, puuid) {
  var participantIndex = matchInfo.metadata.participants.indexOf(puuid);

  if (participantIndex == undefined)
    return;

  var participant = matchInfo.info.participants[participantIndex];

  if (participant == undefined)
    return;

  return participant;
}

function FormatSecondsToMinutes(s) { return (s - (s %= 60)) / 60 + (9 < s ? ':' : ':0') + s }

function FormatStringIntoTitleCase(string) {
  return string[0].toUpperCase() + string.slice(1).toLowerCase();
}
