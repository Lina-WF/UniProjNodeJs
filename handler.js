const mysql = require('mysql2');
const bodyParser = require('body-parser');
const express = require('express');
const path = require('path');
const ejs = require('ejs');
const fs = require('fs');

const connection = mysql.createConnection({
    host: "127.0.0.1",
    user: "root",
    database: "imagination",
    password: ""
  });
    
connection.connect(function(err){
    if (err) {
        return console.error("Ошибка: " + err.message);
    }
    else{
        console.log("Подключение к серверу MySQL успешно установлено");
    }
});

const urlencodedParser = bodyParser.urlencoded({
    extended: false,
});


const app = express();
app.set('view engine', 'ejs');
app.set('views', 'views');

app.use(express.static(path.join(__dirname, 'public')));

app.get('/img', function(req, res){ 
    let file_path = path.resolve(__dirname, "public/img", "logo.png")
    fs.readFile(file_path, function(err, content){
        if (err) {
            console.log(err);
            res.statusCode = 500;
            res.write(`Не удалось обратиться к файлу`);
        } else {
            res.statusCode = 200;
            res.write(content);
        }
        res.end();
    });
});

app.get('/', function(req, res){ 
    connection.query("SELECT texts.id, texts.title, texts.short_text, users.name FROM texts LEFT JOIN users ON texts.user_id = users.id ORDER BY date DESC LIMIT 5", function(err, content_texts){
        connection.query("SELECT name, describtion FROM users ORDER BY rating DESC LIMIT 5", function(err, content_authors){
            res.render('index', {
                texts: content_texts,
                authors: content_authors,
            });
        });
    });
    res.statusCode = 200;
});

app.post('/read', urlencodedParser, function(req, res){
    connection.query("SELECT texts.title, texts.full_text, users.name FROM texts LEFT JOIN users ON texts.user_id = users.id WHERE texts.id = " + req.body["id"], function(err, content){
        res.render('read_text', {
            text: content[0]
        });
    });
    res.statusCode = 200;
});

app.get('/authors', function(req, res){ 
    connection.query("SELECT name, describtion FROM users ORDER BY rating DESC", function(err, content){
        res.render('authors', {
            authors: content,
        });
    });
    res.statusCode = 200;
});

app.get('/texts', function(req, res){ 
    connection.query("SELECT texts.id, texts.title, texts.short_text, users.name FROM texts LEFT JOIN users ON texts.user_id = users.id", function(err, content){
        res.render('texts', {
            texts: content,
        });
    });
    res.statusCode = 200;
});

app.get('/connect', function(req, res){ 
    res.render('contacts', {
        response: ""
    });
    res.statusCode = 200;
});

app.post('/help', urlencodedParser, function(req, res){ 
    connection.query("INSERT INTO `feedback`(`name`, `email`, `problem`) VALUES ('" + req.body["nm"] + "','" + req.body["email"] + "','" + req.body["problem"] + "')", function(err, content_texts){
        res.render('contacts', {
            response: "Заявка отправлена."
        });
    });
    res.statusCode = 200;
});

app.get('/profile', function(req, res){ 
    connection.query("SELECT signed FROM users WHERE signed = 1", function(err, content){
        if (content.length == 0)
            res.render('login', {
                error: "",
                name: "",
                desc: ""
            });
        else {
            connection.query("SELECT id, name, describtion FROM users WHERE signed = 1", function(err, content_user){
                connection.query("SELECT * FROM texts WHERE user_id = " + content_user[0]["id"], function(err, content_texts){
                    res.render('user_profile', {
                        user: content_user[0],
                        texts: content_texts,
                        error: ""
                    });
                });
            });
        }
    });
    res.statusCode = 200;
});

app.get('/login', function(req, res){ 
    connection.query("SELECT signed FROM users WHERE signed = 1", function(err, content){
        if (content.length == 0)
            res.render('login', {
                error: "",
                name: "",
                desc: ""
            });
        else {
            connection.query("SELECT id, name, describtion FROM users WHERE signed = 1", function(err, content_user){
                connection.query("SELECT * FROM texts WHERE user_id = " + content_user[0]["id"], function(err, content_texts){
                    res.render('user_profile', {
                        user: content_user[0],
                        texts: content_texts,
                        error: ""
                    });
                });
            });
        }
    });
    res.statusCode = 200;
});

app.post('/login', urlencodedParser, function(req, res){ 
    connection.query("SELECT * FROM users WHERE login = " + req.body["login"] + " AND password = " + req.body["password"], function(err, content_users){
        if (!content_users) {
            res.render('login', {
                error: "Неправильно введён логин или пароль.",
                name: "",
                desc: ""
            });
        }
        else {
            connection.query("UPDATE users SET signed='1' WHERE id = " + content_users[0]["id"], function(err, content){
            });
            connection.query("SELECT id, name, describtion FROM users WHERE signed = 1", function(err, content_user){
                connection.query("SELECT * FROM texts WHERE user_id = " + content_user[0]["id"], function(err, content_texts){
                    res.render('user_profile', {
                        user: content_user[0],
                        texts: content_texts,
                        error: ""
                    });
                });
            });
        }
    });
    res.statusCode = 200;
});

app.post('/registration', urlencodedParser, function(req, res){
    if (req.body["nm"] == "" || req.body["descr"] == "" || req.body["login"] == "" || req.body["password"] == "")
    {
        res.render('login', {
            error: "Заполните все поля.",
            name: req.body["nm"],
            desc: req.body["descr"]
        });
    }
    else {
        connection.query("INSERT INTO `users`(`name`, `describtion`, `login`, `password`, `signed`, `rating`) VALUES ('" + req.body["nm"] + "', '" + req.body["descr"] + "', '" + req.body["login"] + "', '" + req.body["password"] + "', '1', '0')", function(err, content){
        });
        connection.query("SELECT id, name, describtion FROM users WHERE signed = 1", function(err, content_user){
            connection.query("SELECT * FROM texts WHERE user_id = " + content_user[0]["id"], function(err, content_texts){
                res.render('user_profile', {
                    user: content_user[0],
                    texts: content_texts,
                });
            });
        });
    }
    res.statusCode = 200;
});

app.get('/logout', function(req, res){ 
    connection.query("SELECT id FROM users WHERE signed = 1", function(err, content){
        if (content.length != 0)
            connection.query("UPDATE users SET signed='0' WHERE id = " + content[0]["id"], function(err, content){
                
            });
        res.render('login', {
            error: "",
            name: "",
            desc: ""
        });
    });
    res.statusCode = 200;
});

app.post('/edit_text', urlencodedParser, function(req, res){ 
    connection.query("SELECT * FROM texts WHERE id = " + req.body["id"], function(err, content){
        res.render('edit_texts', {
            text: content[0],
            error: ""
        });
    });
    res.statusCode = 200;
});

app.post('/edit', urlencodedParser, function(req, res){
    if (req.body["title"] == "" || req.body["text"] == "")
    {
        res.render('edit_texts', {
            text: {"id": req.body["id"],
                "title": req.body["title"],
                "full_text": req.body["text"]
            },
            error: "Заполните все поля."
        });
    }
    else {
        var short_text = req.body["text"].slice(0, 200) + "...";
        connection.query("UPDATE `texts` SET `title`='" + req.body["title"] + "',`full_text`='" + req.body["text"] + "',`short_text`='" + short_text + "' WHERE id = " + req.body["id"], function(err, content){
            console.log("изменение прошло успешно");
        }); 
        connection.query("SELECT id, name, describtion FROM users WHERE signed = 1", function(err, content_user){
            connection.query("SELECT * FROM texts WHERE user_id = " + content_user[0]["id"], function(err, content_texts){
                res.render('user_profile', {
                    user: content_user[0],
                    texts: content_texts,
                });
            });
        });
    }
    res.statusCode = 200;
});

app.post('/del', urlencodedParser, function(req, res){
    connection.query("DELETE FROM `texts` WHERE `id`= " + req.body["id"], function(err, content){
        console.log("удаление прошло успешно");
        connection.query("SELECT id, name, describtion FROM users WHERE signed = 1", function(err, content_user){
            connection.query("SELECT * FROM texts WHERE user_id = " + content_user[0]["id"], function(err, content_texts){
                res.render('user_profile', {
                    user: content_user[0],
                    texts: content_texts,
                });
            });
        });
    }); 
    res.statusCode = 200;
});

app.get('/add', function(req, res){
    res.render('add_text', {
        text: {"title": "",
                "full_text": ""
            },
            error: "Заполните все поля."
    });
    res.statusCode = 200;
});

app.post('/add', urlencodedParser, function(req, res){
    if (req.body["title"] == "" || req.body["text"] == "")
    {
        res.render('edit_texts', {
            text: {"title": req.body["title"],
                "full_text": req.body["text"]
            },
            error: "Заполните все поля."
        });
    }
    else {
        var short_text = req.body["text"].slice(0, 200) + "...";
        var today = new Date();
            var dd = String(today.getDate()).padStart(2, '0');
            var mm = String(today.getMonth() + 1).padStart(2, '0');
            var yyyy = today.getFullYear();
            today = yyyy + '-' + mm + '-' + dd;
        connection.query("SELECT id, name, describtion FROM users WHERE signed = 1", function(err, content_user){
            connection.query("INSERT INTO `texts`(`title`, `full_text`, `short_text`, `user_id`, `date`) VALUES ('" + req.body["title"] + "','" + req.body["text"] + "','" + short_text + "','" + content_user[0]["id"] + "','" + today +"')", function(err, content){
            }); 
            connection.query("SELECT * FROM texts WHERE user_id = " + content_user[0]["id"], function(err, content_texts){
                res.render('user_profile', {
                    user: content_user[0],
                    texts: content_texts,
                });
            });
        });
    }
    res.statusCode = 200;
});

app.use(function(req, res){
    res.render('404', {
    });
    res.statusCode = 404;
});

app.listen(3000, function(){
    console.log(`Приложение было запущено`);
});