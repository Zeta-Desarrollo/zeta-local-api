import {config} from "dotenv"
config()
import bcrypt from "bcrypt"
import { sqliteDB as db } from "../utils/sqlite.js"
function task (){
    db.serialize(() => {
        // db.run("CREATE TABLE permissions (name TEXT)");
    
        // const stmt = db.prepare("INSERT INTO permissions VALUES (?)");
        // stmt.run("imprimir-etiquetas");
        // stmt.run("visor-de-precios");
        // stmt.run("cambiar-listado-precios");
        // stmt.run("editar-sorteo");
        // stmt.run("manipular-tickets");
        
        // stmt.finalize();

        // db.run("CREATE TABLE users (name TEXT, password TEXT, role TEXT, lastlogin DATE)")
        
        // const admin = db.prepare("INSERT INTO users VALUES (?, ?, ? ,?)")
        // // admin.run("admin", bcrypt.hashSync("12345",10), "admin", new Date())
        // admin.run("TiendaWeb", bcrypt.hashSync(process.env.STORE_PASSWORD,10), "store", new Date())
        // admin.finalize()
        

        // db.run("CREATE table user_permissions (permision INT, user INT)")
        // const perms = db.prepare("INSERT INTO user_permissions VALUES (?, ?)")
        // perms.run(1,1)
        // perms.run(2,1)
        // perms.run(3,1)
        // perms.run(4,1)
        // perms.run(5,1)
        // perms.finalize()

        // //IMAGENES

        // db.run("CREATE table images (ItemCode TEXT, hash TEXT, lastUpdate INT DEFAULT -1)")
        // db.run("CREATE table config (code INT,imageUpdate INT DEFAULT 0)")
        // db.prepare("INSERT INTO config VALUES (?,?)").run(1,0).finalize()

        // //Facturas
        // db.run(`CREATE table facturas (
        //     FullCode TEXT,
        //     NumFactura TEXT,
        //     NumTicketFiscal TEXT,
            
        //     CodCliente TEXT,
        //     NomCliente TEXT,
        //     DireccionCliente TEXT,
        //     Telefono TEXT,

        //     Total REAL DEFAULT 0,
        //     TasaUSD REAL,

        //     Date TEXT, 
        //     Hour TEXT,

        //     Started INT Default 0,
        //     Checked INT DEFAULT 0,
        //     Canceled INT DEFAULT 0,
        //     FactComment TEXT
        //     ProductData TEXT
        // )`);
        
        // //Configuracion
        // db.run("CREATE TABLE sysconfig (name TEXT, value TEXT)");
        // const sysconfig = db.prepare("INSERT INTO sysconfig VALUES (?, ?)");
        // sysconfig.run("CentsPerTicket", "5000");
        // sysconfig.run("BottomMessage", "");
        // sysconfig.run("ReciptCheck", "false");
        // sysconfig.run("TicketsPriceActive", "false");
        // sysconfig.run("TicketsProductActive", "false");
        // sysconfig.run("TicketsProducts", "");
        // sysconfig.run("ProductsBottomMessage", "");
        // sysconfig.run("ProductsTopMessage", "");

        // sysconfig.finalize();

        // //Tickets
        // db.run("create table tickets (Number INTEGER PRIMARY KEY,FactCode TEXT, Date TEXT, CanceledTicket INT DEFAULT 0, Comment TEXT)")   

        // //facturas productos
        // db.run(`create table factura_tickets_productos (
        //     FullCode TEXT,

        //     Begun INT Default 0,
        //     Finished INT DEFAULT 0,
        //     CanceledProduct INT DEFAULT 0, 
        //     CommentProduct TEXT DEFAULT '')
        // `)
        // //per products tirckerts
        // db.run("create table product_tickets (Number INTEGER PRIMARY KEY,FactCode TEXT, Date TEXT, CanceledTicket INT DEFAULT 0, Comment TEXT)")   
       
        // //patch
        // db.run("ALTER TABLE facturas ADD COLUMN ProductData TEXT")
        // db.run("delete from sysconfig where name='TicketsActive'")
        // db.run("ALTER TABLE product_tickets ADD COLUMN ProductName TEXT")
        // db.run("ALTER TABLE product_tickets ADD COLUMN ProductAmount TEXT")
        // db.run("create table product_data ( ItemCode TEXT,hash TEXT,json TEXT)")
        db.run("create table impresion (Number INT, Date TEXT, mode TEXT, finished INT, status TEXT)")
        db.run("create table impresion_etiqueta (Impresion INT, orden INT, ItemCode TEXT, printed INT)")
        db.run("insert into impresion values (0, '', '', 1, 'null')")
        db.run("INSERT INTO sysconfig VALUES ('PrintLabels','true')");



    });
    
    db.close();
}

export {task}