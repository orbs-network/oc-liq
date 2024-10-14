import { hasWeb3Instance, setWeb3Instance } from "@defi.org/web3-candies";
import dotenv from 'dotenv';
import Web3 from 'web3';

dotenv.config();

const privateKey = process.env.PRIVATE_KEY;
const infuraUrl = process.env.INFURA_URL;

if (!privateKey) {
  console.error('Error: PRIVATE_KEY is not defined in environment variables.');
  process.exit(1);
}

if (!infuraUrl) {
  console.error('Error: INFURA_URL is not defined in environment variables.');
  process.exit(1);
}

let formattedPrivateKey = privateKey.trim();

if (!formattedPrivateKey.startsWith('0x')) {
  formattedPrivateKey = '0x' + formattedPrivateKey;
}

export const web3 = new Web3(infuraUrl);

export const account = web3.eth.accounts.privateKeyToAccount(formattedPrivateKey);

web3.eth.accounts.wallet.add(account);

if (!hasWeb3Instance()) setWeb3Instance(new Web3(infuraUrl!));

console.log(`Wallet address: ${account.address}`);

