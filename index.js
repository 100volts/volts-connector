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

//global variable for key & port
let key;
let port;

const client = new ModbusRTU();
client.connectRTUBuffered("COM3", { baudRate: 9600 });
client.setID(1);
//helper function
const sleep = (ms = 2000) => new Promise((r) => setTimeout(r, ms));
//const sleepALot = (ms = 120000) => new Promise((r) => setTimeout(r, ms));//this is 2 mins

const sleepALot = (ms = 60000) => new Promise((r) => setTimeout(r, ms));

async function welcome() {
  const title = chalkAnimation.neon("Volts-Connector \n");
  await sleep();
  title.stop();
  console.log(`
    ${chalk.bgBlue("Welcome to the controller")}
    The application need to run indefinatly for all meters to be read
        `);
}

async function askForKey() {
  const keyInput = await inquirer.prompt({
    name: "company_key",
    type: "input",
    message: "What is the company key?",
    default() {
      return "key0";
    },
  });
  key = keyInput.company_key;
  console.log(key);
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

let reqdata;
let accesToken;
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
  await readMeters();
  await sleepALot();
  await mainScreen();
}

async function readMeters() {
  //set up modbus for reading

  function getTodaysDate() {
    const today = new Date();

    const day = String(today.getDate()).padStart(2, "0");
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const year = today.getFullYear();

    const formattedDate = `${day}-${month}-${year}`;
    console.log(formattedDate);
    return formattedDate;
  }

  function modbusRegistersToDouble(registers) {
    var buffer = new ArrayBuffer(8);
    var view = new DataView(buffer);
    view.setUint16(0, registers[0], false);
    view.setUint16(2, registers[1], false);
    view.setUint16(4, registers[2], false);
    view.setUint16(6, registers[3], false);
    return view.getFloat64(0, false) / 1000;
  }

  function decodeFloat(registers) {
    if (registers.length !== 2) {
      throw new Error(
        "Invalid number of registers. Floating-point decoding requires exactly two 16-bit registers."
      );
    }
    const combined = (registers[0] << 16) | registers[1];
    const floatNumber = new Float32Array(new Uint32Array([combined]).buffer)[0];
    return floatNumber;
  }

  function decodeFloatL4(registers) {
    if (registers.length !== 4) {
      throw new Error(
        "Invalid number of registers. Floating-point decoding requires exactly four 16-bit registers."
      );
    }

    // Combine the four registers into a single 32-bit integer
    const combined =
      (registers[0] << 48) |
      (registers[1] << 32) |
      (registers[2] << 16) |
      registers[3];
    const floatNumber = new Float32Array(new Uint32Array([combined]).buffer)[0];
    return floatNumber;
  }

  const metersIdList = [1, 2, 3, 4, 5, 6, 7];

  const getMetersValue = async (meters) => {
    var volatageMeter = [];
    try {
      // get value of all meters
      for (let meter of meters) {
        await sleep(50);
        const activePowerData = await getMeterValue(meter.id);
        const len2Data = await getMeterValueLen2(meter.id);
        volatageMeter.push({
          name: meter.name,
          value: activePowerData,
          voltageL1: len2Data[0],
          voltageL2: len2Data[1],
          voltageL3: len2Data[2],
          currentL1: len2Data[3],
          currentL2: len2Data[4],
          currentL3: len2Data[5],
          activePowerL1: len2Data[6],
          activePowerL2: len2Data[7],
          activePowerL3: len2Data[8],
          powerFactorL1: len2Data[9],
          powerFactorL2: len2Data[10],
          powerFactorL3: len2Data[11],
          totActivePower: len2Data[12],
        });
        const postMeterData = JSON.stringify({
          merterId: meter.id,
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
        await sleep(100);
      }
    } catch (e) {
      console.log(e);
    } finally {
      //TODO add post to server here
      return volatageMeter;
    }
  };

  const getMeterValue = async (id) => {
    try {
      await client.setID(id);
      let val = await client.readInputRegisters(801, 4).then((res) => {
        return modbusRegistersToDouble(res.data);
      });
      return val;
    } catch (e) {
      return -1;
    }
  };

  const getMeterValueLen2 = async (id) => {
    const addresses = [1, 3, 5, 13, 15, 17, 25, 27, 29, 37, 39, 41, 65]; //all addresses for len2
    let allFoundAddressData = [];
    for (let address of addresses) {
      try {
        await client.setID(id);
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

  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  async function main() {
    const dataPrep = [
      { id: 1, name: "GRT-1" },
      { id: 2, name: "Ampak-2" },
      { id: 3, name: "Ledena Voda-3" },
      { id: 4, name: "Hladilnici-4" },
      { id: 5, name: "Kompresorno-5" },
      { id: 6, name: "Priemno-6" },
      { id: 7, name: "Trafo#1-7" },
    ];
    const header = [
      "Meter Name",
      "Active Energy",
      "Voltage L1",
      "Voltage L2",
      "Voltage L3",
      "Current L1",
      "Current L2",
      "Current L3",
      "Active power L1",
      "Active power L2",
      "Active power L3",
      "Power factor L1",
      "Power factor L2",
      "Power factor L3",
      "Total active power",
    ];
    const totalPowerData = await getMetersValue(dataPrep);
    console.log();
    const names = totalPowerData.map((item) => item.name);
    const values = totalPowerData.map((item) => item.value);
    const combined = totalPowerData.map((item) => [
      item.name,
      item.value,
      item.voltageL1,
      item.voltageL2,
      item.voltageL3,
      item.currentL1,
      item.currentL2,
      item.currentL3,
      item.activePowerL1,
      item.activePowerL2,
      item.activePowerL3,
      item.powerFactorL1,
      item.powerFactorL2,
      item.powerFactorL3,
      item.totActivePower,
    ]);
    combined.unshift(header);

    console.log("Exel Date:", combined);

    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.aoa_to_sheet(combined);
    XLSX.utils.book_append_sheet(workbook, worksheet, getTodaysDate());
    XLSX.writeFile(workbook, "output.xlsx");
    console.log("Excel file has been created successfully.");
  }

  main();
}

await welcome();
//await askForKey();
//await askForPort();
await mainScreen();
