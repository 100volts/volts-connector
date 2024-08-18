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
//
class ElectricMeterHandler{
  async getElmeterData(companyName, accesToken,com) {
      this.meter=null;//macking shore to to fill up the ram with new and newwer meters
      try{
          const response = await fetch(
            `http://${urladdress}:8081/elmeter/company/address/list`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${accesToken}`,
              },
              body: JSON.stringify({
                  company_name: companyName,
              }),
            },
          );
          const datat = await response.json();
          const {address_list}=datat;
          
          address_list.forEach(element => {
              console.log(element)
              //todo make the call for every meter
              writeElmeterDataFromAddress(element,com)
          });
          
      }catch (error) {
          console.log('Failed to fetch data: ' + error.message);
      }
  }
  
  async writeElmeterDataFromAddress(address,com){
      //Create new meter and read it
      let elMeter= new ElectriMeter();
      elMeter.setAddressName(address,address)
      elMeter.readModbusData(com)
  }
}


export class ElectriMeter{
  /*
    constructor(
      name,address,value,
      voltageL1,voltageL2,voltageL3,
      currentL1,currentL2,currentL3,
      activePowerL1,activePowerL2,activePowerL3,
      powerFactorL1,powerFactorL2,powerFactorL3,
      totActivePower
      ){
          this.name=name;
          this.address=address;
          this.value=value;
          this.voltageL1=voltageL1;
          this.voltageL2=voltageL2;
          this.voltageL3=voltageL3;
          this.currentL1=currentL1;
          this.currentL2=currentL2;
          this.currentL3=currentL3;
          this.activePowerL1=activePowerL1;
          this.activePowerL2=activePowerL2;
          this.activePowerL3=activePowerL3;
          this.powerFactorL1=powerFactorL1;
          this.powerFactorL2=powerFactorL2;
          this.powerFactorL3=powerFactorL3;
          this.totActivePower=totActivePower;
      }
          */
  
      getMeterByAddress(address,company){
          //TODO add api call
          //TODO call setAddressName
      }
  
      setAddressName(address,name){
          this.address=address;
          this.name=name;    
      }
  
      async setMeter(
          name,address,value,
          voltageL1,voltageL2,voltageL3,
          currentL1,currentL2,currentL3,
          activePowerL1,activePowerL2,activePowerL3,
          powerFactorL1,powerFactorL2,powerFactorL3,
          totActivePower
          ){
              this.name=name;
              this.address=address;
              this.value=value;
              this.voltageL1=voltageL1;
              this.voltageL2=voltageL2;
              this.voltageL3=voltageL3;
              this.currentL1=currentL1;
              this.currentL2=currentL2;
              this.currentL3=currentL3;
              this.activePowerL1=activePowerL1;
              this.activePowerL2=activePowerL2;
              this.activePowerL3=activePowerL3;
              this.powerFactorL1=powerFactorL1;
              this.powerFactorL2=powerFactorL2;
              this.powerFactorL3=powerFactorL3;
              this.totActivePower=totActivePower;
          }
  
      async readModbusData(com){
          //Prep
          const client = new ModbusRTU();
          // client.connectRTUBuffered(com, { baudRate: 9600 });/"COM3"C
          //Read
          const len4Data = getMeterValueLen4(this.address)
          const len2Data = getMeterValueLen2(this.address)
          //TODO add activePowerData
          setMeter(this.name,this.address,
              len2Data[0], len2Data[1],len2Data[2],
              len2Data[3],len2Data[4],len2Data[5],
              len2Data[6],len2Data[7],len2Data[8],
              len2Data[9],len2Data[10], len2Data[11], 
              len2Data[12]
          )
          //Sent api
          const postMeterData = JSON.stringify({
              merterId: this.address,
              voltagell1: len2Data[0].toFixed(2),
              voltagell2: len2Data[1].toFixed(2),
              voltagell3: len2Data[2].toFixed(2),
              currentl1: len2Data[3].toFixed(4),
              currentl2: len2Data[4].toFixed(4),
              currentl3: len2Data[5].toFixed(4),
              activepowerl1: len2Data[6].toFixed(2),
              activepowerl2: len2Data[7].toFixed(2),
              activepowerl3: len2Data[8].toFixed(2),
              pfl1: len2Data[9].toFixed(6),
              pfl2: len2Data[10].toFixed(6),
              pfl3: len2Data[11].toFixed(6),
              totalActivePpower: len2Data[12].toFixed(2),
              totalActiveEnergyImportTariff1: 0,
              totalActiveEnergyImportTariff2: 0,
          });
          await sleep(100);
          await sendMerterDataRequestPost(postMeterData);
      }
  
  
      async #sendMerterDataRequestPost(postMeterData) {
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
  } 

    async function GetMeterValueLen2 (address){
    const addresses = [1, 3, 5, 13, 15, 17, 25, 27, 29, 37, 39, 41, 65]; //all addresses for len2
    let allFoundAddressData = [];
    for (let address of addresses) {
      try {
        await client.setID(address);
        let val = await client.readInputRegisters(address, 2).then((res) => {
          allFoundAddressData.push(decodeFloat(res.data));
        });
      } catch (e) {
        return -1;
      }
    }
    console.log("Len 2 Volt data", allFoundAddressData);
    return allFoundAddressData;
};

async function GetMeterValueLen4 (address) {
  try {
    await client.setID(address);
    let val = await client.readInputRegisters(801, 4).then((res) => {
      return modbusRegistersToDouble(res.data);
    });
    return val;
  } catch (e) {
    return -1;
  }
};

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
        return "COM3";
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

async function postElMeterData() {
  await sendPostRequest().then((data) => (reqdata = data));
}

async function mainScreen() {
  console.clear();
  const msg = "Working";

  figlet(msg, (err, data) => {
    console.log(gradient.pastel.multiline(data));
  });
  await postElMeterData();
  const jsonObject = JSON.parse(reqdata);
  console.log("Tokken: ", jsonObject["access_token"]);
  accesToken = jsonObject["access_token"];
  await elemters.getElmeterData("Markeli",accesToken)
  await sleepALot();
  await mainScreen();
}
//1- read meter address list
//2- Create classes for ech of the list
//3- read from meter
//4- write to db
//4.5- Eport excel
//5- Reepeat

const elemters=new ElectricMeterHandler();
await welcome()
await askForCompanyName()
await askForPort()
await mainScreen()

