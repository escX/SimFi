import { ethers } from "ethers"

export interface Artifact {
  contractName: string
  sourceName: string
  abi: any[]
  bytecode: string
  deployedBytecode: string
  linkReferences: Record<string, any>
  deployedLinkReferences: Record<string, any>
}

export interface ContractData {
  address: string
  name: string
  deployTimestamp: number
  deployAccountName: string
  deployAccountAddress: string
  ref: ethers.BaseContract
}
