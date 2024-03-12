import fs from 'fs'
import path from 'path'
import { useMemo, useState } from "react"
import { JsonRpcApiProvider, JsonRpcSigner, ethers } from "ethers"
import { message } from 'antd'
import ConnectModal from "../components/index/ConnectModal"

export default function Index({ artifacts }: { artifacts: Artifact[] }) {
  const [provider, setProvider] = useState<JsonRpcApiProvider | null>(null) // 当前连接到hardhat网络的provider
  const [contracts, setContracts] = useState<any[]>([]) // 已部署合约列表
  const [accounts, setAccounts] = useState<JsonRpcSigner[]>([]) // 账户列表
  const [currAccount, setCurrAccount] = useState<string>() // 当前选中的账户
  const [currContract, setCurrContract] = useState<string>() // 当前选中的合约
  const [messageApi, contextHolder] = message.useMessage()

  const hasProvider = useMemo(() => {
    return provider instanceof JsonRpcApiProvider
  }, [provider])

  const handleConnect = async (url: string) => {
    try {
      const provider = new ethers.JsonRpcProvider(url)
      const accounts = await provider.listAccounts()

      setProvider(provider)
      setAccounts(accounts)

      messageApi.open({
        type: 'success',
        content: '连接到Hardhat网络',
      })

      return Promise.resolve()
    } catch (error) {
      messageApi.open({
        type: 'error',
        content: '无法连接到Hardhat网络',
      })

      return Promise.reject()
    }
  }

  return (
    <>
      <div>

      </div>

      <ConnectModal visible={!hasProvider} onConfirm={handleConnect} />

      {contextHolder}
    </>
  )
}

export async function getStaticProps() {
  const dirPath = path.join(process.cwd(), 'src', 'contracts')
  const artifacts: Artifact[] = []

  if (fs.existsSync(dirPath)) {
    fs.readdirSync(dirPath).forEach(file => {
      const filePath = path.join(dirPath, file)

      if (fs.statSync(filePath).isFile()) {
        const content = fs.readFileSync(filePath, 'utf8')

        try {
          const contentJson = JSON.parse(content)
          if (!!contentJson.abi && !!contentJson.bytecode) {
            artifacts.push(contentJson)
          }
        } catch (error) { }
      }
    })
  }

  return {
    props: {
      artifacts
    }
  }
}
