import express from 'express'
import './database/db.js'
import { db } from './database/db.js'
const baseaddress = "/shui/api"

const app = express()
const PORT = 3000
app.use(express.json())

app.get(baseaddress + "/channels", (req, res) => {
    db.all(`
        SELECT channel_id, channel_name, username as owner FROM channels
        JOIN users ON channels.owner = users.user_id
        `, (err, rows) => {
        if(err) res.status(err.statusCode || 500).json({success: false, msg: err.message})
        res.status(200).json({success: true, data: rows})
    })
})

app.get(baseaddress + "/channels/user", (req, res) => {
    console.log(req.body.userId)
    db.all(`
        SELECT channels.channel_id, channels.channel_name, users.username as owner FROM subscriptions
        JOIN channels ON subscriptions.channel_id = channels.channel_id
        JOIN users ON subscriptions.user_id = users.user_id
        WHERE users.user_id = ?
        `,
        [req.body.userId],
         (err, rows) => {
        if(err) res.status(err.statusCode || 500).json({success: false, msg: err.message})
        res.status(200).json({success: true, data: rows})
    })
})

app.post(baseaddress + "/channels/create", (req, res) => {
    db.run(`
        INSERT INTO channels (channel_name, owner) VALUES (?, ?)
        `,
        [req.body.channelName, req.body.userId],
         (err) => {
        if(err) res.status(err.statusCode || 500).json({success: false, msg: err.message})
        res.status(201).json({success: true, msg: "Channel created."})
    })
})

app.post(baseaddress + "/channels/subscribe", (req, res) => {
    db.run(`
        INSERT INTO subscriptions (user_id, channel_id) VALUES (?, ?)
        `,
        [req.body.userId, req.body.channelId],
         (err) => {
        if(err) res.status(err.statusCode || 500).json({success: false, msg: err.message})
        res.status(201).json({success: true, msg: "Subscription added."})
    })
})

app.get(baseaddress + "/channels/messgaes", (req, res) => { // kanalId
    // hämta alla meddelanden i en kanal
})

app.post(baseaddress + "/channels/messages/create", (req, res) => { // userID, title, text, channelIDArray
    // skapa meddelande
})

app.listen(PORT, () => {
    console.log('Listening to port ' + PORT)
})