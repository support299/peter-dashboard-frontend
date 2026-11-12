import { useState } from 'react'
import { useAuth } from '../../app/providers/AuthProvider'
import { Panel } from '../master/MasterPages'
import { useFetch, usePeriod } from '../master/periodState'
import { atLeast, send, useMeta } from './financeApi'
import { Choice } from './FinanceParts'
import { confirmDialog } from '../../lib/feedback'

function CategoryRow({ cat, admin, onChange, children }) {
  const [name, setName] = useState(cat.name)
  const [error, setError] = useState('')

  async function patch(body) {
    setError('')
    try {
      const result = await send(`/api/financials/categories/${cat.id}/`, {
        method: 'PATCH',
        body,
      })
      onChange(result.message)
    } catch (err) {
      setError(err.message)
    }
  }

  async function remove() {
    if (!(await confirmDialog({ title: `Remove “${cat.name}”?`, message: "If it's already used, it's hidden instead so past expenses keep it.", confirmLabel: 'Remove', danger: true }))) return
    try {
      const result = await send(`/api/financials/categories/${cat.id}/`, {
        method: 'DELETE',
      })
      onChange(result.message)
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <li className={`fin-cat${cat.is_active ? '' : ' inactive'}${cat.parent_id ? ' sub' : ''}`}>
      <div className="fin-cat-row">
        {admin ? (
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            onBlur={() => name.trim() && name !== cat.name && patch({ name })}
            aria-label="Category name"
          />
        ) : (
          <span>{cat.name}</span>
        )}
        {!cat.parent_id ? (
          <span className="fin-flags">
            {['counts_as_payroll', 'counts_as_labour', 'in_profit_and_loss'].map((flag) => (
              <label key={flag} className="fin-check" title={FLAG_HELP[flag]}>
                <input type="checkbox" disabled={!admin} checked={cat[flag]} onChange={(e) => patch({ [flag]: e.target.checked })} />
                {FLAG_LABEL[flag]}
              </label>
            ))}
          </span>
        ) : null}
        {admin ? (
          cat.is_active ? (
            <button type="button" className="ghost tiny" onClick={remove}>
              Remove
            </button>
          ) : (
            <button type="button" className="ghost tiny" onClick={() => patch({ is_active: true })}>
              Restore
            </button>
          )
        ) : null}
      </div>
      {error ? <small className="error-text">{error}</small> : null}
      {children}
    </li>
  )
}

const FLAG_LABEL = {
  counts_as_payroll: 'Payroll',
  counts_as_labour: 'Labour',
  in_profit_and_loss: 'In P&L',
}
const FLAG_HELP = {
  counts_as_payroll: 'Counts in the Payroll KPI and Payroll % of revenue',
  counts_as_labour: 'Counts in Labour cost % (cleaner wages and subcontractors)',
  in_profit_and_loss: 'Untick for money movements that are not costs (loan principal, transfers…)',
}

function AddCategory({ group, parent, onAdded }) {
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  async function add(event) {
    event.preventDefault()
    setError('')
    try {
      await send('/api/financials/categories/', {
        body: { name, group, parent_id: parent?.id },
      })
      setName('')
      onAdded()
    } catch (err) {
      setError(err.message)
    }
  }
  return (
    <form className="fin-add-cat" onSubmit={add}>
      <input value={name} onChange={(e) => setName(e.target.value)} placeholder={parent ? `+ Subcategory of ${parent.name}` : '+ New category'} />
      {name ? (
        <button type="submit" className="ghost tiny">
          Add
        </button>
      ) : null}
      {error ? <small className="error-text">{error}</small> : null}
    </form>
  )
}

function Categories({ meta, admin }) {
  const { reload } = usePeriod()
  const [message, setMessage] = useState('')
  const [openParent, setOpenParent] = useState(null)
  const changed = (text) => {
    setMessage(text || '')
    reload()
  }
  const cats = meta?.categories || []
  return (
    <Panel
      title="Expense categories"
      subtitle={
        admin ? 'Rename, add or remove categories. Subcategories are optional (e.g. Software › Jobber).' : 'Only Financials admins can change categories.'
      }
    >
      {message ? <div className="notice good">{message}</div> : null}
      <div className="fin-cat-groups">
        {(meta?.groups || []).map((group) => (
          <section key={group.key} className="fin-cat-group">
            <h4>{group.label}</h4>
            <ul>
              {cats
                .filter((c) => c.group === group.key && !c.parent_id)
                .map((cat) => (
                  <CategoryRow key={`${cat.id}-${cat.name}-${cat.is_active}`} cat={cat} admin={admin} onChange={changed}>
                    <ul>
                      {cats
                        .filter((c) => c.parent_id === cat.id)
                        .map((sub) => (
                          <CategoryRow key={`${sub.id}-${sub.name}-${sub.is_active}`} cat={sub} admin={admin} onChange={changed} />
                        ))}
                    </ul>
                    {admin && cat.is_active ? (
                      openParent === cat.id ? (
                        <AddCategory group={group.key} parent={cat} onAdded={changed} />
                      ) : (
                        <button type="button" className="link tiny-text" onClick={() => setOpenParent(cat.id)}>
                          + subcategory
                        </button>
                      )
                    ) : null}
                  </CategoryRow>
                ))}
            </ul>
            {admin ? <AddCategory group={group.key} onAdded={changed} /> : null}
          </section>
        ))}
      </div>
    </Panel>
  )
}

function Access({ meta }) {
  const { user } = useAuth()
  const [version, setVersion] = useState(0)
  const { data, error } = useFetch('/api/financials/access/', version)
  const [message, setMessage] = useState('')
  const roles = [{ key: '', label: 'No access' }, ...(meta?.roles || [])]

  async function setRole(target, role) {
    setMessage('')
    try {
      await send(`/api/financials/access/${target.id}/`, {
        method: 'PUT',
        body: { role },
      })
      setVersion((v) => v + 1)
    } catch (err) {
      setMessage(err.message)
    }
  }

  return (
    <Panel
      title="Who can use Financials"
      subtitle="Enter expenses only: add and correct their own expenses, no totals or profit. View all financials: everything, including profit on the Master Dashboard. Admin: also categories, access and reopening reviewed months."
    >
      {error ? <div className="notice">{error}</div> : null}
      {message ? <div className="notice">{message}</div> : null}
      <div className="drill-table-wrap">
        <table className="drill-table fin-table">
          <thead>
            <tr>
              <th>User</th>
              <th>Financials access</th>
            </tr>
          </thead>
          <tbody>
            {(data?.users || []).map((u) => (
              <tr key={u.id}>
                <td>
                  <strong>{u.name || u.email}</strong>
                  {u.name ? <small className="muted"> · {u.email}</small> : null}
                </td>
                <td>
                  {u.is_superuser ? (
                    <span className="muted">Admin (superuser)</span>
                  ) : u.id === user?.id ? (
                    <span className="muted">{roles.find((r) => r.key === u.role)?.label} (you)</span>
                  ) : (
                    <Choice options={roles} value={u.role} onChange={(role) => setRole(u, role)} />
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="muted tiny-text">
        Add people, and change what they can see, on Master → Users. A changed role applies the next time that person loads the page.
      </p>
    </Panel>
  )
}

export function FinanceSettings() {
  const meta = useMeta()
  const admin = atLeast(meta?.role, 'admin')
  return (
    <div className="master finance">
      <Categories meta={meta} admin={admin} />
      {admin ? <Access meta={meta} /> : null}
    </div>
  )
}
