import { ethers } from "ethers"
import { ComponentType } from "react"

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

export enum StateMutability {
  Pure,
  View,
  Nonpayable,
  Payable
}

interface InputArguement {
  type: string
  isAccount?: boolean
}

interface FunctionConfig {
  name: string
  inputs: InputArguement[]
  outputs: any[]
  stateMutability: StateMutability
  getDescription: (...args: any) => string
}

export interface ContractConfig {
  [key: string]: {
    component: ComponentType<any>
    functions: FunctionConfig[]
  }
}
