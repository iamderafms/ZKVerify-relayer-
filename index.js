import axios from 'axios';
import fs from 'fs';
import dotenv from 'dotenv';

dotenv.config();

const API_URL = 'https://relayer-api.horizenlabs.io/api/v1';
const proof = JSON.parse(fs.readFileSync("./data/proof.json"));
const publicInputs = JSON.parse(fs.readFileSync("./data/public.json"));
const key = JSON.parse(fs.readFileSync("./data/main.groth16.vkey.json"));

async function main() {
  const params = {
    "proofType": "groth16",
    "vkRegistered": false,
    "proofOptions": {
      "library": "snarkjs",
      "curve": "bn128"
    },
    "proofData": {
      "proof": proof,
      "publicSignals": publicInputs,
      "vk": key
    }
  };

  try {
    const requestResponse = await axios.post(`${API_URL}/submit-proof/${process.env.API_KEY}`, params);
    console.log(requestResponse.data);

    if (requestResponse.data.optimisticVerify !== "success") {
      console.error("Proof verification failed, check proof artifacts");
      return;
    }

    while (true) {
      const jobStatusResponse = await axios.get(`${API_URL}/job-status/${process.env.API_KEY}/${requestResponse.data.jobId}`);
      if (jobStatusResponse.data.status === "Finalized") {
        console.log("Job finalized successfully");
        console.log(jobStatusResponse.data);
        break;
      } else {
        console.log("Job status: ", jobStatusResponse.data.status);
        console.log("Waiting for job to finalize...");
        await new Promise(resolve => setTimeout(resolve, 5000)); // Wait for 5 seconds before checking again
      }
    }
  } catch (error) {
    console.error("An error occurred:", error);
  }
}

main();