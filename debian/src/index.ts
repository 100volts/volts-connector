import { login } from "./login";


async function app() {
    console.log("Hello, app is running");
    try {
        const token = await login(); // wait for login and get the token
        console.log("Token received in index.ts:", token);
    } catch (err) {
        console.error("Login failed:", err);
    }
}


app()