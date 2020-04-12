require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const ejs = require('ejs');
const mongoose = require('mongoose');
const md5 = require('md5');
const bcrypt = require('bcrypt');



const app = express();
const saltRounds = 10;
app.use(express.static("public"));
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({
    extended: true
}));

mongoose.connect("mongodb+srv://admin-debajit:dynamic11@test-loztw.mongodb.net/userDB", {useNewUrlParser: true, useUnifiedTopology: true});


const userSchema = new mongoose.Schema({
    email: String,
    password: String,
});




const User = new mongoose.model("User", userSchema);

app.route('/')
    .get(  (req, res) =>{
        res.render('home')
    } );

app.route('/login')
        .get(  (req, res) =>{
            res.render('login')
        })
        .post(   (req, res) => {

            const username =req.body.username;
            const password = req.body.password;

            User.findOne ({ 
                email: username
            },
             (err, foundUser) => {
                if(err){
                    console.log(err)
                    res.redirect('login')
                    
                }   else    {

                    bcrypt.compare(password,foundUser.password, function(err, result) {
                        // result == true
                        if(result){
                            res.render("secrets")
                        }   else {
                            res.render('login')
                        }

                    });

                    
                }
            }
            )
        }  
    )

 

app.route('/register')
        .get(  (req, res) =>{
            res.render('register')
        })
        .post(  (req, res) => {

            bcrypt.hash(req.body.password, saltRounds, function(err, hash) {
                // Store hash in your password DB.

                const newUser = User(
                    {
                        email: req.body.username,
                        password: hash,
                    }
                )
    
                newUser.save(   (err)=> {
                    if(err){
                        console.log(err);
                    }   else {
                        res.render('secrets')
                    }
                } )


            });

           
        }
        );

app.route('/submit')
        .get(  (req, res) =>{
            res.render('submit')
        });


app.listen(3000, () => console.log("Server started at port 3000"));