import './StatusPill.css'


const statusStyles = {
  Open: { bg: '#DCE8F5', color: '#3B6EA5' },  
  New: { bg: '#E5E7E6', color: '#4B5F5A' },
  Contacted: { bg: '#DCE8F5', color: '#3B6EA5' },
  Qualified: { bg: 'rgba(163, 195, 170, 0.35)', color: '#2E6B3E' },
  Proposal: { bg: 'rgba(72, 145, 89, 0.18)', color: '#489159' },
  Negotiation: { bg: '#FBEBC7', color: '#9A6B0A' },
  Won: { bg: 'rgba(72, 145, 89, 0.18)', color: '#3C7A4A' },
  Lost: { bg: '#F5DCDA', color: '#B3453D' },
  Low: { bg: '#E5E7E6', color: '#4B5F5A' },
  Medium: { bg: '#FBEBC7', color: '#9A6B0A' },
  High: { bg: '#F5DCDA', color: '#B3453D' },
    Pending: { bg: '#EFE7DC', color: '#8A6D4E' },
  'In Progress': { bg: '#DCE8F5', color: '#3B6EA5' },
  Done: { bg: 'rgba(72, 145, 89, 0.18)', color: '#3C7A4A' },
}
function StatusPill({ status }) {
  const style = statusStyles[status] || statusStyles.New

  return (
    <span
      className="status-pill"
      style={{ backgroundColor: style.bg, color: style.color }}
    >
      {status}
    </span>
  )
}

export default StatusPill