import { LoginResponse } from "./domain/LoginResponse"; // adjust path if needed

let accessToken;
const urlAddress="localhost"

const loginData = JSON.stringify({
    email: "plamen@mail.com",
    password: "12345678",
});



export async function login(): Promise<string> {
  const response = await fetch(`http://${urlAddress}:8081/api/vi/auth/authenticate`, {
      method: "POST",
      headers: {
          "Content-Type": "application/json",
      },
      body: loginData,
  });

  if (!response.ok) {
      throw new Error("Network response was not ok");
  }

  const data: LoginResponse = await response.json();
  accessToken = data.access_token;
  console.log("Token:", accessToken);

  return accessToken; // return it so index.ts can use it
}
