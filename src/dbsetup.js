const sqlite3 = require('sqlite3').verbose();
var db = new sqlite3.Database('./main.db');

db.serialize(function() {

    const CREATE_EMPLOYEES = 
    '                           \
        create table employees( \
        UID text primary key,      \
        minutes_worked integer default 0,           \
        tag text);\
    '

    db.run(CREATE_EMPLOYEES);
});

db.close();