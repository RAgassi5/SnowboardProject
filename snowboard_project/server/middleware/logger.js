/**
 * Logger Middleware
 * Logs HTTP method, URL, timestamp, response status code, query params, and response time.
 */
const logger = (req, res, next) => {
  const start = Date.now();
  const timestamp = new Date().toISOString();

  // Capture the original res.end to intercept the status code after response is sent
  const originalEnd = res.end.bind(res);

  res.end = function (...args) {
    const duration = Date.now() - start;
    const queryString = Object.keys(req.query).length
      ? ` | Query: ${JSON.stringify(req.query)}`
      : "";

    console.log(
      `[${timestamp}] ${req.method} ${req.originalUrl} | Status: ${res.statusCode} | ${duration}ms${queryString}`
    );

    return originalEnd(...args);
  };

  next();
};

module.exports = logger;
