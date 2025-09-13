import { writeFileSync } from "fs";
import { promises as fs } from "fs";

export async function writeTimeSheetToJson<T>(fileName: string, data: T): Promise<void> {
    try {
      const jsonData = JSON.stringify(data, null, 2); // Pretty JSON
      await fs.writeFile(fileName, jsonData, "utf8");
      console.log(`File saved successfully to ${fileName}`);
    } catch (err: any) {
      throw new Error(`Error writing file: ${err.message}`);
    }
  }
