// scripts/deploy.js
import fs from "fs";
import path from "path";
import hre from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with the account:", deployer.address);

  const Certificate = await ethers.getContractFactory("Certificate");
  const cert = await Certificate.deploy();
  
  console.log("Certificate address:", cert.address);
  console.log("University address set to:", deployer.address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
