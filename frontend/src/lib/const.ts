import { JsonRpcSigner } from "ethers"

export interface Artifact {
  contractName: string
  sourceName: string
  abi: any[]
  bytecode: string
  deployedBytecode: string
  linkReferences: Record<string, any>
  deployedLinkReferences: Record<string, any>
}

export interface AccountData extends JsonRpcSigner {
  name: string
}
