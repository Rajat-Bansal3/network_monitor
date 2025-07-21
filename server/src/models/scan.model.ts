const mongoose = require("mongoose");

const interfaceSchema = new mongoose.Schema({
  name: String,
  mac_address: String,
  status: String,
  mtu: Number,
  ipv4_addresses: [String],
  ipv4_subnets: [Number],
  ipv6_addresses: [String],
  default_gateway: String,
  network_devices: [String],
});

const scanSchema = new mongoose.Schema(
  {
    timestamp: { type: Date, required: true },
    hostname: { type: String, required: true },
    interfaces: [interfaceSchema],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Scan", scanSchema);
