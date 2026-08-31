import { useEffect, useState } from 'react'
import { api, readJson } from '../../lib'

export function MappingTable({ title, rows, fields, divisions, onSave, onDelete }) {
  const [draft, setDraft] = useState(() =>
    Object.fromEntries(fields.map((field) => [field.key, field.key === 'active' ? true : field.key === 'priority' ? 100 : ''])),
  )

  return (
    <article className="jobber-panel span-12 mapping-panel anim-rise">
      <header className="jobber-panel-head">
        <div>
          <h3>{title}</h3>
          <p>POST to save or delete rules</p>
        </div>
      </header>
      <table className="table">
        <thead>
          <tr>
            {fields.map((field) => (
              <th key={field.key}>{field.label}</th>
            ))}
            <th />
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id}>
              {fields.map((field) => (
                <td key={field.key}>
                  {field.key === 'active' ? (row.active ? 'Yes' : 'No') : row[field.key]}
                </td>
              ))}
              <td>
                <button className="ghost tiny" type="button" onClick={() => onDelete(row.id)}>
                  Delete
                </button>
              </td>
            </tr>
          ))}
          <tr>
            {fields.map((field) => (
              <td key={field.key}>
                {field.key === 'division' && divisions?.length ? (
                  <select
                    value={draft.division || ''}
                    onChange={(e) => setDraft((prev) => ({ ...prev, division: e.target.value }))}
                  >
                    <option value="">Division</option>
                    {divisions.map((item) => (
                      <option key={item.key} value={item.key}>
                        {item.label}
                      </option>
                    ))}
                  </select>
                ) : field.key === 'active' ? (
                  <select
                    value={draft.active ? 'true' : 'false'}
                    onChange={(e) => setDraft((prev) => ({ ...prev, active: e.target.value === 'true' }))}
                  >
                    <option value="true">Active</option>
                    <option value="false">Inactive</option>
                  </select>
                ) : (
                  <input
                    value={draft[field.key] ?? ''}
                    type={field.key === 'priority' ? 'number' : 'text'}
                    placeholder={field.label}
                    onChange={(e) =>
                      setDraft((prev) => ({
                        ...prev,
                        [field.key]: field.key === 'priority' ? Number(e.target.value) : e.target.value,
                      }))
                    }
                  />
                )}
              </td>
            ))}
            <td>
              <button
                className="primary tiny"
                type="button"
                onClick={async () => {
                  await onSave(draft)
                  setDraft(
                    Object.fromEntries(
                      fields.map((field) => [field.key, field.key === 'active' ? true : field.key === 'priority' ? 100 : '']),
                    ),
                  )
                }}
              >
                Add
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </article>
  )
}

export function MappingsView() {
  const [serviceRows, setServiceRows] = useState(null)
  const [divisionRows, setDivisionRows] = useState(null)
  const [divisions, setDivisions] = useState([])
  const [error, setError] = useState('')

  async function reload() {
    const [services, rules] = await Promise.all([
      readJson(await api('/api/operations/mappings/service-types/')),
      readJson(await api('/api/operations/mappings/divisions/')),
    ])
    setServiceRows(services.results || [])
    setDivisionRows(rules.results || [])
    setDivisions(rules.divisions || [])
  }

  useEffect(() => {
    reload().catch((err) => setError(err.message))
  }, [])

  async function postMapping(path, body) {
    await readJson(
      await api(path, {
        method: 'POST',
        body: JSON.stringify(body),
      }),
    )
    await reload()
  }

  if (!serviceRows || !divisionRows) return <p className="empty muted">Loading…</p>

  return (
    <div className="jobber-board">
      {error ? <div className="notice">{error}</div> : null}
      <section className="jobber-bento">
        <MappingTable
          title="Service type mappings"
          rows={serviceRows}
          fields={[
            { key: 'keyword', label: 'Keyword' },
            { key: 'service_type', label: 'Service type' },
            { key: 'priority', label: 'Priority' },
            { key: 'active', label: 'Active' },
          ]}
          onSave={(draft) => postMapping('/api/operations/mappings/service-types/', draft)}
          onDelete={(id) => postMapping('/api/operations/mappings/service-types/', { id, delete: true })}
        />
        <MappingTable
          title="Division rules"
          rows={divisionRows}
          divisions={divisions}
          fields={[
            { key: 'keyword', label: 'Keyword' },
            { key: 'division', label: 'Division' },
            { key: 'priority', label: 'Priority' },
            { key: 'active', label: 'Active' },
          ]}
          onSave={(draft) => postMapping('/api/operations/mappings/divisions/', draft)}
          onDelete={(id) => postMapping('/api/operations/mappings/divisions/', { id, delete: true })}
        />
      </section>
    </div>
  )
}
