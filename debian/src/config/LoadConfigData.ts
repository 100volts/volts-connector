import {ConfigData} from "../domain/ConfigData"
import fs from 'fs';

export function loadConfig(): Promise<ConfigData> {
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