import express from "express";
import dotenv from "dotenv";

dotenv.config();
const app = express();

const PORT = process.env.PORT || 3000;
const ipApiKey = process.env.IP_API_KEY;
const weatherApiKey = process.env.W_API_KEY;
const production = process.env.productionBaseUrl;
// Middleware
app.use((req, res, next) => {
  let ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress;
  console.log("ip", ip);
  // If x-forwarded-for contains multiple IPs, take the first one
  if (ip.includes(",")) {
    ip = ip.split(",")[0].trim();
  }
  // Check for IPv6-mapped IPv4 address
  if (ip.startsWith("::ffff:")) {
    ip = ip.replace("::ffff:", "");
  }
  // Validate the IP address
  // if (!ipValidator.isV4Format(ip) && !ipValidator.isV6Format(ip)) {
  //   return res.status(400).json({ error: "Invalid IP address" });
  // }
  // console.log("Client IP:", ip);
  req.clientIp = ip;
  next();
});

// const getClientIp = async (req) => {
//   if (process.env.NODE_ENV === production) {
//     // When in production use the request headers
//     const getClientIp = (req) => {
//       const forwarded = req.headers["x-forwarded-for"];
//       const clientIp = forwarded
//         ? forwarded.split(",").shift()
//         : req.connection.remoteAddress;
//       return clientIp;
//     };
//   } else {
//     // When running locally, fetch the IP using an external service
//     const ipUrl = `https://api.ipify.org?format=json`;
//     const response = await fetch(ipUrl);
//     if (!response.ok) {
//       throw new Error(`IP Fetch HTTP error! status: ${response.status}`);
//     }
//     const data = await response.json();
//     return data.ip;
//   }
// };

const getLocationFromIp = async (ip) => {
  const locationUrl = `https://api.ip2location.io/?key=${ipApiKey}&ip=${ip}`;
  const response = await fetch(locationUrl);
  if (!response.ok) {
    throw new Error(`Location API HTTP error! status: ${response.status}`);
  }
  const data = await response.json();
  return {
    client_ip: data.ip,
    client_city: data.city_name,
  };
};

const getWeatherData = async (city) => {
  const weatherUrl = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${weatherApiKey}&units=metric`;
  const response = await fetch(weatherUrl);
  if (!response.ok) {
    throw new Error(`Weather API HTTP error! status: ${response.status}`);
  }
  const data = await response.json();
  return {
    temperature: data.main.temp,
    city: data.name,
  };
};

app.get("/api/hello", async (req, res) => {
  const visitorName = req.query.visitor_name || "Mark";
  const newIp = req.headers["x-forwarded-for"] || req.socket.remoteAddress;
  // console.log("newIp", newIp);
  try {
    const clientIp = req.clientIp;
    const location = await getLocationFromIp(clientIp);
    const weather = await getWeatherData(location.client_city);

    res.json({
      client_ip: location.client_ip,
      client_city: location.client_city,
      greeting: `Hello, ${visitorName}!, the weather is ${weather.temperature} degree Celsius in ${weather.city}`,
    });
  } catch (error) {
    console.error(error);
    res.status(500).send("Error fetching data");
  }
});

app.listen(PORT, () => {
  console.log(`App running on port ${PORT}`);
});
