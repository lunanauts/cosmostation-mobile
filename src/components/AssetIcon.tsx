import React, { ReactElement } from 'react'
import { Image } from 'react-native'
import { SvgUri } from 'react-native-svg'
import Terra from 'assets/svg/Terra'
import { useIsClassic } from 'lib/contexts/ConfigContext'

export type AssetIconProps = {
  size?: number
  uri?: string
  name?: string
}

const ASSET = 'https://assets.terrarebels.net/icon'

const AssetIcon = (props: AssetIconProps): ReactElement => {
  const isClassic = useIsClassic()
  const { name, uri, size = 18 } = props
  const src =
    uri ||
    (name
      ? (
        (!isClassic && name === 'Luna')
        ? `${ASSET}/svg/LUNA.png`
        : `${ASSET}/60/${name}.png`
      ) : undefined)

  return (
    <>
      {src ? (
        src.includes('.svg') ? (
          <SvgUri
            uri={src}
            width={size}
            height={size}
          />
        ) : (
          <Image
            source={{ uri: src }}
            style={{
              width: size,
              height: size,
            }}
          />
        )
      ) : (
        <Terra width={size} height={size} />
      )}
    </>
  )
}

export default AssetIcon
