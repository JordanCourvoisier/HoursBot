const { Client, Intents, MessageEmbed } = require('discord.js');
const fs = require('fs');
const client = new Client({ intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES] });
var sqlite3 = require('sqlite3').verbose();
var db = new sqlite3.Database('./main.db');
require('dotenv').config();
client.login('OTY3OTgyNjE2MDY0MTk2NjQ5.YmYODw.AFt5TQ8er-vwiw-h9lJ84h61g3I');

client.on("ready", async () => { 
    console.log("Ready"); 

});

///// CHANGE TO CORRECT ROLE
client.on('message', async (message) => {
    if (message.content.toLowerCase().startsWith("!w") && message.content.toLowerCase().endsWith("m")){
        let mins = parseInt(message.content.substring(2,message.content.length));
        
        if(!mins){
            message.channel.send({content: 'Please enter a valid number'});
            return;
        }

        if(mins <= 0) message.channel.send({content: 'Please enter a value above 0'});

        let uid = message.author.id;
        let workerExists = await inTable(uid);
        if(workerExists){
            console.log("in table");
            let currMins = await getMinutes(uid);
            deleteHours(uid);
            insert(uid, currMins + mins, message.author.tag);
        } 
        else {
            console.log("not in table");
            insert(uid, mins, message.author.tag);
        }

    }
   
    else if (message.content.toLowerCase().startsWith("!w")) {
        let hours = parseInt(message.content.substring(2,message.content.length));
        
        if(!hours){
            message.channel.send({content: 'Please enter a valid number'});
            return;
        }

        if(hours <= 0){
            message.channel.send({content: 'Please enter a value above 0'});
            return;
        } 

        let uid = message.author.id;
        let workerExists = await inTable(uid);
        if(workerExists){
            console.log("in table");
            let mins = await getMinutes(uid);
            deleteHours(uid);
            insert(uid, (hours * 60) + mins, message.author.tag);
        } 
        else {
            console.log("not in table");
            insert(uid, hours * 60, message.author.tag);
        }
    }   
    
    else if (message.content.toLowerCase().startsWith("!h_all")) {
        let arrTag = await slcAllTag();
        let arrMins = await slcAllHours();
        let Data = "";
        const embedMSG = new MessageEmbed()

        for(let x = 0; x < arrTag.length; x++){
            Data = "";
            Data += "Has worked ";
            Data += toHours(arrMins[x]);
            Data += "hours ";
            Data += arrMins[x] - 60 * toHours(arrMins[x]);
            Data += 'minutes \n';
            embedMSG.addFields( { name: `${arrTag[x]}`, value: Data } );
        }
         message.channel.send({ embeds: [embedMSG] });
    }

    else if (message.content.toLowerCase().startsWith("!h_reset")) {
        let arrTag = await slcAllTag();
        let arrMins = await slcAllHours();
        let Data = "";

        for(let x = 0; x < arrTag.length; x++){
            Data += arrTag[x];
            Data += "  =  ";
            Data += toHours(arrMins[x]);
            Data += ":";
            Data += arrMins[x] - 60 * toHours(arrMins[x]);
            Data += '\n';
        }

        fs.writeFile('PreviousWeek.txt', Data, err => {
            if (err) {
              console.error(err)
              return
            }
          })

          deleteHoursAll();
    }

    else if (message.content.toLowerCase().startsWith("!h")) {
        if(message.mentions.users.first() === undefined){
            message.channel.send({content: "Mention a user to get hours"});
            return;
        }

        let uid = message.mentions.users.first().id;
        let mins = 0;
        let hours = 0;

        if(!inTable(uid)) message.channel.send({content: `${message.mentions.users.first()} has no recorded hours`});
        await getMinutes(uid).then(min => mins = min);
        for(mins; mins >= 60; mins -= 60){ hours++ ;}

        const embedMSG = new MessageEmbed()
        .addFields( { name: `${message.mentions.users.first().tag}`, value: 'Has worked ' + hours + ' hours and ' + mins + " minutes." } ) 

        message.channel.send({ embeds: [embedMSG] });
    }



});

function toHours(mins){
    let hours = 0;
    for(mins; mins >= 60; mins -= 60) hours++;
    return hours;
}

async function getMinutes(id){
    return await new Promise((resolve, reject) => {
        db.all('SELECT * FROM employees where UID = ?', [id], (err, rows) => {
            rows.forEach((row) => {
                resolve(row.minutes_worked);
            });
        });
    }) 
};

async function insert(UID, minutes, tag) {
    return await new Promise(() => {
        db.run("insert into employees (UID, minutes_worked, tag) values (?,?,?)", [UID,minutes, tag], (err) => {console.log("Insert error?: " + err)});
    })
}

async function slcAllTag(){
    let sql = 'SELECT * FROM employees'; 
    let arr = [];
    let x = 0;
    return await new Promise((resolve, reject) => {
        db.all(sql, [], (err, rows) => {
            rows.forEach((row) => {
                arr[x] = row.tag;
                x++;
                resolve(arr);
            });
        });
    }) 
}

async function slcAllHours(){
    let sql = 'SELECT * FROM employees'; 
    let arr = [];
    let x = 0;
    return await new Promise((resolve, reject) => {
        db.all(sql, [], (err, rows) => {
            rows.forEach((row) => {
                arr[x] = row.minutes_worked;
                x++;
                resolve(arr);
            });
        });
    }) 
}

// Checks if table is empty
async function inTable(id){
    let sql = 'SELECT * FROM employees WHERE UID = ?'; 
    return await new Promise((resolve, reject) => {
        db.get(sql, [id], (err, row) => {
            resolve(row !== undefined);
        });
    })
}

function deleteHours(id) {
    db.run(`DELETE FROM employees WHERE UID = ?`, [id], function(err) {
        if (err) {
            return console.error(err.message);
        }
        console.log("Deleted");
    });
}

function deleteHoursAll(id) {
    db.run(`DELETE FROM employees`, [id], function(err) {
        if (err) {
            return console.error(err.message);
        }
        console.log("Deleted all");
    });
}
