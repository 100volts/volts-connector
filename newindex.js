import chalk from "chalk";
import inquirer from "inquirer";
import gradient from "gradient-string";
import chalkAnimation from "chalk-animation";
import figlet from "figlet";
import { createSpinner } from "nanospinner";
import http from "http";
import https from "https";
import readline from "readline";
import ModbusRTU from "modbus-serial";
import XLSX from "xlsx";

//global variable for key & port
let key;
let port;
const urladdress="localhost"
const dateNow=new Date();
const readGap=1;
const sleep = (ms = 2000) => new Promise((r) => setTimeout(r, ms));


//TODO this will be part of the read for every meter
const client = new ModbusRTU();
client.connectRTUBuffered("COM3", { baudRate: 9600 });
client.setID(1);

//Ui elements
async function welcome() {
  const title = chalkAnimation.neon("Volts-Connector \n");
  await sleep();
  title.stop();
  console.log(`
    ${chalk.bgBlue("Welcome to the controller")}
    The application need to run indefinatly for all meters to be read
        `);
}
//UI elements end

let accesToken;

const nextRead=new Date();
const allMetersHaveBeenRead=false;
async function setNextRead(){
  console.log("Next read before: ",nextRead.getMinutes());
  nextRead.setMinutes(nextRead.getMinutes()+readGap)
  console.log("Next read after: ",nextRead.getMinutes());
  console.log("Next sleep time: ",Math.abs(new Date()-nextRead));
  const sleepNextRead = (ms = Math.abs(new Date()-nextRead)) => new Promise((r) => setTimeout(r, ms));
  if(minReadTime>new Date()){
    minReadTime=nextRead;
    console.log("New minReadTime: ",minReadTime.getHours());
  }
}
const minReadTime=new Date();
async function checkNexRead(nextreadTime){
  if(new Date()<nextreadTime){

  }else{
    //console.log("Next read is HERE!!: ",nextRead.getMinutes());
    //await setNextRead();
  }
}


let meterSettingsResponse=[]
async function setMitterSettings(){
    const response = await fetch(
      `http://${urladdress}:8081/elmeterc/settings`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accesToken}`,
        },
        body:JSON.stringify({
          "company_name":"Markeli"
        })  
      }
    );
    if (!response.ok) {
      throw new Error("Network response was not ok");
    }
    const datat = await response.json();
    const { settings } = datat;
    meterSettingsResponse=settings;
    console.log("Meter settings: ",meterSettingsResponse);
}
const loginData = JSON.stringify({
  email: "plamen@mail.com",
  password: "12345678",
});
async function login(){
    const response = await fetch(
      `http://${urladdress}:8081/api/vi/auth/authenticate`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: loginData
      }
    );
  if (!response.ok) {
    throw new Error("Network response was not ok");
  } 
  const datat = await response.json();
  const { access_token } =  datat;
  accesToken=access_token;  
  console.log("Tokken: ", accesToken);
}

async function mainScreen() {
  //console.clear();
  const msg = "Working";

  figlet(msg, (err, data) => {
    console.log(gradient.pastel.multiline(data));
  });
  //await postElMeterData();

  //await readMeters();
  if(allMetersHaveBeenRead){
    const sleepTilNextRead = (ms = minReadTime-new Date()) => new Promise((r) => setTimeout(r, ms));
    sleepTilNextRead();
  }
  await setNextRead();
  //await checkNexRead(nextRead);
  await mainScreen();
}

await login();
await setMitterSettings();
await welcome();
//await setMitterSettings();
//await mainScreen();