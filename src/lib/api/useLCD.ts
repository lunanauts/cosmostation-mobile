import { useMemo } from 'react'
import { LCDClient } from '@terra-rebels/terra.js'
import { useConfig, useIsClassic } from 'lib/contexts/ConfigContext'

const useLCD = () => {
  const { chain } = useConfig()
  const isClassic = useIsClassic()

  const lcdClient = useMemo(
    () => new LCDClient({
        ...chain.current,
        URL: chain.current.lcd,
        isClassic,
      }),
    [chain, isClassic]
  )

  return lcdClient
}

export default useLCD
