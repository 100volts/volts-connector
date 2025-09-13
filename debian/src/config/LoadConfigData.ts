import {ConfigData} from "../domain/ConfigData"
import fs from 'fs';

export function loadConfig<T>(fileName: string): Promise<T> {
  return new Promise((resolve, reject) => {
    fs.readFile(fileName, 'utf8', (err, data) => {
      if (err) {
        reject(`Error reading config file: ${err.message}`);
      } else {
        resolve(JSON.parse(data));
      }
    });
  });
}