import fs from 'fs'
import path from 'path'
import { useMemo, useState } from "react"
import { ContractTransactionResponse, ContractTransactionReceipt, JsonRpcApiProvider, JsonRpcSigner, ethers, EventLog } from "ethers"
import { Card, Empty, Layout, Typography, message } from 'antd'
import { Artifact, ContractData, HistoryRecord, HistoryRecordProvided } from '@/lib/const'
import { contractConfig, getDefaultAccountNameMap } from '@/lib/utils'
import { InputValueData } from '@/components/common/FuncExecution/const'
import styles from "@/styles/index.module.scss"
import ConnectModal from "../components/index/ConnectModal"
import DeployedListPanel from '@/components/index/DeployedListPanel'
import HistoryPanel from '@/components/index/HistoryPanel'
import InfoPanel from '@/components/index/InfoPanel'
import ContractPanel from '@/components/index/ContractPanel'

export default function Index({ artifacts }: { artifacts: Artifact[] }) {
  const [provider, setProvider] = useState<JsonRpcApiProvider | null>(null) // 当前连接到hardhat网络的provider
  const [accounts, setAccounts] = useState<JsonRpcSigner[]>([]) // 账户列表
  const [accountNameMap, setAccountNameMap] = useState<Record<string, string>>({}) // 账户地址和名称的映射
  const [contracts, setContracts] = useState<ContractData[]>([]) // 已部署合约列表
  const [currAccountAddress, setCurrAccountAddress] = useState<string>() // 当前选中的账户地址
  const [currContractAddress, setCurrContractAddress] = useState<string>() // 当前选中的合约地址
  const [historyRecord, setHistoryRecord] = useState<HistoryRecord[]>([]) // 合约操作历史记录
  const [logRecord, setLogRecord] = useState<EventLog[]>([]) // 事件日志记录
  const [messageApi, contextHolder] = message.useMessage()

  // 当前是否连接到hardhat网络
  const hasProvider = useMemo<boolean>(() => {
    return provider instanceof JsonRpcApiProvider
  }, [provider])

  // 当前选中的合约
  const currContract = useMemo(() => {
    return contracts.find(contract => contract.address === currContractAddress) ?? null
  }, [currContractAddress, contracts])

  // 当前选中的账户
  const currAccount = useMemo(() => {
    return accounts.find(account => account.address === currAccountAddress) ?? null
  }, [currAccountAddress, accounts])

  // 账户地址和别名数组
  const accountList = useMemo(() => {
    return accounts.map(account => ({
      address: account.address,
      name: accountNameMap[account.address]
    }))
  }, [accounts, accountNameMap])

  const handleConnect = async (url: string) => {
    try {
      const provider = new ethers.JsonRpcProvider(url)
      const accounts = await provider.listAccounts()

      setProvider(provider)
      setAccounts(accounts)
      setCurrAccountAddress(accounts[0].address)
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

      return Promise.reject('无法连接到Hardhat网络')
    }
  }

  const handleDeploy = async (artifact: Artifact) => {
    if (!!currAccount && !!currAccount.address) {
      try {
        const factory: ethers.ContractFactory = new ethers.ContractFactory(artifact.abi, artifact.bytecode, currAccount)
        const contractRef = await factory.deploy()
        await contractRef.waitForDeployment()
        await contractRef.on("*", (event) => {
          setLogRecord(record => [...record, event.log])
        })

        const deployedAddress = await contractRef.getAddress()
        if (contracts.length === 0) {
          setCurrContractAddress(deployedAddress)
        }

        setContracts(contract => {
          return [
            ...contract,
            {
              address: deployedAddress,
              name: artifact.contractName,
              deployTimestamp: new Date().getTime(),
              deployAccountAddress: currAccount.address,
              ref: contractRef
            }
          ]
        })

        setTimeout(() => {
          const scrollElement = document.querySelector('.deployed-list-panel .ant-card-body')
          if (scrollElement) {
            scrollElement.scrollTo({ top: scrollElement.scrollHeight })
          }
        }, 0)

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

        return Promise.reject('部署失败')
      }
    } else {
      messageApi.open({
        type: 'error',
        content: '无法获取当前账户',
      })

      return Promise.reject('无法获取当前账户')
    }
  }

  const handleDeleteContract = (address: string) => {
    setContracts(contracts => contracts.filter(contract => contract.address !== address))
    if (currContractAddress === address) {
      setCurrContractAddress(undefined)
    }
  }

  const handleExecFunction = async (funcName: string, args: InputValueData[]) => {
    if (!!currContract) {
      try {
        const response = await currContract.ref.connect(currAccount).getFunction(funcName)(...args)
        let receipt: ContractTransactionReceipt | null = null

        if (response instanceof ContractTransactionResponse) {
          receipt = await response.wait()
        }

        messageApi.open({
          type: 'success',
          content: '执行成功',
        })

        return Promise.resolve({ response, receipt })
      } catch (error) {
        messageApi.open({
          type: 'error',
          content: '执行失败',
        })

        return Promise.reject('执行失败')
      }
    } else {
      messageApi.open({
        type: 'error',
        content: '无法获取当前合约',
      })

      return Promise.reject('无法获取当前合约')
    }
  }

  const handleRecordHistory = (record: HistoryRecordProvided) => {
    setHistoryRecord(data => [...data, {
      ...record,
      accountAddress: currAccountAddress!,
      contractAddress: currContractAddress!,
      contractName: currContract!.name,
      contractTimestamp: currContract!.deployTimestamp
    }])

    setTimeout(() => {
      const scrollElement = document.querySelector('.history-panel .ant-card-body')
      if (scrollElement) {
        scrollElement.scrollTo({ top: scrollElement.scrollHeight })
      }
    }, 0)
  }

  return (
    <>
      <Layout className={styles.layout}>
        <Layout.Header className={styles.header}>
          <Typography.Text className={styles.title} strong>SimFi</Typography.Text>
        </Layout.Header>
        <Layout className={styles.content}>
          <Layout.Sider width="480" className={styles['left-sider']}>
            <InfoPanel
              className={styles['info-panel']}
              accounts={accountList}
              artifacts={artifacts}
              currAccountAddress={currAccountAddress}
              onAccountChange={setCurrAccountAddress}
              onDeploy={handleDeploy}
              onAccountNameChange={setAccountNameMap}
            />
            <DeployedListPanel
              className={`${styles['deployed-list-panel']} ${styles['fixed-card-body']} deployed-list-panel`}
              contracts={contracts}
              currContractAddress={currContractAddress}
              accountNameMap={accountNameMap}
              onChangeCurrContract={setCurrContractAddress}
              onDelete={handleDeleteContract}
            />
          </Layout.Sider>
          <Layout.Content className={styles.main}>
            <Card
              title={`${currContract ? currContract.name : ''} 合约可执行方法`}
              className={`${styles['contract-panel']} ${styles['fixed-card-body']}`}
            >
              {currContract && contractConfig[currContract.name] ?
                <ContractPanel
                  config={contractConfig[currContract?.name ?? '']}
                  accounts={accountList}
                  onExecFunction={handleExecFunction}
                  onHistoryRecord={handleRecordHistory}
                /> :
                <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} />
              }
            </Card>
          </Layout.Content>
          <Layout.Sider width="420" className={styles['right-sider']}>
            <HistoryPanel
              className={`${styles['history-panel']} ${styles['fixed-card-body']} history-panel`}
              historyRecord={historyRecord}
              accounts={accountList}
              contracts={contracts}
              logRecord={logRecord}
            />
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
        } catch (error) {
          console.error(error)
        }
      }
    })
  }

  return {
    props: {
      artifacts
    }
  }
}
