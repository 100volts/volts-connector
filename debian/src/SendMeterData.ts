import http from "http";
import https from "https";
import fs from 'fs';
//to do make method to send data to server

export default async function postMeterData(postMeterDatam:any, hostname:string, accesToken:string){
    console.log("postMeterDatam",postMeterDatam)
    for(let meter of postMeterDatam) {
        try{
            console.log("sendMerterDataRequestPost1")
            await sendMerterDataRequestPost( JSON.stringify(meter), hostname, accesToken);
            //const fileData=await readAndFormatJsonData()
            //console.log("back up file data",fileData)
            /*
            for (const fD of fileData) {
            console.log("JSON.stringify(fD)",JSON.stringify(fD))
            await sendMerterDataRequestPost(JSON.stringify(fD), hostname, accesToken);
            }
            */
            //clearStoredData();
            
        }catch (e) {
            writeToJsonFile(postMeterData);
        }
    }
}

function writeToJsonFile(newData : any) : Promise<any> {
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
        resolve;
      });
    });
  });
}

async function sendMerterDataRequestPost(postMeterData:any, hostname:string, accesToken:string) {
    const meterOptions = {
      hostname: hostname,
      port: 8081,
      path: "/elmeter/data/electric_meter_energy_data",
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(postMeterData),
        Authorization: `Bearer ${accesToken}`,
      },
      protocol: "http:",
    };
    //console.log("postMeterData",postMeterData)
    //console.log("meterOptions",meterOptions)
    return new Promise((resolve, reject) => {
      //  console.log("meterOptions",meterOptions)
      const req = http.request(meterOptions, (res) => {
        let responseData = "";
        console.log("responseData",responseData)
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
  

function readAndFormatJsonData(): Promise<any> {
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
          // Parse the JSON file content once
          const jsonArray = JSON.parse(data);
  
          // Map objects directly
          const formattedDataArray = jsonArray.map((jsonData: any) => ({
            energyActiveImport: jsonData.energyActiveImport,
            energyActyveExport: jsonData.energyActyveExport,
            energyReactyveImport: jsonData.energyReactyveImport,
            energyReaktyveExport: jsonData.energyReaktyveExport,
            energyApparent: jsonData.energyApparent,
          }));
  
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
  

async function clearStoredData() {
    try {
      await clearJsonFile();
      console.log('All stored meter readings have been cleared');
    } catch (err) {
      console.error('Failed to clear stored data:', err);
    }
}

function clearJsonFile() {
  return new Promise((resolve: any, reject) => {
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
