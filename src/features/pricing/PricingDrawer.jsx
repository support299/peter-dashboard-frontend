import { money, number, when } from '../../lib'
import { Field } from '../dashboard/Field'

export function PricingDrawer({ payload, onBack }) {
  const item = payload.item || {}
  const pricing = item.pricing || {}
  return (
    <div className="drawer-backdrop" onClick={onBack} role="presentation">
      <aside className="drawer" onClick={(event) => event.stopPropagation()}>
        <button className="back" type="button" onClick={onBack}>
          ← Back
        </button>
        <h2>{item.customer}</h2>
        <div className="details">
          <Field label="Status">{item.status}</Field>
          <Field label="Email">{item.email}</Field>
          <Field label="Phone">{item.phone}</Field>
          <Field label="Property">{item.property_type}</Field>
          <Field label="Location">{item.location}</Field>
          <Field label="Lead source">{item.lead_source}</Field>
          <Field label="Sqft">{item.sqft != null ? number(item.sqft) : null}</Field>
          <Field label="Services">{item.services?.join(', ')}</Field>
          <Field label="Coupon">{item.coupon}</Field>
          <Field label="Bundle">{item.bundle}</Field>
          <Field label="Base">{money(pricing.base)}</Field>
          <Field label="Add-ons">{money(pricing.addons)}</Field>
          <Field label="Discounts">{money((pricing.coupon_discount || 0) + (pricing.bundle_discount || 0))}</Field>
          <Field label="Final">{money(pricing.final_total ?? item.final_total)}</Field>
          <Field label="Created">{when(item.created_at, true)}</Field>
        </div>
      </aside>
    </div>
  )
}
