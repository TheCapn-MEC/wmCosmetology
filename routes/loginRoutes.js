const express = require('express');
const app = express.Router();
const bcrypt = require('bcrypt');
const passport = require('passport');

const UserSchema = require('../models/admin');

app.use(express.json())

app.post('/', async (req, res) => { //create user
    const { username, name, password, confirmPassword } = req.body;
    let errors = [];
    try {
        UserSchema.findOne({ username: username }).exec((err, user) => {
            if (user) {
                console.log('username already in use')
                errors.push({ msg: 'user already registered' })
            } else {
                const newUser = new UserSchema({
                    username: username,
                    name: name,
                    password: password,
                    confirmPassword: confirmPassword
                })
                if (password.length < 8) {
                    console.log('password too short, requires at least 8 characters')
                    errors.push({ msg: 'password to short, requires at least 8 characters' })
                }
                if (password != confirmPassword) {
                    console.log('passwords do not match')
                    errors.push({ msg: 'passwords do not match' })
                }
                bcrypt.genSalt(10, (err, salt) =>
                    bcrypt.hash(newUser.password, salt,
                        (err, hash) => {
                            if (err) throw err;
                            //same pass to hash
                            newUser.password = hash;
                            //save user
                            newUser.save()
                                .then((value) => {
                                    res.sendStatus(200)
                                })
                                .catch(value => console.log(value))
                        }
                    )
                )
            }
        })
    } catch (error) {
        console.error(error)
    }
})

app.post('/login', async (req, res, next) => { //login
    passport.authenticate('local', {
        successRedirect: '/adminHome',
        failureRedirect: '/login'
    })(req, res, next)
})

app.get('/current', async (req, res) => {
    if (req.user === undefined) {
        // The user is not logged in
        res.json({});
    } else {
        res.json({
            user: req.user
        });
    }
})

app.post('/logout', (req, res, next) => {
    req.logout();
    res.redirect('/');
})

app.get('/', async (req, res) => {
    try {
        const allUsers = await UserSchema.find({});
        res.status(201).json({ allUsers });
    } catch (error) { res.status(500).json({ msg: error }) }
})
app.delete('/', async (req, res) => {
    try {
        await UserSchema.deleteMany({});
        res.status(201).json({ success: true, msg: "all users deleted" });
    } catch (error) { res.status(500).json({ msg: error }) }
})

module.exports = app;