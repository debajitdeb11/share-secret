
require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const ejs = require('ejs');
const mongoose = require('mongoose');
const session = require('express-session');
const passport = require('passport');
const passportLocalMongoose = require('passport-local-mongoose');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const findOrCreate = require('mongoose-findorcreate');

const app = express();

app.use(express.static("public"));
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({
    extended: true
}));

app.use(session({
    secret: 'OurLittleSecret',
    resave: false,
    saveUninitialized: false,
  }));

  app.use(passport.initialize());
  app.use(passport.session());




mongoose.connect(process.env.MONGO_DB_CREDENTIALS, {useNewUrlParser: true, useUnifiedTopology: true});
mongoose.set("useCreateIndex", true);

const userSchema = new mongoose.Schema({
    username: String,
    password: String,
    googleId: String,
    secret: String,
});
userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);

const User = new mongoose.model("User", userSchema);




passport.use(User.createStrategy());
passport.serializeUser(function(user, done) {
    done(null, user.id);
  });
  
  passport.deserializeUser(function(id, done) {
    User.findById(id, function(err, user) {
      done(err, user);
    });
  });


passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/secrets",
    userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo",
  },
    function(accessToken, refreshToken, profile, cb) {
    User.findOrCreate({ googleId: profile.id }, function (err, user) {
      return cb(err, user);
      
    });
  }
));


app.route('/')
    .get(  (req, res) =>{
        res.render('home')
    } );

app.route('/login')
        .get(  (req, res) =>{
            res.render('login')
        })  

        .post(  (req, res) => {
            const user = new User({
                username: req.body.username,
                password: req.body.password,
            });

            req.login(user,  (err) => {
                if(err){
                    console.log(err);
                    res.redirect('/login');
                }   else    {
                    passport.authenticate('local') (req, res, () =>{
                        res.redirect('/secrets')
                    })
                }
            }  )

        }
        );

app.route('/logout')
        .get(    (req, res) => {
            req.logout();
            res.redirect('/');
        }   );

app.route('/secrets')
        .get(    (req, res) => {
            if(req.isAuthenticated()){
                User.find({"secret" : {$ne: null} }  , function(err, foundUsers){
                    if(err){
                        console.log(err);
                    }   else   {
                        if(foundUsers){
                            res.render("secrets" ,{usersWithSecrets: foundUsers});
                            console.log(foundUsers);
                        }
                    }
                }
                )}
            }
                )
                
            // }   else    { 
            //     res.redirect('/login');
            // }
        
    


// app.route('/auth/google')
//         .get( () => {
//             passport.authenticate('google', { scope: ['profile'] })
//             console.log("Hello");
            
//         } )

app.get('/auth/google',
  passport.authenticate('google', { scope: ['profile'] }));

  app.get('/auth/google/secrets', 
  passport.authenticate('google', { failureRedirect: '/login' }),
  function(req, res) {
    // Successful authentication, redirect secrets.
    res.redirect('/secrets');
  })


app.route('/register')
        .get(  (req, res) =>{
            res.render('register')
        })

        .post(   (req, res) => {
            User.register( { username:  req.body.username},  req.body.password , (err, user) => {
                if (err){
                    console.log(err);
                    res.redirect('/'); 
                }   else    {
                    passport.authenticate('local') (req, res, () =>{
                        res.redirect('/secrets')
                    })
                }
            }
            )
        }  )


        

app.route('/submit')
        .get(  (req, res) =>{
            if(req.isAuthenticated()){
                res.render('submit');
            }   else    {
                res.redirect('/login');
            }
            
        })

        .post(   (req, res) => {

            const submittedSecret = req.body.secret;

            User.findById(req.user.id, (err, foundUser) => {
                if(err){
                    console.log(err);
                    
                }   else    {
                    if(foundUser){
                        foundUser.secret = submittedSecret;
                        foundUser.save(   () => {
                            res.redirect("/secrets");
                        }  );
                            
                    }
                }
            } )
            
         } )


app.listen(3000, () => console.log("Server started at port 3000"));