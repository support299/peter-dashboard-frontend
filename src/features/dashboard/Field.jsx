export function Field({ label, children }) {
  if (!children) return null
  return (
    <div>
      <span>{label}</span>
      <strong>{children}</strong>
    </div>
  )
}
