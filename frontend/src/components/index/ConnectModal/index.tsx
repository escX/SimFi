import { useState } from "react"
import { Button, Form, Input, Modal } from "antd"
import { HARDHAT_NODE_URL } from "@/utils"

interface Props {
  visible: boolean
  onConfirm: (url: string) => Promise<void>
}

export default function Index({ visible, onConfirm }: Props) {
  const [formRef] = Form.useForm()
  const [confirmLoading, setConfirmLoading] = useState<boolean>(false)

  const handleConfirm = () => {
    setConfirmLoading(true)

    formRef.validateFields().then((values) => {
      onConfirm(values.url).then(() => {
        setConfirmLoading(false)
      }).catch(() => {
        setConfirmLoading(false)
      })
    }).catch(() => {
      setConfirmLoading(false)
    })
  }

  return <Modal
    title="连接Hardhat网络"
    closeIcon={false}
    confirmLoading={confirmLoading}
    open={visible}
    footer={<Button type="primary" onClick={handleConfirm}>确定</Button>}
  >
    <Form form={formRef} initialValues={{
      url: HARDHAT_NODE_URL
    }}>
      <Form.Item name="url" label="地址" rules={[
        { required: true, message: '不能为空' },
        { type: 'url', message: '无效的网络地址' }
      ]}>
        <Input placeholder={HARDHAT_NODE_URL} />
      </Form.Item>
    </Form>
  </Modal>
}
