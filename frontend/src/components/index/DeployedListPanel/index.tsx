import { ContractData } from "@/lib/const"
import { Card, List, Popconfirm, Tooltip, Typography } from "antd"
import { useMemo } from "react"

interface Props {
  contracts: ContractData[]
  currContract: string | undefined
  onChangeCurrContract: (address: string) => void
  onDelete: (address: string) => void
}

export default function Index({ contracts, currContract, onChangeCurrContract, onDelete }: Props) {
  const sortedContracts = useMemo(() => {
    const thisContract = contracts.find(contract => contract.address === currContract)

    if (!!thisContract) {
      return [
        thisContract,
        ...contracts.filter(contract => contract.address !== currContract)
      ]
    }

    return contracts
  }, [contracts, currContract])

  return (
    <Card>
      <List
        dataSource={sortedContracts}
        itemLayout="vertical"
        renderItem={(item) => (
          <List.Item actions={[
            <Popconfirm
              key="delete"
              title="删除合约"
              description="确定要删除该合约？"
              onConfirm={() => onDelete(item.address)}
              okText="确定"
              cancelText="取消"
            >
              <Typography.Link>删除</Typography.Link>
            </Popconfirm>,
            item.address === currContract ?
              <Typography.Text key="check" type="secondary">当前合约</Typography.Text> :
              <Typography.Link key="check" onClick={() => onChangeCurrContract(item.address)}>选择</Typography.Link>,
          ]}>
            <List.Item.Meta
              title={item.name}
              description={
                <>
                  <div style={{ whiteSpace: 'nowrap' }}>
                    部署地址：
                    <Typography.Text type="secondary" copyable>
                      {item.address}
                    </Typography.Text>
                  </div>
                  <div>
                    部署时间：
                    <Typography.Text type="secondary">
                      {new Date(item.deployTimestamp).toLocaleString()}
                    </Typography.Text>
                  </div>
                  <div>
                    部署账户：
                    <Tooltip color="#fff" overlayStyle={{ width: 'max-content', maxWidth: 'unset' }} title={
                      <Typography.Text type="secondary" copyable>
                        {item.deployAccountAddress}
                      </Typography.Text>
                    }>
                      <Typography.Text type="secondary">
                        {item.deployAccountName}
                      </Typography.Text>
                    </Tooltip>
                  </div>
                </>
              }
            />
          </List.Item>
        )}
      />
    </Card>
  )
}
