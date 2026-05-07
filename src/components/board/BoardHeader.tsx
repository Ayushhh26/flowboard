interface BoardHeaderProps {
  name: string
}

export function BoardHeader({ name }: BoardHeaderProps) {
  return (
    <header className="flex items-center border-b border-gray-200 bg-white px-6 py-4">
      <h1 className="text-2xl font-semibold text-gray-900">{name}</h1>
    </header>
  )
}
