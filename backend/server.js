const express = require('express')
const mysql = require('mysql2')
const util = require('util')
const cors = require('cors')
const jsonMiddleware = require('./middleware/jsonMiddleware')
const authMiddleware = require('./middleware/authMiddleware')
const sendOtp = require('./routes/sendOtp')
const verifyOtp = require('./routes/verifyOtp')
const logOut = require('./routes/logOut')
const getPayments = require('./routes/getMyPayments')
const myprofile = require('./routes/myProfile')
const getSupportRequest = require('./routes/getSupportRequest')
const leadHistory = require('./routes/LeadHistory')
const getUsers = require('./routes/getUsers')
require('dotenv').config()

const app = express()
const PORT = process.env.PORT || 5000

const db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
});

db.connect((err)=>{
    if(err){    
    console.error('Error connecting to MySql: ',err)
    return
    }
    console.log('Connected to MySQL database')
})

db.query = util.promisify(db.query);

app.use(cors())
app.use(jsonMiddleware)

// Debug middleware to log incoming requests
app.use((req, res, next) => {
    console.log(`Request: ${req.method} ${req.url}`);
    next();
});


app.use('/api', sendOtp(db))
app.use('/api', verifyOtp(db))

app.use('/api',authMiddleware(db), logOut(db))
app.use('/api', authMiddleware(db), getPayments(db))
app.use('/api', authMiddleware(db), myprofile(db))
app.use('/api', authMiddleware(db), getSupportRequest(db))
app.use('/api', authMiddleware(db), getUsers(db))
app.use('/api', authMiddleware(db), leadHistory(db))

app.listen(PORT,()=>{
    console.log(`Server running on ${PORT}`)
})