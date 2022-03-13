# Nandobot
Nandobot is a simple discord bot that publishes the last match results of selected players on a text channel.

Every minute it fetches the last match of each player registered on the config file, and if it's a new match, the following message will be sent:

![image](https://user-images.githubusercontent.com/82987034/158078207-76825d4a-57aa-4aac-9d15-a828560c9d5f.png)

The configuration is done on a config.json file

{
	"token": "discordtoken",
	"channelId": "channelid",
	"riotAPIKey": "riotapikey",
	"players": ["Player1", "Player2"]
}
