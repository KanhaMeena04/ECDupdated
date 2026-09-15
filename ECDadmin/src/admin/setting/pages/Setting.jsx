import React from 'react'
import PageHeader from '../../components/PageHeader'
import SiteSetting from '../components/SIteSetting'
import LayoutSetting from '../components/LayoutSetting'
import EmailSetting from '../components/EmailSetting'
import PaymentSetting from '../components/PaymentSetting'
import TaxSetting from '../components/TaxSetting'
function Setting() {
  return (
	<div className="w-full  lg:mt-0 p-4 xs:p-5">
					<PageHeader
				  title="Setting"
				  breadcrumbs={[
					{ label: "Setting" },
					{ label: "Setting", active: true }
				  ]}
				/>
				<SiteSetting/>
				<LayoutSetting/>
				<EmailSetting/>
				<PaymentSetting/>
				<TaxSetting/>
				</div>
  )
}

export default Setting