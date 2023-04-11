import {
  NavigationProp,
  useNavigation,
} from '@react-navigation/native'
import { useSetRecoilState } from 'recoil'
import _ from 'lodash'
import { RawKey, Key } from '@terra-rebels/terra.js'

import {
  ConfirmPage,
  ConfirmProps,
  useConfirm as useStationConfirm,
  User,
} from 'lib'

import ConfirmStore from 'stores/ConfirmStore'
import { RootStackParams } from 'types'

import { getDecyrptedKey } from 'utils/wallet'
import { LedgerKey } from '@terra-rebels/ledger-terra-js'
import TransportBLE from '@ledgerhq/react-native-hw-transport-ble'

export type NavigateToConfirmProps = {
  confirm: ConfirmProps
}

export const useConfirm = (): {
  navigateToConfirm: (props: NavigateToConfirmProps) => void
  getComfirmData: ({
    confirm,
    user,
  }: {
    confirm: ConfirmProps
    user: User
  }) => ConfirmPage
  initConfirm: () => void
} => {
  const { navigate } =
    useNavigation<NavigationProp<RootStackParams>>()

  // ConfirmProps couldn't be serialized, so it have to transfer on recoil
  const setConfirm = useSetRecoilState(ConfirmStore.confirm)

  const navigateToConfirm = ({
    confirm,
  }: NavigateToConfirmProps): void => {
    setConfirm(confirm)
    navigate('Confirm')
  }

  const initConfirm = (): void => {
    setConfirm(undefined)
  }

  const getComfirmData = ({
    confirm,
    user,
  }: {
    confirm: ConfirmProps
    user: User
  }): ConfirmPage => {
    return useStationConfirm(confirm, {
      user,
      password: '',
      getKey: async (
        params
      ): Promise<{ key: Key; disconnect?: () => void }> => {
        if (user.ledger) {
          const { password } = params!
          const transport = await TransportBLE.open(password) // select device
          const key = await LedgerKey.create(transport, user.path)
          return {
            key,
            disconnect: () => TransportBLE.disconnect(password),
          }
        } else {
          const { name, password } = params!
          const decyrptedKey = await getDecyrptedKey(name, password)
          if (_.isEmpty(decyrptedKey)) {
            throw new Error('Incorrect password')
          }
          const key = new RawKey(Buffer.from(decyrptedKey, 'hex'))
          return { key }
        }
      },
    })
  }

  return { navigateToConfirm, getComfirmData, initConfirm }
}
