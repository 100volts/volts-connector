#!/usr/bin/env node
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
import ElectricMater from "./electric/ElectricMater.js";

//0 -Set company gy name
let port;
let companyName;
let reqdata;
let accesToken;

const sleep = (ms = 2000) => new Promise((r) => setTimeout(r, ms));
//const sleepALot = (ms = 120000) => new Promise((r) => setTimeout(r, ms));//this is 2 mins
const sleepALot = (ms = 60000) => new Promise((r) => setTimeout(r, ms));

async function welcome() 
{
    const title = chalkAnimation.neon("Volts-Connector \n");
    await sleep();
    title.stop();
    console.log(`
      ${chalk.bgBlue("Welcome to the controller")}
      The application need to run indefinatly for all meters to be read
          `);
}

async function askForCompanyName() {
    const companyNameInput = await inquirer.prompt({
      name: "company_name",
      type: "input",
      message: "What is the company name?",
      default() {
        return "Markeli";
      },
    });
    companyName = companyNameInput.company_name;
    console.log(companyName);
}
  
async function askForPort() {
    const portInput = await inquirer.prompt({
      name: "connector_port",
      type: "input",
      message: "What is the connector port?",
      default() {
        return "TtyS0";
      },
    });
    port = portInput.connector_port;
    console.log(port);
}

//0.1- Auth user

const postData = JSON.stringify({
    email: "plamen@mail.com",
    password: "12345678",
  });
  const options = {
    hostname: "192.168.0.102",
    port: 8081,
    path: "/api/vi/auth/authenticate",
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Content-Length": Buffer.byteLength(postData),
    },
};
async function sendPostRequest() {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = "";

      res.on("data", (chunk) => {
        data += chunk;
      });

      res.on("end", () => {
        try {
          resolve(data);
        } catch (err) {
          reject(err);
        }
      });
    });

    req.on("error", (e) => {
      reject(`Problem with request: ${e.message}`);
    });

    req.write(postData);
    req.end();
  });
}
//1- read meter address list
//2- Create classes for ech of the list
//3- read from meter
//4- write to db
//4.5- Eport excel
//5- Reepeat
await welcome()
await askForCompanyName()
await askForPort()
