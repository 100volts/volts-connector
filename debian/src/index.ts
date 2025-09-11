import { login } from "./login";
import { loadConfig } from "./config/LoadConfigData" 
import { ConfigData } from "./domain/ConfigData";
import ReadMeters from "./modbus/ReadMeters" 
import postMeterData from "./SendMeterData"


async function app() {
    console.log("Hello, app is running");
    try {
        const configData : ConfigData = await loadConfig();
        console.log("Config data: ", configData)
        const token = await login(configData.hostname); // wait for login and get the token
        console.log("Token received in index.ts:", token);
        //console.log("Read data:", ReadMeters())
        postMeterData(await ReadMeters(),"localhost",token)
        console.log("data sent")
    } catch (err) {
        console.error("Login failed:", err);
    }
}


app()