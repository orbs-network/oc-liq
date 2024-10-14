import { _TypedDataEncoder } from '@ethersproject/hash';
import { web3, account } from '../onchain/web3';
import * as sigUtil from '@metamask/eth-sig-util';
import { PermitData } from "@uniswap/permit2-sdk/dist/domain";

interface TypedData {
  domain: any;
  types: any;
  message: any;
}

export async function signEIP712(data: PermitData): Promise<string> {
  try {
    const populated = await _TypedDataEncoder.resolveNames(
      data.domain,
      data.types,
      data.values,
      async (name) => {
        return await web3.eth.ens.getAddress(name);
      }
    );

    const typedDataMessage = _TypedDataEncoder.getPayload(populated.domain, data.types, populated.value);

    const privateKeyBuffer = Buffer.from(account.privateKey.replace('0x', ''), 'hex');
    const signature = sigUtil.signTypedData({
      privateKey: privateKeyBuffer,
      data: typedDataMessage as sigUtil.TypedMessage<any>,
      version: sigUtil.SignTypedDataVersion.V4
    });

    return signature;
  } catch (e) {
    console.log("Error signing data:", e);
    throw e;
  }
}


export async function signAsync(method: string, signer: string, payload: any): Promise<string> {
  const provider = web3.currentProvider;

  if (!provider) {
    throw new Error("Provider is not defined. Ensure web3 is properly initialized.");
  }

  return new Promise((resolve, reject) => {

    if ((provider as any).sendAsync) {

      (provider as any).sendAsync(
        {
          id: 1,
          method,
          params: [signer, typeof payload === 'string' ? payload : JSON.stringify(payload)],
          from: signer,
        },
        (e: any, r: any) => {
          console.log({ e, r });

          if (e || !r?.result) {
            return reject(e);
          }

          console.log("🔏 Signature result:", r.result);
          return resolve(r.result);
        }
      );
    } else if ((provider as any).send) {

      (provider as any).send(
        {
          id: 1,
          method,
          params: [signer, typeof payload === 'string' ? payload : JSON.stringify(payload)],
          from: signer,
        },
        (e: any, r: any) => {
          console.log({ e, r });

          if (e || !r?.result) {
            return reject(e);
          }

          console.log("🔏 Signature result:", r.result);
          return resolve(r.result);
        }
      );
    } else {
      throw new Error("Provider does not support sending requests.");
    }
  });
}

