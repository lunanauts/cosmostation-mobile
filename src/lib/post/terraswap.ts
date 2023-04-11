import { AccAddress, MsgExecuteContract } from '@terra-rebels/terra.js'
import { Coin, Coins } from '@terra-rebels/terra.js'
import axios from 'axios'
import { ChainOptions } from '../types'

interface Params {
  pair?: string
  token?: string
  offer: { amount: string; from: string }
}

export type ToTokenInfoType =
  | {
      token: {
        contract_addr: string
      }
      native_token?: undefined
    }
  | {
      native_token: {
        denom: string
      }
      token?: undefined
    }

export const toTokenInfo = (token: string): ToTokenInfoType =>
  AccAddress.validate(token)
    ? { token: { contract_addr: token } }
    : { native_token: { denom: token } }

export const getTerraswapURL = (
  { pair, token, offer }: Params,
  { lcd: baseURL }: ChainOptions,
  address: string,
  swapOptions?: { belief_price: string; max_spread: string }
): {
  query: {
    baseURL: string
    path: string
    params: {
      query_msg: {
        simulation: {
          offer_asset: {
            amount: string
            info: ToTokenInfoType
          }
        }
      }
    }
  }
  url: string
  msgs: MsgExecuteContract[]
} => {
  const shouldHook = AccAddress.validate(offer.from)
  const simulatePath = `/wasm/contracts/${pair}/store`
  const url = `/wasm/contracts/${shouldHook ? token : pair}`

  const offerMessage = {
    offer_asset: {
      amount: offer.amount,
      info: toTokenInfo(offer.from),
    },
  }

  const params = { query_msg: { simulation: offerMessage } }
  const asset = {
    amount: offer.amount,
    info: toTokenInfo(offer.from),
  }

  return {
    query: { baseURL, path: simulatePath, params },
    url,
    msgs: !shouldHook
      ? [
          new MsgExecuteContract(
            address,
            pair!,
            { swap: { ...swapOptions, offer_asset: asset } },
            new Coins([new Coin(offer.from, offer.amount)])
          ),
        ]
      : [
          new MsgExecuteContract(address, token!, {
            send: {
              amount: offer.amount,
              contract: pair,
              msg: toBase64({ swap: swapOptions }),
            },
          }),
        ],
  }
}

interface SimulationResult {
  return_amount: string
  spread_amount: string
  commission_amount: string
}

export const simulateTerraswap = async (
  params: Params,
  chain: ChainOptions,
  address: string
): Promise<SimulationResult> => {
  const { query } = getTerraswapURL(params, chain, address)
  const { path, ...config } = query
  const { data } = await axios.get<{ result: SimulationResult }>(
    path,
    config
  )
  return data.result
}

/* utils */
export const toBase64 = (object: Record<string, unknown>): string => {
  try {
    return Buffer.from(JSON.stringify(object)).toString('base64')
  } catch (error) {
    return ''
  }
}
