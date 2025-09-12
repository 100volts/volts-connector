async function app2() {
  console.log("Hello, app is running");
  try {
    const configData: ConfigData = await loadConfig();
    console.log("Config data: ", configData);
    const token = await login(configData.hostname); // wait for login and get the token
    console.log("Token received in index.ts:", token);

    // Function to send meter data
    const sendMeterData = async () => {
      try {
        const meterData = await ReadMeters();
        await postMeterData(meterData, "localhost", token);
        console
          .log
          //chalk.green("Data sent at"),
          //chalk.yellow(new Date().toLocaleTimeString())
          ();

        // Display as a table
        /*console.log(chalk.blue.bold("\nLast meter data:"));
        console.log(
          chalk.bold(
            `${"ID".padEnd(5)}${"Name".padEnd(
              20
            )}${"Active Import".padEnd(
              15
            )}${"Active Export".padEnd(
              15
            )}${"Reactive Import".padEnd(
              17
            )}${"Reactive Export".padEnd(
              17
            )}${"Apparent".padEnd(10)}${"Recorded At"}`
          )
        );
        meterData.forEach((meter: any) => {
          console.log(
            `${chalk.cyan(
              meter.meterId.toString().padEnd(5)
            )}` +
              `${chalk.magenta(meter.name.padEnd(20))}` +
              `${chalk.green(
                meter.energyActiveImport
                  .toFixed(2)
                  .padEnd(15)
              )}` +
              `${chalk.red(
                meter.energyActiveExport
                  .toFixed(2)
                  .padEnd(15)
              )}` +
              `${chalk.yellow(
                meter.energyReactiveImport
                  .toFixed(2)
                  .padEnd(17)
              )}` +
              `${chalk.yellowBright(
                meter.energyReactiveExport
                  .toFixed(2)
                  .padEnd(17)
              )}` +
              `${chalk.white(
                meter.energyApparent.toFixed(2).padEnd(10)
              )}` +
              `${chalk.gray(meter.recordedAt)}`
          );
        });*/
      } catch (err) {
        console.error(
          //chalk.bgRed("Error sending meter data:"),
          err
        );
      }
    };

    // Initial call
    await sendMeterData();

    // Repeat every 15 minutes
    setInterval(sendMeterData, 15 * 60 * 1000);
  } catch (err) {
    console.error("Login failed:", err);
  }
}
