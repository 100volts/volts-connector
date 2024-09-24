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
let meterSettingsResponse=[]
let accesToken;
const nextRead=new Date();
const allMetersHaveBeenRead=false;
const minReadTime=new Date();

const sleep = (ms = 2000) => new Promise((r) => setTimeout(r, ms));//2 mins

//TODO this will be part of the read for every meter
const client = new ModbusRTU();

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
  console.clear();
  const msg = "Working";
  figlet(msg, (err, data) => {
    console.log(gradient.pastel.multiline(data));
  });
  try{
    await readMeters();
  }catch(e){
    console.error("Error in mainScreen",e);
    await reportError(e);
    await login();
    await setMitterSettings();
    await welcome();
    await mainScreen();
  }
  console.log("Minsleep time",sleepTime);
  await sleep(sleepTime);
  await mainScreen();
}

async function reportError(e){
  console.log("Error in mainScreen",e);
  const response = await fetch(
    `http://${urladdress}:8081/connector/report`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accesToken}`,
      },
      body:JSON.stringify({
        "company_name":"Markeli",
        "content":e.toString(),
        "time_stamp": formatDateForTs(new Date())
      })  
    }
  );
  if (!response.ok) {
    throw new Error("Network response was not ok : "+formatDateForTs(new Date()));
  }
  const datat = await response.json();
  const { settings } = datat;
  meterSettingsResponse=settings;
  console.log("Meter settings: ",meterSettingsResponse);

}

function formatDateForTs(date) {
  const pad = (num) => num.toString().padStart(2, '0');

  const year = date.getFullYear();
  const month = pad(date.getMonth() + 1); // getMonth() returns 0-11
  const day = pad(date.getDate());
  const hours = pad(date.getHours());
  const minutes = pad(date.getMinutes());
  const seconds = pad(date.getSeconds());

  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

async function sendMerterDataRequestPost(postMeterData) {
  console.log("Post meter data",postMeterData);
  try{
    const meterOptions = {
      hostname: urladdress,
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
        reportError(e);
        //reject(`Problem with request: ${e.message}`);
      });
      req.write(postMeterData);
      req.end();
    });
  } catch (e) {
    await reportError(e)
    console.log("Error in getMetersValue",e);
    throw new Error("Error in getMetersValue",e);
  } 
}
const sleepALot = (ms = 60000) => new Promise((r) => setTimeout(r, ms));

async function readMeters() {
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
      reportError("Invalid number of registers. Floating-point decoding requires exactly two 16-bit registers.");
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
      reportError("Invalid number of registers. Floating-point decoding requires exactly four 16-bit registers.");
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

  const getMetersValue = async (meters) => {
    console.log("Get meters value",meters);
    var volatageMeter = [];
    try {
      // get value of all meters
      for (let meter of meters) {
        await sleep(50);
        let activePowerData;
        let len2Data;
        try{
          const timeout = new Promise((_, reject) => setTimeout(() => reject(new Error("Timeout")), 10000)); // 5 seconds timeout
          activePowerData = await Promise.race([getMeterValue(meter.address), timeout]);
          len2Data = await Promise.race([getMeterValueLen2(meter.address), timeout]);
          console.log("Len 2 data",len2Data);
        }catch (e) {
          await reportError(e)
        }
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
          merterId: meter.address,
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
        await sendMerterDataRequestPost(postMeterData);
        await sleep(100);
      }
    } catch (e) {
      await reportError(e)
      console.log("Error in getMetersValue",e);
      throw new Error("Error in getMetersValue",e);
    } finally {
      //TODO add post to server here
      console.log("Volatage meter",volatageMeter);
      return volatageMeter;
    }
    };
  const getMeterValue = async (id) => {
    console.log("getMeterValue id:", id);
    try {
      client.setID(id);
      console.log("client.setID(id) id:", client.getID());
      console.log("client open id: ", client.isOpen);
      let val;
      client.on('error', async (error) => {
        await reportError(error);
        console.error('Modbus error:', error);
        throw new Error("Error in Modbus operation", error);
      });
      try {
        console.log("Checking if client ID can be reached...");
        await client.readInputRegisters(801, 4); // Attempt to read a known register
      } catch (e) {
        console.error("Client ID cannot be reached:", e);
        throw new Error("Client ID cannot be reached", e);
      }
      try {
        const res = await client.readInputRegisters(801, 4); // Await the readInputRegisters call
        console.log("readInputRegisters(801, 4) id:", id);
        val = modbusRegistersToDouble(res.data);
      } catch (e) {
        throw new Error("Error in getMeterValue id is not found ", e);
      }
      return val;
    } catch (e) {
      client.close();
      throw new Error("Error in getMeterValue id is not found ", e);
    }
  };

  const getMeterValueLen2 = async (id) => {
    console.log("getMeterValueLen2 with id:",id)
    const addresses = [1, 3, 5, 13, 15, 17, 25, 27, 29, 37, 39, 41, 65]; //all addresses for len2
    let allFoundAddressData = [];
    for (let address of addresses) {
      try {
        client.setID(id);
        let val = await client.readInputRegisters(address, 2).then((res) => {
          allFoundAddressData.push(decodeFloat(res.data));
        });
      } catch (e) {
        throw new Error("Error in getMeterValueLen2 id is not found ",e);
      }
    }
    console.log("Len 2 Volt data", allFoundAddressData);
    return allFoundAddressData;
  };

  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  async function main() {
    try{
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
      const totalPowerData = await getMetersValue(meterSettingsResponse);
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
      meterSettingsResponse.forEach(async (meter) => {
        meter.lastTimeRead=new Date();
        meter.nextTimeRead=new Date(meter.lastTimeRead.getTime()+meter.timeGapRead);
        console.log("meter.nextTimeRead",meter.nextTimeRead)
        sleepTime=Math.abs(meter.nextTimeRead-new Date());
        console.log("sleepTime",sleepTime);
      })
      console.log("Exel Date:", combined);
      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.aoa_to_sheet(combined);
      XLSX.utils.book_append_sheet(workbook, worksheet, getTodaysDate());
      XLSX.writeFile(workbook, "output.xlsx");
      console.log("Excel file has been created successfully.");
    }catch(e){
      reportError(e)
      throw new Error("Error in first read ",e);
    }
  }
  
  async function readMeters(meter) {
    try{
      console.log("Read meters for meter in th read meter function duh",meter.name);
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
      const totalPowerData = await getMetersValue([meter]);
      console.log("totalPowerData",totalPowerData);
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
      meter.lastTimeRead=new Date();
      meter.nextTimeRead=new Date(meter.lastTimeRead.getTime()+meter.timeGapRead-10);
      console.log("mater name: ",meter.name);
      console.log("meter.nextTimeRead",meter.nextTimeRead);
    }catch(e){
      reportError(e)
      console.error("Error in readMeters",e);
      throw new Error("Error in first read ",e);
    }
  }
  try{
    if(firstRun){
      await main();
      firstRun=false;
    }else{
      for(let meter of meterSettingsResponse){
        console.log("Meter anme", meter.name);
        console.log("meter.nextTimeRead in the for each", meter.nextTimeRead);
        console.log("Date new in the for each", new Date());
        console.log("Data check", meter.nextTimeRead <= new Date());
        if (meter.nextTimeRead <= new Date()) {
          console.log("Metter to read", [meter]);
          await readMeters(meter);
        }
      }
    }
  }catch(e){
    await reportError(e)
    throw new Error("When readind meter",e);
  }
}
let sleepTime=0;
async function checkNexRead(nextreadTime){
  if(new Date()<nextreadTime){  }else{
    //console.log("Next read is HERE!!: ",nextRead.getMinutes());
    //await setNextRead();
  }
}
let firstRun=true;

async function comInit() {
  try {
    await client.connectRTUBuffered("COM3", { baudRate: 9600 }); // Added await here
    client.setID(1);
    client.on('error', async (error) => { // Added async here
      await reportError(error); // Added await here
      console.error('Modbus error:', error);
      throw new Error("Error in getMeterValue id is not found ", error);
    });
  } catch (e) {
    await reportError(e);
    throw new Error("Error in comInit", e);
  }
}

await login();
await comInit();
await setMitterSettings();
await welcome();
await mainScreen();