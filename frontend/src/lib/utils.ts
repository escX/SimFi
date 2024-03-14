import { JsonRpcSigner } from "ethers"
import dynamic from "next/dynamic"
import { ContractConfig, StateMutability } from "./const"

export const HARDHAT_NODE_URL = "http://localhost:8545"

export const getDefaultAccountNameMap = (accounts: JsonRpcSigner[]) => {
  const map: Record<string, string> = {}
  accounts.forEach((account, index) => {
    map[account.address] = `账户${index + 1}`
  })

  return map
}

export const contractConfig: ContractConfig = {
  'SFT': {
    component: dynamic(() => import('@/components/index/ContractSFT')),
    functions: [
      {
        name: 'totalSupply',
        inputs: [],
        outputs: [],
        stateMutability: StateMutability.View,
        getDescription: (...args: any) => {
          return ''
        }
      }
    ]
  }
}
