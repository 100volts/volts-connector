let spinnerInterval: NodeJS.Timeout | null = null;

export function startLoadingSpinner(message: string = "Loading") {
  const spinnerChars = ['|', '/', '-', '\\'];
  let i = 0;
  spinnerInterval = setInterval(() => {
    process.stdout.write(`\r${message} ${spinnerChars[i++ % spinnerChars.length]}`);
  }, 100);
}

export function stopLoadingSpinner(finalMessage: string = "Done!") {
  if (spinnerInterval) {
    clearInterval(spinnerInterval);
    spinnerInterval = null;
    process.stdout.write(`\r${finalMessage}\n`);
  }
}