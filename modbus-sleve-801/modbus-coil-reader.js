const ModbusRTU = require("modbus-serial");

// Modbus client configuration
const SERVER_HOST = "localhost";
const SERVER_PORT = 502;
const SLAVE_ADDRESS = 801;

// Create a Modbus client
const client = new ModbusRTU();

async function readCoils() {
  try {
    console.log("🔌 Connecting to Modbus server...");

    // Connect to the Modbus TCP server
    await client.connectTCP(SERVER_HOST, {
      port: SERVER_PORT,
    });

    // Set the unit ID (slave address)
    client.setID(SLAVE_ADDRESS);

    console.log(
      `✅ Connected to Modbus server at ${SERVER_HOST}:${SERVER_PORT}`
    );
    console.log(`📍 Using Slave Address: ${SLAVE_ADDRESS}`);
    console.log("=".repeat(60));

    // Read individual coils
    console.log("📖 Reading Individual Coils:");
    console.log("-".repeat(40));

    // Read coils 0, 1, and 5 (which we know have data from the server)
    const coilsToRead = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];

    for (const coilAddr of coilsToRead) {
      try {
        const result = await client.readCoils(coilAddr, 1);
        console.log(
          `Coil ${coilAddr.toString().padStart(2)} (${(
            coilAddr + 1
          )
            .toString()
            .padStart(5)}): ${
            result.data[0] ? "ON " : "OFF"
          } (${result.data[0]})`
        );
      } catch (err) {
        console.log(
          `Coil ${coilAddr.toString().padStart(2)} (${(
            coilAddr + 1
          )
            .toString()
            .padStart(5)}): ERROR - ${err.message}`
        );
      }
    }

    console.log("\n" + "=".repeat(60));
    console.log("📖 Reading Multiple Coils at Once:");
    console.log("-".repeat(40));

    // Read multiple coils at once (coils 0-9)
    try {
      const multipleCoils = await client.readCoils(0, 10);
      console.log("Coils 0-9 status:");
      multipleCoils.data.forEach((coil, index) => {
        console.log(
          `  Coil ${index.toString().padStart(2)} (${(
            index + 1
          )
            .toString()
            .padStart(5)}): ${
            coil ? "ON " : "OFF"
          } (${coil})`
        );
      });
    } catch (err) {
      console.error(
        "Error reading multiple coils:",
        err.message
      );
    }

    console.log("\n" + "=".repeat(60));
    console.log(
      "🔄 Continuous Monitoring (Press Ctrl+C to stop)"
    );
    console.log("-".repeat(40));

    // Continuous monitoring
    let monitorCount = 0;
    const monitorInterval = setInterval(async () => {
      try {
        monitorCount++;
        console.log(
          `\n📊 Monitor Update #${monitorCount} - ${new Date().toLocaleTimeString()}`
        );

        // Read the first 6 coils for monitoring
        const monitorCoils = await client.readCoils(0, 6);
        console.log("Current Coil Status:");
        monitorCoils.data.forEach((coil, index) => {
          const status = coil ? "🟢 ON " : "🔴 OFF";
          console.log(`  Coil ${index}: ${status}`);
        });
      } catch (err) {
        console.error("❌ Monitor error:", err.message);
      }
    }, 3000); // Update every 3 seconds

    // Handle graceful shutdown
    process.on("SIGINT", async () => {
      console.log("\n🛑 Stopping coil reader...");
      clearInterval(monitorInterval);
      try {
        await client.close();
        console.log("✅ Connection closed successfully");
      } catch (err) {
        console.error(
          "Error closing connection:",
          err.message
        );
      }
      process.exit(0);
    });
  } catch (err) {
    console.error("❌ Connection error:", err.message);
    console.log(
      "\n💡 Make sure the Modbus slave server is running:"
    );
    console.log("   node modbus-slave-standalone.js");
    process.exit(1);
  }
}

// Function to write coils (bonus feature)
async function writeCoil(coilAddress, value) {
  try {
    console.log(
      `\n📝 Writing Coil ${coilAddress} = ${
        value ? "ON" : "OFF"
      }`
    );
    await client.writeCoil(coilAddress, value);
    console.log(
      `✅ Successfully wrote coil ${coilAddress}`
    );

    // Read back to confirm
    const result = await client.readCoils(coilAddress, 1);
    console.log(
      `📖 Confirmed: Coil ${coilAddress} is now ${
        result.data[0] ? "ON" : "OFF"
      }`
    );
  } catch (err) {
    console.error(
      `❌ Error writing coil ${coilAddress}:`,
      err.message
    );
  }
}

// Function to demonstrate writing coils
async function demonstrateWriteCoils() {
  console.log("\n" + "=".repeat(60));
  console.log("✏️  Demonstrating Coil Writing:");
  console.log("-".repeat(40));

  // Write some test values
  await writeCoil(2, true); // Turn ON coil 2
  await writeCoil(3, false); // Turn OFF coil 3
  await writeCoil(4, true); // Turn ON coil 4
}

// Handle command line arguments
const args = process.argv.slice(2);
if (args.length > 0) {
  const command = args[0].toLowerCase();

  if (command === "write" && args.length >= 3) {
    // Usage: node modbus-coil-reader.js write <coil_address> <value>
    const coilAddr = parseInt(args[1]);
    const coilValue =
      args[2].toLowerCase() === "true" || args[2] === "1";

    client
      .connectTCP(SERVER_HOST, { port: SERVER_PORT })
      .then(() => {
        client.setID(SLAVE_ADDRESS);
        return writeCoil(coilAddr, coilValue);
      })
      .then(() => client.close())
      .catch((err) => {
        console.error("Error:", err.message);
        process.exit(1);
      });
    return;
  }

  if (command === "demo-write") {
    // Usage: node modbus-coil-reader.js demo-write
    client
      .connectTCP(SERVER_HOST, { port: SERVER_PORT })
      .then(() => {
        client.setID(SLAVE_ADDRESS);
        return demonstrateWriteCoils();
      })
      .then(() => client.close())
      .catch((err) => {
        console.error("Error:", err.message);
        process.exit(1);
      });
    return;
  }
}

// Default behavior - start reading coils
console.log("🚀 Modbus Coil Reader Starting...");
console.log("=".repeat(60));
readCoils();

// Handle uncaught exceptions
process.on("uncaughtException", (err) => {
  console.error("❌ Uncaught Exception:", err.message);
  process.exit(1);
});

process.on("unhandledRejection", (reason, promise) => {
  console.error("❌ Unhandled Rejection:", reason);
  process.exit(1);
});
