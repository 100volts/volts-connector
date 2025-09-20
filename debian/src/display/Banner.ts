import figlet from "figlet";
import chalk from "chalk";

// Promise wrapper around figlet.text
function fig(text: string, font: any = "Standard"): Promise<string> {
  return new Promise((resolve, reject) => {
    figlet.text(text, { font }, (err, data) => {
      if (err || !data) reject(err);
      else resolve(data);
    });
  });
}

export default async function showBanner(
  text: string = "100 SQ",
  font: any = "Slant"
): Promise<void> {
  try {
    const ascii = await fig(text, font);
    console.log(chalk.cyan(ascii));
  } catch (error) {
    console.error("Figlet error:", error);
  }
}

