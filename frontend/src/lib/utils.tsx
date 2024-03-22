import { JsonRpcSigner } from "ethers"
import { Typography } from "antd"
import { AccountData } from "@/components/index/InfoPanel/const"
import SFTConfig from "./SFT.config"
import DebTConfig from "./DebT.config"
import ExchangeConfig from "./Exchange.config"

export const HARDHAT_NODE_URL = "http://localhost:8545"

export const getDefaultAccountNameMap = (accounts: JsonRpcSigner[]) => {
  const map: Record<string, string> = {}
  accounts.forEach((account, index) => {
    map[account.address] = `账户${index + 1}`
  })

  return map
}

export const contractConfig: Record<string, any> = {
  'SFT': SFTConfig,
  'DebT': DebTConfig,
  'Exchange': ExchangeConfig,
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
