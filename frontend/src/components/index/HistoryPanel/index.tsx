import { ContractData, HistoryRecord } from "@/lib/const"
import { Card, Divider, Empty, Space, Tag, Typography } from "antd"
import { UserOutlined, AuditOutlined, FunctionOutlined, FieldTimeOutlined, CloseOutlined } from "@ant-design/icons"
import { AccountData } from "../InfoPanel/const"
import { HistoryFilterData, colors } from "./const"
import { useMemo, useState } from "react"
import FilterModal from "./FilterModal"

interface Props {
  historyRecord: HistoryRecord[]
  accounts: AccountData[]
  contracts: ContractData[]
}

export default function Index({ historyRecord, accounts, contracts }: Props) {
  const [filterData, setFilterData] = useState<HistoryFilterData>({
    accounts: [],
    contracts: [],
    displayDeletedContract: false
  })
  const [filterVisible, setFilterVisible] = useState<boolean>(false)

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
      <Card title={
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
          recordAfterFilter.map((record, index) => {
            const account = accounts.map((account, index) => ({ ...account, color: colors[index] })).find(account => account.address === record.accountAddress)!
            const contract = contracts.find(contract => contract.address === record.contractAddress)

            return (
              <div key={index}>
                <div>
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

                <Divider />
              </div>
            )
          })
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
