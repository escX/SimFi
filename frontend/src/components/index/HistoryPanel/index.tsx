import { ContractData, HistoryRecord, LogRecord } from "@/lib/const"
import { Card, Collapse, Empty, Space, Tag, Typography } from "antd"
import { UserOutlined, AuditOutlined, FunctionOutlined, FieldTimeOutlined, CloseOutlined, FlagOutlined } from "@ant-design/icons"
import { AccountData } from "../InfoPanel/const"
import { HistoryFilterData, colors } from "./const"
import { useEffect, useMemo, useState } from "react"
import FilterModal from "./FilterModal"
import { EventLog } from "ethers"

interface Props {
  className: string
  historyRecord: HistoryRecord[]
  accounts: AccountData[]
  contracts: ContractData[]
  logRecord: EventLog[]
}

export default function Index({ className, historyRecord, accounts, contracts, logRecord }: Props) {
  const [filterData, setFilterData] = useState<HistoryFilterData>({
    accounts: [],
    contracts: [],
    displayDeletedContract: false
  })
  const [filterVisible, setFilterVisible] = useState<boolean>(false)
  const [transactionLogMap, setTransactionLogMap] = useState<Record<string, LogRecord[]>>({})

  const recordAfterFilter = useMemo(() => {
    return historyRecord.filter(record => {
      const contract = contracts.find(contract => contract.address === record.contractAddress)
      const allowAccounts = filterData.accounts.length === 0 ? accounts.map(account => account.address) : filterData.accounts
      const allowContracts = filterData.contracts.length === 0 ? contracts.map(contract => contract.address) : filterData.contracts

      const filterAccounts = allowAccounts.includes(record.accountAddress)
      const filterContracts = allowContracts.includes(record.contractAddress)
      const filterContractsWithoutDeleted = !filterData.displayDeletedContract && filterContracts
      const filterContractsWithDeleted = filterData.displayDeletedContract && (contract === undefined || filterContracts)

      return filterAccounts && (filterContractsWithoutDeleted || filterContractsWithDeleted)
    })
  }, [filterData, historyRecord, contracts, accounts])

  const recordRenderItems = useMemo(() => {
    return recordAfterFilter.map((record, index) => {
      const account = accounts.map((account, index) => ({ ...account, color: colors[index] })).find(account => account.address === record.accountAddress)!
      const contract = contracts.find(contract => contract.address === record.contractAddress)

      const recordRender = (
        <>
          <div style={{ lineHeight: 1.7 }}>
            <Tag icon={<UserOutlined />} color={account.color}>{account.name}</Tag>
            {record.getDescription(record.inputs, record.outputs, accounts)}
          </div>

          <div style={{ marginTop: 12 }}>
            <Tag
              icon={contract === undefined ? <CloseOutlined /> : <AuditOutlined />}
              color={contract === undefined ? 'error' : ''}
              bordered={false}
            >
              {`${record.contractName}: ${new Date(record.contractTimestamp).toLocaleString()}`}
            </Tag>
            <Tag
              icon={contract === undefined ? <CloseOutlined /> : <FunctionOutlined />}
              color={contract === undefined ? 'error' : ''}
              bordered={false}
            >
              {record.functionName}
            </Tag>
          </div>

          <div style={{ marginTop: 12 }}>
            <Tag
              icon={contract === undefined ? <CloseOutlined /> : <FieldTimeOutlined />}
              color={contract === undefined ? 'error' : ''}
              bordered={false}
            >
              {new Date(record.execTimestamp).toLocaleString()}
            </Tag>
          </div>
        </>
      )

      const transactionHash = record.transactionResponse?.hash

      const logRender = transactionHash ? (transactionLogMap[transactionHash] ?? []).map(log => {
        return (
          <div key={log.eventName} style={{ marginBottom: 12, lineHeight: 1.7 }}>
            <Tag icon={<FlagOutlined />}>{log.eventName}</Tag>
            <div style={{ marginTop: 5 }}>
              {log.result.map((item, index) => (
                <div key={index}>
                  <Typography.Text strong>{item.name}</Typography.Text>
                  <Typography.Text style={{ wordBreak: 'break-all' }}>：{String(item.value)}</Typography.Text>
                </div>
              ))}
            </div>
          </div>
        )
      }) : null

      return {
        key: index,
        label: recordRender,
        children: logRender,
      }
    })
  }, [recordAfterFilter, transactionLogMap])

  useEffect(() => {
    const logMap: Record<string, LogRecord[]> = {}

    historyRecord.forEach(record => {
      const transaction = record.transactionResponse

      if (transaction) {
        const txHash = transaction.hash
        const eventLogs = logRecord.filter(log => log.transactionHash === txHash)

        if (eventLogs.length > 0) {
          logMap[txHash] = eventLogs.map(log => ({
            eventName: log.fragment.name,
            topics: log.topics,
            result: log.fragment.inputs.map((arg, index) => ({
              value: log.args[index],
              name: arg.name,
              indexed: arg.indexed,
              type: arg.type
            }))
          }))
        }
      }
    })

    setTransactionLogMap(logMap)
  }, [historyRecord, logRecord])

  const handleResetFilter = () => {
    setFilterData({
      accounts: [],
      contracts: [],
      displayDeletedContract: false
    })
  }

  const handleConfirmFilter = (data: HistoryFilterData) => {
    setFilterData(data)
    setFilterVisible(false)
  }

  return (
    <>
      <Card className={className} title={
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <div>执行合约方法历史</div>
          <Space style={{ fontWeight: 'normal' }}>
            <Typography.Link onClick={handleResetFilter}>重置</Typography.Link>
            <Typography.Link onClick={() => setFilterVisible(true)}>筛选</Typography.Link>
          </Space>
        </div>
      }>
        {recordAfterFilter.length === 0 ?
          <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} /> :
          <Collapse ghost expandIconPosition="end" items={recordRenderItems} />
        }
      </Card>

      <FilterModal
        accounts={accounts}
        contracts={contracts}
        data={filterData}
        visible={filterVisible}
        onCancel={() => setFilterVisible(false)}
        onConfirm={data => handleConfirmFilter(data)}
      />
    </>
  )
}
