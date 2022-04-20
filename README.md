# Nandobot
Nandobot is a simple discord bot that publishes the last League of Legends match results of selected players on a text channel.

Every minute it fetches the last match of each player registered on the config file, and if it's a new match, the following message will be sent:

![image](https://user-images.githubusercontent.com/82987034/159039059-7497e287-9494-40f8-8ac5-d3e0a1168379.png)

Use yarn and run nandobot.js with NodeJS to host the bot.


The configuration is done on a config.json file. You need to have your own Discord Bot token and Riot API keys to use it. 

{
	"token": "discordtoken",
	"channelId": "channelid",
	"riotAPIKey": "riotapikey",
	"players": ["Player1", "Player2"],
	"gameVersion" : "12.5.1"
}
