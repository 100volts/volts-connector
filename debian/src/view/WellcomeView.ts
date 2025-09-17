import figlet from "figlet";

async function wellcome() {
  // Render the main title using figlet
  const title = figlet.textSync("volts-controller", {
    font: "Slant", // More slanted font
    horizontalLayout: "default",
    verticalLayout: "default",
  });

  // Render the subtitle using figlet (even smaller and slanted)
  const subtitle = figlet.textSync("made by 100sq", {
    font: "Small", // Smallest and slanted font available
    horizontalLayout: "default",
    verticalLayout: "default",
  });

  console.log(title);
  console.log(subtitle);
}

export default wellcome;
