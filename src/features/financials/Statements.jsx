import { Fragment, useState } from 'react'
import { money } from '../../lib'
import { HowInfo } from '../master/KpiCard'
import { TrendPanel } from '../master/MasterCharts'
import { BreakdownTable, Panel } from '../master/MasterPages'
import { formatChange, formatValue, monthName, tone } from '../master/format'
import { useComparisons, useInsights } from '../master/periodState'
import { FinanceAlerts } from './ExpensePages'
import { csvBlob, saveBlob, useDrill } from './financeApi'
import { FinanceShell } from './FinanceParts'

const LINE_DRILL = {
  cogs: 'expenses_cogs',
  operating_expenses: 'expenses_opex',
  vehicle_expenses: 'expenses_vehicles',
  financial_costs: 'expenses_financial',
}

function Amount({ kind, value }) {
  return value == null ? <span className="muted">—</span> : formatValue(kind === 'percent' ? 'percent' : 'currency', value)
}

// ——— Profit & Loss ———
export function FinancePnl() {
  const { data, error } = useInsights('/api/financials/pnl/')
  const comparisons = useComparisons(data)
  const [drill, openDrill, closeDrill] = useDrill()
  const [open, setOpen] = useState({})
  const toggle = (key) => setOpen((prev) => ({ ...prev, [key]: !prev[key] }))

  return (
    <FinanceShell data={data} error={error} drill={drill} onCloseDrill={closeDrill}>
      <FinanceAlerts unreviewed={data?.unreviewed} />
      <Panel
        title="Profit & loss"
        subtitle="Revenue from Jobber (before tax, after discounts) minus expenses from Financials (before tax). Click a cost line to see its categories."
      >
        <div className="drill-table-wrap">
          <table className="breakdown pnl">
            <thead>
              <tr>
                <th>Line</th>
                <th className="num">This period</th>
                {comparisons.map(({ name, label }) => (
                  <th key={name} className="num">
                    {label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(data?.lines || []).map((line) => {
                const expandable = line.details?.length > 0
                return (
                  <Fragment key={line.key}>
                    <tr className={`pnl-${line.line}${expandable ? ' clickable' : ''}`} onClick={expandable ? () => toggle(line.key) : undefined}>
                      <td>
                        {expandable ? <span className="pnl-caret">{open[line.key] ? '▾' : '▸'}</span> : null}
                        {line.label}
                        <HowInfo text={line.how} />
                        {!line.available && line.note ? <small className="muted"> · {line.note}</small> : null}
                      </td>
                      <td className="num strong">
                        <Amount kind={line.kind} value={line.current} />
                      </td>
                      {comparisons.map(({ name }) => {
                        const change = line.kind === 'percent' ? null : formatChange('currency', line.current, line[name])
                        return (
                          <td key={name} className="num">
                            <Amount kind={line.kind} value={line[name]} />
                            {change && line[name] != null && line.current != null ? (
                              <small className={tone(change.diff)}> {change.text.split(' / ')[1] || ''}</small>
                            ) : null}
                          </td>
                        )
                      })}
                    </tr>
                    {open[line.key]
                      ? line.details.map((row) => (
                          <tr key={`${line.key}-${row.key}`} className="pnl-detail">
                            <td>{row.label}</td>
                            <td className="num">{money(row.current)}</td>
                            {comparisons.map(({ name }) => (
                              <td key={name} className="num">
                                {row[name] == null ? 'n/a' : money(row[name])}
                              </td>
                            ))}
                          </tr>
                        ))
                      : null}
                    {open[line.key] && LINE_DRILL[line.key] ? (
                      <tr className="pnl-detail">
                        <td colSpan={2 + comparisons.length}>
                          <button type="button" className="ghost tiny" onClick={() => openDrill(LINE_DRILL[line.key], line.label)}>
                            See the expenses →
                          </button>
                        </td>
                      </tr>
                    ) : null}
                  </Fragment>
                )
              })}
            </tbody>
          </table>
        </div>
      </Panel>

      <Panel
        title="By division"
        subtitle="Each division's revenue minus the costs entered for that division. Shared costs (rent, office payroll…) aren't split between divisions; they're shown on their own line. The company total equals net profit."
      >
        {data && !data.divisions?.length ? <p className="muted">Pick a period that starts after expenses were entered to compare divisions.</p> : null}
        <div className="drill-table-wrap">
          <table className="breakdown">
            <thead>
              <tr>
                <th>Division</th>
                <th className="num">Revenue</th>
                <th className="num">Direct COGS</th>
                <th className="num">Gross profit</th>
                <th className="num">Gross margin</th>
                <th className="num">Other direct costs</th>
                <th className="num">Contribution</th>
              </tr>
            </thead>
            <tbody>
              {(data?.divisions || []).map((row) => (
                <tr key={row.key}>
                  <td>{row.label}</td>
                  <td className="num">{money(row.revenue)}</td>
                  <td className="num">{money(row.cogs)}</td>
                  <td className="num strong">{money(row.gross_profit)}</td>
                  <td className="num">{row.gross_margin == null ? '—' : `${Number(row.gross_margin).toFixed(1)}%`}</td>
                  <td className="num">{money(row.other_costs)}</td>
                  <td className="num strong">{money(row.contribution)}</td>
                </tr>
              ))}
              {data?.shared ? (
                <tr>
                  <td>Shared costs (all divisions)</td>
                  <td className="num">—</td>
                  <td className="num">{money(data.shared.cogs)}</td>
                  <td className="num">—</td>
                  <td className="num">—</td>
                  <td className="num">{money(data.shared.other_costs)}</td>
                  <td className="num strong">−{money(data.shared.total)}</td>
                </tr>
              ) : null}
              {data?.company ? (
                <tr className="total">
                  <td>Company total</td>
                  <td className="num">{money(data.company.revenue)}</td>
                  <td className="num">{money(data.company.cogs)}</td>
                  <td className="num strong">{money(data.company.gross_profit)}</td>
                  <td className="num">{data.company.gross_margin == null ? '—' : `${Number(data.company.gross_margin).toFixed(1)}%`}</td>
                  <td className="num">{money(data.company.other_costs)}</td>
                  <td className="num strong" title="Equals net profit">
                    {money(data.company.contribution)}
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </Panel>

      {data?.excluded?.length ? (
        <Panel
          title="Not in profit & loss"
          subtitle="Money that moved but isn't a cost: loan principal, credit card payments, transfers, equipment purchases, tax remittances."
        >
          <BreakdownTable rows={data.excluded} comparisons={comparisons} mode="amount" firstColumn="Transaction" />
        </Panel>
      ) : null}

      <TrendPanel
        title="Profit trend"
        metrics={[
          { key: 'gross_profit', label: 'Gross profit' },
          { key: 'operating_profit', label: 'Operating profit' },
          { key: 'net_profit', label: 'Net profit' },
          { key: 'revenue', label: 'Revenue' },
        ]}
      />
    </FinanceShell>
  )
}

// ——— Reports ———
function reportRows(data) {
  if (!data) return []
  const cats = data.categories || []
  const detail = {
    cogs: 'cogs',
    operating_expenses: 'opex',
    vehicle_expenses: 'vehicles',
    financial_costs: 'financial',
  }
  const rows = []
  for (const line of data.lines) {
    rows.push({
      key: line.key,
      label: line.label,
      line: line.line,
      values: data.columns.map((c) => c.values[line.key]),
      total: data.total?.values[line.key],
      kind: line.line === 'ratio' ? 'percent' : 'currency',
    })
    if (detail[line.key]) {
      for (const cat of cats.filter((c) => c.part === detail[line.key])) {
        rows.push({
          key: `c${cat.id}`,
          label: cat.label,
          line: 'detail',
          values: data.columns.map((c) => cat.values[c.month]),
          total: cat.total,
          kind: 'currency',
        })
      }
    }
  }
  const excluded = cats.filter((c) => c.part === 'excluded')
  if (excluded.length) {
    rows.push({
      key: 'excluded',
      label: 'Not in profit & loss',
      line: 'section',
      values: data.columns.map(() => null),
      total: null,
    })
    for (const cat of excluded) {
      rows.push({
        key: `c${cat.id}`,
        label: cat.label,
        line: 'detail',
        values: data.columns.map((c) => cat.values[c.month]),
        total: cat.total,
        kind: 'currency',
      })
    }
  }
  return rows
}

export function FinanceReports() {
  const { data, error } = useInsights('/api/financials/report/')
  const rows = reportRows(data)
  // The Total column is the whole period, calculated by the server exactly like Profit & Loss.
  const totalOf = (row) => (row.line === 'section' || row.total == null ? null : Number(row.total))

  function exportCsv() {
    const header = ['Line', ...data.columns.map((c) => c.label), 'Total']
    const body = rows.map((row) => [
      row.line === 'detail' ? `   ${row.label}` : row.label,
      ...row.values.map((v) => (v == null ? '' : Number(v).toFixed(row.kind === 'percent' ? 1 : 2))),
      totalOf(row) == null ? '' : totalOf(row).toFixed(row.kind === 'percent' ? 1 : 2),
    ])
    saveBlob(csvBlob([header, ...body]), `profit-and-loss-${data.period.start}-to-${data.period.end}.csv`)
  }

  return (
    <FinanceShell
      data={data}
      error={error}
      compareNote={false}
      actions={
        <>
          <button type="button" className="ghost" onClick={exportCsv} disabled={!data}>
            Download CSV
          </button>
          <button type="button" className="ghost" onClick={() => window.print()}>
            Print / PDF
          </button>
        </>
      }
    >
      <Panel
        title={`Profit & loss by month · ${data?.period?.label || ''}`}
        subtitle="Pick Year (or Custom) above to see more months. Months before expenses were entered show “—”. Every number matches Profit & Loss for the same dates."
        className="fin-report"
      >
        <div className="drill-table-wrap">
          <table className="breakdown pnl report">
            <thead>
              <tr>
                <th>Line</th>
                {(data?.columns || []).map((c) => (
                  <th key={c.month} className="num">
                    {monthName(c.month)}
                    {c.partial ? '*' : ''}
                  </th>
                ))}
                <th className="num">Total</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.key} className={`pnl-${row.line}`}>
                  <td>{row.label}</td>
                  {row.values.map((v, i) => (
                    <td key={i} className="num">
                      {row.line === 'section' ? '' : v == null ? '—' : formatValue(row.kind, v)}
                    </td>
                  ))}
                  <td className="num strong">{totalOf(row) == null ? (row.line === 'section' ? '' : '—') : formatValue(row.kind, totalOf(row))}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {data?.columns?.some((c) => c.partial) ? <p className="muted tiny-text">* Part of the month only (the current month stops at today).</p> : null}
      </Panel>
    </FinanceShell>
  )
}
