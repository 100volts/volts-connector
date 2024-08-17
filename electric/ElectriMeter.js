import ModbusRTU from "modbus-serial";
import getMeterValueLen2 from "../GetMeterValueLen2.js"
import getMeterValueLen4 from "../GetMeterValueLen4.js"

export default class{
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

    async readModbusData(){
        //Prep
        const client = new ModbusRTU();
        client.connectRTUBuffered("COM3", { baudRate: 9600 });
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

/*
const getMeterValue = async (address) => {
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

const getMeterValueLen2 = async (address) => {
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
*/