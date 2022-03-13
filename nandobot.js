const { token, channelId, riotAPIKey, players } = require('./config.json');
const axios = require('axios')
const { Client, Intents } = require('discord.js');
const quickDB = require('quick.db');
const bot = new Client({ intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_VOICE_STATES, Intents.FLAGS.GUILD_MESSAGES] })

bot.login(token);

var checkminutes = 1, checkthe_interval = checkminutes * 60 * 1000;

setInterval(async function () {

  players.forEach(async function (player) {
    await GetLastMatchFromPlayer(player);
  });

}, checkthe_interval);



async function GetLastMatchFromPlayer(name) {
  try {
    var puuid = await GetPuuid(name);
    var lastMatch = await GetLastMatchId(puuid);
    var lastMatchStored = quickDB.get(`${name}.lastMatchId`);

    if (lastMatchStored == lastMatch)
      return;

    var lastMatchInfo = await GetMatchInfo(lastMatch);
    var participantInfo = await GetParticipantData(lastMatchInfo, puuid);

    await quickDB.set(name, { lastMatchId: lastMatch });

    var win = participantInfo.win ? "ganhou" : "perdeu";
    var champion = participantInfo.championName;
    var kda = `${participantInfo.kills}/${participantInfo.deaths}/${participantInfo.assists}`

    var message = `${name} jogou de ${champion} e ${win}! KDA: ${kda}`;

    var channel = bot.channels.cache.get(channelId);
    channel.send(message);
  }
  catch (exception) {
    console.log(exception);
  }
}


async function GetPuuid(name) {
  var uri = `https://br1.api.riotgames.com/lol/summoner/v4/summoners/by-name/${name}?api_key=${riotAPIKey}`;
  const response = await axios.get(uri)
  return response.data.puuid;
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
