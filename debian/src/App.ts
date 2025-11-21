import { loadConfig } from "./config/LoadConfigData";
import { AppStatus } from "./domain/AppStatus";
import { ConfigData } from "./domain/ConfigData";

export default class App {
  static #instance: App;
  private state: AppStatus;
  private configData: ConfigData;

  public async loadConfigData(): Promise<ConfigData | null> {
    console.log("Loading config data...");
    try {
      this.configData = await loadConfig<ConfigData>(
        "config.json"
      );
    } catch (err) {
      console.error("Loading config failed:", err);
      this.configData = {
        companyName: "defaultCompany",
        hostname: "defaultHost",
        baudRate: 9600,
        port: "COM3",
        readTime: 10,
      };
    }
    console.log("Config data loaded:", this.configData);
    return this.configData;
  }

  private constructor() {
    this.state = {
      lastInput: "AppendMode created",
      networkStatus: "OK",
    };

    this.configData = {
      companyName: "defaultCompany",
      hostname: "defaultHost",
      baudRate: 9600,
      port: "/dev/ttyUSB0",
      readTime: 10,
    };
  }

  public static getInstance(): App {
    if (!App.#instance) {
      App.#instance = new App();
    }

    return App.#instance;
  }

  public getState(): AppStatus {
    return this.state;
  }

  public getConfigData(): ConfigData {
    return this.configData;
  }
}
