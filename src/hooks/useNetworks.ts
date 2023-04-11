import { useMemo } from 'react'

import useTerraAssets from 'lib/hooks/useTerraAssets'
import { ChainOptions } from 'lib'
import { NetworkEnum } from 'types'

const defaultNetworks: Record<NetworkEnum, ChainOptions> = {
  mainnet: {
    name: NetworkEnum.mainnet,
    chainID: 'phoenix-1',
    lcd: 'https://phoenix-lcd.terra.dev',
    fcd: 'https://phoenix-fcd.terra.dev',
    api: 'https://phoenix-api.terra.dev',
    mantle: 'https://phoenix-mantle.terra.dev',
    walletconnectID: 2
  },
  classic: {
    name: NetworkEnum.classic,
    chainID: 'columbus-5',
    lcd: 'https://lcd.terrarebels.net',
    fcd: 'https://fcd.terrarebels.net',
    api: 'https://api.terrarebels.net',
    mantle: 'https://lcd.terrarebels.net',
    walletconnectID: 1
  },
  testnet: {
    name: NetworkEnum.testnet,
    chainID: 'pisco-1',
    lcd: 'https://pisco-lcd.terra.dev',
    fcd: 'https://pisco-fcd.terra.dev',
    api: 'https://pisco-api.terra.dev',
    mantle: 'https://pisco-mantle.terra.dev',
    walletconnectID: 0
  }
}

const useNetworks = (): {
  networks: Record<NetworkEnum, ChainOptions>
} => {
  const { data } = useTerraAssets<Record<NetworkEnum, ChainOptions>>(
    'chains.json'
  )

  const networks: Record<NetworkEnum, ChainOptions> = useMemo(() => {
    const getOptions = (net: NetworkEnum): ChainOptions => {
      return { ...defaultNetworks[net], ...data?.[net] }
    }

    return {
      [NetworkEnum.classic]: getOptions(NetworkEnum.classic),
      [NetworkEnum.mainnet]: getOptions(NetworkEnum.mainnet),
      [NetworkEnum.testnet]: getOptions(NetworkEnum.testnet),
    }
  }, [data])

  return {
    networks,
  }
}

export default useNetworks
