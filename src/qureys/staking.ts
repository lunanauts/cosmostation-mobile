import { useQuery } from 'react-query'
import { flatten, path, uniqBy } from 'ramda'
import BigNumber from 'bignumber.js'
import {
  AccAddress,
  ValAddress,
  Validator,
} from '@terra-rebels/terra.js'
import {
  Coins,
  Delegation,
  UnbondingDelegation,
} from '@terra-rebels/terra.js'
/* FIXME(terra.js): Import from terra.js */
import { BondStatus } from '@terra-rebels/terra.proto/cosmos/staking/v1beta1/staking'
import { has } from 'utils/num'
import { queryKey, Pagination, RefetchOptions } from './query'
import useLCDClient from 'lib/api/useLCD'
import { useAuth } from 'lib/contexts/AuthContext'

export const useValidators = () => {
  const lcd = useLCDClient()
  return useQuery(
    [queryKey.staking.validators],
    async () => {
      // TODO: Pagination
      // Required when the number of results exceed LAZY_LIMIT

      const [v1] = await lcd.staking.validators({
        status: BondStatus[BondStatus.BOND_STATUS_UNBONDED],
        ...Pagination,
      })

      const [v2] = await lcd.staking.validators({
        status: BondStatus[BondStatus.BOND_STATUS_UNBONDING],
        ...Pagination,
      })

      const [v3] = await lcd.staking.validators({
        status: BondStatus[BondStatus.BOND_STATUS_BONDED],
        ...Pagination,
      })

      return uniqBy(path(['operator_address']), [...v1, ...v2, ...v3])
    },
    { ...RefetchOptions.INFINITY }
  )
}

export const useValidator = (operatorAddress: ValAddress) => {
  const lcd = useLCDClient()
  return useQuery(
    [queryKey.staking.validator, operatorAddress],
    () => lcd.staking.validator(operatorAddress),
    { ...RefetchOptions.INFINITY }
  )
}

export const useDelegations = () => {
  const { user } = useAuth()

  const lcd = useLCDClient()

  return useQuery(
    [queryKey.staking.delegations, user?.address],
    async () => {
      if (!user?.address) return []
      // TODO: Pagination
      // Required when the number of results exceed LAZY_LIMIT
      const [delegations] = await lcd.staking.delegations(
        user?.address,
        undefined,
        Pagination
      )

      return delegations.filter(({ balance }) =>
        has(balance.amount.toString())
      )
    },
    { ...RefetchOptions.INFINITY }
  )
}

export const useDelegation = (validatorAddress: ValAddress) => {
  const { user } = useAuth()
  const lcd = useLCDClient()

  return useQuery(
    [queryKey.staking.delegation, user?.address, validatorAddress],
    async () => {
      if (!user?.address) return
      try {
        const delegation = await lcd.staking.delegation(
          user?.address,
          validatorAddress
        )
        return delegation
      } catch {
        return
      }
    },
    { ...RefetchOptions.INFINITY }
  )
}

export const useUnbondings = () => {
  const { user } = useAuth()
  const lcd = useLCDClient()

  return useQuery(
    [queryKey.staking.unbondings, user?.address],
    async () => {
      if (!user?.address) return []
      // Pagination is not required because it is already limited
      const [unbondings] = await lcd.staking.unbondingDelegations(user?.address)
      return unbondings
    },
    { ...RefetchOptions.INFINITY }
  )
}

export const useStakingPool = () => {
  const lcd = useLCDClient()
  return useQuery([queryKey.staking.pool], () => lcd.staking.pool(), {
    ...RefetchOptions.INFINITY,
  })
}

/* helpers */
export const getFindValidator = (validators: Validator[]) => {
  return (address: AccAddress) => {
    const validator = validators.find((v) => v.operator_address === address)
    if (!validator) throw new Error(`${address} is not a validator`)
    return validator
  }
}

export const getFindMoniker = (validators: Validator[]) => {
  return (address: AccAddress) => {
    const validator = getFindValidator(validators)(address)
    return validator.description.moniker
  }
}

export enum StakeAction {
  DELEGATE = "delegate",
  REDELEGATE = "redelegate",
  UNBOND = "undelegate",
}

export const getAvailableStakeActions = (
  destination: ValAddress,
  delegations: Delegation[]
) => {
  return {
    [StakeAction.DELEGATE]: true,
    [StakeAction.REDELEGATE]:
      delegations.filter(
        ({ validator_address }) => validator_address !== destination
      ).length > 0,
    [StakeAction.UNBOND]: !!delegations.filter(
      ({ validator_address }) => validator_address === destination
    ).length,
  }
}

/* delegation */
export const calcDelegationsTotal = (delegations: Delegation[]) => {
  return delegations.length
    ? BigNumber.sum(
        ...delegations.map(({ balance }) => balance.amount.toString())
      ).toString()
    : "0"
}

/* unbonding */
export const calcUnbondingsTotal = (unbondings: UnbondingDelegation[]) => {
  return BigNumber.sum(
    ...unbondings.map(({ entries }) => sumEntries(entries))
  ).toString()
}

export const flattenUnbondings = (unbondings: UnbondingDelegation[]) => {
  return flatten(
    unbondings.map(({ validator_address, entries }) => {
      return entries.map((entry) => ({ ...entry, validator_address }))
    })
  ).sort((a, b) => a.completion_time.getTime() - b.completion_time.getTime())
}

export const sumEntries = (entries: UnbondingDelegation.Entry[]) =>
  BigNumber.sum(
    ...entries.map(({ initial_balance }) => initial_balance.toString())
  ).toString()
