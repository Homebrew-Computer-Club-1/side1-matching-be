import mysql from 'mysql';
import dotenv from 'dotenv';
import path from "path";
const __dirname = path.resolve();

dotenv.config({path : path.join(__dirname, '../.env')});

const connection = mysql.createConnection({
  host     : process.env.DB_HOST,
  user     : process.env.DB_USER,
  password : process.env.DB_PW,
  database : process.env.DB_NAME
});

 
function handleDisconnect() {         
  connection.connect(function(err) {            
    if(err) {                     
      console.log('error when connecting to db:', err);
      setTimeout(handleDisconnect, 2000); 
    }                                   
  });  


  connection.on('error', function(err) {
    console.log('db error', err);
    if(err.code === 'PROTOCOL_CONNECTION_LOST') { 
      return handleDisconnect();                      
    } else {
      throw err;                              
    }
  });
}


export {connection,handleDisconnect}


