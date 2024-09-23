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

const loginData = JSON.stringify({
  email: "plamen@mail.com",
  password: "12345678",
});
const loginOptions = {
  hostname: "192.168.0.102",
  port: 8081,
  path: "/api/vi/auth/authenticate",
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "Content-Length": Buffer.byteLength(loginData),
  },
};

let reqdata;
let accesToken;
async function sendPostRequest() {
  return new Promise((resolve, reject) => {
    const req = http.request(loginOptions, (res) => {
      let data = "";
      res.on("data", (chunk) => {
        data += chunk;
      });
      res.on("end", () => {
        try {resolve(data);} catch (err) {reject(err);}
      });
    })
    req.on("error", (e) => {reject(`Problem with request: ${e.message}`);});
    req.write(loginData);
    req.end();
  });
}


async function sendMerterDataRequestPost(postMeterData) {
  const meterOptions = {
    hostname: "192.168.0.102",
    port: 8081,
    path: "/elmeter/data",
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Content-Length": Buffer.byteLength(postMeterData),
      Authorization: `Bearer ${accesToken}`,
    },
    protocol: "http:",
  };
  return new Promise((resolve, reject) => {
    const req = http.request(meterOptions, (res) => {
      let responseData = "";

      res.on("data", (chunk) => {
        responseData += chunk;
      });

      res.on("end", () => {
        resolve(responseData);
      });
    });

    req.on("error", (e) => {
      reject(`Problem with request: ${e.message}`);
    });
    req.write(postMeterData);
    req.end();
  });
}

async function postElMeterData() {
  await sendPostRequest().then((data) => (reqdata = data));
}
const nextRead=new Date();
async function checkNexRead(){
  console.log("Next read before: ",nextRead.getMinutes());
  nextRead.setMinutes(nextRead.getMinutes()+readGap)
  console.log("Next read after: ",nextRead.getMinutes());
  console.log("Next sleep time: ",Math.abs(new Date()-nextRead));
  const sleepNextRead = (ms = Math.abs(new Date()-nextRead)) => new Promise((r) => setTimeout(r, ms));
  await sleepNextRead();
}

async function mainScreen() {
  //console.clear();
  const msg = "Working";

  figlet(msg, (err, data) => {
    console.log(gradient.pastel.multiline(data));
  });
  await postElMeterData();
  const jsonObject = JSON.parse(reqdata);
  console.log("Tokken: ", jsonObject["access_token"]);
  accesToken = jsonObject["access_token"];
  //await readMeters();
  await checkNexRead();
  await mainScreen();
}


await welcome();
await mainScreen();