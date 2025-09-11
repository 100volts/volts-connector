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
import fs from 'fs';

let errorFlagCom=true;
let welcomeFlag=true;
const config = await loadConfig();
//global variable for key & port
let key;
const { port, baudRate,readTime,hostname } = config;

let client = new ModbusRTU();
let brRefreshes=0;

//helper function
const sleep = (ms = 2000) => new Promise((r) => setTimeout(r, ms));
//const sleepALot = (ms = 120000) => new Promise((r) => setTimeout(r, ms));//this is 2 mins

const sleepALot = (ms = 60000) => new Promise((r) => setTimeout(r, ms));

function loadConfig() {
  return new Promise((resolve, reject) => {
    fs.readFile('config.json', 'utf8', (err, data) => {
      if (err) {
        reject(`Error reading config file: ${err.message}`);
      } else {
        resolve(JSON.parse(data)); // Parse JSON data
      }
    });
  });
}

async function initCOM(){
  try {
      await client.connectRTUBuffered(port, { baudRate: baudRate });
      client.setID(1);
      errorFlagCom = true;
  } catch (error) {
      console.error(`Cannot initialize connection. Please plug in the USB connection to port ${port}. Error:`, error);
      await inputErrorHandling()
      errorFlagCom = false;
  }
}

async function inputErrorHandling() {
  process.on("uncaughtException", async (err) => {
    console.clear()
    errorFlagCom=false;
    console.error(`Cannot initialize connection. Please plug in the USB connection to port ${port}. Error:`);
  });
  process.clear
}

async function welcome() {
  if(errorFlagCom){
  const title = chalkAnimation.neon("Volts-Connector \n");
  await sleep();
  title.stop();
  console.log(`
    ${chalk.bgBlue("Welcome to the controller")}
    The application need to run indefinatly for all meters to be read
        `);
  }
  await sleep();
  console.clear();
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
  try{
    const portInput = await inquirer.prompt({
      name: "connector_port",
      type: "list", // This creates a selection menu
      message: "What is the connector port?",
      choices: ["COM1", "COM2", "COM3", "TtyS0", "TtyS1"], // Predefined options
      default() {
        return "TtyS0"; // Default selection
      },
    });s
    port = portInput.connector_port;
    console.log(port);
  }catch (err) {
    console.error('Connection error:', err.message);
  }
}

async function runRead() {
  if (!client.isOpen) {
    console.log("Initializing COM connection...");
    await initCOM();
    await sleep();
  }
  if(errorFlagCom){
    const msg = "Volts-Controller";
      console.log(gradient.retro.multiline(msg));

        await mainScreen();
  }
}

async function mainMenu() {
  //testing for client
  if (!client.isOpen) {
    console.log("Initializing COM connection...");
    await initCOM();
    await sleep();
  }
  if(errorFlagCom){
    const msg = "Volts-Controller";
      console.log(gradient.retro.multiline(msg));

    console.log("")
    const optionSelected = await inquirer.prompt({
      name: "option",  // Changed from company_key to option
      type: "list",
      message: "Select an option",
      choices: [
        {
          name: 'Read meter',
          value: '0',
          description: 'Reads the elctric meter as per settings',
        },
        {
          name: 'Settings',
          value: '1',
          description: 'All settings for the controller',
          disabled: true,
        },
        {
          name: 'Read 15 min load',
          value: '2',
          disabled: true,
        },
        {
          name: 'Escape',
          value: '9',
          disabled: true,
        },
      ],
    });

    // Handle the selected option
    switch(optionSelected.option) {
      case '0':
        await mainScreen();
        break;
      case '1':
        // Add settings logic here
        console.log('Settings selected');
        break;
      case '9':
        console.log('Exiting menu...');
        break;
      default:
        console.log('Invalid option');
    }
  }
}

const postData = JSON.stringify({
  email: "plamen@mail.com",
  password: "12345678",
});
const options = {
  hostname: hostname,
  port: 8081,
  path: "/api/vi/auth/authenticate",
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "Content-Length": Buffer.byteLength(postData),
  },
};
let errFlag=false;
let reqdata;
let accesToken;
async function sendPostRequest() {
  errFlag=false;
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
          resolve("");
        }
      });
    });
    
    req.setTimeout(5000, () => {
      console.log("Request timed out");
      errFlag = true;
      req.destroy();
      resolve("");
    });

    req.on("error", (e) => {
      console.log(`Problem with request get auth: ${e.message}`);
      errFlag = true;
      resolve("");
      req.destroy();
    });

    if(!errFlag) {
      req.write(postData);
    }
    req.end();
  });
}

async function sendMerterDataRequestPost(postMeterData) {
  const meterOptions = {
    hostname: hostname,
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
      reject(`Problem with request sed meter data: ${e.message}`);
    });
    req.write(postMeterData);
    req.end();
  });
}

async function postElMeterData() {
  await sendPostRequest().then((data) => (reqdata = data));
}
let flagSendDataToServer=true;
async function mainScreen() {
  brRefreshes=brRefreshes+1;
  if(errorFlagCom){
    console.clear();
    try {
      const msg = "Reading meter";
      figlet(msg, (err, data) => {
        if (err) throw new Error("Figlet error: " + err.message);
        console.log(gradient.pastel.multiline(data));
      });

      // Add key listener for exit
      console.log("\nPress 'q' to return to main menu...");
      console.log("brRefreshes",brRefreshes)
      readline.emitKeypressEvents(process.stdin);
      process.stdin.setRawMode(true);
      flagSendDataToServer=true;
      // Set up timer for 1 hour (3600000 milliseconds)
      const timer = setTimeout(() => {
        console.log('\nOne hour passed, returning to main menu...');
        process.stdin.setRawMode(false);
        process.stdin.removeAllListeners('keypress');
        mainScreen();
        return;
      }, readTime);

      process.stdin.on('keypress', (str, key) => {
        if (key.name === 'q') {
          clearTimeout(timer); // Clear the timer when 'q' is pressed
          console.log('\nReturning to main menu...');
          process.stdin.setRawMode(false);
          process.stdin.removeAllListeners('keypress');
          mainMenu();
          return;
        }
      });
      try{
        // Continue with normal operation
        await postElMeterData();
        if (reqdata) {
          const jsonObject = JSON.parse(reqdata);
          console.log("Token:", jsonObject["access_token"]);
          accesToken = jsonObject["access_token"];
        } else {
          console.log("No data received from server");
          errFlag = true;
        }
      }catch(e){
        flagSendDataToServer=false;
      }
      await readMeters();
      //await sleepALot();
      //await mainScreen();
      //await mainMenu();
    } catch (err) {
      console.error("Error in mainScreen:", err);
      console.log("Returning to main screen...");
      await sleep(1000);

      //mainMenu();
    } finally{
      await mainMenu();
    }
  }
}

async function readMeters() {
  //set up modbus for reading

  function getTodaysDate() {
    const today = new Date();

    const day = String(today.getDate()).padStart(2, "0");
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const year = today.getFullYear();

    const formattedDate = `${day}-${month}-${year}`;
    console.log("Current worksheet date:", formattedDate);
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
        const now = new Date();
        const postMeterData = JSON.stringify({
          merterId: meter.id,
          timestamp: now.toISOString(), // Local time: "15:30:00"
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
          totalActiveEnergyImportTariff1: activePowerData.toFixed(2),
          totalActiveEnergyImportTariff2: 0,
        });
        await sleep(100);
        if(!errFlag){
          await sendMerterDataRequestPost(postMeterData);
          const fileData=await readAndFormatJsonData()
          //console.log("back up file data",fileData)
         if(fileData){
          for (const fD of fileData) {
            console.log("JSON.stringify(fD)",JSON.stringify(fD))
            await sendMerterDataRequestPost(JSON.stringify(fD));
          }
          clearStoredData();
          }
        }else{
          writeToJsonFile(postMeterData);
        }
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
      { id: 1, name: "TBA-8" },
      { id: 2, name: "Ampak" },
      { id: 3, name: "Ledena Voda" },
      { id: 4, name: "Hladilnici" },
      { id: 5, name: "Kompresorno" },
      { id: 6, name: "Priemno" },
      { id: 7, name: "Trafo#1-7" },
      { id: 8, name: "HOMO UHT" },
      { id: 9, name: "Priem KM" },
      { id: 10, name: "Priem UHT" },
    ];
    
    const header = [
      "Date",
      "Time",
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
    
    // Get current date and time
    const now = new Date();
    const date = now.toLocaleDateString();
    const time = now.toLocaleTimeString();

    // Add date and time to each row
    const combined = totalPowerData.map((item) => [
      date,
      time,
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

    let workbook;
    let worksheet;
    const todaySheet = getTodaysDate();

    // Try to read existing file
    try {
      workbook = XLSX.readFile('output.xlsx');
      worksheet = workbook.Sheets[todaySheet];
      
      if (!worksheet) {
        // If sheet for today doesn't exist, create new one with header
        console.log(`Creating new worksheet for ${todaySheet}`);
        worksheet = XLSX.utils.aoa_to_sheet([header]);
        XLSX.utils.book_append_sheet(workbook, worksheet, todaySheet);
        
        // Add the first data rows after header
        XLSX.utils.sheet_add_aoa(worksheet, combined, { origin: 1 });
      } else {
        console.log(`Appending to existing worksheet for ${todaySheet}`);
        // Get the current number of rows
        const range = XLSX.utils.decode_range(worksheet['!ref']);
        const startRow = range.e.r + 1;

        // Append new rows to existing worksheet
        XLSX.utils.sheet_add_aoa(worksheet, combined, { origin: startRow });
      }
    } catch (error) {
      // If file doesn't exist, create new workbook and worksheet
      console.log("Creating new Excel file with first worksheet");
      workbook = XLSX.utils.book_new();
      worksheet = XLSX.utils.aoa_to_sheet([header]);
      XLSX.utils.book_append_sheet(workbook, worksheet, todaySheet);
      
      // Add the first data rows after header
      XLSX.utils.sheet_add_aoa(worksheet, combined, { origin: 1 });
    }

    // Write to file
    XLSX.writeFile(workbook, "output.xlsx");
    console.log(`Excel file updated. Added ${combined.length} rows to worksheet ${todaySheet}`);
  }

  main();
}

async function app(){
  await sleep();
  if(welcomeFlag){
      await welcome();
      welcomeFlag = false; // Only show welcome once
  }
  await sleep();
  if(errorFlagCom){
      await runRead();
  } else {  
      console.log("Connection lost, requesting port...");
      await askForPort();
  }
}

function writeToJsonFile(newData) {
  return new Promise((resolve, reject) => {
    // First, try to read existing data
    fs.readFile('data.json', 'utf8', (readErr, existingData) => {
      let dataArray = [];
      
      // If file exists, parse its content
      if (!readErr) {
        try {
          dataArray = JSON.parse(existingData);
          if (!Array.isArray(dataArray)) {
            dataArray = [dataArray]; // Convert to array if it's a single object
          }
        } catch (parseErr) {
          console.error('Error parsing existing JSON:', parseErr);
          dataArray = []; // Start fresh if parsing fails
        }
      }

      // Add new data to array
      dataArray.push(newData);
      //console.log("newData",dataArray)
      // Write the updated array back to file
      const jsonData = JSON.stringify(dataArray, null,2);
      
      fs.writeFile('data.json', jsonData, 'utf8', (writeErr) => {
        if (writeErr) {
          console.error('Error writing to JSON file:', writeErr);
          reject(writeErr);
          return;
        }
        console.log('Data successfully appended to JSON file');
        console.log('Total records:', dataArray.length);
        resolve();
      });
    });
  });
}

// Function to read all saved data and format it
function readAndFormatJsonData() {
  return new Promise((resolve, reject) => {
    fs.readFile('data.json', 'utf8', (err, data) => {
      if (err) {
        if (err.code === 'ENOENT') {
          console.log('No saved data found');
          resolve([]);
          return;
        }
        console.error('Error reading JSON file:', err);
        reject(err);
        return;
      }

      try {
        // Parse the outer array
        const jsonStringsArray = JSON.parse(data);
        
        // Parse each string in the array into an object
        const formattedDataArray = jsonStringsArray.map(jsonString => {
          const jsonData = JSON.parse(jsonString);
          return {
            merterId: jsonData.merterId,
            voltagell1: jsonData.voltagell1,
            voltagell2: jsonData.voltagell2,
            voltagell3: jsonData.voltagell3,
            currentl1: jsonData.currentl1,
            currentl2: jsonData.currentl2,
            currentl3: jsonData.currentl3,
            activepowerl1: jsonData.activepowerl1,
            activepowerl2: jsonData.activepowerl2,
            activepowerl3: jsonData.activepowerl3,
            pfl1: jsonData.pfl1,
            pfl2: jsonData.pfl2,
            pfl3: jsonData.pfl3,
            totalActivePpower: jsonData.totalActivePpower,
            totalActiveEnergyImportTariff1: jsonData.totalActiveEnergyImportTariff1,
            totalActiveEnergyImportTariff2: jsonData.totalActiveEnergyImportTariff2,
            timestamp:jsonData.timestamp
          };
        });

        console.log(`Successfully parsed ${formattedDataArray.length} meter readings`);
        if (formattedDataArray.length > 0) {
          console.log('Sample reading:', formattedDataArray[0]);
        }

        resolve(formattedDataArray);
      } catch (parseErr) {
        console.error('Error parsing JSON data:', parseErr);
        reject(parseErr);
      }
    });
  });
}

function clearJsonFile() {
  return new Promise((resolve, reject) => {
    // Write an empty array to the file
    fs.writeFile('data.json', '[]', 'utf8', (err) => {
      if (err) {
        console.error('Error clearing JSON file:', err);
        reject(err);
        return;
      }
      console.log('Successfully cleared data.json');
      resolve();
    });
  });
}

async function clearStoredData() {
  try {
    await clearJsonFile();
    console.log('All stored meter readings have been cleared');
  } catch (err) {
    console.error('Failed to clear stored data:', err);
  }
}

await app();
