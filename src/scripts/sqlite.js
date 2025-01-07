// const sqlite3 = require('sqlite3').verbose();
import bcrypt from "bcrypt"
import sqlite3 from "sqlite3"
const db = new sqlite3.Database("sqlite.db")
function task (){
    db.serialize(() => {
        db.run("CREATE TABLE permissions (name TEXT)");
    
        const stmt = db.prepare("INSERT INTO permissions VALUES (?)");
        stmt.run("imprimir-etiquetas");
        stmt.run("visor-de-precios");
        stmt.run("cambiar-listado-precios");
        stmt.finalize();

        db.run("CREATE TABLE users (name TEXT, password TEXT, role TEXT, lastlogin DATE)")
        
        const admin = db.prepare("INSERT INTO users VALUES (?, ?, ? ,?)")
        admin.run("admin", bcrypt.hashSync("12345",10), "admin", new Date())
        admin.finalize()
        

        db.run("CREATE table user_permissions (permision INT, user INT)")
        const perms = db.prepare("INSERT INTO user_permissions VALUES (?, ?)")
        perms.run(1,1)
        perms.run(2,1)
        perms.run(3,1)
        perms.finalize()

        //IMAGENES

        db.run("CREATE table images (ItemCode TEXT, hash TEXT, lastUpdate INT DEFAULT -1)")
        db.run("CREATE table config (code INT,imageUpdate INT DEFAULT 0)")
        db.prepare("INSERT INTO config VALUES (?,?)").run(1,0).finalize()

        //Facturas
        db.run(`CREATE table facturas (
            FullCode TEXT,
            NumFactura TEXT,
            NumTicketFiscal TEXT,
            
            CodCliente TEXT,
            NomCliente TEXT,
            DireccionCliente TEXT,
            Telefono TEXT,

            Total REAL DEFAULT 0,
            TasaUSD REAL,

            Date TEXT, 
            Hour TEXT,

            Started INT Default 0,
            Checked INT DEFAULT 0,
            Canceled INT DEFAULT 0,
            FactComment TEXT
        )`);
        
        //Configuracion
        db.run("CREATE TABLE sysconfig (name TEXT, value TEXT)");
        const sysconfig = db.prepare("INSERT INTO sysconfig VALUES (?, ?)");
        sysconfig.run("CentsPerTicket", "5000");
        sysconfig.run("BottomMessage", "");
        sysconfig.run("TicketsActive", "false");
        sysconfig.finalize();

        //Tickets
        db.run("create table tickets (Number INTEGER PRIMARY KEY,FactCode TEXT, Date TEXT, CanceledTicket INT DEFAULT 0, Comment TEXT)")




    });
    
    db.close();
}

export {task}