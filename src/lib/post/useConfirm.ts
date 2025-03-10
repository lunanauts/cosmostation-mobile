import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useQuery } from 'react-query'
import {
  Coins,
  LCDClient,
  Fee,
  Tx,
  TxInfo,
  Wallet,
} from '@terra-rebels/terra.js'
import { SignMode } from '@terra-rebels/terra.proto/cosmos/tx/signing/v1beta1/signing'
import {
  ConfirmProps,
  ConfirmPage,
  Field,
  GetKey,
  User,
} from '../types'
import { PostResult, PostError } from '../types'
import useInfo from '../lang/useInfo'
import { format } from '../utils'
import { toInput, toAmount } from '../utils/format'
import { lt, gt } from '../utils/math'
import { useCalcFee } from './txHelpers'
import { checkError, parseError } from './txHelpers'
import { useConfig, useIsClassic } from 'lib'
import useLCDClient from 'lib/api/useLCD'

interface SignParams {
  user: User
  password?: string
  getKey: GetKey
}

export default (
  { memo, submitLabels, message, ...rest }: ConfirmProps,
  { user, password: defaultPassword = '', getKey }: SignParams
): ConfirmPage => {
  const {
    contents,
    msgs,
    feeDenom,
    validate,
    warning,
    parseResult,
  } = rest

  const { t } = useTranslation()
  const { ERROR } = useInfo()
  const { name, address, ledger } = user

  const SUCCESS = {
    title: t('Post:Confirm:Success!'),
    button: t('Common:Form:Ok'),
  }

  /* error */
  const defaultErrorMessage = t(
    'Common:Error:Oops! Something went wrong'
  )
  const [
    simulatedErrorMessage,
    setSimulatedErrorMessage,
  ] = useState<string>()
  const [errorMessage, setErrorMessage] = useState<string>()
  const {
    chain: {
      current: { chainID, lcd: URL },
    },
  } = useConfig()

  /* fee */
  const getFeeDenom = (gas: string): string => {
    const { defaultValue, list } = feeDenom
    const available = list.filter((denom) => {
      const amount = calcFee ? calcFee.feeFromGas(gas, denom) : gas
      return validate({ amount, denom })
    })
    return defaultValue ?? (
      isClassic ? available[0] : available?.some((a) => a === 'uluna') ? 'uluna' : available[0]
    )
  }

  const [input, setInput] = useState<string>(toInput('1'))
  const [denom, setDenom] = useState<string>(() => getFeeDenom('1'))
  const [estimated, setEstimated] = useState<string>()
  const fee = { amount: toAmount(input), denom }
  const calcFee = useCalcFee()
  const readyToSimulate = !!calcFee

  /* simulate */
  const [simulating, setSimulating] = useState(true)
  const [simulated, setSimulated] = useState(false)
  const [unsignedTx, setUnsignedTx] = useState<Tx>()
  const [gas, setGas] = useState('0')
  const isGasEstimated = gt(gas, 0)
  const isClassic = useIsClassic()

  useEffect(() => {
    isGasEstimated && setDenom(getFeeDenom(gas))
    // eslint-disable-next-line
  }, [isGasEstimated])

  useEffect(() => {
    const simulate = async (): Promise<void> => {
      try {
        setSimulated(false)
        setSimulating(true)
        setEstimated(undefined)
        setErrorMessage(undefined)

        const gasAdjustment = 1.75

        const gasPrices = { [denom]: calcFee!.gasPrice(denom) }
        const lcd = new LCDClient({ chainID, URL, gasPrices })
        const options = {
          msgs,
          feeDenoms: [denom],
          memo,
          gasAdjustment,
        }
        const unsignedTx = await lcd.tx.create([{ address }], options)
        setUnsignedTx(unsignedTx)

        const gas = String(unsignedTx.auth_info.fee.gas_limit)
        const estimatedFee = calcFee!.feeFromGas(gas, denom)
        setGas(gas)
        setInput(toInput(estimatedFee ?? '0'))
        setEstimated(estimatedFee)
        setSimulated(true)
      } catch (error) {
        setSimulatedErrorMessage(
          parseError(error as PostError, defaultErrorMessage)
        )
      } finally {
        setSimulating(false)
      }
    }

    readyToSimulate && simulate()

    // eslint-disable-next-line
  }, [readyToSimulate])

  useEffect(() => {
    const setFee = (): void => {
      const estimatedFee = calcFee!.feeFromGas(gas, denom)
      setInput(toInput(estimatedFee ?? '0'))
      setEstimated(estimatedFee)
    }

    readyToSimulate && setFee()

    // eslint-disable-next-line
  }, [denom, readyToSimulate])

  /* submit */
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [result, setResult] = useState<PostResult>()
  const [txhash, setTxHash] = useState<string>()
  let device = ''

  const submit = async (): Promise<void> => {
    if (!unsignedTx) return

    try {
      setSubmitting(true)
      setErrorMessage(undefined)

      const broadcast = async (signedTx: Tx): Promise<void> => {
        const { gasPrices } = calcFee!
        const lcd = new LCDClient({ chainID, URL, gasPrices })

        const data = await lcd.tx.broadcastSync(signedTx)

        if ('code' in data && Number(data.code) !== 0) {
          throw new Error(data.raw_log)
        }
        setTxHash(data.txhash)
      }

      const gasFee = new Coins({ [fee.denom]: fee.amount })
      const fees = gasFee
      unsignedTx.auth_info.fee = new Fee(
        unsignedTx.auth_info.fee.gas_limit,
        fees
      )

      const { gasPrices } = calcFee!
      const lcd = new LCDClient({ chainID, URL, gasPrices })
      const { key, disconnect } = await getKey(name ? { name, password: ledger ? device : password } : undefined)
      const wallet = new Wallet(lcd, key)
      const {
        account_number,
        sequence,
      } = await wallet.accountNumberAndSequence()

      const signed = await key.signTx(unsignedTx, {
        accountNumber: account_number,
        sequence,
        chainID,
        signMode: ledger ? SignMode.SIGN_MODE_LEGACY_AMINO_JSON : SignMode.SIGN_MODE_DIRECT,
      }, isClassic)

      // disconnect ledger
      ledger && disconnect && disconnect()

      await broadcast(signed)
    } catch (error) {
      const { message } = error as PostError

      if (message === 'Incorrect password') {
        setPasswordError(t('Auth:Form:Incorrect password'))
      } else {
        setErrorMessage(
          parseError(error as PostError, defaultErrorMessage)
        )
      }
    } finally {
      setSubmitting(false)
    }
  }

  const pollResult = usePollTxHash(txhash ?? '')
  useEffect(() => {
    if (pollResult?.height) {
      setResult(pollResult)
      const errorMessage = checkError(pollResult.raw_log)
      errorMessage
        ? setErrorMessage(errorMessage)
        : setSubmitted(true)
    }
  }, [pollResult])

  const readyToSubmit = simulated && !submitting
  const valid = gt(fee.amount, 0) && validate(fee)

  /* password */
  const [password, setPassword] = useState(defaultPassword)
  const [passwordError, setPasswordError] = useState<string>()
  const passwordField: Field = {
    label: t('Post:Confirm:Confirm with password'),
    element: 'input',
    attrs: {
      type: 'password',
      id: 'password',
      disabled: !readyToSubmit || !valid,
      value: password,
      placeholder: t('Post:Confirm:Input your password to confirm'),
      autoComplete: 'off',
      autoFocus: true,
    },
    setValue: (v) => {
      setPasswordError(undefined)
      setPassword(v)
    },
    error: passwordError,
  }

  const disabled = !readyToSubmit || !valid || !(!name || password)
  const onSubmit = (): void => {
    submit()
  }

  return {
    contents,

    fee: {
      label: t('Common:Tx:Fee'),
      status: simulating
        ? t('Post:Confirm:Simulating...')
        : undefined,
      select: {
        options: feeDenom.list.map((denom) => ({
          value: denom,
          children: format.denom(denom),
          disabled: !validate({
            amount: calcFee ? calcFee.feeFromGas(gas, denom) : gas,
            denom,
          }),
        })),
        attrs: {
          id: 'denom',
          value: denom,
          disabled: !readyToSubmit,
        },
        setValue: (value: string): void => setDenom(value),
      },
      input: {
        attrs: {
          id: 'input',
          value: input,
          disabled: !readyToSubmit || !denom,
        },
        setValue: (value: string): void => setInput(value),
      },
      message:
        estimated && lt(fee.amount, estimated)
          ? t(
              'Post:Confirm:Recommended fee is {{fee}} or higher.\nTransactions with low fee might fail to proceed.',
              {
                fee: format.coin({
                  amount: estimated,
                  denom: fee.denom,
                }),
              }
            )
          : undefined,
    },

    form: {
      title: t('Common:Form:Confirm'),
      fields: name ? [passwordField] : [],
      errors: ([] as string[])
        .concat(warning ?? [])
        .concat(
          simulated && !valid
            ? t(
                "Post:Confirm:You don't have enough balance. Please adjust either the amount or the fee."
              )
            : []
        ),
      disabled,
      submitLabel: submitting ? submitLabels[1] : submitLabels[0],
      onSubmit: disabled ? undefined : onSubmit,
      submitting,
    },
    ledger: {
      onSubmit,
      setDevice: (d) => { device = d },
      submitting
    },
    result: simulatedErrorMessage
      ? { ...ERROR, content: simulatedErrorMessage }
      : errorMessage
      ? { ...ERROR, content: errorMessage }
      : submitted
      ? {
          ...SUCCESS,
          content: (result && parseResult?.(result)) ?? message,
        }
      : undefined,

    txhash,
  }
}

/* hooks */
export const usePollTxHash = (txhash: string): undefined | TxInfo => {
  const [refetchInterval, setRefetchInterval] = useState<
    number | false
  >(false)
  const lcd = useLCDClient()

  const { data } = useQuery(
    txhash,
    () => lcd.tx.txInfo(txhash),
    {
      refetchInterval,
      enabled: !!txhash,
    }
  )

  const height = data && data.height

  useEffect(() => {
    if (height) {
      setRefetchInterval(false)
    } else {
      setRefetchInterval(1000)
    }
  }, [height])

  return data
}
