import jwt from 'jsonwebtoken';
import RequestLog from './../models/requestLogs.model.js';
import config from '../config/env.config.js';



const getIpDetails = (req) => {
  return {
      clientIp: req.headers['x-forwarded-for']?.split(',')[0].trim() || 
                req.headers['x-real-ip'] || 
                req.headers['x-client-ip'] || 
                req.socket.remoteAddress, // Best guess for real client IP
      xForwardedFor: req.headers['x-forwarded-for'] || '',
      xRealIp: req.headers['x-real-ip'] || '',
      xClientIp: req.headers['x-client-ip'] || '',
      remoteAddress: req .socket.remoteAddress || '',
      reqIP: req.ip
  };
};

const requestLoggerMiddleware = async (req, res, next) => {
  const start = Date.now(); // Track response time
  let userId = null;
  let errorMessage = null; // Variable to store the error message

  try {
    // Check token in headers or cookies
    const token = req.headers.authorization?.split(' ')[1] || req.cookies?.token;
    
    if (token && token !== null) {
      const decodedToken = jwt.verify(token, config.jwt.secret); // Replace with your JWT secret
      userId = decodedToken?.id || null; // Assuming the token contains the user's ID
    }
  } catch (error) {
    console.error('Error decoding token:', error);
  }

  // Intercept and capture response data
  const originalSend = res.send;
  let responseData;

  res.send = function (body) {
    // Check if the response body is a valid JSON string
    try {
      // If the body is a JSON string, parse it
      responseData = JSON.parse(body);
    } catch (error) {
      // If it's not JSON, keep it as a plain string
      responseData = body;
    }

    // Call the original res.send
    return originalSend.apply(this, arguments);
  };
  req.ipDetails = getIpDetails(req);

  // Capture errors during the response process
  res.on('finish', async () => {
    try {
      // If the response status code indicates an error, log the error message
      if (res.statusCode >= 400) {
        errorMessage = responseData?.message || 'Unknown error occurred';
      }

      const logEntry = new RequestLog({
        requestType: req.headers['content-type'] || 'Unknown',
        requestStatus: res.statusCode >= 400 ? 'Failed' : 'Successful',
        errors: errorMessage, // Capture the error message here
        ipAddress: getIpDetails(req),
        origin: req.headers.origin || 'Unknown',
        requestMethod: req.method,
        requestUrl: req.originalUrl,
        requestHeaders: req.headers,
        requestBody: req.body,
        responseStatus: res.statusCode,
        responseBody: responseData, // Use the captured response data
        user: userId,
        createdAt: new Date(),
      });

      await logEntry.save();
    } catch (error) {
      console.error('Error saving request log:', error);
    }
  });

  next();
};

export default requestLoggerMiddleware;
