const productionConfig = {
  corsOptions: {
    origin: "frontend",
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  },
  helmetOptions: {
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "https://trusted-scripts.com"],
        objectSrc: ["'none'"],
        upgradeInsecureRequests: [],
      },
    },
  },
  mongoOptions: {
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
    family: 4,
  },
};

export default productionConfig;
