const express = require("express");
const path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const bcrypt = require("bcrypt");

const DbPath = path.join(__dirname, "userData.db");

const app = express();

app.use(express.json());

let db = null;

const initializeDbAndServer = async () => {
  try {
    db = await open({
      filename: DbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Running at http://localhost:3000/");
    });
  } catch (error) {
    console.log(`Db Error: ${error.message}`);
    process.exit(1);
  }
};

initializeDbAndServer();

const validatePassword = (password)=>{
    return password.length>4;
};

app.post("/register", async (request,response)=>{
    const {username,name,password,gender,location} = request.body;
    const hashedPassword = await bcrypt.hash(password,10);
    const selectNameQuery = `SELECT * FROM user WHERE username = ${username};`;
    const DbUser = await db.get(selectNameQuery);
     if(DbUser === undefined){
         const createNameQuery = `
         INSERT INTO
            user(username,name,password,gender,location)
         VALUES
            (
                '${username}',
                '${hashedPassword}',
                '${gender}',
                '${location}',
            );`;
            if(validatePassword(password)){
                 await db.run(createNameQuery);
                response.send("User created successfully");
            } else{
                response.status(400);
                response.send("Password is too short");
            }
         }    else{
                response.status(400);
                response.send("User already exists");
            }
});

app.post("/login", async(request,response)=>{
    const {username,password} = request.body;
    const selectNameQuery = `SELECT * FROM user WHERE username = ${username};`;
    const DbUser = await db.get(selectNameQuery);
    
    if(DbUser === undefined){
        response.status(400);
        response.send("Invalid user");
    }else{
        const isPasswordMatch = await bcrypt.compare(password,DbUser.password);
        if(isPasswordMatch === true){
            response.send("Login success!");
        }else{
            response.status(400);
            response.send("Invalid password");
        }
    }
});

app.put("/change-password", async(request,response)=>{
    const {username,oldPassword,newPassword} = request.body;
    const selectNameQuery = `SELECT * FROM user WHERE username = ${username};`;
    const DbUser = await db.get(selectNameQuery);
    
     if(DbUser === undefined){
        response.status(400);
        response.send("Invalid user");
    }else{
        const isPasswordMatch = await bcrypt.compare(oldPassword,DbUser.password);
        if(validatePassword(newPassword)){
            const hashedPassword = await bcrypt.hash(newPassword,10);
            const updatePasswordQuery = `
             UPDATE
                user
             SET
                password = ${hashedPassword}
             WHERE
                username = ${username};`;
            const user = await db.run(updatePasswordQuery);
            response.send("Password updated");
        }else{
            response.status(400);
            response.send("Password is too short");
        }else{
            response.status(400);
            response.send("Invalid current password");
        }
    }
});
module.exports = app; 


