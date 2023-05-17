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

app.get(baseaddress + "/channels/messages", (req, res) => {
    let sort = 'DESC'
    if(req.query.sort === 'oldest') sort = 'ASC'
    db.all(`
        SELECT * FROM messages_channels
        JOIN messages ON messages_channels.message_id = messages.message_id
        WHERE messages_channels.channel_id = ?
        ORDER BY createdAt ${sort}
        `,
        [req.body.channelId],
        (err, rows) => {
        if(err) res.status(err.statusCode || 500).json({success: false, msg: err.message})
        res.status(200).json({
            success: true,
            data: rows.map(item => ({...item, createdAt: new Date(item.createdAt).toLocaleString()}))
        })
    })
})

app.post(baseaddress + "/channels/messages/create", (req, res) => {
    db.all(`
        SELECT * FROM subscriptions
        WHERE user_id = ?
        `,
        [req.body.userId],
        (err, rows) => {
        if(err) res.status(err.statusCode || 500).json({success: false, msg: err.message})
        let channels = rows.map(row => row.channel_id)
        let channelsToPostTo  = req.body.channels.filter(item => channels.includes(item))
        if(channelsToPostTo.length !== 0) {
            db.run(`
                INSERT INTO messages (user_id, title, text, createdAt)
                VALUES (?, ?, ?, ?)
            `, [req.body.userId, req.body.title, req.body.text, Date.now()],
            function(err) {
                if(err) res.status(err.statusCode || 500).json({success: false, msg: err.message})
                for(let i = 0; i < channelsToPostTo.length; i++) {
                    db.run(`
                        INSERT INTO messages_channels (message_id, channel_id)
                        VALUES (?, ?)
                    `,
                    [this.lastID, channelsToPostTo[i]],
                    (err) => {
                        if(err) res.status(err.statusCode || 500).json({success: false, msg: err.message})
                    })
                }
                res.status(200).json({success: true, msg: "Message added."})
            })
        }
    })
})

app.listen(PORT, () => {
    console.log('Listening to port ' + PORT)
})