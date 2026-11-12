import { useState } from 'react'
import { money, number, queryString } from '../../lib'
import { Panel } from '../master/MasterPages'
import { shortDate } from '../master/format'
import { useFetch, usePeriod } from '../master/periodState'
import { FinanceShell, Modal } from './FinanceParts'
import { SkeletonTable } from '../../components/Skeleton'

const TYPES = {
  pay: 'Pay',
  tip: 'Tip',
  adjustment: 'Late change',
  supplies_deduction: 'Supplies deduction',
  restock_deduction: 'Restock deduction',
}
const RULES = { percent: '% of price', fixed: 'Fixed $', override: 'Changed by admin', manual: 'Entered by hand' }
const FLAGS = { missing_percent: 'No % in the Hub' }

function ContractorLines({ person, params, onClose }) {
  const { data, error } = useFetch(`/api/financials/contractor-pay/${queryString({ ...params, division: undefined, contractor: person.key })}`)
  return (
    <Modal title={person.contractor} kicker="Contractor pay" onClose={onClose} wide>
      {error ? <div className="notice">{error}</div> : null}
      {!data && !error ? <SkeletonTable /> : null}
      {data ? (
        <div className="drill-table-wrap">
          <table className="drill-table fin-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Type</th>
                <th>Client · job</th>
                <th>Rule</th>
                <th className="k-currency">Price × %</th>
                <th className="k-currency">Paid</th>
                <th>Week</th>
              </tr>
            </thead>
            <tbody>
              {data.lines.map((line) => (
                <tr key={line.id} className={line.status === 'void' ? 'muted' : ''}>
                  <td>{shortDate(line.date)}</td>
                  <td>
                    {TYPES[line.type] || line.type}
                    {line.status === 'void' ? <span className="fin-tag">Removed</span> : null}
                    {line.flags.map((flag) => (
                      <span key={flag} className="fin-tag warn">
                        {FLAGS[flag] || flag}
                      </span>
                    ))}
                  </td>
                  <td>
                    {line.client || '—'}
                    {line.job ? <small className="muted"> · {line.job}</small> : null}
                    {line.reason ? <small className="muted"> · {line.reason}</small> : null}
                  </td>
                  <td>
                    {RULES[line.pay_rule] || '—'}
                    {line.changed_by ? <small className="muted"> · {line.changed_by}</small> : null}
                  </td>
                  <td className="k-currency">{line.calculated_amount == null ? '—' : money(line.calculated_amount)}</td>
                  <td className="k-currency">{money(line.amount_paid)}</td>
                  <td>{line.week_paid ? 'Paid' : 'Not paid yet'}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {!data.lines.length ? <p className="muted empty">Nothing in this period.</p> : null}
        </div>
      ) : null}
    </Modal>
  )
}

export function FinanceContractorPay() {
  const { params, version } = usePeriod()
  const { data, error } = useFetch(`/api/financials/contractor-pay/${queryString({ ...params, division: undefined })}`, version)
  const [open, setOpen] = useState(null)
  const totals = data?.totals
  return (
    <FinanceShell data={data} error={error} compareNote={false}>
      {data && !data.has_data ? <div className="notice">No contractor pay from the Hub yet. It arrives with the next nightly Hub sync.</div> : null}
      {data && !data.start_date ? (
        <div className="notice">Contractor pay isn’t added to expenses yet. It starts on the date agreed with you; until then, keep entering it by hand.</div>
      ) : data ? (
        <p className="muted fin-help">
          For work from <b>{shortDate(data.start_date)}</b>, pay, tips and late changes are added to expenses every day under <b>Subcontractors</b> (labour
          cost, not PayEvo payroll), on the visit date. Don’t enter that pay by hand: it would be counted twice. Change pay in the Hub. Don’t enter a monthly
          total for Subcontractors either: it would replace these expenses.
        </p>
      ) : null}
      {totals?.missing_percent ? (
        <div className="notice">
          {number(totals.missing_percent)} visit{totals.missing_percent === 1 ? '' : 's'} paid $0 because the contractor has no % in the Hub yet.
        </div>
      ) : null}
      <div className="fin-stats">
        <div>
          <span>Pay</span>
          <strong>{money(totals?.pay)}</strong>
        </div>
        <div>
          <span>Tips</span>
          <strong>{money(totals?.tips)}</strong>
        </div>
        <div>
          <span>Late changes</span>
          <strong>{money(totals?.adjustments)}</strong>
        </div>
        <div>
          <span>Cost (in expenses)</span>
          <strong>{money(totals?.expense)}</strong>
        </div>
        <div>
          <span>Deductions (not in expenses)</span>
          <strong>{money(totals?.deductions)}</strong>
        </div>
        <div>
          <span>Paid to contractors</span>
          <strong>{money(totals?.net)}</strong>
        </div>
      </div>
      <Panel
        title="By contractor"
        subtitle="Worked out by the Hub for visits marked complete. Deductions are money back for equipment and supplies, so they stay out of expenses. Click a contractor to see each visit."
      >
        <div className="drill-table-wrap">
          <table className="drill-table fin-table">
            <thead>
              <tr>
                <th>Contractor</th>
                <th className="k-number">Visits</th>
                <th className="k-currency">Pay</th>
                <th className="k-currency">Tips</th>
                <th className="k-currency">Late changes</th>
                <th className="k-currency">Deductions</th>
                <th className="k-currency">To contractor</th>
                <th className="k-currency">Week not paid yet</th>
              </tr>
            </thead>
            <tbody>
              {(data?.rows || []).map((row) => (
                <tr key={row.key} className="clickable" onClick={() => setOpen(row)}>
                  <td>
                    <strong>{row.contractor}</strong>
                    {row.missing_percent ? <span className="fin-tag warn">No % in the Hub</span> : null}
                  </td>
                  <td className="k-number">{number(row.visits)}</td>
                  <td className="k-currency">{money(row.pay)}</td>
                  <td className="k-currency">{money(row.tips)}</td>
                  <td className="k-currency">{money(row.adjustments)}</td>
                  <td className="k-currency">{money(row.deductions)}</td>
                  <td className="k-currency">
                    <strong>{money(row.net)}</strong>
                  </td>
                  <td className="k-currency">{money(row.unpaid)}</td>
                </tr>
              ))}
            </tbody>
            {totals && data.rows.length ? (
              <tfoot>
                <tr className="total">
                  <td>Total</td>
                  <td className="k-number">{number(totals.visits)}</td>
                  <td className="k-currency">{money(totals.pay)}</td>
                  <td className="k-currency">{money(totals.tips)}</td>
                  <td className="k-currency">{money(totals.adjustments)}</td>
                  <td className="k-currency">{money(totals.deductions)}</td>
                  <td className="k-currency">{money(totals.net)}</td>
                  <td className="k-currency">{money(totals.unpaid)}</td>
                </tr>
              </tfoot>
            ) : null}
          </table>
          {data && !data.rows.length ? <p className="muted empty">No contractor pay in this period.</p> : null}
        </div>
        {data?.start_date ? (
          <p className="muted tiny-text fin-note">
            In expenses for this period: {money(data.booked)}. This can differ from the cost above for days before {shortDate(data.start_date)}, and when a
            change to a reviewed month was booked on a later day.
          </p>
        ) : null}
      </Panel>
      {open ? <ContractorLines person={open} params={params} onClose={() => setOpen(null)} /> : null}
    </FinanceShell>
  )
}
