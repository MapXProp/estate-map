import AccountBillingPanel from '@/components/account/AccountBillingPanel'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'แพ็กเกจและการชำระเงิน | MapXProp',
  description: 'สถานะแพ็กเกจ MapXProp',
}

const AccountBilling = () => <AccountBillingPanel />

export default AccountBilling
