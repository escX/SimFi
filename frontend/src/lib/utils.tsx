import { JsonRpcSigner } from "ethers"
import dynamic from "next/dynamic"
import { Typography } from "antd"
import { ComponentType } from "react"
import { AccountData } from "@/components/index/InfoPanel/const"

export const HARDHAT_NODE_URL = "http://localhost:8545"

export const getDefaultAccountNameMap = (accounts: JsonRpcSigner[]) => {
  const map: Record<string, string> = {}
  accounts.forEach((account, index) => {
    map[account.address] = `账户${index + 1}`
  })

  return map
}

export const contractComponent: Record<string, ComponentType<any>> = {
  'SFT': dynamic(() => import('@/components/index/ContractSFT'))
}

export const getDescNode = (data: string | number | undefined | null) => {
  if (data === undefined || data === null || data === '') {
    return <Typography.Text type="secondary"> ? </Typography.Text>
  }

  return <Typography.Text code>{data.toString()}</Typography.Text>
}

export const getAccountName = (accounts: AccountData[], address: string) => {
  const account = accounts.find(account => account.address === address)

  return !!account ? account.name : address
}
