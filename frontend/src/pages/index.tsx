import fs from 'fs'
import path from 'path'
import { useMemo, useState } from "react"
import { JsonRpcApiProvider, JsonRpcSigner, ethers } from "ethers"
import { Layout, Typography, message } from 'antd'
import { Artifact, ContractData } from '@/lib/const'
import { getDefaultAccountNameMap } from '@/lib/utils'
import styles from "@/styles/index.module.css"
import ConnectModal from "../components/index/ConnectModal"
import DeployedListPanel from '@/components/index/DeployedListPanel'
import HistoryPanel from '@/components/index/HistoryPanel'
import InfoPanel from '@/components/index/InfoPanel'

export default function Index({ artifacts }: { artifacts: Artifact[] }) {
  const [provider, setProvider] = useState<JsonRpcApiProvider | null>(null) // 当前连接到hardhat网络的provider
  const [accounts, setAccounts] = useState<JsonRpcSigner[]>([]) // 账户列表
  const [accountNameMap, setAccountNameMap] = useState<Record<string, string>>({}) // 账户地址和名称的映射
  const [contracts, setContracts] = useState<ContractData[]>([]) // 已部署合约列表
  const [currAccount, setCurrAccount] = useState<string>() // 当前选中的账户
  const [currContract, setCurrContract] = useState<string>() // 当前选中的合约
  const [messageApi, contextHolder] = message.useMessage()

  const hasProvider = useMemo<boolean>(() => {
    return provider instanceof JsonRpcApiProvider
  }, [provider])

  const handleConnect = async (url: string) => {
    try {
      const provider = new ethers.JsonRpcProvider(url)
      const accounts = await provider.listAccounts()

      setProvider(provider)
      setAccounts(accounts)
      setCurrAccount(accounts[0].address)
      setAccountNameMap(getDefaultAccountNameMap(accounts))

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

  const handleDepoly = async (artifact: Artifact) => {
    const signer = accounts.find(account => account.address === currAccount)

    if (signer !== undefined && !!signer.address) {
      try {
        const factory = new ethers.ContractFactory(artifact.abi, artifact.bytecode, signer)
        const contract = await factory.deploy()
        await contract.waitForDeployment()
        const deployedAddress = await contract.getAddress()

        if (contracts.length === 0) {
          setCurrContract(deployedAddress)
        }
        setContracts(contract => {
          return [
            {
              address: deployedAddress,
              name: artifact.contractName,
              deployTimestamp: new Date().getTime(),
              deployAccount: signer.address
            },
            ...contract
          ]
        })

        messageApi.open({
          type: 'success',
          content: '部署成功',
        })

        return Promise.resolve()
      } catch (error) {
        messageApi.open({
          type: 'error',
          content: '部署失败',
        })

        return Promise.reject()
      }
    } else {
      messageApi.open({
        type: 'error',
        content: '无法获取当前账户',
      })

      return Promise.reject()
    }
  }

  return (
    <>
      <Layout className={styles.layout}>
        <Layout.Header className={styles.header}>
          <Typography.Text className={styles.title} strong>SimFi</Typography.Text>
        </Layout.Header>
        <Layout>
          <Layout.Sider width="300" className={styles.left_sider}>
            <InfoPanel
              accounts={accounts.map(account => ({
                address: account.address,
                name: accountNameMap[account.address]
              }))}
              artifacts={artifacts}
              currAccount={currAccount}
              onAccountChange={setCurrAccount}
              onDeploy={handleDepoly}
              onAccountNameChange={setAccountNameMap}
            />
            <DeployedListPanel />
          </Layout.Sider>
          <Layout.Content></Layout.Content>
          <Layout.Sider width="300" className={styles.right_sider}>
            <HistoryPanel />
          </Layout.Sider>
        </Layout>
      </Layout>

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
