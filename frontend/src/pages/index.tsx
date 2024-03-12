import { Inter } from "next/font/google"
import fs from 'fs'
import path from 'path'
import { useState } from "react"
import { JsonRpcApiProvider, JsonRpcSigner, ethers } from "ethers"
import { HARDHAT_NODE_URL } from "@/utils"
import ConnectModal from "../components/index/ConnectModal"

const inter = Inter({ subsets: ["latin"] })

export default function Index({ artifacts }: { artifacts: Artifact[] }) {
  const [provider, setProvider] = useState<JsonRpcApiProvider | null>(null) // 当前连接到hardhat网络的provider
  const [contracts, setContracts] = useState<any[]>([]) // 已部署合约列表
  const [accounts, setAccounts] = useState<JsonRpcSigner[]>([]) // 账户列表
  const [currAccount, setCurrAccount] = useState<string>() // 当前选中的账户
  const [currContract, setCurrContract] = useState<string>() // 当前选中的合约

  return (
    <>
      <main className={inter.className}>

      </main>

      <ConnectModal />
    </>
  )
}

export async function getStaticProps() {
  const dirPath = path.join(process.cwd(), 'src', 'contracts')
  const artifacts: Artifact[] = []

  if (fs.existsSync(dirPath) ) {
    fs.readdirSync(dirPath).forEach(file => {
      const filePath = path.join(dirPath, file)

      if (fs.statSync(filePath).isFile()) {
        const content = fs.readFileSync(filePath, 'utf8')

        try {
          const contentJson = JSON.parse(content)
          if (!!contentJson.abi && !!contentJson.bytecode) {
            artifacts.push(contentJson)
          }
        } catch (error) {}
      }
    })
  }

  return {
    props: {
      artifacts
    }
  }
}
