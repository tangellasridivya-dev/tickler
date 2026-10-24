import { Bell, BriefcaseBusiness, ReceiptIndianRupee, ShoppingBag } from 'lucide-react'

const ICONS = {
  reminders: Bell,
  shopping: ShoppingBag,
  work: BriefcaseBusiness,
  bills: ReceiptIndianRupee,
}

/** The icon for a task category (decorative; the label is always shown beside it). */
function CategoryIcon({ category, size = 13 }) {
  const Icon = ICONS[category] ?? Bell
  return <Icon size={size} aria-hidden="true" />
}

export default CategoryIcon
