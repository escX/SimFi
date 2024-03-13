import { JsonRpcSigner } from "ethers"

export const HARDHAT_NODE_URL = "http://localhost:8545"

export const getDefaultAccountNameMap = (accounts: JsonRpcSigner[]) => {
  const map: Record<string, string> = {}
  accounts.forEach((account, index) => {
    map[account.address] = `账户${index + 1}`
  })

  return map
}
