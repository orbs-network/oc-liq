import BN from "bignumber.js"
import { PERMIT2, config } from "../config"
import { DutchOrder } from "@uniswap/uniswapx-sdk";
import { contract } from "@defi.org/web3-candies";
import { REACTOR_ABI } from "../abi/reactor";
import { signEIP712 } from "../onchain/signEIP712"
import { account } from "../onchain/web3";

export async function encodeReactorTransferMsg(chainId: number, outAmount: BN | string, inAmount: BN | string, minAmountOut: BN | string, outToken: string, inToken: string, filler: string) {

  console.log(`encodeReactorTransferMsg: `, { outAmount, inAmount, minAmountOut });

  outAmount = BN(outAmount)
  inAmount = BN(inAmount)
  minAmountOut = BN(minAmountOut)

  console.log({ chainId, reactor: config[chainId].reactor });

  if (!outAmount || !inAmount || !minAmountOut) {
    throw new Error('outAmount, inAmount and minAmountOut must be valid BN instances');
  }

  if (isNaN(outAmount.toNumber()) || isNaN(inAmount.toNumber())) {
    throw new Error('Invalid BigNumber value for inAmount or outAmount');
  }

  if (minAmountOut.gt(0) && outAmount.lt(minAmountOut)) {
    throw new Error("Insufficient output amount");
  }

  const now = Date.now();

  const orderSkeleton = {
    reactor: config[chainId].reactor,
    exclusiveFiller: filler,
    exclusivityOverrideBps: "0",
    additionalValidationContract: filler!,
    additionalValidationData: "0x",
    swapper: process.env.amiFoldPublicAddr!,
    nonce: String(now),
    deadline: now + 3 * 60 * 1000,
    decayStartTime: now,
    decayEndTime: now + 3 * 60 * 1000,
    input: {
      token: outToken,
      startAmount: outAmount.toString(),
      endAmount: outAmount.toString(),
    },
    outputs: [
      {
        token: inToken,
        recipient: account.address,
        startAmount: inAmount.toString(),
        endAmount: inAmount.toString(),
      }],
  }

  const order = DutchOrder.fromJSON(orderSkeleton, chainId, PERMIT2);

  const permitData = order.permitData();

  const signature = await signEIP712(permitData);
  const serializedOrder = order.serialize();

  const data = contract<any>(REACTOR_ABI as any, config[chainId].reactor).methods.execute([serializedOrder, signature]).encodeABI();
  return {
    outAmount: outAmount,
    to: config[chainId].reactor,
    data: data,
  }
}