import { useMemo, useState } from 'react'
import { useAuth } from '../../app/providers/AuthProvider'
import { SkeletonTable } from '../../components/Skeleton'
import { api, readJson } from '../../lib'
import { Panel } from '../master/MasterPages'
import { shortDate } from '../master/format'
import { useFetch } from '../master/periodState'
import './users.css'

/*
 * Users (Peter, Nov 2026): admins add people and choose what each one can see. The server sends no
 * email, so a new person gets a temporary password that the admin passes on. Accounts are disabled,
 * never deleted, so what they entered stays. Admin accounts and your own can't be changed here.
 */

async function send(path, method, body) {
  return readJson(await api(path, { method, body: JSON.stringify(body) }))
}

/** Easy to read out or type on a phone: no 0/O or 1/l, ends with a digit and a symbol. */
function newPassword() {
  const letters = 'abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ'
  const pick = (chars) => chars[crypto.getRandomValues(new Uint32Array(1))[0] % chars.length]
  return Array.from({ length: 10 }, () => pick(letters)).join('') + pick('23456789') + pick('!@#$%')
}

function accessSummary(row, labels) {
  if (row.is_admin) return 'Admin · everything'
  if (row.is_staff) return 'Office staff · everything'
  if (row.access === 'everything') return 'Everything'
  const names = row.pages.map((key) => labels[key] || key)
  return names.length > 3 ? `${names.slice(0, 3).join(', ')} +${names.length - 3} more` : names.join(', ')
}

function CopyButton({ text }) {
  const [done, setDone] = useState(false)
  return (
    <button
      type="button"
      className="ghost tiny"
      onClick={() => {
        navigator.clipboard?.writeText(text).then(() => {
          setDone(true)
          setTimeout(() => setDone(false), 1500)
        })
      }}
    >
      {done ? 'Copied ✓' : 'Copy'}
    </button>
  )
}

function PasswordField({ value, onChange, label, hint, required }) {
  const [show, setShow] = useState(true)
  return (
    <label className="usr-field wide">
      <span>{label}</span>
      <div className="usr-password">
        <input
          type={show ? 'text' : 'password'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          autoComplete="new-password"
          required={required}
          spellCheck={false}
        />
        <button type="button" className="ghost tiny" onClick={() => setShow((s) => !s)}>
          {show ? 'Hide' : 'Show'}
        </button>
        <button type="button" className="ghost tiny" onClick={() => onChange(newPassword())}>
          Generate
        </button>
      </div>
      {hint ? <small className="muted">{hint}</small> : null}
    </label>
  )
}

function PagePicker({ options, value, onChange }) {
  const groups = useMemo(() => {
    const out = []
    for (const page of options) {
      let group = out.find((g) => g.name === page.group)
      if (!group) out.push((group = { name: page.group, pages: [] }))
      group.pages.push(page)
    }
    return out
  }, [options])
  const toggle = (key) => onChange(value.includes(key) ? value.filter((k) => k !== key) : [...value, key])
  return (
    <div className="usr-pages">
      {groups.map((group) => (
        <fieldset key={group.name}>
          <legend>{group.name}</legend>
          {group.pages.map((page) => (
            <label key={page.key} className="usr-check">
              <input type="checkbox" checked={value.includes(page.key)} onChange={() => toggle(page.key)} />
              {page.label}
            </label>
          ))}
        </fieldset>
      ))}
    </div>
  )
}

function UserForm({ row, options, onClose, onSaved }) {
  const creating = !row
  const [form, setForm] = useState(() => ({
    first_name: row?.first_name || '',
    last_name: row?.last_name || '',
    email: row?.email || '',
    password: creating ? newPassword() : '',
    access: row?.access || 'pages',
    pages: row?.pages || [],
    finance_role: row?.finance_role || '',
  }))
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const set = (patch) => setForm((prev) => ({ ...prev, ...patch }))

  async function save(event) {
    event.preventDefault()
    setBusy(true)
    setError('')
    const body = {
      first_name: form.first_name,
      last_name: form.last_name,
      ...(row?.is_staff ? {} : { access: form.access, pages: form.access === 'pages' ? form.pages : [] }),
      finance_role: form.finance_role,
    }
    try {
      if (creating) {
        const result = await send('/api/accounts/users/', 'POST', { ...body, email: form.email, password: form.password })
        onSaved(result.user, { email: result.user.email, password: form.password, created: true })
      } else {
        if (form.password) body.password = form.password
        const result = await send(`/api/accounts/users/${row.id}/`, 'PATCH', body)
        onSaved(result.user, form.password ? { email: result.user.email, password: form.password, created: false } : null)
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  async function setActive(active) {
    if (!active && !window.confirm(`Disable ${row.name || row.email}? They're signed out at once and can't sign in until you enable the account again.`)) return
    setBusy(true)
    setError('')
    try {
      const result = await send(`/api/accounts/users/${row.id}/`, 'PATCH', { is_active: active })
      onSaved(result.user, null)
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="drill-backdrop" role="presentation" onClick={onClose}>
      <form className="usr-modal" role="dialog" aria-modal="true" aria-label={creating ? 'Add user' : 'Edit user'} onClick={(e) => e.stopPropagation()} onSubmit={save}>
        <header className="usr-modal-head">
          <h3>{creating ? 'Add a user' : `Edit ${row.name || row.email}`}</h3>
          <button type="button" className="ghost" onClick={onClose}>
            Close
          </button>
        </header>
        {error ? <div className="notice">{error}</div> : null}
        <div className="usr-grid">
          <label className="usr-field">
            <span>First name *</span>
            <input value={form.first_name} onChange={(e) => set({ first_name: e.target.value })} required autoFocus={creating} />
          </label>
          <label className="usr-field">
            <span>Last name</span>
            <input value={form.last_name} onChange={(e) => set({ last_name: e.target.value })} />
          </label>
          <label className="usr-field wide">
            <span>Email (used to sign in) *</span>
            <input type="email" value={form.email} onChange={(e) => set({ email: e.target.value })} required={creating} disabled={!creating} autoComplete="off" />
            {!creating ? <small className="muted">The email can't be changed. To use another email, add a new user.</small> : null}
          </label>
          <PasswordField
            label={creating ? 'Temporary password *' : 'New temporary password'}
            value={form.password}
            onChange={(password) => set({ password })}
            required={creating}
            hint={
              creating
                ? 'Pass it on to them; they can change it from their account menu after signing in.'
                : 'Leave empty to keep their password. Setting one signs them out on every device.'
            }
          />
        </div>

        {row?.is_staff ? (
          <p className="notice">Office staff accounts always see everything, so their pages can't be limited here.</p>
        ) : (
        <fieldset className="usr-access">
          <legend>What can they see?</legend>
          <label className="usr-radio">
            <input type="radio" name="access" checked={form.access === 'everything'} onChange={() => set({ access: 'everything' })} />
            <span>
              <b>Everything</b>
              <small className="muted">All pages and sections. They can't manage users.</small>
            </span>
          </label>
          <label className="usr-radio">
            <input type="radio" name="access" checked={form.access === 'pages'} onChange={() => set({ access: 'pages' })} />
            <span>
              <b>Only these pages</b>
              <small className="muted">Everything else is hidden and blocked, even if they type the address.</small>
            </span>
          </label>
          {form.access === 'pages' ? <PagePicker options={options.pages} value={form.pages} onChange={(pages) => set({ pages })} /> : null}
        </fieldset>
        )}

        <label className="usr-field">
          <span>Financials</span>
          <select value={form.finance_role} onChange={(e) => set({ finance_role: e.target.value })}>
            {options.finance_roles.map((role) => (
              <option key={role.key} value={role.key}>
                {role.label}
              </option>
            ))}
          </select>
          <small className="muted">Profit numbers on the Master pages also follow this.</small>
        </label>

        <footer className="usr-modal-foot">
          {!creating ? (
            row.is_active ? (
              <button type="button" className="ghost danger" disabled={busy} onClick={() => setActive(false)}>
                Disable account
              </button>
            ) : (
              <button type="button" className="ghost" disabled={busy} onClick={() => setActive(true)}>
                Enable account
              </button>
            )
          ) : (
            <span />
          )}
          <button type="submit" className="primary" disabled={busy || (!row?.is_staff && form.access === 'pages' && !form.pages.length)}>
            {busy ? 'Saving…' : creating ? 'Add user' : 'Save changes'}
          </button>
        </footer>
      </form>
    </div>
  )
}

function SignInDetails({ details, onClose }) {
  const site = window.location.origin
  const text = `Insights: ${site}\nEmail: ${details.email}\nTemporary password: ${details.password}`
  return (
    <div className="usr-share" role="status">
      <div>
        <b>{details.created ? 'User added.' : 'Password changed.'} Share these sign-in details:</b>
        <pre>{text}</pre>
        <small className="muted">The password isn't shown again. They can change it from their account menu after signing in.</small>
      </div>
      <div className="usr-share-actions">
        <CopyButton text={text} />
        <button type="button" className="ghost tiny" onClick={onClose}>
          Done
        </button>
      </div>
    </div>
  )
}

export function UsersPage() {
  const { user } = useAuth()
  const [version, setVersion] = useState(0)
  const { data, error } = useFetch('/api/accounts/users/', version)
  const [editing, setEditing] = useState(null) // null | 'new' | row
  const [details, setDetails] = useState(null)
  const labels = useMemo(() => Object.fromEntries((data?.options?.pages || []).map((page) => [page.key, page.label])), [data])
  const roleLabels = useMemo(() => Object.fromEntries((data?.options?.finance_roles || []).map((role) => [role.key, role.label])), [data])

  return (
    <div className="master">
      <Panel
        title="People with access"
        subtitle="Choose what each person can see. Admins always see everything and manage users."
        actions={
          <button type="button" className="primary" disabled={!data} onClick={() => setEditing('new')}>
            + Add user
          </button>
        }
      >
        {details ? <SignInDetails details={details} onClose={() => setDetails(null)} /> : null}
        {error ? <div className="notice">{error}</div> : null}
        {!data && !error ? <SkeletonTable rows={4} columns={5} /> : null}
        {data ? (
          <div className="drill-table-wrap">
            <table className="drill-table usr-table">
              <thead>
                <tr>
                  <th>Person</th>
                  <th>Can see</th>
                  <th>Financials</th>
                  <th>Status</th>
                  <th>Last sign-in</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {data.users.map((row) => {
                  const you = row.id === user?.id
                  return (
                    <tr key={row.id} className={row.is_active ? '' : 'usr-disabled'}>
                      <td>
                        <strong>{row.name || row.email}</strong>
                        {you ? <span className="usr-pill">you</span> : null}
                        {row.name ? <small className="muted usr-email">{row.email}</small> : null}
                      </td>
                      <td>{accessSummary(row, labels)}</td>
                      <td>{row.is_admin ? 'Admin' : roleLabels[row.finance_role] || 'No access'}</td>
                      <td>
                        <span className={`usr-status ${row.is_active ? 'on' : 'off'}`}>{row.is_active ? 'Active' : 'Disabled'}</span>
                      </td>
                      <td>{row.last_login ? shortDate(String(row.last_login).slice(0, 10)) : 'Never'}</td>
                      <td className="usr-actions">
                        {row.is_admin || you ? null : (
                          <button type="button" className="ghost tiny" onClick={() => setEditing(row)}>
                            Edit
                          </button>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        ) : null}
        <p className="muted tiny-text">
          Changes apply on the person's next click. Disabled accounts are signed out at once and keep everything they entered.
        </p>
      </Panel>
      {editing && data ? (
        <UserForm
          row={editing === 'new' ? null : editing}
          options={data.options}
          onClose={() => setEditing(null)}
          onSaved={(_, shared) => {
            setEditing(null)
            setDetails(shared)
            setVersion((v) => v + 1)
          }}
        />
      ) : null}
    </div>
  )
}
